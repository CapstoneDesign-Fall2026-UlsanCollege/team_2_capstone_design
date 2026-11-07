import hashlib
import hmac
import logging
from django.conf import settings
from accounts.otp import get_client_ip

logger = logging.getLogger("shopcraft.security")


def compute_salted_ip_hash(ip_address: str) -> str:
    """
    Returns a 12-char salted HMAC-SHA256 digest of the resolved client IP.
    Never returns or logs the raw IP address.
    """
    key = (getattr(settings, "SECRET_KEY", "") or "shopcraft-ip-salt").encode("utf-8")
    normalized = (ip_address or "unknown").strip().encode("utf-8")
    return hmac.new(key, normalized, hashlib.sha256).hexdigest()[:12]


class HashedClientIPMiddleware:
    """
    Optional verification log for proxy/Heroku client-IP resolution (default OFF).
    When LOG_HASHED_CLIENT_IP=True, logs only a short salted hash of the resolved
    client IP so two devices can be compared in logs without ever recording PII.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if getattr(settings, "LOG_HASHED_CLIENT_IP", False):
            path = request.path or ""
            if path.startswith("/api/") and not path.startswith("/api/health"):
                resolved_ip = get_client_ip(request)
                ip_hash = compute_salted_ip_hash(resolved_ip)
                logger.info(
                    "client_ip_check ip_hash=%s method=%s",
                    ip_hash,
                    request.method,
                )
        return self.get_response(request)
