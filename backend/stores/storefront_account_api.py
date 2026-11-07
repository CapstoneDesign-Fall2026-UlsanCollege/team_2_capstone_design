import logging
import re
from django.conf import settings
from django.contrib.auth import get_user_model, login
from django.db import models, transaction
from rest_framework import permissions, serializers, status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from accounts.google_auth import (
    GENERIC_GOOGLE_AUTH_ERROR,
    GoogleTokenVerificationError,
    check_google_ip_rate_limit,
    get_configured_google_client_id,
    verify_google_id_token,
)
from accounts.models import EmailOTPChallenge
from accounts.otp import get_client_ip
from core.email_transport import schedule_otp_email
from core.tenant_context import TenantDatabaseContext
from orders.models import Order
from stores.api import StorePublicMixin
from stores.models import Customer, provision_store_customer

User = get_user_model()
logger = logging.getLogger(__name__)


def clean_and_validate_nepali_phone(value: str) -> str:
    """Validates and formats a 10-digit Nepali mobile number starting with 98 or 97."""
    cleaned = re.sub(r"[\s\-]", "", str(value or ""))
    if cleaned.startswith("+977"):
        cleaned = cleaned[4:]
    elif cleaned.startswith("977"):
        cleaned = cleaned[3:]

    if not cleaned:
        return ""

    if not re.match(r"^9[78]\d{8}$", cleaned):
        raise serializers.ValidationError("Enter a valid 10-digit Nepali mobile number starting with 98 or 97.")
    return cleaned


def format_order_items_summary(order: Order) -> str:
    """Formats an editorial summary of items in an order."""
    parts = []
    for it in order.items.all():
        name = it.product_name_snapshot
        if it.variant_label_snapshot and it.variant_label_snapshot not in ["Default", "Standard", "Regular"]:
            name = f"{name} ({it.variant_label_snapshot})"
        parts.append(f"{name} × {it.quantity}")
    return ", ".join(parts) if parts else "1 item"


def _serialize_safe_customer_for_user(customer: Customer | None, user) -> dict[str, str]:
    if customer is not None and customer.user_id == user.id:
        return {
            "full_name": customer.full_name,
            "phone": customer.phone,
            "email": customer.email,
        }
    return {
        "full_name": user.full_name or "",
        "phone": user.phone or "",
        "email": user.email,
    }


# -----------------------------------------------------------------------------
# Storefront OTP & Google Sign-In Endpoints
# -----------------------------------------------------------------------------

class StorefrontOTPRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class StorefrontOTPRequestView(StorePublicMixin, APIView):
    """
    Store-scoped OTP request endpoint.
    Generates a 6-digit code, enforces 60s cooldown, 3/15min email limit, and 10/hr IP limit.
    Commits the OTP record first, then schedules store-branded email delivery via transaction.on_commit.
    Returns a generic response that never reveals whether an account exists or leaks OTPs in production.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, store_slug):
        serializer = StorefrontOTPRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"error": "Please provide a valid email address."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = serializer.validated_data["email"].strip().lower()
        client_ip = get_client_ip(request)

        # 1. Enforce rate limits via database records
        allowed, reason, retry_after = EmailOTPChallenge.check_rate_limits(email, client_ip)
        if not allowed:
            if reason == "COOLDOWN":
                msg = f"Please wait {retry_after} seconds before requesting another code."
            elif reason == "EMAIL_LIMIT":
                msg = "Too many sign-in attempts for this email. Please try again in a few minutes."
            else:
                msg = "Too many sign-in attempts from this network. Please try again later."
            return Response(
                {"error": msg, "resend_in_seconds": retry_after},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        store_name = (self.store.name or "Store").strip()
        support_email = (
            (getattr(self.store, "support_email", "") or "").strip()
            or (getattr(self.store, "contact_email", "") or "").strip()
            or None
        )

        # 2. Commit OTP record first, then dispatch asynchronously via transaction.on_commit
        with transaction.atomic():
            _, raw_code = EmailOTPChallenge.issue_for_email(email, ip_address=client_ip)
            schedule_otp_email(
                to_email=email,
                raw_code=raw_code,
                brand_name=store_name,
                reply_to_email=support_email,
                store_id=self.store.id,
            )

        payload = {
            "ok": True,
            "detail": "If this email is valid, a verification code has been sent.",
            "expires_in_seconds": 600,
            "resend_in_seconds": 60,
        }
        if settings.DEBUG:
            payload["dev_otp_hint"] = raw_code

        return Response(payload, status=status.HTTP_200_OK)


class StorefrontOTPVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.RegexField(regex=r"^\d{6}$")


class StorefrontOTPVerifyView(StorePublicMixin, APIView):
    """
    Store-scoped OTP verification endpoint.
    Validates code using constant-time HMAC comparison.
    On success: signs in user, safely links Customer for this store (never across stores).
    Returns user and customer profile data only.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, store_slug):
        serializer = StorefrontOTPVerifySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"error": "Please enter a valid 6-digit code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = serializer.validated_data["email"].strip().lower()
        code = serializer.validated_data["code"].strip()

        verified = EmailOTPChallenge.verify_code(email, code)
        if not verified:
            return Response(
                {"error": "That code didn't match or has expired. Please request a fresh code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with TenantDatabaseContext(self.store.id), transaction.atomic():
            user, created = User.objects.get_or_create(
                email=email,
                defaults={"full_name": ""}
            )
            if created:
                user.set_unusable_password()
                user.save()
            login(request, user, backend="django.contrib.auth.backends.ModelBackend")

            # Link customer for the current store ONLY:
            # provision_store_customer links user only if customer.user is null or already this user
            customer = provision_store_customer(self.store, user)

        return Response(
            {
                "ok": True,
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "full_name": user.full_name,
                    "phone": user.phone,
                },
                "customer": _serialize_safe_customer_for_user(customer, user),
            },
            status=status.HTTP_200_OK,
        )


class StorefrontGoogleAuthSerializer(serializers.Serializer):
    credential = serializers.CharField(max_length=8192)


class StorefrontGoogleAuthView(StorePublicMixin, APIView):
    """
    Store-scoped Google Sign-In endpoint (POST /api/stores/<slug>/account/google/).
    Verifies the Google ID token server-side (signature, issuer, audience == GOOGLE_CLIENT_ID,
    expiry, email_verified is True), takes email/name strictly from the verified token,
    creates/reuses the single normalized Django User, logs in the session, and links
    the store Customer ONLY when customer.user is null or already this user.
    Never links across stores and never grants merchant access.
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_google"

    def post(self, request, store_slug):
        if not get_configured_google_client_id():
            return Response(
                {"error": "Google sign-in is unavailable."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        client_ip = get_client_ip(request)
        if not check_google_ip_rate_limit(client_ip):
            return Response(
                {"error": "Too many sign-in attempts. Please try again shortly."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        serializer = StorefrontGoogleAuthSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"error": GENERIC_GOOGLE_AUTH_ERROR},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            verified = verify_google_id_token(
                serializer.validated_data["credential"],
                store_id=self.store.id,
            )
        except GoogleTokenVerificationError:
            return Response(
                {"error": GENERIC_GOOGLE_AUTH_ERROR},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        email = verified["email"]
        full_name = verified["full_name"]

        with TenantDatabaseContext(self.store.id), transaction.atomic():
            user, created = User.objects.get_or_create(
                email=email,
                defaults={"full_name": full_name},
            )
            if created:
                user.set_unusable_password()
                user.save()
            elif not user.full_name and full_name:
                user.full_name = full_name
                user.save(update_fields=["full_name"])

            login(request, user, backend="django.contrib.auth.backends.ModelBackend")
            customer = provision_store_customer(self.store, user, full_name=full_name)

        return Response(
            {
                "ok": True,
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "full_name": user.full_name,
                    "phone": user.phone,
                },
                "customer": _serialize_safe_customer_for_user(customer, user),
            },
            status=status.HTTP_200_OK,
        )


# -----------------------------------------------------------------------------
# Storefront Account & Orders Endpoints
# -----------------------------------------------------------------------------

class StorefrontAccountUpdateSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    phone = serializers.CharField(max_length=24, required=False, allow_blank=True)

    def validate_phone(self, value):
        if value:
            return clean_and_validate_nepali_phone(value)
        return ""

    def validate_full_name(self, value):
        return (value or "").strip()


class StorefrontAccountDetailView(StorePublicMixin, APIView):
    """
    Storefront customer account profile.
    GET: Returns {user, customer} for this store only.
    PATCH: Updates full_name and phone with Nepali mobile number validation.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, store_slug):
        with TenantDatabaseContext(self.store.id):
            customer = Customer.objects.for_store(self.store).filter(user=request.user).first()
            if not customer:
                customer = provision_store_customer(self.store, request.user)

            if customer.user_id != request.user.id:
                orders_count = 0
                total_spent = 0
                cust_payload = {
                    "id": None,
                    "email": request.user.email,
                    "full_name": request.user.full_name,
                    "phone": request.user.phone,
                    "orders_count": 0,
                    "total_spent_minor": 0,
                }
            else:
                orders_qs = Order.objects.for_store(self.store).filter(customer=customer)
                orders_count = orders_qs.count()
                total_spent = (
                    orders_qs.filter(payment_status="PAID")
                    .aggregate(total=models.Sum("total_minor"))["total"]
                    or 0
                )
                cust_payload = {
                    "id": customer.id,
                    "email": customer.email,
                    "full_name": customer.full_name,
                    "phone": customer.phone,
                    "orders_count": orders_count,
                    "total_spent_minor": total_spent,
                }

        return Response(
            {
                "user": {
                    "id": request.user.id,
                    "email": request.user.email,
                    "full_name": request.user.full_name,
                    "phone": request.user.phone,
                },
                "customer": cust_payload,
            },
            status=status.HTTP_200_OK,
        )

    def patch(self, request, store_slug):
        serializer = StorefrontAccountUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        full_name = serializer.validated_data.get("full_name")
        phone = serializer.validated_data.get("phone")

        with TenantDatabaseContext(self.store.id), transaction.atomic():
            customer = Customer.objects.for_store(self.store).filter(user=request.user).first()
            if not customer:
                customer = provision_store_customer(self.store, request.user)

            if customer.user_id != request.user.id:
                return Response(
                    {"error": "Unable to update customer profile for this store."},
                    status=status.HTTP_409_CONFLICT,
                )

            update_fields = []
            if full_name is not None:
                customer.full_name = full_name
                update_fields.append("full_name")
                if not request.user.full_name:
                    request.user.full_name = full_name
                    request.user.save(update_fields=["full_name"])

            if phone is not None:
                customer.phone = phone
                update_fields.append("phone")
                if not request.user.phone:
                    request.user.phone = phone
                    request.user.save(update_fields=["phone"])

            if update_fields:
                customer.save(update_fields=update_fields)

            orders_qs = Order.objects.for_store(self.store).filter(customer=customer)
            orders_count = orders_qs.count()
            total_spent = (
                orders_qs.filter(payment_status="PAID")
                .aggregate(total=models.Sum("total_minor"))["total"]
                or 0
            )

        return Response(
            {
                "ok": True,
                "user": {
                    "id": request.user.id,
                    "email": request.user.email,
                    "full_name": request.user.full_name,
                    "phone": request.user.phone,
                },
                "customer": {
                    "id": customer.id,
                    "email": customer.email,
                    "full_name": customer.full_name,
                    "phone": customer.phone,
                    "orders_count": orders_count,
                    "total_spent_minor": total_spent,
                },
            },
            status=status.HTTP_200_OK,
        )


class StorefrontCustomerOrdersView(StorePublicMixin, APIView):
    """
    Returns the authenticated customer's orders in the current store only.
    Each item contains id, order_number, status, payment_status, total_minor,
    created_at, items_summary, and token (for linking to the order page).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, store_slug):
        with TenantDatabaseContext(self.store.id):
            orders = (
                Order.objects.for_store(self.store)
                .filter(customer__user=request.user)
                .prefetch_related("items")
                .order_by("-created_at")
            )

            data = []
            for o in orders:
                data.append(
                    {
                        "id": o.id,
                        "order_number": o.order_number,
                        "status": o.status,
                        "payment_status": o.payment_status,
                        "total_minor": o.total_minor,
                        "created_at": o.created_at.isoformat(),
                        "items_summary": format_order_items_summary(o),
                        "token": str(o.token),
                    }
                )

        return Response(data, status=status.HTTP_200_OK)
