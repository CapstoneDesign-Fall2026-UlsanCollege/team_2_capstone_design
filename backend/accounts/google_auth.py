from __future__ import annotations

import hashlib
import logging
import os
import re
import threading
import time
from typing import Any

from django.conf import settings
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from google.auth import exceptions as google_exceptions
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from core.email_transport import get_shared_http_session

logger = logging.getLogger(__name__)

VALID_GOOGLE_ISSUERS = frozenset({"accounts.google.com", "https://accounts.google.com"})
GENERIC_GOOGLE_AUTH_ERROR = "Unable to sign in with Google. Please try again or use email code."
GOOGLE_IP_LIMIT_PER_MINUTE = 20

_req_lock = threading.Lock()
_cached_google_request: CachedGoogleAuthRequest | None = None
_cached_google_request_pid: int | None = None
_MAX_AGE_RE = re.compile(r"max-age=(\d+)")


class GoogleTokenVerificationError(ValueError):
    """Raised when a Google ID token fails verification; reason_code is non-PII."""

    def __init__(self, reason_code: str):
        super().__init__(reason_code)
        self.reason_code = reason_code


class CachedGoogleAuthRequest(google_requests.Request):
    """
    google.auth.transport.requests.Request backed by the shared requests.Session
    with in-memory HTTP Cache-Control caching for Google's public JWK cert endpoint
    so certificates are reused across requests without hitting Google on every login.
    """

    def __init__(self, session=None):
        super().__init__(session=session or get_shared_http_session())
        self._cert_cache: dict[str, tuple[float, Any]] = {}
        self._cache_lock = threading.Lock()

    def __call__(
        self,
        url: str,
        method: str = "GET",
        body=None,
        headers=None,
        timeout=None,
        **kwargs,
    ):
        upper_method = (method or "GET").upper()
        now = time.monotonic()

        if upper_method == "GET":
            with self._cache_lock:
                cached = self._cert_cache.get(url)
                if cached and cached[0] > now:
                    return cached[1]

        effective_timeout = timeout if timeout is not None else 5.0
        response = super().__call__(
            url,
            method=upper_method,
            body=body,
            headers=headers,
            timeout=effective_timeout,
            **kwargs,
        )

        if upper_method == "GET" and getattr(response, "status", 0) == 200:
            resp_headers = getattr(response, "headers", {}) or {}
            cache_control = ""
            for k, v in resp_headers.items():
                if str(k).lower() == "cache-control":
                    cache_control = str(v)
                    break
            ttl = 300
            match = _MAX_AGE_RE.search(cache_control)
            if match:
                ttl = min(max(int(match.group(1)), 0), 3600)
            if "no-store" not in cache_control.lower() and ttl > 0:
                with self._cache_lock:
                    self._cert_cache[url] = (now + ttl, response)

        return response


def get_cached_google_request() -> CachedGoogleAuthRequest:
    """
    Lazily initializes and caches a post-fork-safe CachedGoogleAuthRequest
    wrapping the shared requests.Session.
    """
    global _cached_google_request, _cached_google_request_pid
    pid = os.getpid()
    if _cached_google_request is None or _cached_google_request_pid != pid:
        with _req_lock:
            if _cached_google_request is None or _cached_google_request_pid != pid:
                _cached_google_request = CachedGoogleAuthRequest(
                    session=get_shared_http_session()
                )
                _cached_google_request_pid = pid
    return _cached_google_request


def get_configured_google_client_id() -> str:
    configured = getattr(settings, "GOOGLE_CLIENT_ID", "") or ""
    if configured.strip():
        return configured.strip()
    return (
        os.getenv("GOOGLE_CLIENT_ID", "").strip()
        or os.getenv("GOOGLE_OAUTH_CLIENT_ID", "").strip()
    )


