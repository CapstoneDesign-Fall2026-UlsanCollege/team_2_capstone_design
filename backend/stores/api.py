from datetime import timedelta
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.db.models import Count, F, Prefetch, Q, Sum
from django.http import Http404
from django.urls import path
from django.utils import timezone
from rest_framework import permissions, serializers, status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from PIL import Image
import io

from accounts.models import User
from catalog.models import Discount, Product, Variant
from orders.models import Order, OrderItem, OrderEvent
from core.tenant_context import set_current_tenant_id, reset_current_tenant_id, UserMembershipContext
from stores.cloudinary_upload import (
    CloudinaryUploadError,
    is_cloudinary_configured,
    upload_store_image_to_cloudinary,
    upload_theme_image_to_cloudinary,
    delete_cloudinary_asset,
    extract_cloudinary_public_id,
)
from stores.khalti import (
    initiate_khalti_epayment,
    resolve_khalti_initiation_config,
    validate_khalti_settings_update,
    verify_khalti_epayment,
)
from accounts.otp import compute_salted_ip_hash, get_client_ip
from stores.models import (
    ActionRateLimit,
    validate_store_slug,
    MerchantAuditLog,
    Customer,
    Store,
    StoreMembership,
    RESERVED_STORE_SLUGS,
    SLUG_REGEX,
    provision_store_customer,
)


# -----------------------------------------------------------------------------
# Mixins
# -----------------------------------------------------------------------------

PUBLIC_STOREFRONT_CACHE_CONTROL = "public, max-age=30, s-maxage=60, stale-while-revalidate=300"
PRIVATE_NO_STORE_CACHE_CONTROL = "private, no-store"


class StoreTenantMixin:
    """
    Enforces transaction-local PostgreSQL RLS context inside transaction.atomic()
    for all tenant-scoped requests. No tenant state survives the transaction or HTTP request.
    Guarantees atomic rollback whenever DRF catches an exception (response.exception = True)
    or an error response with status >= 500 is returned.
    """
    store = None

    def dispatch(self, request, *args, **kwargs):
        with transaction.atomic():
            response = super().dispatch(request, *args, **kwargs)
            if getattr(response, "exception", False) or (hasattr(response, "status_code") and response.status_code >= 500):
                transaction.set_rollback(True)
            if hasattr(response, "headers") and "Cache-Control" not in response:
                response["Cache-Control"] = PRIVATE_NO_STORE_CACHE_CONTROL
            return response


class StorePublicMixin(StoreTenantMixin):
    """Resolves active store from URL slug or raises HTTP 404. Sets Postgres RLS context."""
    store = None

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        store_slug = self.kwargs.get("store_slug")
        self.store = Store.objects.filter(slug=store_slug, is_active=True).first()
        if not self.store:
            raise Http404("Store not found or inactive.")
        set_current_tenant_id(self.store.id, is_local=True)

    def finalize_response(self, request, response, *args, **kwargs):
        reset_current_tenant_id()
        return super().finalize_response(request, response, *args, **kwargs)


def is_local_media_allowed() -> bool:
    """Local media uploads are strictly forbidden in production."""
    if getattr(settings, "DEBUG", False) or getattr(settings, "IS_TEST_COMMAND", False):
        return bool(getattr(settings, "ALLOW_LOCAL_MEDIA_UPLOADS", False))
    return False


class StoreMerchantMixin(StoreTenantMixin):
    """
    Requires authentication and verifies the user is a member of the store.
    Raises HTTP 404 if the store does not exist or user is not a member (D-03).
    """
    store = None
    membership = None
    member_role = "OWNER"
    permission_classes = [permissions.IsAuthenticated]

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        store_slug = self.kwargs.get("store_slug")
        store = Store.objects.filter(slug=store_slug).first()
        if not store:
            raise Http404("Store not found.")

        # Activate tenant transaction before checking tenant-scoped StoreMembership
        set_current_tenant_id(store.id, is_local=True)

        # Check membership & role
        membership = StoreMembership.objects.for_store(store).filter(user=request.user).first()
        is_member = membership is not None
        if not is_member and (
            getattr(request.user, "is_staff", False)
            or getattr(request.user, "is_superuser", False)
        ):
            is_member = True
        if not is_member:
            raise Http404("Store not found.")

        self.store = store
        self.membership = membership
        self.member_role = membership.role if membership else "OWNER"

    def finalize_response(self, request, response, *args, **kwargs):
        reset_current_tenant_id()
        return super().finalize_response(request, response, *args, **kwargs)


class StoreScopedSerializerMixin(serializers.ModelSerializer):
    """Prevents tenant reassignment by ignoring incoming store fields."""
    def to_internal_value(self, data):
        clean_data = data.copy() if hasattr(data, "copy") else dict(data)
        clean_data.pop("store", None)
        clean_data.pop("store_id", None)
        return super().to_internal_value(clean_data)


# -----------------------------------------------------------------------------
# Serializers
# -----------------------------------------------------------------------------

class StorePublicSerializer(serializers.ModelSerializer):
    has_khalti = serializers.SerializerMethodField()

    class Meta:
        model = Store
        fields = [
            "slug",
            "name",
            "tagline",
            "category",
            "city",
            "province",
            "currency",
            "theme_preset",
            "logo_url",
            "accent_color",
            "contact_phone",
            "contact_email",
            "support_email",
            "address",
            "story_headline",
            "about_text",
            "banner_url",
            "instagram_url",
            "facebook_url",
            "inside_valley_shipping_minor",
            "outside_valley_shipping_minor",
            "free_shipping_threshold_minor",
            "shipping_configured",
            "has_khalti",
            "cod_enabled",
            "custom_domain",
        ]

    def get_has_khalti(self, obj) -> bool:
        return bool(obj.khalti_secret_key_encrypted)


class CustomerSerializer(serializers.ModelSerializer):
    orders_count = serializers.IntegerField(read_only=True, default=0)
    total_spent_minor = serializers.IntegerField(read_only=True, default=0)
    city = serializers.SerializerMethodField()
    has_account = serializers.SerializerMethodField()

    class Meta:
        model = Customer
        fields = [
            "id",
            "email",
            "full_name",
            "phone",
            "orders_count",
            "total_spent_minor",
            "city",
            "has_account",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def get_has_account(self, obj):
        return obj.user_id is not None

    def _get_last_order(self, obj):
        if hasattr(obj, "prefetched_orders"):
            return obj.prefetched_orders[0] if obj.prefetched_orders else None
        if not hasattr(obj, "_cached_last_order"):
            obj._cached_last_order = obj.orders.order_by("-created_at").first()
        return obj._cached_last_order

    def get_city(self, obj):
        last_order = self._get_last_order(obj)
        if last_order and isinstance(last_order.shipping_address_snapshot, dict):
            return (
                last_order.shipping_address_snapshot.get("district")
                or last_order.shipping_address_snapshot.get("city")
                or "Kathmandu"
            )
        return "Kathmandu"

    def to_representation(self, instance):
        data = super().to_representation(instance)
        last_order = self._get_last_order(instance)
        if not data.get("phone") and last_order:
            snap = getattr(last_order, "shipping_address_snapshot", None)
            if isinstance(snap, dict) and snap.get("phone"):
                data["phone"] = snap.get("phone")

        if not data.get("full_name") and last_order:
            snap = getattr(last_order, "shipping_address_snapshot", None)
            if isinstance(snap, dict) and snap.get("recipient_name"):
                data["full_name"] = snap.get("recipient_name")
        return data


class VariantSerializer(StoreScopedSerializerMixin):
    class Meta:
        model = Variant
        fields = [
            "id",
            "sku",
            "label",
            "weight_grams",
            "price_minor",
            "allow_one_time",
            "in_stock",
            "is_active",
            "sort_order",
        ]
        read_only_fields = ["id"]


class ProductSerializer(StoreScopedSerializerMixin):
    variants = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "slug",
            "name",
            "description",
            "image_url",
            "attributes",
            "allow_one_time",
            "is_active",
            "sort_order",
            "variants",
        ]
        read_only_fields = ["id"]

    def get_variants(self, obj):
        if hasattr(obj, "prefetched_active_variants"):
            active_variants = obj.prefetched_active_variants
        else:
            active_variants = obj.variants.filter(is_active=True).order_by("sort_order", "price_minor")
        return VariantSerializer(active_variants, many=True).data


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product_name_snapshot",
            "variant_label_snapshot",
            "unit_price_minor",
            "quantity",
            "line_total_minor",
        ]
        read_only_fields = ["id"]


class OrderEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderEvent
        fields = [
            "id",
            "from_status",
            "to_status",
            "note",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    events = OrderEventSerializer(many=True, read_only=True)
    customer_name = serializers.CharField(source="customer.full_name", read_only=True)
    customer_email = serializers.CharField(source="customer.email", read_only=True)
    customer_phone = serializers.CharField(source="customer.phone", read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "token",
            "order_number",
            "order_type",
            "status",
            "payment_method",
            "payment_status",
            "payment_ref",
            "subtotal_minor",
            "shipping_minor",
            "discount_minor",
            "total_minor",
            "currency",
            "shipping_address_snapshot",
            "created_at",
            "items",
            "events",
            "customer_name",
            "customer_email",
            "customer_phone",
        ]
        read_only_fields = ["id", "created_at"]


# -----------------------------------------------------------------------------
# Public Store Views
# -----------------------------------------------------------------------------

class StoreDetailView(StorePublicMixin, APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def get(self, request, store_slug):
        response = Response(StorePublicSerializer(self.store).data)
        response["Cache-Control"] = PUBLIC_STOREFRONT_CACHE_CONTROL
        return response


class StoreCatalogView(StorePublicMixin, APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def get(self, request, store_slug):
        active_variants_qs = Variant.objects.filter(is_active=True).order_by("sort_order", "price_minor")
        products = (
            Product.objects.for_store(self.store)
            .filter(is_active=True)
            .prefetch_related(
                Prefetch("variants", queryset=active_variants_qs, to_attr="prefetched_active_variants")
            )
            .order_by("sort_order", "id")
        )
        response = Response({
            "products": ProductSerializer(products, many=True).data,
        })
        response["Cache-Control"] = PUBLIC_STOREFRONT_CACHE_CONTROL
        return response


class StorePublicProductDetailView(StorePublicMixin, APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def get(self, request, store_slug, product_ref):
        active_variants_qs = Variant.objects.filter(is_active=True).order_by("sort_order", "price_minor")
        base_qs = (
            Product.objects.for_store(self.store)
            .filter(is_active=True)
            .prefetch_related(
                Prefetch("variants", queryset=active_variants_qs, to_attr="prefetched_active_variants")
            )
        )
        clean_ref = str(product_ref).strip()
        if clean_ref.isdigit():
            product = base_qs.filter(Q(id=int(clean_ref)) | Q(slug__iexact=clean_ref)).first()
        else:
            product = base_qs.filter(slug__iexact=clean_ref).first()
        if not product:
            raise Http404("Product not found.")
        related = list(base_qs.exclude(id=product.id).order_by("sort_order", "id")[:3])
        response = Response({
            "product": ProductSerializer(product).data,
            "related_products": ProductSerializer(related, many=True).data,
        })
        response["Cache-Control"] = PUBLIC_STOREFRONT_CACHE_CONTROL
        return response


class CustomerBootstrapView(StorePublicMixin, APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, store_slug):
        customer = provision_store_customer(self.store, request.user)
        return Response(CustomerSerializer(customer).data, status=status.HTTP_200_OK)


class ShopperOrderListView(StorePublicMixin, APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, store_slug):
        orders = (
            Order.objects.for_store(self.store)
            .filter(customer__user=request.user)
            .select_related("customer")
            .prefetch_related("items", "events")
            .order_by("-created_at")
        )
        return Response(OrderSerializer(orders, many=True).data)


class ShopperOrderDetailView(StorePublicMixin, APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, store_slug, order_id):
        order = (
            Order.objects.for_store(self.store)
            .filter(customer__user=request.user, id=order_id)
            .select_related("customer")
            .prefetch_related("items", "events")
            .first()
        )
        if not order:
            raise Http404("Order not found.")
        response = Response(OrderSerializer(order).data)
        response["Cache-Control"] = "no-store, no-cache, must-revalidate, private"
        return response


class StorePublicOrderDetailView(StorePublicMixin, APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, store_slug, order_id):
        import uuid
        token_param = request.query_params.get('token', '').strip()
        order = None
        base_qs = (
            Order.objects.for_store(self.store)
            .select_related("customer")
            .prefetch_related("items", "events")
        )

        try:
            uuid_token = uuid.UUID(str(order_id))
            order = base_qs.filter(token=uuid_token).first()
        except ValueError:
            try:
                oid = int(order_id)
                if token_param:
                    try:
                        param_uuid = uuid.UUID(token_param)
                        order = base_qs.filter(id=oid, token=param_uuid).first()
                    except ValueError:
                        pass
                elif request.user.is_authenticated:
                    order = base_qs.filter(id=oid, customer__user=request.user).first()
            except ValueError:
                pass

        if not order:
            raise Http404('Order not found.')
        data = OrderSerializer(order).data
        response = Response(data)
        response['Cache-Control'] = 'no-store, no-cache, must-revalidate, private'
        return response

class StorePublicOrderPayView(StorePublicMixin, APIView):
    """
    Allows a shopper holding a valid unguessable order access token (e.g. from a
    pay-per-delivery renewal link or failed Khalti return) to pay via Khalti or confirm COD.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, store_slug, order_id):
        import uuid
        token_param = str(
            request.data.get("token") or request.query_params.get("token") or ""
        ).strip()
        order = None

        try:
            uuid_token = uuid.UUID(str(order_id))
            order = Order.objects.for_store(self.store).filter(token=uuid_token).first()
        except ValueError:
            try:
                oid = int(order_id)
                if token_param:
                    try:
                        param_uuid = uuid.UUID(token_param)
                        order = Order.objects.for_store(self.store).filter(id=oid, token=param_uuid).first()
                    except ValueError:
                        pass
                elif request.user.is_authenticated:
                    order = Order.objects.for_store(self.store).filter(id=oid, customer__user=request.user).first()
            except ValueError:
                pass

        if not order:
            raise Http404("Order not found.")

        if order.payment_status == "PAID" or order.status not in ["PENDING_PAYMENT", "PAYMENT_FAILED"]:
            return Response(
                {"error": "This order does not have a pending payment balance."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        payment_method = str(request.data.get("payment_method", "KHALTI")).strip().upper()
        if payment_method not in ["KHALTI", "COD"]:
            return Response(
                {"error": "Invalid payment method. Choose KHALTI or COD."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if payment_method == "COD" and not self.store.cod_enabled:
            return Response(
                {"error": "Cash on Delivery is currently disabled for this store. Please pay via Khalti."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if payment_method == "KHALTI":
            _, _, khalti_cfg_err = resolve_khalti_initiation_config(self.store)
            if khalti_cfg_err:
                return Response({"error": khalti_cfg_err}, status=status.HTTP_400_BAD_REQUEST)

        if payment_method == "COD":
            with transaction.atomic():
                old_status = order.status
                order.status = "CONFIRMED"
                order.payment_method = "COD"
                order.payment_status = "COD_PENDING"
                order.save(update_fields=["status", "payment_method", "payment_status", "updated_at"])

                OrderEvent.objects.create(
                    store=self.store,
                    order=order,
                    from_status=old_status,
                    to_status="CONFIRMED",
                    note="Order confirmed via Cash on Delivery.",
                    actor=request.user if request.user.is_authenticated else None,
                )

            return Response({
                "order_id": order.id,
                "token": str(order.token),
                "order_number": order.order_number,
                "status": order.status,
                "payment_method": "COD",
                "payment_status": order.payment_status,
                "total_minor": order.total_minor,
            })

        # Khalti initiation for renewal / retry payment
        _, _, khalti_cfg_err = resolve_khalti_initiation_config(self.store)
        if khalti_cfg_err:
            return Response({"error": khalti_cfg_err}, status=status.HTTP_400_BAD_REQUEST)

        return_url = request.data.get("return_url") or request.build_absolute_uri(
            f"/s/{self.store.slug}/checkout/khalti-return/"
        )
        snap = order.shipping_address_snapshot or {}
        recipient_name = snap.get("recipient_name") or order.customer.full_name or "Shopper"
        phone = snap.get("phone") or order.customer.phone or "9800000000"

        khalti_body = {
            "return_url": return_url,
            "website_url": request.build_absolute_uri(f"/s/{self.store.slug}/"),
            "amount": order.total_minor,
            "purchase_order_id": str(order.id),
            "purchase_order_name": f"{self.store.name} Renewal {order.order_number}",
            "customer_info": {
                "name": recipient_name,
                "email": order.customer.email,
                "phone": phone,
            },
        }

        pidx, payment_url, is_sandbox, gw_err = initiate_khalti_epayment(
            store=self.store,
            order=order,
            khalti_body=khalti_body,
        )
        if gw_err or not pidx or not payment_url:
            return Response(
                {"error": gw_err or "Unable to reach Khalti payment gateway. Please try again shortly."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        order.payment_method = "KHALTI"
        order.payment_ref = pidx
        order.save(update_fields=["payment_method", "payment_ref", "updated_at"])

        payload = {
            "order_id": order.id,
            "token": str(order.token),
            "order_number": order.order_number,
            "pidx": pidx,
            "payment_url": payment_url,
            "status": order.status,
        }
        if is_sandbox:
            payload["is_sandbox"] = True
        return Response(payload)


class StoreCheckoutQuoteView(StorePublicMixin, APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, store_slug):
        items_data = request.data.get("items", [])
        if not items_data:
            return Response({"error": "Cart is empty."}, status=status.HTTP_400_BAD_REQUEST)

        variant_ids = [it.get("variant_id") for it in items_data if it.get("variant_id")]
        variants = {
            v.id: v
            for v in Variant.objects.for_store(self.store)
            .select_related("product")
            .filter(id__in=variant_ids, is_active=True)
        }

        subtotal_minor = 0
        computed_items = []

        for it in items_data:
            v_id = it.get("variant_id")
            v = variants.get(v_id)
            if not v:
                return Response(
                    {"error": f"Product variant {v_id} not available in this store."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            quantity = max(1, int(it.get("quantity", 1)))
            unit_price = v.price_minor
            line_total = unit_price * quantity

            subtotal_minor += line_total
            computed_items.append({
                "variant_id": v.id,
                "product_name": v.product.name,
                "variant_label": v.label,
                "unit_price_minor": unit_price,
                "quantity": quantity,
                "line_total_minor": line_total,
            })

        district = str(request.data.get("district", "")).strip().lower()
        inside_valley_districts = {"kathmandu", "lalitpur", "bhaktapur"}

        if district in inside_valley_districts:
            shipping_minor = self.store.inside_valley_shipping_minor
        else:
            shipping_minor = self.store.outside_valley_shipping_minor

        is_free_shipping = False
        if self.store.free_shipping_threshold_minor and subtotal_minor >= self.store.free_shipping_threshold_minor:
            shipping_minor = 0
            is_free_shipping = True

        discount_minor = 0
        applied_discount_code = None
        raw_discount_code = str(request.data.get("discount_code") or "").strip().upper()
        if raw_discount_code:
            disc = Discount.objects.for_store(self.store).filter(code__iexact=raw_discount_code).first()
            if not disc:
                return Response(
                    {"error": f"Promo code '{raw_discount_code}' is not valid for this store."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            ok, reason = disc.check_eligibility(subtotal_minor)
            if not ok:
                return Response({"error": reason}, status=status.HTTP_400_BAD_REQUEST)
            discount_minor = disc.compute_discount_minor(subtotal_minor)
            applied_discount_code = disc.code

        total_minor = max(0, subtotal_minor - discount_minor) + shipping_minor

        return Response({
            "subtotal_minor": subtotal_minor,
            "shipping_minor": shipping_minor,
            "discount_minor": discount_minor,
            "discount_code": applied_discount_code,
            "total_minor": total_minor,
            "is_free_shipping": is_free_shipping,
            "currency": self.store.currency,
            "items": computed_items,
        })


class StoreCheckoutPlaceView(StorePublicMixin, APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, store_slug):
        items_data = request.data.get("items", [])
        if not items_data:
            return Response({"error": "Cart is empty."}, status=status.HTTP_400_BAD_REQUEST)

        shipping_address = request.data.get("shipping_address")
        if not isinstance(shipping_address, dict):
            return Response({"error": "Valid shipping address required."}, status=status.HTTP_400_BAD_REQUEST)

        recipient_name = str(shipping_address.get("recipient_name", "")).strip()
        phone = str(shipping_address.get("phone", "")).strip()
        district = str(shipping_address.get("district", "")).strip()

        if not recipient_name or not phone or not district:
            return Response(
                {"error": "Recipient name, phone number, and district are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        import re
        if not re.match(r"^9[78]\d{8}$", phone):
            return Response(
                {"error": "Please enter a valid 10-digit Nepali mobile number starting with 98 or 97."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        customer_email = str(
            request.data.get("customer_email")
            or request.data.get("email")
            or shipping_address.get("email")
            or (request.user.email if getattr(request.user, "is_authenticated", False) else "")
            or ""
        ).strip().lower()

        if not customer_email:
            return Response(
                {"error": "Customer email is required for order confirmation."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user_email_norm = (
            request.user.email.strip().lower()
            if getattr(request.user, "is_authenticated", False) and request.user.email
            else None
        )

        if user_email_norm and customer_email == user_email_norm:
            customer = provision_store_customer(
                self.store,
                request.user,
                full_name=recipient_name,
                phone=phone
            )
        else:
            customer, _ = Customer.objects.for_store(self.store).get_or_create(
                store=self.store,
                email=customer_email,
                defaults={"full_name": recipient_name, "phone": phone},
            )
            if not customer.phone and phone:
                customer.phone = phone
                customer.save(update_fields=["phone"])
            if not customer.full_name and recipient_name:
                customer.full_name = recipient_name
                customer.save(update_fields=["full_name"])

        payment_method = str(request.data.get("payment_method", "KHALTI")).strip().upper()
        if payment_method not in ["KHALTI", "COD"]:
            return Response({"error": "Invalid payment method. Choose KHALTI or COD."}, status=status.HTTP_400_BAD_REQUEST)

        if payment_method == "COD" and not self.store.cod_enabled:
            return Response(
                {"error": "Cash on Delivery is currently disabled for this store. Please pay via Khalti."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if payment_method == "KHALTI":
            _, _, khalti_cfg_err = resolve_khalti_initiation_config(self.store)
            if khalti_cfg_err:
                return Response({"error": khalti_cfg_err}, status=status.HTTP_400_BAD_REQUEST)

        variant_ids = [it.get("variant_id") for it in items_data if it.get("variant_id")]
        variants = {
            v.id: v
            for v in Variant.objects.for_store(self.store)
            .select_related("product")
            .filter(id__in=variant_ids, is_active=True)
        }

        subtotal_minor = 0
        order_items_to_create = []

        for it in items_data:
            v_id = it.get("variant_id")
            v = variants.get(v_id)
            if not v:
                return Response(
                    {"error": f"Product variant {v_id} not available."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            quantity = max(1, int(it.get("quantity", 1)))
            unit_price = v.price_minor
            line_total = unit_price * quantity
            variant_label = v.label

            subtotal_minor += line_total
            order_items_to_create.append({
                "variant": v,
                "product_name_snapshot": v.product.name,
                "variant_label_snapshot": variant_label,
                "unit_price_minor": unit_price,
                "quantity": quantity,
                "line_total_minor": line_total,
            })

        inside_valley_districts = {"kathmandu", "lalitpur", "bhaktapur"}
        if district.lower() in inside_valley_districts:
            shipping_minor = self.store.inside_valley_shipping_minor
        else:
            shipping_minor = self.store.outside_valley_shipping_minor

        if self.store.free_shipping_threshold_minor and subtotal_minor >= self.store.free_shipping_threshold_minor:
            shipping_minor = 0

        raw_discount_code = str(request.data.get("discount_code") or "").strip().upper()
        disc_candidate = None
        if raw_discount_code:
            disc_candidate = Discount.objects.for_store(self.store).filter(code__iexact=raw_discount_code).first()
            if not disc_candidate:
                return Response(
                    {"error": f"Promo code '{raw_discount_code}' is not valid for this store."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            ok, reason = disc_candidate.check_eligibility(subtotal_minor)
            if not ok:
                return Response({"error": reason}, status=status.HTTP_400_BAD_REQUEST)

        prefix = f"{self.store.slug[:2].upper()}-{timezone.now().year}"
        with transaction.atomic():
            discount_minor = 0
            applied_promo_note = ""
            if disc_candidate is not None:
                locked_disc = Discount.objects.select_for_update().for_store(self.store).filter(id=disc_candidate.id).first()
                if not locked_disc:
                    return Response({"error": "Promo code is no longer valid."}, status=status.HTTP_400_BAD_REQUEST)
                ok, reason = locked_disc.check_eligibility(subtotal_minor)
                if not ok:
                    return Response({"error": reason}, status=status.HTTP_400_BAD_REQUEST)
                discount_minor = locked_disc.compute_discount_minor(subtotal_minor)
                Discount.objects.for_store(self.store).filter(id=locked_disc.id).update(used_count=F("used_count") + 1)
                applied_promo_note = f" (Promo: {locked_disc.code})"

            total_minor = max(0, subtotal_minor - discount_minor) + shipping_minor

            count = Order.objects.for_store(self.store).count() + 1
            order_number = f"#{prefix}-{count:04d}"
            while Order.objects.filter(store=self.store, order_number=order_number).exists():
                count += 1
                order_number = f"#{prefix}-{count:04d}"

            initial_status = "CONFIRMED" if payment_method == "COD" else "PENDING_PAYMENT"
            initial_payment_status = "COD_PENDING" if payment_method == "COD" else "UNPAID"

            order = Order.objects.create(
                store=self.store,
                customer=customer,
                order_number=order_number,
                order_type="ONE_TIME",
                status=initial_status,
                payment_method=payment_method,
                payment_status=initial_payment_status,
                subtotal_minor=subtotal_minor,
                shipping_minor=shipping_minor,
                discount_minor=discount_minor,
                total_minor=total_minor,
                currency=self.store.currency,
                shipping_address_snapshot=shipping_address,
                is_test=(self.store.khalti_mode != "LIVE"),
            )

            OrderItem.objects.bulk_create([
                OrderItem(
                    store=self.store,
                    order=order,
                    variant=item_info["variant"],
                    product_name_snapshot=item_info["product_name_snapshot"],
                    variant_label_snapshot=item_info["variant_label_snapshot"],
                    unit_price_minor=item_info["unit_price_minor"],
                    quantity=item_info["quantity"],
                    line_total_minor=item_info["line_total_minor"],
                )
                for item_info in order_items_to_create
            ])

            OrderEvent.objects.create(
                store=self.store,
                order=order,
                from_status="",
                to_status=initial_status,
                note=f"Order placed via {payment_method}{applied_promo_note}",
                actor=request.user if request.user.is_authenticated else None,
            )

        if payment_method == "COD":
            return Response({
                "order_id": order.id,
                "token": str(order.token),
                "order_number": order.order_number,
                "status": order.status,
                "payment_method": "COD",
                "payment_status": order.payment_status,
                "total_minor": order.total_minor,
            }, status=status.HTTP_201_CREATED)

        return_url = request.data.get("return_url") or request.build_absolute_uri(
            f"/s/{self.store.slug}/checkout/khalti-return/"
        )
        khalti_body = {
            "return_url": return_url,
            "website_url": request.build_absolute_uri(f"/s/{self.store.slug}/"),
            "amount": order.total_minor,
            "purchase_order_id": str(order.id),
            "purchase_order_name": f"{self.store.name} Order {order.order_number}",
            "customer_info": {
                "name": recipient_name,
                "email": customer.email,
                "phone": phone,
            },
        }

        pidx, payment_url, is_sandbox, gw_err = initiate_khalti_epayment(
            store=self.store,
            order=order,
            khalti_body=khalti_body,
        )
        if gw_err or not pidx or not payment_url:
            return Response(
                {"error": gw_err or "Unable to reach Khalti payment gateway. Please try again shortly."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        order.payment_ref = pidx
        order.save(update_fields=["payment_ref"])

        payload = {
            "order_id": order.id,
            "token": str(order.token),
            "order_number": order.order_number,
            "pidx": pidx,
            "payment_url": payment_url,
            "status": order.status,
        }
        if is_sandbox:
            payload["is_sandbox"] = True
        return Response(payload, status=status.HTTP_201_CREATED)


class StoreKhaltiVerifyView(StorePublicMixin, APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, store_slug):
        pidx = str(request.data.get("pidx", "")).strip()
        order_id = request.data.get("order_id") or request.data.get("purchase_order_id")

        if not pidx or not order_id:
            return Response(
                {"error": "pidx and order_id are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        order = Order.objects.for_store(self.store).filter(id=order_id).first()
        if not order:
            raise Http404("Order not found for this store.")

        if order.status in ["PAID", "CONFIRMED"] and order.payment_status == "PAID":
            return Response({
                "success": True,
                "order_id": order.id,
                "token": str(order.token),
                "order_number": order.order_number,
                "status": order.status,
            })

        verified, rejection_reason = verify_khalti_epayment(store=self.store, pidx=pidx)

        if verified:
            mode_label = "Khalti Live" if self.store.khalti_mode == "LIVE" else "Khalti Sandbox"
            with transaction.atomic():
                order.status = "PAID"
                order.payment_status = "PAID"
                order.payment_ref = pidx
                order.save(update_fields=["status", "payment_status", "payment_ref", "updated_at"])

                OrderEvent.objects.create(
                    store=self.store,
                    order=order,
                    from_status="PENDING_PAYMENT",
                    to_status="PAID",
                    note=f"Payment verified via {mode_label}.",
                    actor=request.user if request.user.is_authenticated else None,
                )

            return Response({
                "success": True,
                "order_id": order.id,
                "token": str(order.token),
                "order_number": order.order_number,
                "status": order.status,
            })
        else:
            failure_note = (
                f"Khalti payment verification failed ({rejection_reason})"
                if rejection_reason
                else "Khalti payment verification failed."
            )
            with transaction.atomic():
                order.status = "PAYMENT_FAILED"
                order.payment_status = "FAILED"
                order.save(update_fields=["status", "payment_status", "updated_at"])

                OrderEvent.objects.create(
                    store=self.store,
                    order=order,
                    from_status="PENDING_PAYMENT",
                    to_status="PAYMENT_FAILED",
                    note=failure_note,
                    actor=request.user if request.user.is_authenticated else None,
                )

            return Response(
                {"error": rejection_reason or "Payment verification failed or was cancelled."},
                status=status.HTTP_400_BAD_REQUEST,
            )


# -----------------------------------------------------------------------------
# Merchant Console Views
# -----------------------------------------------------------------------------

class MerchantStoreOverviewView(StoreMerchantMixin, APIView):
    def get(self, request, store_slug):
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        seven_days_start = (now - timedelta(days=6)).replace(hour=0, minute=0, second=0, microsecond=0)

        orders_qs = Order.objects.for_store(self.store)
        valid_orders_qs = orders_qs.exclude(status__in=["CANCELLED", "PAYMENT_FAILED"])

        orders_agg = orders_qs.aggregate(
            orders_count=Count("id"),
            revenue_minor=Sum("total_minor", filter=Q(payment_status__in=["PAID", "CONFIRMED"])),
            today_orders_count=Count("id", filter=Q(created_at__gte=today_start) & ~Q(status__in=["CANCELLED", "PAYMENT_FAILED"])),
            today_sales_minor=Sum("total_minor", filter=Q(created_at__gte=today_start) & ~Q(status__in=["CANCELLED", "PAYMENT_FAILED"])),
            pending_fulfillment_count=Count("id", filter=Q(status__in=["CONFIRMED", "PAID", "PROCESSING"])),
            cod_pending_minor=Sum("total_minor", filter=Q(payment_status="COD_PENDING") & ~Q(status="CANCELLED")),
        )
        orders_count = orders_agg["orders_count"] or 0
        revenue_minor = orders_agg["revenue_minor"] or 0
        today_orders_count = orders_agg["today_orders_count"] or 0
        today_sales_minor = orders_agg["today_sales_minor"] or 0
        pending_fulfillment_count = orders_agg["pending_fulfillment_count"] or 0
        cod_pending_minor = orders_agg["cod_pending_minor"] or 0

        products_count = Product.objects.for_store(self.store).filter(is_active=True).count()
        customers_count = Customer.objects.for_store(self.store).count()
        active_discounts_count = Discount.objects.for_store(self.store).filter(
            is_active=True
        ).count()

        # 7-day daily revenue & order count series (single query)
        daily_buckets = {}
        for offset in range(7):
            d = (seven_days_start + timedelta(days=offset)).date()
            daily_buckets[d.isoformat()] = {
                "date": d.isoformat(),
                "label": d.strftime("%b %d"),
                "revenue_minor": 0,
                "orders_count": 0,
            }
        recent_7d_rows = list(
            valid_orders_qs.filter(created_at__gte=seven_days_start).values(
                "created_at", "total_minor"
            )
        )
        for row in recent_7d_rows:
            dt_key = timezone.localtime(row["created_at"]).date().isoformat()
            if dt_key in daily_buckets:
                daily_buckets[dt_key]["revenue_minor"] += row["total_minor"] or 0
                daily_buckets[dt_key]["orders_count"] += 1

        recent_orders_qs = (
            orders_qs.select_related("customer").order_by("-created_at")[:5]
        )
        recent_orders = [
            {
                "id": o.id,
                "order_number": o.order_number,
                "customer_name": (
                    (o.shipping_address_snapshot or {}).get("recipient_name")
                    or o.customer.full_name
                    or o.customer.email
                ),
                "total_minor": o.total_minor,
                "status": o.status,
                "payment_method": o.payment_method,
                "payment_status": o.payment_status,
                "created_at": o.created_at.isoformat(),
            }
            for o in recent_orders_qs
        ]

        checklist = {
            "has_products": products_count > 0,
            "has_shipping": bool(self.store.shipping_configured),
            "has_khalti": bool(self.store.khalti_secret_key_encrypted),
            "has_story": bool(self.store.story_headline or self.store.about_text),
        }

        return Response({
            "store": StorePublicSerializer(self.store).data,
            "member_role": self.member_role,
            "products_count": products_count,
            "orders_count": orders_count,
            "revenue_minor": revenue_minor,
            "customers_count": customers_count,
            "today_sales_minor": today_sales_minor,
            "today_orders_count": today_orders_count,
            "pending_fulfillment_count": pending_fulfillment_count,
            "cod_pending_minor": cod_pending_minor,
            "active_discounts_count": active_discounts_count,
            "daily_sales_7d": list(daily_buckets.values()),
            "recent_orders": recent_orders,
            "checklist": checklist,
        })


class MerchantStoreSettingsView(StoreMerchantMixin, APIView):
    def get(self, request, store_slug):
        data = StorePublicSerializer(self.store).data
        has_custom_key = bool(self.store.khalti_secret_key_encrypted)
        masked_key = ""
        if has_custom_key:
            try:
                raw_key = self.store.get_khalti_secret_key()
                if len(raw_key) > 4:
                    masked_key = "••••••••••••" + raw_key[-4:]
                else:
                    masked_key = "••••••••••••"
            except Exception:
                masked_key = "••••••••••••"

        if self.member_role == "OWNER":
            data["has_custom_khalti_key"] = has_custom_key
            data["khalti_mode"] = self.store.khalti_mode
            data["khalti_key_masked"] = masked_key
        data["cod_enabled"] = self.store.cod_enabled
        data["custom_domain"] = self.store.custom_domain
        data["member_role"] = self.member_role
        return Response(data)

    def patch(self, request, store_slug):
        store = self.store
        data = request.data

        owner_only_fields = ("khalti_secret_key", "clear_khalti_secret_key", "khalti_mode", "custom_domain")
        if any(field in data for field in owner_only_fields) and self.member_role != "OWNER":
            return Response(
                {"detail": "Only store owners can modify payment gateway keys or custom domains."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if "name" in data and str(data["name"]).strip():
            store.name = str(data["name"]).strip()
        if "tagline" in data:
            store.tagline = str(data["tagline"]).strip()
        if "category" in data:
            store.category = str(data["category"] or "").strip()[:64]
        if "city" in data and str(data["city"]).strip():
            store.city = str(data["city"]).strip()
        if "province" in data and str(data["province"]).strip():
            store.province = str(data["province"]).strip()
        if "contact_phone" in data:
            store.contact_phone = str(data["contact_phone"]).strip()
        if "theme_preset" in data:
            preset = str(data["theme_preset"]).strip()
            if preset in [c[0] for c in Store.THEME_PRESET_CHOICES]:
                store.theme_preset = preset
        if "accent_color" in data:
            store.accent_color = str(data["accent_color"]).strip()
        # Strict CDN host and store folder validation (only if changed)
        cloud_name = getattr(settings, "CLOUDINARY_CLOUD_NAME", "").strip()
        allow_local = is_local_media_allowed()
        field_errors = {}

        old_banner_url = store.banner_url
        old_logo_url = store.logo_url
        banner_changed = False
        logo_changed = False

        if "banner_url" in data:
            candidate_banner = str(data["banner_url"]).strip()
            if candidate_banner != (store.banner_url or "").strip():
                banner_changed = True
                if candidate_banner:
                    valid_cdn = False
                    expected_cdn_prefix = f"https://res.cloudinary.com/{cloud_name}/" if cloud_name else ""
                    expected_store_folder = f"shopcraft/stores/{store.id}_"

                    if cloud_name and candidate_banner.startswith(expected_cdn_prefix) and expected_store_folder in candidate_banner:
                        valid_cdn = True
                    elif allow_local and candidate_banner.startswith("/uploads/stores/") and expected_store_folder in candidate_banner:
                        valid_cdn = True

                    if not valid_cdn:
                        field_errors["banner_url"] = ["Hero cover image URL must be hosted on our CDN within your store's folder."]

        if "logo_url" in data:
            candidate_logo = str(data["logo_url"]).strip()
            if candidate_logo != (store.logo_url or "").strip():
                logo_changed = True
                if candidate_logo:
                    valid_cdn = False
                    expected_cdn_prefix = f"https://res.cloudinary.com/{cloud_name}/" if cloud_name else ""
                    expected_store_folder = f"shopcraft/stores/{store.id}_"

                    if cloud_name and candidate_logo.startswith(expected_cdn_prefix) and expected_store_folder in candidate_logo:
                        valid_cdn = True
                    elif allow_local and candidate_logo.startswith("/uploads/stores/") and expected_store_folder in candidate_logo:
                        valid_cdn = True

                    if not valid_cdn:
                        field_errors["logo_url"] = ["Store logo URL must be hosted on our CDN within your store's folder."]

        if field_errors:
            return Response(field_errors, status=status.HTTP_400_BAD_REQUEST)

        if banner_changed:
            store.banner_url = str(data["banner_url"]).strip()
        if logo_changed:
            store.logo_url = str(data["logo_url"]).strip()
        if "contact_email" in data:
            store.contact_email = str(data["contact_email"]).strip()
        if "support_email" in data:
            store.support_email = str(data["support_email"]).strip()
        if "address" in data:
            store.address = str(data["address"]).strip()
        if "story_headline" in data:
            store.story_headline = str(data["story_headline"]).strip()
        if "about_text" in data:
            store.about_text = str(data["about_text"]).strip()
        if "instagram_url" in data:
            store.instagram_url = str(data["instagram_url"]).strip()
        if "facebook_url" in data:
            store.facebook_url = str(data["facebook_url"]).strip()

        if "cod_enabled" in data:
            raw_cod = data["cod_enabled"]
            if isinstance(raw_cod, bool):
                store.cod_enabled = raw_cod
            elif isinstance(raw_cod, str):
                store.cod_enabled = raw_cod.lower() in ("true", "1", "yes")

        if "custom_domain" in data:
            raw_domain = str(data["custom_domain"] or "").strip().lower()
            raw_domain = raw_domain.replace("https://", "").replace("http://", "").split("/")[0].strip()
            store.custom_domain = raw_domain[:160]

        old_inside_shipping = store.inside_valley_shipping_minor
        old_outside_shipping = store.outside_valley_shipping_minor
        old_free_threshold = store.free_shipping_threshold_minor

        if "inside_valley_shipping_minor" in data:
            try:
                val = int(data["inside_valley_shipping_minor"])
                if val >= 0:
                    store.inside_valley_shipping_minor = val
            except (ValueError, TypeError):
                pass

        if "outside_valley_shipping_minor" in data:
            try:
                val = int(data["outside_valley_shipping_minor"])
                if val >= 0:
                    store.outside_valley_shipping_minor = val
            except (ValueError, TypeError):
                pass

        if "free_shipping_threshold_minor" in data:
            raw_threshold = data["free_shipping_threshold_minor"]
            if raw_threshold is None or raw_threshold == "":
                store.free_shipping_threshold_minor = None
            else:
                try:
                    val = int(raw_threshold)
                    store.free_shipping_threshold_minor = val if val >= 0 else None
                except (ValueError, TypeError):
                    pass

        shipping_rate_changed = (
            store.inside_valley_shipping_minor != old_inside_shipping
            or store.outside_valley_shipping_minor != old_outside_shipping
            or store.free_shipping_threshold_minor != old_free_threshold
        )
        shipping_keys = {
            "inside_valley_shipping_minor",
            "outside_valley_shipping_minor",
            "free_shipping_threshold_minor",
            "shipping_configured",
        }
        if "shipping_configured" in data:
            raw_sc = data["shipping_configured"]
            if isinstance(raw_sc, bool):
                store.shipping_configured = raw_sc
            elif isinstance(raw_sc, str):
                store.shipping_configured = raw_sc.lower() in ("true", "1", "yes")
        elif shipping_rate_changed or (
            any(k in data for k in shipping_keys) and set(data.keys()).issubset(shipping_keys)
        ):
            store.shipping_configured = True

        khalti_fields_touched = any(
            k in data for k in ("khalti_mode", "khalti_secret_key", "clear_khalti_secret_key")
        )
        if khalti_fields_touched:
            candidate_mode = (
                str(data["khalti_mode"]).strip().upper()
                if "khalti_mode" in data
                else store.khalti_mode
            )
            if data.get("clear_khalti_secret_key"):
                candidate_key = ""
            elif "khalti_secret_key" in data and str(data["khalti_secret_key"]).strip():
                candidate_key = str(data["khalti_secret_key"]).strip()
            else:
                candidate_key = store.get_khalti_secret_key()

            khalti_err = validate_khalti_settings_update(
                target_mode=candidate_mode,
                effective_secret_key=candidate_key,
            )
            if khalti_err:
                return Response({"error": khalti_err}, status=status.HTTP_400_BAD_REQUEST)

            store.khalti_mode = candidate_mode
            if data.get("clear_khalti_secret_key"):
                store.set_khalti_secret_key("")
            elif "khalti_secret_key" in data and str(data["khalti_secret_key"]).strip():
                store.set_khalti_secret_key(str(data["khalti_secret_key"]).strip())

        store.save()

        # Best-effort deletion of old assets on replacement (strictly scoped to current store folder)
        if banner_changed and old_banner_url:
            old_pub_id = extract_cloudinary_public_id(old_banner_url, store.id)
            if old_pub_id:
                delete_cloudinary_asset(public_id=old_pub_id, store_id=store.id)
        if logo_changed and old_logo_url:
            old_pub_id = extract_cloudinary_public_id(old_logo_url, store.id)
            if old_pub_id:
                delete_cloudinary_asset(public_id=old_pub_id, store_id=store.id)
        MerchantAuditLog.objects.create(
            store=self.store,
            actor=request.user,
            action="SETTINGS_UPDATE",
            entity_type="Store",
            entity_id=str(self.store.id),
            details={"updated_fields": list(data.keys())},
            ip_address=request.META.get("REMOTE_ADDR"),
        )
        return self.get(request, store_slug)


class MerchantProductListCreateView(StoreMerchantMixin, APIView):
    def get(self, request, store_slug):
        active_variants_qs = Variant.objects.all().order_by("sort_order", "price_minor")
        products = (
            Product.objects.for_store(self.store)
            .prefetch_related(
                Prefetch("variants", queryset=active_variants_qs, to_attr="prefetched_active_variants")
            )
            .order_by("sort_order", "-id")
        )
        return Response(ProductSerializer(products, many=True).data)

    def post(self, request, store_slug):
        data = request.data.copy() if hasattr(request.data, "copy") else dict(request.data)
        if "slug" not in data or not data["slug"]:
            from django.utils.text import slugify
            name = data.get("name", "")
            base_slug = slugify(name) or "item"
            candidate = base_slug
            idx = 1
            while Product.objects.for_store(self.store).filter(slug=candidate).exists():
                candidate = f"{base_slug}-{idx}"
                idx += 1
            data["slug"] = candidate

        serializer = ProductSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        product = serializer.save(store=self.store)

        if "initial_price_minor" in data:
            try:
                price_minor = int(data["initial_price_minor"])
                Variant.objects.create(
                    store=self.store,
                    product=product,
                    sku=f"{self.store.slug.upper()[:4]}-{product.id}-01",
                    label=data.get("initial_variant_label", "Standard"),
                    price_minor=price_minor,
                    allow_one_time=product.allow_one_time,
                    in_stock=True,
                    is_active=True,
                )
            except (ValueError, TypeError):
                pass

                MerchantAuditLog.objects.create(
            store=self.store,
            actor=request.user,
            action="PRODUCT_CREATE",
            entity_type="Product",
            entity_id=str(product.id),
            details={"name": product.name, "slug": product.slug},
            ip_address=request.META.get("REMOTE_ADDR"),
        )
        return Response(ProductSerializer(product).data, status=status.HTTP_201_CREATED)


class MerchantProductDetailView(StoreMerchantMixin, APIView):
    def get_product(self, product_id):
        active_variants_qs = Variant.objects.filter(is_active=True).order_by("sort_order", "price_minor")
        product = (
            Product.objects.for_store(self.store)
            .prefetch_related(
                Prefetch("variants", queryset=active_variants_qs, to_attr="prefetched_active_variants")
            )
            .filter(id=product_id)
            .first()
        )
        if not product:
            raise Http404("Product not found.")
        return product

    def get(self, request, store_slug, product_id):
        product = self.get_product(product_id)
        return Response(ProductSerializer(product).data)

    def patch(self, request, store_slug, product_id):
        product = self.get_product(product_id)
        old_name = product.name
        old_image_url = product.image_url
        serializer = ProductSerializer(product, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        if product.is_starter_default and (product.name != old_name or product.image_url != old_image_url):
            product.is_starter_default = False
            product.save(update_fields=["is_starter_default"])
        return Response(ProductSerializer(product).data)

    def delete(self, request, store_slug, product_id):
        product = self.get_product(product_id)
        if request.query_params.get("permanent") == "true":
            product.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        product.is_active = False
        product.save(update_fields=["is_active"])
        return Response({"detail": "Product archived.", "id": product.id, "is_active": False})


class MerchantVariantListCreateView(StoreMerchantMixin, APIView):
    def get_product(self, product_id):
        product = Product.objects.for_store(self.store).filter(id=product_id).first()
        if not product:
            raise Http404("Product not found.")
        return product

    def get(self, request, store_slug, product_id):
        product = self.get_product(product_id)
        variants = product.variants.all().order_by("sort_order", "price_minor", "id")
        return Response(VariantSerializer(variants, many=True).data)

    def post(self, request, store_slug, product_id):
        product = self.get_product(product_id)
        data = request.data.copy() if hasattr(request.data, "copy") else dict(request.data)
        if "sku" not in data or not data["sku"]:
            count = product.variants.count() + 1
            data["sku"] = f"{self.store.slug.upper()[:4]}-{product.id}-{count}"

        serializer = VariantSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        variant = serializer.save(store=self.store, product=product)
        return Response(VariantSerializer(variant).data, status=status.HTTP_201_CREATED)


class MerchantVariantDetailView(StoreMerchantMixin, APIView):
    def get_variant(self, product_id, variant_id):
        product = Product.objects.for_store(self.store).filter(id=product_id).first()
        if not product:
            raise Http404("Product not found.")
        variant = product.variants.filter(id=variant_id).first()
        if not variant:
            raise Http404("Variant not found.")
        return variant

    def get(self, request, store_slug, product_id, variant_id):
        variant = self.get_variant(product_id, variant_id)
        return Response(VariantSerializer(variant).data)

    def patch(self, request, store_slug, product_id, variant_id):
        variant = self.get_variant(product_id, variant_id)
        old_price_minor = variant.price_minor
        serializer = VariantSerializer(variant, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        if variant.price_minor != old_price_minor:
            Product.objects.for_store(self.store).filter(
                id=variant.product_id,
                is_starter_default=True,
            ).update(is_starter_default=False)
        return Response(VariantSerializer(variant).data)

    def delete(self, request, store_slug, product_id, variant_id):
        variant = self.get_variant(product_id, variant_id)
        if request.query_params.get("permanent") == "true":
            variant.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        variant.is_active = False
        variant.save(update_fields=["is_active"])
        return Response({"detail": "Variant archived.", "id": variant.id, "is_active": False})


class MerchantOrderListView(StoreMerchantMixin, APIView):
    def get(self, request, store_slug):
        base_qs = Order.objects.for_store(self.store)

        # Single conditional aggregation replaces 5 separate COUNT(*) round-trips
        counts_agg = base_qs.aggregate(
            all_count=Count("id"),
            new_count=Count("id", filter=Q(status__in=["CONFIRMED", "PAID"])),
            packed_count=Count("id", filter=Q(status__in=["PROCESSING", "PACKED"])),
            shipped_count=Count("id", filter=Q(status="SHIPPED")),
            delivered_count=Count("id", filter=Q(status="DELIVERED")),
        )

        qs = (
            base_qs.select_related("customer")
            .prefetch_related("items", "events")
            .order_by("-created_at")
        )

        status_filter = request.query_params.get("status", "").strip().lower()
        if status_filter == "new":
            qs = qs.filter(status__in=["CONFIRMED", "PAID"])
        elif status_filter == "packed":
            qs = qs.filter(status__in=["PROCESSING", "PACKED"])
        elif status_filter == "shipped":
            qs = qs.filter(status="SHIPPED")
        elif status_filter == "delivered":
            qs = qs.filter(status="DELIVERED")

        search = request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(order_number__icontains=search)
                | Q(customer__full_name__icontains=search)
                | Q(customer__email__icontains=search)
                | Q(customer__phone__icontains=search)
            )

        return Response({
            "orders": OrderSerializer(qs, many=True).data,
            "counts": {
                "all": counts_agg["all_count"] or 0,
                "new": counts_agg["new_count"] or 0,
                "packed": counts_agg["packed_count"] or 0,
                "shipped": counts_agg["shipped_count"] or 0,
                "delivered": counts_agg["delivered_count"] or 0,
            },
        })


class MerchantOrderDetailView(StoreMerchantMixin, APIView):
    def get(self, request, store_slug, order_id):
        order = (
            Order.objects.for_store(self.store)
            .select_related("customer")
            .prefetch_related("items", "events")
            .filter(id=order_id)
            .first()
        )
        if not order:
            raise Http404("Order not found.")
        response = Response(OrderSerializer(order).data)
        response["Cache-Control"] = "no-store, no-cache, must-revalidate, private"
        return response


class MerchantOrderStatusTransitionView(StoreMerchantMixin, APIView):
    def post(self, request, store_slug, order_id):
        order = Order.objects.for_store(self.store).filter(id=order_id).first()
        if not order:
            raise Http404("Order not found.")

        target_status = str(request.data.get("to_status", "")).strip().upper()
        note = str(request.data.get("note", "")).strip()

        VALID_FORWARD = {
            "CONFIRMED": ["PROCESSING", "CANCELLED"],
            "PAID": ["PROCESSING", "CANCELLED"],
            "PROCESSING": ["SHIPPED", "CANCELLED"],
            "SHIPPED": ["DELIVERED"],
        }
        VALID_UNDO = {
            "PROCESSING": ["CONFIRMED", "PAID"],
            "SHIPPED": ["PROCESSING"],
            "DELIVERED": ["SHIPPED"],
        }

        current = order.status.upper()
        is_forward = target_status in VALID_FORWARD.get(current, [])
        is_undo = target_status in VALID_UNDO.get(current, [])

        if not is_forward and not is_undo:
            return Response(
                {"error": f"Invalid transition from {current} to {target_status}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            old_status = order.status
            order.status = target_status

            if target_status == "DELIVERED" and order.payment_method == "COD":
                order.payment_status = "PAID"
                if not note:
                    note = f"Delivered · Cash of Rs. {order.total_minor // 100} collected."
            elif old_status == "DELIVERED" and is_undo and order.payment_method == "COD":
                order.payment_status = "COD_PENDING"
                if not note:
                    note = "Undone delivery · Reverted cash collection."

            order.save()

            OrderEvent.objects.create(
                store=self.store,
                order=order,
                from_status=old_status,
                to_status=target_status,
                note=note or f"Status changed from {old_status} to {target_status}",
                actor=request.user,
            )

        return Response(OrderSerializer(order).data)


class MerchantCustomerListView(StoreMerchantMixin, APIView):
    def get(self, request, store_slug):
        q = request.query_params.get("q", "").strip()
        orders_prefetch = Prefetch(
            "orders",
            queryset=Order.objects.order_by("-created_at").only("id", "customer_id", "shipping_address_snapshot", "created_at"),
            to_attr="prefetched_orders",
        )
        customers = (
            Customer.objects.for_store(self.store)
            .prefetch_related(orders_prefetch)
            .annotate(
                orders_count=Count("orders", distinct=True),
                total_spent_minor=Sum(
                    "orders__total_minor",
                    filter=Q(orders__payment_status__in=["PAID", "CONFIRMED"]),
                    default=0,
                ),
            )
            .order_by("-created_at")
        )
        if q:
            customers = customers.filter(
                Q(full_name__icontains=q) | Q(email__icontains=q) | Q(phone__icontains=q)
            )
        return Response(CustomerSerializer(customers, many=True).data)


class MerchantCustomerDetailView(StoreMerchantMixin, APIView):
    def get(self, request, store_slug, customer_id):
        customer = (
            Customer.objects.for_store(self.store)
            .annotate(
                orders_count=Count("orders", distinct=True),
                total_spent_minor=Sum(
                    "orders__total_minor",
                    filter=Q(orders__payment_status__in=["PAID", "CONFIRMED"]),
                    default=0,
                ),
            )
            .filter(id=customer_id)
            .first()
        )
        if not customer:
            raise Http404("Customer not found.")

        orders = list(
            Order.objects.for_store(self.store)
            .filter(customer=customer)
            .select_related("customer")
            .prefetch_related("items", "events")
            .order_by("-created_at")[:20]
        )
        customer.prefetched_orders = orders

        return Response({
            "customer": CustomerSerializer(customer).data,
            "orders": OrderSerializer(orders, many=True).data,
        })


class StoreSlugCheckView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        # 1. Multi-worker shared rate limiting per IP (max 30 slug checks per minute)
        client_ip = get_client_ip(request)
        ip_hash = compute_salted_ip_hash(client_ip, "check_slug")
        allowed, retry_after = ActionRateLimit.check_and_record("check_slug", ip_hash, limit=30, window_seconds=60)
        if not allowed:
            res = Response(
                {"available": False, "reason": "Too many slug checks. Please try again shortly.", "retry_after": retry_after},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )
            res["Cache-Control"] = "private, no-store"
            return res

        raw_slug = request.query_params.get("slug", "").strip().lower()
        if not raw_slug:
            res = Response({"available": False, "reason": "Slug cannot be empty."})
            res["Cache-Control"] = "public, max-age=15"
            return res
        if len(raw_slug) < 3:
            res = Response({"available": False, "reason": "Slug must be at least 3 characters long."})
            res["Cache-Control"] = "public, max-age=15"
            return res
        if len(raw_slug) > 60:
            res = Response({"available": False, "reason": "Slug cannot exceed 60 characters."})
            res["Cache-Control"] = "public, max-age=15"
            return res
        if raw_slug in RESERVED_STORE_SLUGS or not SLUG_REGEX.match(raw_slug):
            res = Response({"available": False, "reason": "Invalid or reserved slug."})
            res["Cache-Control"] = "public, max-age=15"
            return res
        exists = Store.objects.filter(slug=raw_slug).exists()
        res = Response({"available": not exists, "slug": raw_slug})
        res["Cache-Control"] = "public, max-age=15"
        return res


def seed_starter_catalog(store):
    """Creates 2-3 realistic starter products with authentic photography, descriptions and variants."""
    norm_cat = f"{store.category} {store.theme_preset}".lower()
    prefix = store.slug.upper().replace("-", "")[:4] or "SHOP"

    if any(k in norm_cat for k in ["honey", "herb", "spice", "sage"]):
        items = [
            {
                "name": "Raw Himalayan Wild Cliff Honey",
                "slug": f"{store.slug}-wild-cliff-honey",
                "desc": "Pure unpasteurized honey harvested from wild cliff bee colonies in the Annapurna foothills. Rich in natural pollens, floral aromas, and medicinal enzymes.",
                "image": "/images/products/himalayan-honey.svg",
                "attrs": {"category": "Wild Cliff Honey", "district": "Lamjung, Nepal"},
                "variants": [
                    ("500g Glass Jar", f"{prefix}-HON-500", 145000),
                    ("250g Jar", f"{prefix}-HON-250", 85000),
                ],
            },
            {
                "name": "High-Altitude White Forest Honey",
                "slug": f"{store.slug}-white-forest-honey",
                "desc": "Delicate and floral white honey sourced from sub-alpine wildflowers in Mustang and Manang valleys. Smooth crystalline texture with mild sweetness.",
                "image": "/images/products/himalayan-honey.svg",
                "attrs": {"category": "Forest Honey", "district": "Mustang, Nepal"},
                "variants": [
                    ("350g Jar", f"{prefix}-HON-350", 95000),
                ],
            },
            {
                "name": "Himalayan Ginger & Tulsi Honey Infusion",
                "slug": f"{store.slug}-ginger-tulsi-honey",
                "desc": "Hand-infused raw wild honey steeped with fresh mountain ginger root and holy tulsi leaves. Ideal for soothing herbal teas and daily immunity.",
                "image": "/images/products/himalayan-honey.svg",
                "attrs": {"category": "Herbal Infusions", "district": "Kathmandu Valley"},
                "variants": [
                    ("250g Jar", f"{prefix}-HON-GIN", 75000),
                ],
            },
        ]
    elif any(k in norm_cat for k in ["coffee", "tea", "roast"]):
        items = [
            {
                "name": "Single-Origin Nuwakot Arabica Whole Bean",
                "slug": f"{store.slug}-nuwakot-arabica",
                "desc": "High-altitude organic arabica grown at 1,400m in Nuwakot. Notes of brown sugar, dried plum, and dark chocolate with a velvety crema.",
                "image": "/images/products/nuwakot-heritage.svg",
                "attrs": {"category": "Specialty Coffee", "district": "Nuwakot, Nepal"},
                "variants": [
                    ("250g Whole Bean", f"{prefix}-COF-250", 95000),
                    ("500g Whole Bean", f"{prefix}-COF-500", 175000),
                ],
            },
            {
                "name": "Ilam First Flush Orthodox Black Tea",
                "slug": f"{store.slug}-ilam-first-flush",
                "desc": "Delicately plucked spring orthodox black tea from eastern Himalayan gardens. Bright amber liquor with a fragrant muscatel finish.",
                "image": "/images/products/ilam-gold.svg",
                "attrs": {"category": "Artisanal Tea", "district": "Ilam, Nepal"},
                "variants": [
                    ("100g Loose Leaf Tin", f"{prefix}-TEA-100", 65000),
                ],
            },
            {
                "name": "Everest Mountain Dark Roast Espresso",
                "slug": f"{store.slug}-everest-espresso",
                "desc": "Bold, low-acidity espresso blend engineered for moka pot, aeropress, and commercial machine extraction.",
                "image": "/images/products/gulmi-reserve.svg",
                "attrs": {"category": "Espresso Blend", "district": "Kathmandu Valley"},
                "variants": [
                    ("250g Ground", f"{prefix}-COF-ESP", 85000),
                ],
            },
        ]
    elif any(k in norm_cat for k in ["streetwear", "fashion", "apparel", "obsidian"]):
        items = [
            {
                "name": "Heavyweight Boxy Drop-Shoulder Tee",
                "slug": f"{store.slug}-heavyweight-tee",
                "desc": "280 GSM combed cotton tee with reinforced ribbed collar and relaxed boxy drape. Hand-dyed and cut in Kathmandu.",
                "image": "/images/products/placeholder.svg",
                "attrs": {"category": "Apparel", "district": "Kathmandu, Nepal"},
                "variants": [
                    ("Size M", f"{prefix}-TEE-M", 185000),
                    ("Size L", f"{prefix}-TEE-L", 185000),
                    ("Size XL", f"{prefix}-TEE-XL", 185000),
                ],
            },
            {
                "name": "Raw Himalayan Hemp Utility Tote",
                "slug": f"{store.slug}-hemp-utility-tote",
                "desc": "Heavy-duty unbleached Himalayan hemp canvas with double-stitched webbing straps and inner brass zippered compartment.",
                "image": "/images/products/placeholder.svg",
                "attrs": {"category": "Bags & Gear", "district": "Pokhara, Nepal"},
                "variants": [
                    ("Standard Tote", f"{prefix}-BAG-01", 120000),
                ],
            },
            {
                "name": "Ribbed Mountain Wool Fisherman Beanie",
                "slug": f"{store.slug}-fisherman-beanie",
                "desc": "100% mountain wool knit with deep ribbed turn-up brim for warmth in high altitude winds.",
                "image": "/images/products/placeholder.svg",
                "attrs": {"category": "Headwear", "district": "Kathmandu, Nepal"},
                "variants": [
                    ("One Size", f"{prefix}-HAT-01", 85000),
                ],
            },
        ]
    elif any(k in norm_cat for k in ["craft", "handloom", "pashmina"]):
        items = [
            {
                "name": "Hand-Hammered 7-Metal Tibetan Singing Bowl",
                "slug": f"{store.slug}-tibetan-singing-bowl",
                "desc": "Traditional hand-hammered bronze singing bowl tuned to healing vibrational frequencies. Comes with rosewood mallet and brocade cushion.",
                "image": "/images/products/placeholder.svg",
                "attrs": {"category": "Sacred Metalwork", "district": "Patan, Nepal"},
                "variants": [
                    ("14cm Diameter", f"{prefix}-BWL-14", 320000),
                ],
            },
            {
                "name": "Pure Dhaka Handwoven Pashmina Stole",
                "slug": f"{store.slug}-dhaka-pashmina-stole",
                "desc": "Ultra-soft cashmere pashmina bordered with authentic Palpali Dhaka geometric handwoven patterns.",
                "image": "/images/products/placeholder.svg",
                "attrs": {"category": "Textiles", "district": "Bhaktapur, Nepal"},
                "variants": [
                    ("Standard Stole (200x70cm)", f"{prefix}-STL-01", 240000),
                ],
            },
            {
                "name": "Artisanal Studio Ceramic Matcha Tumbler",
                "slug": f"{store.slug}-ceramic-matcha-tumbler",
                "desc": "Wheel-thrown stoneware pottery with organic wood-ash glaze. Comfortable ergonomic handfeel for warm tea.",
                "image": "/images/products/placeholder.svg",
                "attrs": {"category": "Ceramics", "district": "Thimi, Nepal"},
                "variants": [
                    ("280ml Tumbler", f"{prefix}-POT-01", 75000),
                ],
            },
        ]
    elif any(k in norm_cat for k in ["bakery", "sweet", "pastry"]):
        items = [
            {
                "name": "Heritage Sourdough Country Loaf",
                "slug": f"{store.slug}-sourdough-country-loaf",
                "desc": "Naturally leavened with 36-hour slow cold fermentation. Crispy blistered crust and open airy crumb.",
                "image": "/images/products/placeholder.svg",
                "attrs": {"category": "Sourdough", "district": "Lalitpur, Nepal"},
                "variants": [
                    ("800g Loaf", f"{prefix}-BRD-01", 45000),
                ],
            },
            {
                "name": "French Butter Almond Croissant (Box of 4)",
                "slug": f"{store.slug}-almond-croissants",
                "desc": "Twice-baked flaky croissant filled with rich almond frangipane cream and topped with toasted almond flakes.",
                "image": "/images/products/placeholder.svg",
                "attrs": {"category": "Viennoiserie", "district": "Kathmandu, Nepal"},
                "variants": [
                    ("Box of 4", f"{prefix}-CRS-04", 80000),
                ],
            },
            {
                "name": "Artisan Dark Chocolate Sea-Salt Brownies",
                "slug": f"{store.slug}-chocolate-sea-salt-brownies",
                "desc": "Fudgy Belgian dark chocolate brownie bars sprinkled with flaky Himalayan mineral sea salt.",
                "image": "/images/products/placeholder.svg",
                "attrs": {"category": "Confectionery", "district": "Lalitpur, Nepal"},
                "variants": [
                    ("Box of 6", f"{prefix}-BRW-06", 65000),
                ],
            },
        ]
    else:
        items = [
            {
                "name": f"{store.name} Signature Offering",
                "slug": f"{store.slug}-signature-offering",
                "desc": "Our introductory small-batch product, crafted with high standards and packaged in Nepal.",
                "image": "/images/products/placeholder.svg",
                "attrs": {"category": "Signature Edition", "district": f"{store.city}, Nepal"},
                "variants": [
                    ("Standard Edition", f"{prefix}-001", 125000),
                    ("Reserve Edition", f"{prefix}-002", 185000),
                ],
            },
            {
                "name": f"{store.name} Artisanal Reserve",
                "slug": f"{store.slug}-artisanal-reserve",
                "desc": "Curated artisanal edition crafted for discerning clients across Nepal.",
                "image": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
                "attrs": {"category": "Artisanal Reserve", "district": f"{store.city}, Nepal"},
                "variants": [
                    ("Standard Pack", f"{prefix}-003", 85000),
                ],
            },
        ]

    for order_idx, item_data in enumerate(items):
        p = Product.objects.create(
            store=store,
            slug=item_data["slug"],
            name=item_data["name"],
            description=item_data["desc"],
            image_url=item_data["image"],
            attributes=item_data.get("attrs", {}),
            allow_one_time=True,
            is_active=True,
            sort_order=order_idx,
        )
        for v_label, v_sku, v_price in item_data["variants"]:
            Variant.objects.create(
                store=store,
                product=p,
                sku=v_sku,
                label=v_label,
                price_minor=v_price,
                allow_one_time=True,
                in_stock=True,
                is_active=True,
            )


class StoreCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # 1. Multi-worker shared rate limiting per IP (max 10 store creations per IP in 24 hours)
        client_ip = get_client_ip(request)
        ip_hash = compute_salted_ip_hash(client_ip, "store_create")
        allowed, retry_after = ActionRateLimit.check_and_record("store_create", ip_hash, limit=10, window_seconds=86400)
        if not allowed:
            return Response(
                {"error": "Too many store creations from this network. Please try again later."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        name = request.data.get("name", "").strip()
        slug = request.data.get("slug", "").strip().lower()
        theme_preset = request.data.get("theme_preset", "editorial-warm")
        category = request.data.get("category", "").strip()[:64]
        city = request.data.get("city", "").strip() or "Kathmandu"
        province = request.data.get("province", "").strip() or "Bagmati"
        tagline = request.data.get("tagline", "").strip()
        contact_phone = request.data.get("contact_phone", "").strip()
        contact_email = request.data.get("contact_email", "").strip() or (request.user.email if request.user.is_authenticated else "")
        address = request.data.get("address", "").strip() or f"{city}, {province}, Nepal"
        story_headline = request.data.get("story_headline", "").strip() or f"Welcome to {name}"
        about_text = request.data.get("about_text", "").strip() or (
            f"Founded with a passion for authentic quality and local craftsmanship, {name} brings carefully crafted products "
            f"from artisans and producers directly to discerning customers."
        )

        if not name:
            return Response({"error": "Store name is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not slug:
            return Response({"error": "Store slug is required."}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Comprehensive slug validation
        try:
            validate_store_slug(slug)
        except ValidationError as val_err:
            return Response({"error": val_err.message}, status=status.HTTP_400_BAD_REQUEST)

        # 3. Check for existing slug conflicts
        if Store.objects.filter(slug=slug).exists():
            return Response(
                {"error": f"The store handle '{slug}' is already taken. Please choose another."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 4. Resolve optional banner image (leave empty when unset so storefront renders store hero fallback)
        banner_url = request.data.get("banner_url", "").strip()

        # 5. Atomic check & store creation: lock user row with select_for_update() so concurrent
        # requests serialize and strictly obey the 3-store cap.
        try:
            with transaction.atomic():
                user = User.objects.select_for_update().get(id=request.user.id)
                with UserMembershipContext(user.id):
                    owned_count = StoreMembership.all_objects.filter(user=user, role="OWNER").count()
                    if owned_count >= 3:
                        return Response(
                            {"error": "You have reached the maximum limit of 3 stores per merchant account."},
                            status=status.HTTP_400_BAD_REQUEST,
                        )

                    now = timezone.now()
                    recent_creations = StoreMembership.all_objects.filter(
                        user=user,
                        role="OWNER",
                        store__created_at__gte=now - timedelta(hours=24),
                    ).count()
                    if recent_creations >= 5:
                        return Response(
                            {"error": "Too many stores created recently. Please try again tomorrow."},
                            status=status.HTTP_429_TOO_MANY_REQUESTS,
                        )

                store = Store.objects.create(
                    name=name,
                    slug=slug,
                    category=category,
                    city=city,
                    province=province,
                    theme_preset=theme_preset,
                    tagline=tagline,
                    banner_url=banner_url,
                    contact_phone=contact_phone,
                    contact_email=contact_email,
                    support_email=str(request.data.get("support_email", "")).strip() or contact_email,
                    address=address,
                    story_headline=story_headline,
                    about_text=about_text,
                )
                set_current_tenant_id(store.id, is_local=True)
                StoreMembership.objects.create(
                    store=store,
                    user=user,
                    role="OWNER",
                )
                MerchantAuditLog.objects.create(
                    store=store,
                    actor=user,
                    action="STORE_CREATE",
                    entity_type="Store",
                    entity_id=str(store.id),
                    details={
                        "name": store.name,
                        "slug": store.slug,
                        "category": category,
                        "theme_preset": store.theme_preset,
                    },
                    ip_address=None,
                )
        except IntegrityError:
            return Response(
                {"error": f"The store handle '{slug}' is already taken. Please choose another."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(StorePublicSerializer(store).data, status=status.HTTP_201_CREATED)


class MerchantMyStoresView(APIView):
    """
    Returns the authenticated user's store memberships across all stores.
    Powers the Shopify-style store switcher dropdown and /merchant auto-routing.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        with UserMembershipContext(request.user.id):
            memberships = (
                StoreMembership.all_objects.filter(user=request.user, store__is_active=True)
                .select_related("store")
                .order_by("-created_at")
            )
            stores_data = []
            for m in memberships:
                st = m.store
                stores_data.append({
                    "id": st.id,
                    "name": st.name,
                    "slug": st.slug,
                    "category": st.category or "",
                    "city": getattr(st, "city", "Kathmandu"),
                    "province": getattr(st, "province", "Bagmati"),
                    "theme_preset": st.theme_preset,
                    "logo_url": st.logo_url,
                    "accent_color": st.accent_color,
                    "role": m.role,
                    "created_at": st.created_at.isoformat(),
                })
        return Response({"stores": stores_data})



class MerchantAuditLogSerializer(serializers.ModelSerializer):
    actor_email = serializers.CharField(source="actor.email", read_only=True)
    actor_name = serializers.CharField(source="actor.full_name", read_only=True)

    class Meta:
        model = MerchantAuditLog
        fields = [
            "id",
            "actor_email",
            "actor_name",
            "action",
            "entity_type",
            "entity_id",
            "details",
            "ip_address",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class MerchantAuditLogListView(StoreMerchantMixin, APIView):
    def get(self, request, store_slug):
        logs = (
            MerchantAuditLog.objects.for_store(self.store)
            .select_related("actor")
            .order_by("-created_at")[:100]
        )
        return Response(MerchantAuditLogSerializer(logs, many=True).data)


class MerchantMediaUploadView(StoreMerchantMixin, APIView):
    """
    Store-prefixed and authenticated image upload for merchant product catalog and branding.
    Scopes uploads strictly to uploads/stores/<store_slug>/products/.
    """
    def post(self, request, store_slug):
        uploaded_file = request.FILES.get("file")
        if not uploaded_file:
            return Response({"error": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)

        if uploaded_file.size > 5 * 1024 * 1024:
            return Response({"error": "Image size exceeds 5MB limit."}, status=status.HTTP_400_BAD_REQUEST)

        allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]
        content_type = getattr(uploaded_file, "content_type", "")
        if content_type not in allowed_types:
            return Response(
                {"error": "Unsupported image format. Please upload JPG, PNG, or WebP."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        import re
        import secrets
        from pathlib import Path

        clean_slug = re.sub(r"[^a-z0-9_-]", "", self.store.slug.lower())
        if not clean_slug:
            return Response({"error": "Invalid store context."}, status=status.HTTP_400_BAD_REQUEST)

        allowed_exts = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"}
        raw_ext = Path(uploaded_file.name).suffix.lower()
        ext = raw_ext if raw_ext in allowed_exts else ".jpg"

        stem = f"prod_{int(timezone.now().timestamp())}_{secrets.token_hex(8)}"
        filename = f"{stem}{ext}"

        if is_cloudinary_configured():
            try:
                url = upload_store_image_to_cloudinary(
                    uploaded_file=uploaded_file,
                    clean_store_slug=clean_slug,
                    public_id=stem,
                    store_id=self.store.id,
                )
            except CloudinaryUploadError as exc:
                return Response({"error": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)
        elif is_local_media_allowed():
            base_dir = (settings.BASE_DIR.parent / "frontend" / "public" / "uploads" / "stores" / clean_slug / "products").resolve()
            trusted_root = (settings.BASE_DIR.parent / "frontend" / "public" / "uploads").resolve()

            if not str(base_dir).startswith(str(trusted_root)):
                return Response({"error": "Invalid upload destination."}, status=status.HTTP_400_BAD_REQUEST)

            base_dir.mkdir(parents=True, exist_ok=True)
            file_path = base_dir / filename

            with open(file_path, "wb+") as dest:
                for chunk in uploaded_file.chunks():
                    dest.write(chunk)

            url = f"/uploads/stores/{clean_slug}/products/{filename}"
        else:
            return Response(
                {"error": "Cloud media storage is not configured."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        MerchantAuditLog.objects.create(
            store=self.store,
            actor=request.user,
            action="MEDIA_UPLOAD",
            entity_type="MediaAsset",
            entity_id=filename,
            details={"filename": filename, "url": url, "size": uploaded_file.size},
            ip_address=request.META.get("REMOTE_ADDR"),
        )

        return Response({
            "success": True,
            "filename": filename,
            "url": url,
            "relativeUrl": url,
        }, status=status.HTTP_201_CREATED)


def process_theme_image(uploaded_file, asset_type: str) -> tuple[bytes, str, str]:
    """
    Validates that uploaded_file is a genuine image (JPEG, PNG, or WebP) using Pillow,
    rejects SVGs, enforces strict size limits (hero: 5MB, logo: 2MB),
    strips EXIF/GPS metadata, and returns (cleaned_bytes, extension, mime_type).
    """
    max_size = 5 * 1024 * 1024 if asset_type == "hero" else 2 * 1024 * 1024
    if uploaded_file.size > max_size:
        limit_mb = 5 if asset_type == "hero" else 2
        raise serializers.ValidationError(f"{asset_type.capitalize()} image size exceeds {limit_mb}MB limit.")

    filename_lower = (uploaded_file.name or "").lower()
    content_type_lower = getattr(uploaded_file, "content_type", "").lower()
    if filename_lower.endswith(".svg") or "svg" in content_type_lower:
        raise serializers.ValidationError("SVG files are not supported. Please upload JPEG, PNG, or WebP.")

    # Inspect genuine image content using Pillow
    uploaded_file.seek(0)
    try:
        with Image.open(uploaded_file) as img:
            img.verify()
    except Exception:
        raise serializers.ValidationError("Invalid or corrupted image file.")

    # Re-open image since verify() invalidates the image state
    uploaded_file.seek(0)
    try:
        img = Image.open(uploaded_file)
    except Exception:
        raise serializers.ValidationError("Invalid image format.")

    fmt = (img.format or "").upper()
    if fmt not in ("JPEG", "PNG", "WEBP"):
        raise serializers.ValidationError("Unsupported image format. Please upload JPG, PNG, or WebP.")

    buf = io.BytesIO()
    if fmt == "JPEG":
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
        img.save(buf, format="JPEG", quality=90)
        ext = ".jpg"
        mime = "image/jpeg"
    elif fmt == "PNG":
        img.save(buf, format="PNG", optimize=True)
        ext = ".png"
        mime = "image/png"
    elif fmt == "WEBP":
        img.save(buf, format="WEBP", quality=90)
        ext = ".webp"
        mime = "image/webp"

    return buf.getvalue(), ext, mime


class MerchantThemeMediaUploadView(StoreMerchantMixin, APIView):
    """
    Authenticated and store-member-only signed image upload for store branding (hero banner and logo).
    Enforces per-user rate limiting, Pillow-based content verification, EXIF stripping,
    strict size limits (hero: 5MB, logo: 2MB), and stores assets under shopcraft/stores/{store.id}_{slug}/theme/.
    Returns 404 for non-members, keeping RLS intact.
    """
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "theme_media_upload"

    def permission_denied(self, request, message=None, code=None):
        raise Http404("Store not found.")

    def post(self, request, store_slug):
        asset_type = str(request.data.get("asset_type") or "hero").strip().lower()
        if asset_type not in ("hero", "logo"):
            return Response({"error": "Invalid asset_type. Must be 'hero' or 'logo'."}, status=status.HTTP_400_BAD_REQUEST)

        uploaded_file = request.FILES.get("file")
        if not uploaded_file:
            return Response({"error": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            cleaned_bytes, ext, mime = process_theme_image(uploaded_file, asset_type)
        except serializers.ValidationError as exc:
            msg = exc.detail if isinstance(exc.detail, str) else exc.detail[0]
            return Response({"error": msg}, status=status.HTTP_400_BAD_REQUEST)

        import re
        import secrets
        from pathlib import Path

        clean_slug = re.sub(r"[^a-z0-9_-]", "", self.store.slug.lower())
        if not clean_slug:
            return Response({"error": "Invalid store context."}, status=status.HTTP_400_BAD_REQUEST)

        stem = f"store_{self.store.id}_{asset_type}_{int(timezone.now().timestamp())}_{secrets.token_hex(6)}"
        filename = f"{stem}{ext}"

        if is_cloudinary_configured():
            try:
                url = upload_theme_image_to_cloudinary(
                    file_bytes=cleaned_bytes,
                    filename=filename,
                    content_type=mime,
                    store_id=self.store.id,
                    clean_store_slug=clean_slug,
                    asset_type=asset_type,
                    public_id=stem,
                )
            except CloudinaryUploadError as exc:
                return Response({"error": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)
        elif is_local_media_allowed():
            base_dir = (
                settings.BASE_DIR.parent
                / "frontend"
                / "public"
                / "uploads"
                / "stores"
                / f"{self.store.id}_{clean_slug}"
                / "theme"
            ).resolve()
            trusted_root = (settings.BASE_DIR.parent / "frontend" / "public" / "uploads").resolve()

            if not str(base_dir).startswith(str(trusted_root)):
                return Response({"error": "Invalid upload destination."}, status=status.HTTP_400_BAD_REQUEST)

            base_dir.mkdir(parents=True, exist_ok=True)
            file_path = base_dir / filename

            with open(file_path, "wb+") as dest:
                dest.write(cleaned_bytes)

            url = f"/uploads/stores/{self.store.id}_{clean_slug}/theme/{filename}"
        else:
            return Response(
                {"error": "Cloud media storage is not configured."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        MerchantAuditLog.objects.create(
            store=self.store,
            actor=request.user,
            action="MEDIA_UPLOAD",
            entity_type="ThemeAsset",
            entity_id=filename,
            details={
                "asset_type": asset_type,
                "filename": filename,
                "url": url,
                "size": len(cleaned_bytes),
            },
            ip_address=request.META.get("REMOTE_ADDR"),
        )

        full_public_id = f"shopcraft/stores/{self.store.id}_{clean_slug}/theme/{stem}"

        return Response(
            {
                "success": True,
                "filename": filename,
                "url": url,
                "public_id": full_public_id,
            },
            status=status.HTTP_201_CREATED,
        )

# -----------------------------------------------------------------------------
# Slice 6 Views (Analytics, Discounts, Staff RBAC) & URL Patterns
# -----------------------------------------------------------------------------

from stores.analytics_discounts_api import build_slice6_views

_slice6_views = build_slice6_views(StoreMerchantMixin)
MerchantAnalyticsView = _slice6_views["MerchantAnalyticsView"]
MerchantDiscountListCreateView = _slice6_views["MerchantDiscountListCreateView"]
MerchantDiscountDetailView = _slice6_views["MerchantDiscountDetailView"]
MerchantStaffListCreateView = _slice6_views["MerchantStaffListCreateView"]
MerchantStaffDetailView = _slice6_views["MerchantStaffDetailView"]

from stores.storefront_account_api import (
    StorefrontAccountDetailView,
    StorefrontCustomerOrdersView,
    StorefrontGoogleAuthView,
    StorefrontOTPRequestView,
    StorefrontOTPVerifyView,
)

urlpatterns = [
    # Store Creation & Slug Validation
    path("stores/check-slug/", StoreSlugCheckView.as_view(), name="store_check_slug"),
    path("stores/create/", StoreCreateView.as_view(), name="store_create"),
    path("stores/my-stores/", MerchantMyStoresView.as_view(), name="merchant_my_stores"),
    path("merchant/my-stores/", MerchantMyStoresView.as_view(), name="merchant_my_stores_alt"),

    # Public Storefront
    path("stores/<slug:store_slug>/", StoreDetailView.as_view(), name="store_public_detail"),
    path("stores/<slug:store_slug>/catalog/", StoreCatalogView.as_view(), name="store_public_catalog"),
    path("stores/<slug:store_slug>/products/<str:product_ref>/", StorePublicProductDetailView.as_view(), name="store_public_product_detail"),
    path("stores/<slug:store_slug>/account/", StorefrontAccountDetailView.as_view(), name="storefront_account_detail"),
    path("stores/<slug:store_slug>/account/orders/", StorefrontCustomerOrdersView.as_view(), name="storefront_customer_orders"),
    path("stores/<slug:store_slug>/account/otp/request/", StorefrontOTPRequestView.as_view(), name="storefront_otp_request"),
    path("stores/<slug:store_slug>/account/otp/verify/", StorefrontOTPVerifyView.as_view(), name="storefront_otp_verify"),
    path("stores/<slug:store_slug>/account/google/", StorefrontGoogleAuthView.as_view(), name="storefront_google_auth"),
    path("stores/<slug:store_slug>/customer/bootstrap/", CustomerBootstrapView.as_view(), name="store_customer_bootstrap"),
    path("stores/<slug:store_slug>/checkout/quote/", StoreCheckoutQuoteView.as_view(), name="store_checkout_quote"),
    path("stores/<slug:store_slug>/checkout/place/", StoreCheckoutPlaceView.as_view(), name="store_checkout_place"),
    path("stores/<slug:store_slug>/checkout/khalti-verify/", StoreKhaltiVerifyView.as_view(), name="store_khalti_verify"),
    path("stores/<slug:store_slug>/orders/", ShopperOrderListView.as_view(), name="shopper_order_list"),
    path("stores/<slug:store_slug>/orders/<int:order_id>/", ShopperOrderDetailView.as_view(), name="shopper_order_detail"),
    path("stores/<slug:store_slug>/public-orders/<str:order_id>/", StorePublicOrderDetailView.as_view(), name="store_public_order_detail"),
    path("stores/<slug:store_slug>/public-orders/<str:order_id>/pay/", StorePublicOrderPayView.as_view(), name="store_public_order_pay"),

    # Merchant Console
    path("merchant/stores/<slug:store_slug>/overview/", MerchantStoreOverviewView.as_view(), name="merchant_store_overview"),
    path("merchant/stores/<slug:store_slug>/analytics/", MerchantAnalyticsView.as_view(), name="merchant_store_analytics"),
    path("merchant/stores/<slug:store_slug>/discounts/", MerchantDiscountListCreateView.as_view(), name="merchant_discount_list_create"),
    path("merchant/stores/<slug:store_slug>/discounts/<int:discount_id>/", MerchantDiscountDetailView.as_view(), name="merchant_discount_detail"),
    path("merchant/stores/<slug:store_slug>/staff/", MerchantStaffListCreateView.as_view(), name="merchant_staff_list_create"),
    path("merchant/stores/<slug:store_slug>/staff/<int:membership_id>/", MerchantStaffDetailView.as_view(), name="merchant_staff_detail"),
    path("merchant/stores/<slug:store_slug>/settings/", MerchantStoreSettingsView.as_view(), name="merchant_store_settings"),
    path("merchant/stores/<slug:store_slug>/media/upload/", MerchantMediaUploadView.as_view(), name="merchant_media_upload"),
    path("merchant/stores/<slug:store_slug>/media/theme/upload/", MerchantThemeMediaUploadView.as_view(), name="merchant_theme_media_upload"),
    path("merchant/stores/<slug:store_slug>/audit-logs/", MerchantAuditLogListView.as_view(), name="merchant_audit_logs"),
    path("merchant/stores/<slug:store_slug>/products/", MerchantProductListCreateView.as_view(), name="merchant_product_list_create"),
    path("merchant/stores/<slug:store_slug>/products/<int:product_id>/", MerchantProductDetailView.as_view(), name="merchant_product_detail"),
    path("merchant/stores/<slug:store_slug>/products/<int:product_id>/variants/", MerchantVariantListCreateView.as_view(), name="merchant_variant_list_create"),
    path("merchant/stores/<slug:store_slug>/products/<int:product_id>/variants/<int:variant_id>/", MerchantVariantDetailView.as_view(), name="merchant_variant_detail"),
    path("merchant/stores/<slug:store_slug>/orders/", MerchantOrderListView.as_view(), name="merchant_order_list"),
    path("merchant/stores/<slug:store_slug>/orders/<int:order_id>/", MerchantOrderDetailView.as_view(), name="merchant_order_detail"),
    path("merchant/stores/<slug:store_slug>/orders/<int:order_id>/transition/", MerchantOrderStatusTransitionView.as_view(), name="merchant_order_transition"),
    path("merchant/stores/<slug:store_slug>/customers/", MerchantCustomerListView.as_view(), name="merchant_customer_list"),
    path("merchant/stores/<slug:store_slug>/customers/<int:customer_id>/", MerchantCustomerDetailView.as_view(), name="merchant_customer_detail"),
]
