"""
Khalti ePayment mode, key, and token safety guards + shared initiation/verification helpers.

Global invariants:
- Khalti stays in SANDBOX (TEST) mode by default.
- LIVE mode requires explicit server env opt-in (`KHALTI_LIVE_ENABLED=True`).
- Sandbox/test keys and tokens are strictly rejected in LIVE mode.
- Live keys and tokens are strictly rejected in SANDBOX (TEST) mode.
- Never log raw secret keys or tokens.
"""

import logging
import secrets as pysecrets
from django.conf import settings
from core.email_transport import get_shared_http_session

logger = logging.getLogger("shopcraft.payments")


def _strip_key_prefix(raw_key: str) -> str:
    cleaned = (raw_key or "").strip()
    if cleaned.lower().startswith("key "):
        return cleaned[4:].strip()
    return cleaned


def format_khalti_auth_header(raw_key: str) -> str:
    bare = _strip_key_prefix(raw_key)
    return f"Key {bare}" if bare else ""


def is_sandbox_khalti_key(raw_key: str) -> bool:
    bare = _strip_key_prefix(raw_key)
    if not bare:
        return False
    lower = bare.lower()
    if (
        lower.startswith("test_")
        or lower.startswith("sandbox_")
        or "test_secret_key" in lower
        or "test_public_key" in lower
        or "sandbox" in lower
    ):
        return True
    platform_sandbox = _strip_key_prefix(getattr(settings, "KHALTI_PLATFORM_SANDBOX_KEY", ""))
    if platform_sandbox and bare == platform_sandbox:
        return True
    return False


def is_live_khalti_key(raw_key: str) -> bool:
    bare = _strip_key_prefix(raw_key)
    if not bare:
        return False
    lower = bare.lower()
    return (
        lower.startswith("live_")
        or "live_secret_key" in lower
        or "live_public_key" in lower
    )


def is_sandbox_khalti_token(pidx: str) -> bool:
    cleaned = (pidx or "").strip().lower()
    if not cleaned:
        return False
    return (
        cleaned.startswith("sandbox_")
        or cleaned.startswith("test_")
        or "sandbox" in cleaned
    )


def is_live_khalti_token(pidx: str) -> bool:
    cleaned = (pidx or "").strip().lower()
    if not cleaned:
        return False
    return cleaned.startswith("live_") or "live_pidx" in cleaned


def validate_khalti_settings_update(*, target_mode: str, effective_secret_key: str) -> str | None:
    mode = (target_mode or "TEST").strip().upper()
    if mode not in ("TEST", "LIVE"):
        return "Invalid Khalti mode. Must be TEST or LIVE."

    if mode == "LIVE":
        if not getattr(settings, "KHALTI_LIVE_ENABLED", False):
            return "Khalti LIVE mode is disabled on this server (KHALTI_LIVE_ENABLED is off)."
        if not effective_secret_key:
            return "A live Khalti secret key is required before enabling LIVE mode."
        if is_sandbox_khalti_key(effective_secret_key):
            return "Sandbox or test Khalti keys cannot be used in LIVE mode."
    else:
        if effective_secret_key and is_live_khalti_key(effective_secret_key):
            return "Live Khalti keys cannot be used while Khalti is in SANDBOX mode."

    return None


def resolve_khalti_initiation_config(store) -> tuple[str | None, str, str | None]:
    """
    Validates store Khalti mode + credentials prior to payment initiation.
    Returns (authorization_header_or_none, initiate_url, error_message_or_none).
    """
    mode = (getattr(store, "khalti_mode", "TEST") or "TEST").strip().upper()
    custom_key = (store.get_khalti_secret_key() or "").strip()
    platform_sandbox_key = (getattr(settings, "KHALTI_PLATFORM_SANDBOX_KEY", "") or "").strip()

    if mode == "LIVE":
        if not getattr(settings, "KHALTI_LIVE_ENABLED", False):
            return None, "", "Khalti LIVE mode is disabled on this environment."
        if not custom_key:
            return None, "", "Khalti LIVE mode requires a configured live secret key."
        if is_sandbox_khalti_key(custom_key):
            return None, "", "Sandbox Khalti keys are rejected in LIVE mode."
        return (
            format_khalti_auth_header(custom_key),
            "https://khalti.com/api/v2/epayment/initiate/",
            None,
        )

    if custom_key and is_live_khalti_key(custom_key):
        return None, "", "Live Khalti keys are rejected in SANDBOX mode."
    if not custom_key and platform_sandbox_key and is_live_khalti_key(platform_sandbox_key):
        return None, "", "Live Khalti keys are rejected in SANDBOX mode."

    effective = custom_key or platform_sandbox_key
    auth_header = format_khalti_auth_header(effective) if effective else None
    return (
        auth_header,
        "https://dev.khalti.com/api/v2/epayment/initiate/",
        None,
    )


