import hashlib
import hmac
import logging
from django.conf import settings
from django.contrib.auth.hashers import check_password

logger = logging.getLogger(__name__)


def get_client_ip(request) -> str:
    """
    Extracts the client IP address.
    To avoid IP spoofing, arbitrary X-Forwarded-For is NOT trusted.
    Only if settings.TRUSTED_PROXY_HEADER is configured (e.g. 'HTTP_CF_CONNECTING_IP',
    'HTTP_X_REAL_IP', or 'HTTP_X_FORWARDED_FOR') will that header be read.
    Otherwise, strictly falls back to request.META.get('REMOTE_ADDR').
    """
    header = getattr(settings, "TRUSTED_PROXY_HEADER", None)
    if header and header in request.META:
        val = str(request.META[header]).strip()
        if "," in val:
            return val.split(",")[0].strip()
        return val
    return request.META.get("REMOTE_ADDR") or "127.0.0.1"


def get_otp_hmac_key() -> bytes:
    """Derives a domain-separated cryptographic key from DJANGO_SECRET_KEY for OTP hashing."""
    secret = getattr(settings, "SECRET_KEY", "django-insecure-default-dev-key")
    return hmac.new(
        secret.encode("utf-8"),
        b"ShopCraft-Email-OTP-v1",
        hashlib.sha256
    ).digest()


def compute_otp_hash(email: str, code: str) -> str:
    """
    Computes an HMAC-SHA256 digest of (normalized_email + ":" + code)
    using the domain-separated server key.
    """
    norm_email = email.strip().lower()
    key = get_otp_hmac_key()
    message = f"{norm_email}:{code}".encode("utf-8")
    digest = hmac.new(key, message, hashlib.sha256).hexdigest()
    return f"hmac-sha256${digest}"


def check_otp_hash(email: str, code: str, stored_hash: str) -> bool:
    """
    Constant-time compare of the HMAC-SHA256 OTP digest.
    Provides backward-compatibility fallback for in-flight legacy hashes (e.g. PBKDF2).
    """
    norm_email = email.strip().lower()
    if stored_hash.startswith("hmac-sha256$"):
        expected_hash = compute_otp_hash(norm_email, code)
        return hmac.compare_digest(expected_hash, stored_hash)

    # Legacy transition fallback for in-flight PBKDF2/Argon2 hashes
    try:
        return check_password(code, stored_hash)
    except Exception:
        return False