def check_google_ip_rate_limit(client_ip: str) -> bool:
    """
    Returns True if allowed, False if IP exceeded GOOGLE_IP_LIMIT_PER_MINUTE.
    Uses a salted SHA-256 digest of client_ip so raw IPs are not stored in cache keys.
    """
    secret = getattr(settings, "SECRET_KEY", "dev")
    ip_digest = hashlib.sha256(f"google-ip:{secret}:{client_ip}".encode("utf-8")).hexdigest()[:24]
    cache_key = f"sc:gauth:ip:{ip_digest}"
    added = cache.add(cache_key, 1, timeout=60)
    if added:
        return True
    try:
        count = cache.incr(cache_key)
    except ValueError:
        cache.set(cache_key, 1, timeout=60)
        return True
    return count <= GOOGLE_IP_LIMIT_PER_MINUTE


def verify_google_id_token(raw_credential: str, *, store_id: int | None = None) -> dict[str, str]:
    """
    Verifies a Google ID token server-side and returns normalized {"email", "full_name"}.
    Enforces:
      - cryptographic signature via Google certs
      - issuer in {"accounts.google.com", "https://accounts.google.com"}
      - audience == GOOGLE_CLIENT_ID
      - expiry (exp > now)
      - email_verified is True
    Never logs raw tokens, emails, or provider exception text.
    """
    client_id = get_configured_google_client_id()
    if not client_id:
        raise GoogleTokenVerificationError("unconfigured_client_id")

    token_str = (raw_credential or "").strip()
    if not token_str or len(token_str) > 8192:
        logger.warning(
            "Google auth failed: reason=malformed_token store_id=%s",
            store_id if store_id is not None else "platform",
        )
        raise GoogleTokenVerificationError("malformed_token")

    try:
        idinfo = id_token.verify_oauth2_token(
            token_str,
            get_cached_google_request(),
            audience=client_id,
        )
    except (ValueError, google_exceptions.GoogleAuthError):
        logger.warning(
            "Google auth failed: reason=token_verification_failed store_id=%s",
            store_id if store_id is not None else "platform",
        )
        raise GoogleTokenVerificationError("token_verification_failed")

    if not isinstance(idinfo, dict):
        logger.warning(
            "Google auth failed: reason=invalid_claims store_id=%s",
            store_id if store_id is not None else "platform",
        )
        raise GoogleTokenVerificationError("invalid_claims")

    if idinfo.get("iss") not in VALID_GOOGLE_ISSUERS:
        logger.warning(
            "Google auth failed: reason=invalid_issuer store_id=%s",
            store_id if store_id is not None else "platform",
        )
        raise GoogleTokenVerificationError("invalid_issuer")

    aud = idinfo.get("aud")
    if aud != client_id:
        logger.warning(
            "Google auth failed: reason=invalid_audience store_id=%s",
            store_id if store_id is not None else "platform",
        )
        raise GoogleTokenVerificationError("invalid_audience")

    try:
        exp = int(idinfo.get("exp", 0))
    except (TypeError, ValueError):
        exp = 0
    if exp <= int(time.time()):
        logger.warning(
            "Google auth failed: reason=expired_token store_id=%s",
            store_id if store_id is not None else "platform",
        )
        raise GoogleTokenVerificationError("expired_token")

    if idinfo.get("email_verified") is not True:
        logger.warning(
            "Google auth failed: reason=unverified_email store_id=%s",
            store_id if store_id is not None else "platform",
        )
        raise GoogleTokenVerificationError("unverified_email")

    norm_email = str(idinfo.get("email") or "").strip().lower()
    if not norm_email:
        logger.warning(
            "Google auth failed: reason=missing_email store_id=%s",
            store_id if store_id is not None else "platform",
        )
        raise GoogleTokenVerificationError("missing_email")

    try:
        validate_email(norm_email)
    except ValidationError:
        logger.warning(
            "Google auth failed: reason=invalid_email store_id=%s",
            store_id if store_id is not None else "platform",
        )
        raise GoogleTokenVerificationError("invalid_email")

    # Take name strictly from verified token claims (never from client payload)
    full_name = str(idinfo.get("name") or "").strip()[:150]
    return {
        "email": norm_email,
        "full_name": full_name,
    }
