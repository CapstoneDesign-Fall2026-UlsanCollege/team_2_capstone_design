import os
import re
from django.conf import settings
from django.contrib.auth import get_user_model, login, logout
from django.core.mail import send_mail
from django.db import transaction
from django.middleware.csrf import get_token
from django.shortcuts import get_object_or_404
from django.urls import path
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from rest_framework import permissions, serializers, status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from accounts.models import DeliveryAddress, EmailOTPChallenge, NEPALI_MOBILE_VALIDATOR

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "full_name", "phone", "date_joined"]
        read_only_fields = ["id", "email", "date_joined"]

    def validate_phone(self, value):
        if value:
            clean_phone = value.strip()
            if not re.match(r"^9[78]\d{8}$", clean_phone):
                raise serializers.ValidationError("Enter a 10-digit number starting with 98 or 97.")
            return clean_phone
        return value


class DeliveryAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryAddress
        fields = [
            "id",
            "label",
            "recipient_name",
            "phone",
            "province",
            "district",
            "municipality",
            "ward",
            "street_landmark",
            "is_default",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_phone(self, value):
        cleaned = re.sub(r"[\s\-]", "", str(value))
        if cleaned.startswith("+977"):
            cleaned = cleaned[4:]
        elif cleaned.startswith("977"):
            cleaned = cleaned[3:]
        if not re.match(r"^9[78]\d{8}$", cleaned):
            raise serializers.ValidationError("Enter a 10-digit number starting with 98 or 97.")
        return cleaned

    def validate_ward(self, value):
        try:
            ward_num = int(value)
        except (ValueError, TypeError):
            raise serializers.ValidationError("Ward must be a number.")
        if ward_num < 1 or ward_num > 35:
            raise serializers.ValidationError("Ward must be between 1 and 35.")
        return ward_num

    def validate_recipient_name(self, value):
        val = value.strip()
        if not val:
            raise serializers.ValidationError("Recipient name cannot be blank.")
        return val

    def validate_province(self, value):
        val = value.strip()
        if not val:
            raise serializers.ValidationError("Province cannot be blank.")
        return val

    def validate_district(self, value):
        val = value.strip()
        if not val:
            raise serializers.ValidationError("District cannot be blank.")
        return val

    def validate_municipality(self, value):
        val = value.strip()
        if not val:
            raise serializers.ValidationError("Municipality cannot be blank.")
        return val

    def validate_street_landmark(self, value):
        val = value.strip()
        if not val:
            raise serializers.ValidationError("Street / landmark cannot be blank.")
        return val


class CSRFTokenView(APIView):
    permission_classes = [permissions.AllowAny]

    @method_decorator(ensure_csrf_cookie)
    def get(self, request):
        return Response({"csrfToken": get_token(request)})


class OTPRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class OTPRequestView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "otp_request"

    def post(self, request):
        serializer = OTPRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].strip().lower()

        challenge, raw_code = EmailOTPChallenge.issue_for_email(email)

        message = (
            f"Your 6-digit ShopCraft sign-in code is: {raw_code}\n\n"
            "This code expires in 10 minutes. If you did not request this, please ignore this email."
        )

        try:
            send_mail(
                subject="Your ShopCraft sign-in code",
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
        except Exception:
            if not settings.DEBUG:
                raise

        payload = {
            "detail": "6-digit code sent.",
            "email": email,
            "expires_in_seconds": 600,
        }
        if settings.DEBUG:
            payload["dev_otp_hint"] = raw_code

        return Response(payload, status=status.HTTP_200_OK)


class OTPVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.RegexField(regex=r"^\d{6}$")


class OTPVerifyView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "otp_verify"

    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"detail": "That code didn't match or expired. Request a fresh 6-digit code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = serializer.validated_data["email"].strip().lower()
        code = serializer.validated_data["code"]

        verified = EmailOTPChallenge.verify_code(email, code)
        if not verified:
            return Response(
                {"detail": "That code didn't match or expired. Request a fresh 6-digit code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user, created = User.objects.get_or_create(
            email=email,
            defaults={"full_name": ""}
        )
        if created:
            user.set_unusable_password()
            user.save()

        login(request, user, backend="django.contrib.auth.backends.ModelBackend")
        return Response({"user": UserSerializer(user).data}, status=status.HTTP_200_OK)


class GoogleAuthSerializer(serializers.Serializer):
    credential = serializers.CharField()


class GoogleAuthView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_google"

    def post(self, request):
        client_id = os.getenv("GOOGLE_OAUTH_CLIENT_ID", "").strip()
        if not client_id:
            return Response(
                {"detail": "Google OAuth is not configured on this server."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        serializer = GoogleAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        credential = serializer.validated_data["credential"]

        try:
            idinfo = id_token.verify_oauth2_token(
                credential,
                google_requests.Request(),
                audience=client_id,
            )
        except ValueError:
            return Response(
                {"detail": "Invalid Google credential token."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if idinfo.get("iss") not in ("accounts.google.com", "https://accounts.google.com"):
            return Response(
                {"detail": "Untrusted Google token issuer."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not idinfo.get("email_verified") or not idinfo.get("email"):
            return Response(
                {"detail": "Google email is unverified or missing."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        email = idinfo["email"].strip().lower()
        full_name = idinfo.get("name", "").strip()

        user, created = User.objects.get_or_create(
            email=email,
            defaults={"full_name": full_name}
        )
        if created:
            user.set_unusable_password()
            user.save()
        elif not user.full_name and full_name:
            user.full_name = full_name
            user.save(update_fields=["full_name"])

        login(request, user, backend="django.contrib.auth.backends.ModelBackend")
        return Response({"user": UserSerializer(user).data}, status=status.HTTP_200_OK)


class MeView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        if request.user.is_authenticated:
            return Response({"authenticated": True, "user": UserSerializer(request.user).data})
        return Response({"authenticated": False, "user": None})

    def patch(self, request):
        if not request.user.is_authenticated:
            return Response(
                {"detail": "Authentication required."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"authenticated": True, "user": serializer.data})


class LogoutView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        logout(request)
        return Response({"detail": "Signed out."}, status=status.HTTP_200_OK)


class DeliveryAddressListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        addresses = DeliveryAddress.objects.filter(user=request.user).order_by("-is_default", "-updated_at")
        serializer = DeliveryAddressSerializer(addresses, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = DeliveryAddressSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        address = serializer.save(user=request.user)
        return Response(DeliveryAddressSerializer(address).data, status=status.HTTP_201_CREATED)


class DeliveryAddressDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, pk, user):
        return get_object_or_404(DeliveryAddress, pk=pk, user=user)

    def get(self, request, pk):
        address = self.get_object(pk, request.user)
        return Response(DeliveryAddressSerializer(address).data, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        address = self.get_object(pk, request.user)
        serializer = DeliveryAddressSerializer(address, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()
        return Response(DeliveryAddressSerializer(updated).data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        return self.patch(request, pk)

    def delete(self, request, pk):
        address = self.get_object(pk, request.user)
        with transaction.atomic():
            was_default = address.is_default
            address.delete()
            if was_default:
                remaining = (
                    DeliveryAddress.objects.filter(user=request.user)
                    .order_by("-updated_at")
                    .first()
                )
                if remaining:
                    remaining.is_default = True
                    remaining.save(update_fields=["is_default"])
        return Response({"detail": "Address deleted."}, status=status.HTTP_200_OK)


urlpatterns = [
    path("csrf/", CSRFTokenView.as_view(), name="auth_csrf"),
    path("otp/request/", OTPRequestView.as_view(), name="auth_otp_request"),
    path("otp/verify/", OTPVerifyView.as_view(), name="auth_otp_verify"),
    path("google/", GoogleAuthView.as_view(), name="auth_google"),
    path("me/", MeView.as_view(), name="auth_me"),
    path("logout/", LogoutView.as_view(), name="auth_logout"),
    path("addresses/", DeliveryAddressListCreateView.as_view(), name="delivery_address_list_create"),
    path("addresses/<int:pk>/", DeliveryAddressDetailView.as_view(), name="delivery_address_detail"),
]