def validate_khalti_verify_request(store, pidx: str) -> tuple[str | None, str, str | None]:
    """
    Validates store Khalti mode, key, and pidx token prior to payment verification.
    Returns (authorization_header_or_none, lookup_url, error_message_or_none).
    """
    mode = (getattr(store, "khalti_mode", "TEST") or "TEST").strip().upper()
    custom_key = (store.get_khalti_secret_key() or "").strip()
    platform_sandbox_key = (getattr(settings, "KHALTI_PLATFORM_SANDBOX_KEY", "") or "").strip()

    if mode == "LIVE":
        if not getattr(settings, "KHALTI_LIVE_ENABLED", False):
            return None, "", "Khalti LIVE mode is disabled on this environment."
        if is_sandbox_khalti_token(pidx):
            return None, "", "Sandbox payment tokens are rejected in LIVE mode."
        if not custom_key:
            return None, "", "Khalti LIVE mode requires a configured live secret key."
        if is_sandbox_khalti_key(custom_key):
            return None, "", "Sandbox Khalti keys are rejected in LIVE mode."
        return (
            format_khalti_auth_header(custom_key),
            "https://khalti.com/api/v2/epayment/lookup/",
            None,
        )

    if is_live_khalti_token(pidx):
        return None, "", "Live payment tokens are rejected in SANDBOX mode."
    if custom_key and is_live_khalti_key(custom_key):
        return None, "", "Live Khalti keys are rejected in SANDBOX mode."
    if not custom_key and platform_sandbox_key and is_live_khalti_key(platform_sandbox_key):
        return None, "", "Live Khalti keys are rejected in SANDBOX mode."

    effective = custom_key or platform_sandbox_key
    auth_header = format_khalti_auth_header(effective) if effective else None
    return (
        auth_header,
        "https://dev.khalti.com/api/v2/epayment/lookup/",
        None,
    )


def initiate_khalti_epayment(*, store, order, khalti_body: dict) -> tuple[str | None, str | None, bool, str | None]:
    """
    Initiates a Khalti ePayment session using the validated store mode & key.
    Returns (pidx, payment_url, is_sandbox_fallback, gateway_error_or_none).
    Never synthesizes a sandbox pidx in LIVE mode.
    """
    mode = (getattr(store, "khalti_mode", "TEST") or "TEST").strip().upper()
    auth_header, initiate_url, config_err = resolve_khalti_initiation_config(store)
    if config_err:
        return None, None, False, config_err

    if auth_header:
        try:
            session = get_shared_http_session()
            resp = session.post(
                initiate_url,
                json=khalti_body,
                headers={"Authorization": auth_header, "Content-Type": "application/json"},
                timeout=5.0,
            )
            if resp.status_code == 200:
                data = resp.json()
                pidx = str(data.get("pidx") or "").strip()
                payment_url = str(data.get("payment_url") or "").strip()
                if pidx and payment_url:
                    if mode == "LIVE" and is_sandbox_khalti_token(pidx):
                        return None, None, False, "Sandbox payment token rejected in LIVE mode."
                    if mode == "TEST" and is_live_khalti_token(pidx):
                        return None, None, False, "Live payment token rejected in SANDBOX mode."
                    return pidx, payment_url, False, None
        except Exception as exc:
            logger.warning(
                "Khalti initiate error: error_class=%s store_id=%s mode=%s",
                type(exc).__name__,
                store.id,
                mode,
            )

    if mode != "TEST":
        return (
            None,
            None,
            False,
            "Unable to reach Khalti payment gateway. Please try again shortly.",
        )

    sandbox_pidx = f"sandbox_{order.id}_{pysecrets.token_hex(4)}"
    sandbox_payment_url = (
        f"/s/{store.slug}/checkout/khalti-return/"
        f"?pidx={sandbox_pidx}&purchase_order_id={order.id}&amount={order.total_minor}"
    )
    return sandbox_pidx, sandbox_payment_url, True, None


def verify_khalti_epayment(*, store, pidx: str) -> tuple[bool, str | None]:
    """
    Verifies a Khalti pidx against the store's configured mode.
    Returns (verified, rejection_reason_or_none).
    """
    mode = (getattr(store, "khalti_mode", "TEST") or "TEST").strip().upper()
    auth_header, lookup_url, mode_err = validate_khalti_verify_request(store, pidx)
    if mode_err:
        return False, mode_err

    if is_sandbox_khalti_token(pidx):
        # validate_khalti_verify_request already rejected sandbox tokens in LIVE mode
        return (mode == "TEST"), None

    if not auth_header:
        return False, "Khalti verification credentials are not configured."

    try:
        session = get_shared_http_session()
        resp = session.post(
            lookup_url,
            json={"pidx": pidx},
            headers={"Authorization": auth_header, "Content-Type": "application/json"},
            timeout=5.0,
        )
        if resp.status_code == 200:
            data = resp.json()
            if data.get("status") == "Completed":
                return True, None
    except Exception as exc:
        logger.warning(
            "Khalti lookup error: error_class=%s store_id=%s mode=%s",
            type(exc).__name__,
            store.id,
            mode,
        )

    return False, None
