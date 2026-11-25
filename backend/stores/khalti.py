"""
Khalti ePayment v2 mode, key, token safety guards, and initiation/lookup helpers.

Global invariants:
- Khalti stays in SANDBOX (TEST) mode by default, hitting https://dev.khalti.com/api/v2/.
- LIVE mode requires explicit server env opt-in (`KHALTI_LIVE_ENABLED=True`) and hits https://khalti.com/api/v2/.
- Endpoint selection is determined strictly by store `khalti_mode` (never by key prefix).
- Sandbox/test/mock keys and tokens are rejected in LIVE mode.
- Fabricated `sandbox_`/`test_` bypass tokens are always rejected; `mock_` tokens are ONLY accepted
  when `KHALTI_MOCK_MODE=True` in DEBUG or the automated test runner.
- Never log raw secret keys or payment tokens.
"""

import logging
import secrets as pysecrets
from typing import NamedTuple

from django.conf import settings

from core.email_transport import get_shared_http_session

logger = logging.getLogger("shopcraft.payments")

KHALTI_SANDBOX_BASE_URL = "https://dev.khalti.com/api/v2"
KHALTI_LIVE_BASE_URL = "https://khalti.com/api/v2"
KHALTI_INVALID_KEY_MESSAGE = (
    "Khalti rejected the configured key. Check that the key belongs to the right environment (test or live)."
)

KHALTI_STATE_COMPLETED = "COMPLETED"
KHALTI_STATE_PENDING = "PENDING"
KHALTI_STATE_CANCELED = "CANCELED"
KHALTI_STATE_EXPIRED = "EXPIRED"
KHALTI_STATE_REFUNDED = "REFUNDED"
KHALTI_STATE_UNKNOWN_ERROR = "UNKNOWN_ERROR"
KHALTI_STATE_REJECTED = "REJECTED"

KHALTI_STATUS_MAP = {
    "Completed": KHALTI_STATE_COMPLETED,
    "Pending": KHALTI_STATE_PENDING,
    "Initiated": KHALTI_STATE_PENDING,
    "User canceled": KHALTI_STATE_CANCELED,
    "Expired": KHALTI_STATE_EXPIRED,
    "Refunded": KHALTI_STATE_REFUNDED,
}


class KhaltiVerifyResult(NamedTuple):
    state: str
    total_amount_paisa: int | None
    transaction_id: str | None
    error: str | None


def is_khalti_mock_mode_enabled() -> bool:
    """
    Explicit opt-in mock mode is honored ONLY when DEBUG=True or the test runner is active.
    Production servers enforce DEBUG=False and reject KHALTI_MOCK_MODE=True at startup.
    """
    if not getattr(settings, "KHALTI_MOCK_MODE", False):
        return False
    return bool(
        getattr(settings, "DEBUG", False)
        or getattr(settings, "IS_TEST_COMMAND", False)
        or getattr(settings, "IS_TEST_RUNNER_ACTIVE", False)
    )


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


def is_mock_khalti_token(pidx: str) -> bool:
    cleaned = (pidx or "").strip().lower()
    return bool(cleaned and cleaned.startswith("mock_"))


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


def _parse_paisa_int(raw_val) -> int | None:
    if isinstance(raw_val, bool) or raw_val is None:
        return None
    if isinstance(raw_val, int):
        return raw_val if raw_val >= 0 else None
    if isinstance(raw_val, str):
        cleaned = raw_val.strip()
        if cleaned.isdigit():
            return int(cleaned)
    return None


def _is_khalti_invalid_key_response(resp) -> bool:
    """Detects 401 or invalid-token responses without touching or logging any key material."""
    if getattr(resp, "status_code", None) == 401:
        return True
    try:
        payload = resp.json()
    except Exception:
        payload = None
    if isinstance(payload, dict):
        for field in ("detail", "message", "error_key", "error"):
            val = payload.get(field)
            if isinstance(val, str):
                lower = val.lower()
                if "invalid token" in lower or "invalid_token" in lower:
                    return True
    raw_text = getattr(resp, "text", None)
    if isinstance(raw_text, str):
        lower_text = raw_text.lower()
        if "invalid token" in lower_text or "invalid_token" in lower_text:
            return True
    return False


def store_has_khalti_configured(store) -> bool:
    """
    Returns whether Khalti checkout should be enabled on the storefront without revealing
    which credential (merchant custom key vs platform demo sandbox key) is in use.
    """
    mode = (getattr(store, "khalti_mode", "TEST") or "TEST").strip().upper()
    custom_key = _strip_key_prefix(store.get_khalti_secret_key() or "")

    if mode == "LIVE":
        return bool(custom_key and not is_sandbox_khalti_key(custom_key))

    if custom_key:
        return True

    if is_khalti_mock_mode_enabled():
        return True

    platform_sandbox_key = _strip_key_prefix(getattr(settings, "KHALTI_PLATFORM_SANDBOX_KEY", "") or "")
    return bool(platform_sandbox_key)


def validate_khalti_settings_update(*, target_mode: str, effective_secret_key: str) -> str | None:
    mode = (target_mode or "TEST").strip().upper()
    if mode not in ("TEST", "LIVE"):
        return "Invalid Khalti mode. Must be TEST or LIVE."

    if mode == "LIVE":
        if not getattr(settings, "KHALTI_LIVE_ENABLED", False):
            return "Khalti LIVE mode is disabled on this server (KHALTI_LIVE_ENABLED is off)."
        if not _strip_key_prefix(effective_secret_key):
            return "A live Khalti secret key is required before enabling LIVE mode."
        if is_sandbox_khalti_key(effective_secret_key):
            return "Sandbox or test Khalti keys cannot be used in LIVE mode."

    return None


def resolve_khalti_initiation_config(store) -> tuple[str | None, str, str | None]:
    """
    Validates store Khalti mode + credentials prior to payment initiation.
    Endpoint URL is selected strictly from store.khalti_mode (never from key shape).
    Returns (authorization_header_or_none, initiate_url, error_message_or_none).
    """
    mode = (getattr(store, "khalti_mode", "TEST") or "TEST").strip().upper()
    custom_key = _strip_key_prefix(store.get_khalti_secret_key() or "")
    platform_sandbox_key = _strip_key_prefix(getattr(settings, "KHALTI_PLATFORM_SANDBOX_KEY", "") or "")

    if mode == "LIVE":
        if not getattr(settings, "KHALTI_LIVE_ENABLED", False):
            return None, "", "Khalti LIVE mode is disabled on this environment."
        if not custom_key:
            return None, "", "Khalti LIVE mode requires a configured live secret key."
        if is_sandbox_khalti_key(custom_key):
            return None, "", "Sandbox Khalti keys are rejected in LIVE mode."
        return (
            format_khalti_auth_header(custom_key),
            f"{KHALTI_LIVE_BASE_URL}/epayment/initiate/",
            None,
        )

    if is_khalti_mock_mode_enabled():
        return None, "mock://khalti/epayment/initiate/", None

    effective = custom_key or platform_sandbox_key
    if not effective:
        return None, "", "Khalti sandbox secret key is not configured for this store."

    return (
        format_khalti_auth_header(effective),
        f"{KHALTI_SANDBOX_BASE_URL}/epayment/initiate/",
        None,
    )


def validate_khalti_verify_request(store, pidx: str) -> tuple[str | None, str, str | None]:
    """
    Validates store Khalti mode, key, and pidx token prior to payment verification.
    Endpoint URL is selected strictly from store.khalti_mode (never from key shape).
    Returns (authorization_header_or_none, lookup_url, error_message_or_none).
    """
    mode = (getattr(store, "khalti_mode", "TEST") or "TEST").strip().upper()
    custom_key = _strip_key_prefix(store.get_khalti_secret_key() or "")
    platform_sandbox_key = _strip_key_prefix(getattr(settings, "KHALTI_PLATFORM_SANDBOX_KEY", "") or "")

    if mode == "LIVE":
        if not getattr(settings, "KHALTI_LIVE_ENABLED", False):
            return None, "", "Khalti LIVE mode is disabled on this environment."
        if is_sandbox_khalti_token(pidx) or is_mock_khalti_token(pidx):
            return None, "", "Sandbox or mock payment tokens are rejected in LIVE mode."
        if not custom_key:
            return None, "", "Khalti LIVE mode requires a configured live secret key."
        if is_sandbox_khalti_key(custom_key):
            return None, "", "Sandbox Khalti keys are rejected in LIVE mode."
        return (
            format_khalti_auth_header(custom_key),
            f"{KHALTI_LIVE_BASE_URL}/epayment/lookup/",
            None,
        )

    if is_live_khalti_token(pidx):
        return None, "", "Live payment tokens are rejected in SANDBOX mode."

    if is_khalti_mock_mode_enabled():
        if not is_mock_khalti_token(pidx):
            return None, "", "Only mock_* payment tokens are accepted while KHALTI_MOCK_MODE is enabled."
        return None, "mock://khalti/epayment/lookup/", None

    if is_mock_khalti_token(pidx) or is_sandbox_khalti_token(pidx):
        return None, "", "Mock and fabricated sandbox payment tokens are rejected."

    effective = custom_key or platform_sandbox_key
    if not effective:
        return None, "", "Khalti verification credentials are not configured."

    return (
        format_khalti_auth_header(effective),
        f"{KHALTI_SANDBOX_BASE_URL}/epayment/lookup/",
        None,
    )


def initiate_khalti_epayment(*, store, order, khalti_body: dict) -> tuple[str | None, str | None, bool, str | None]:
    """
    Initiates a Khalti ePayment session using the validated store mode & key.
    Returns (pidx, payment_url, is_mock, gateway_error_or_none).
    Never synthesizes a fake sandbox pidx when KHALTI_MOCK_MODE is disabled.
    """
    mode = (getattr(store, "khalti_mode", "TEST") or "TEST").strip().upper()
    auth_header, initiate_url, config_err = resolve_khalti_initiation_config(store)
    if config_err:
        return None, None, False, config_err

    if mode == "TEST" and is_khalti_mock_mode_enabled():
        mock_pidx = f"mock_{order.id}_{pysecrets.token_hex(4)}"
        mock_payment_url = (
            f"/s/{store.slug}/checkout/khalti-return/"
            f"?pidx={mock_pidx}&purchase_order_id={order.id}&amount={order.total_minor}"
        )
        return mock_pidx, mock_payment_url, True, None

    if not auth_header:
        return None, None, False, "Khalti payment credentials are not configured."

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
            if isinstance(data, dict):
                pidx = str(data.get("pidx") or "").strip()
                payment_url = str(data.get("payment_url") or "").strip()
                if pidx and payment_url:
                    if mode == "LIVE" and (is_sandbox_khalti_token(pidx) or is_mock_khalti_token(pidx)):
                        return None, None, False, "Sandbox or mock payment token rejected in LIVE mode."
                    if mode == "TEST" and is_live_khalti_token(pidx):
                        return None, None, False, "Live payment token rejected in SANDBOX mode."
                    if mode == "TEST" and (is_sandbox_khalti_token(pidx) or is_mock_khalti_token(pidx)):
                        return None, None, False, "Invalid payment token returned by Khalti."
                    return pidx, payment_url, False, None
        elif _is_khalti_invalid_key_response(resp):
            logger.warning(
                "Khalti initiate rejected configured key: status_code=%s store_id=%s mode=%s",
                resp.status_code,
                store.id,
                mode,
            )
            return None, None, False, KHALTI_INVALID_KEY_MESSAGE
        logger.warning(
            "Khalti initiate non-200 or incomplete response: status_code=%s store_id=%s mode=%s",
            resp.status_code,
            store.id,
            mode,
        )
    except Exception as exc:
        logger.warning(
            "Khalti initiate error: error_class=%s store_id=%s mode=%s",
            type(exc).__name__,
            store.id,
            mode,
        )

    return (
        None,
        None,
        False,
        "Unable to reach Khalti payment gateway. Please try again shortly.",
    )


def verify_khalti_epayment(
    *,
    store,
    pidx: str,
    expected_pidx: str | None = None,
    mock_amount_paisa: int | None = None,
) -> KhaltiVerifyResult:
    """
    Verifies a Khalti pidx against the store's configured mode via /epayment/lookup/
    (or explicit mock mode in local dev / tests when KHALTI_MOCK_MODE=True).
    Returns KhaltiVerifyResult(state, total_amount_paisa, transaction_id, error).
    """
    mode = (getattr(store, "khalti_mode", "TEST") or "TEST").strip().upper()
    auth_header, lookup_url, mode_err = validate_khalti_verify_request(store, pidx)
    if mode_err:
        return KhaltiVerifyResult(KHALTI_STATE_REJECTED, None, None, mode_err)

    if mode == "TEST" and is_khalti_mock_mode_enabled():
        if not expected_pidx or pidx != expected_pidx:
            return KhaltiVerifyResult(
                KHALTI_STATE_REJECTED,
                None,
                None,
                "Mock payment token does not match order reference.",
            )
        return KhaltiVerifyResult(
            KHALTI_STATE_COMPLETED,
            mock_amount_paisa,
            f"mock_txn_{pidx}",
            None,
        )

    if not auth_header:
        return KhaltiVerifyResult(
            KHALTI_STATE_REJECTED,
            None,
            None,
            "Khalti verification credentials are not configured.",
        )

    try:
        session = get_shared_http_session()
        resp = session.post(
            lookup_url,
            json={"pidx": pidx},
            headers={"Authorization": auth_header, "Content-Type": "application/json"},
            timeout=5.0,
        )
        data = None
        if resp.status_code != 200:
            if _is_khalti_invalid_key_response(resp):
                logger.warning(
                    "Khalti lookup rejected configured key: status_code=%s store_id=%s mode=%s",
                    resp.status_code,
                    store.id,
                    mode,
                )
                return KhaltiVerifyResult(
                    KHALTI_STATE_UNKNOWN_ERROR,
                    None,
                    None,
                    KHALTI_INVALID_KEY_MESSAGE,
                )
            # Khalti ePayment v2 returns HTTP 400 with JSON {"status": "User canceled" | "Expired" | ...}
            # for canceled/expired transactions. Never treat non-200 responses as Completed.
            if resp.status_code == 400:
                try:
                    parsed_400 = resp.json()
                except Exception:
                    parsed_400 = None
                if (
                    isinstance(parsed_400, dict)
                    and isinstance(parsed_400.get("status"), str)
                    and KHALTI_STATUS_MAP.get(parsed_400["status"])
                    not in (None, KHALTI_STATE_COMPLETED)
                ):
                    data = parsed_400
            if data is None:
                logger.warning(
                    "Khalti lookup non-200 response: status_code=%s store_id=%s mode=%s",
                    resp.status_code,
                    store.id,
                    mode,
                )
                return KhaltiVerifyResult(
                    KHALTI_STATE_UNKNOWN_ERROR,
                    None,
                    None,
                    "Unable to reach Khalti payment gateway for verification.",
                )
        else:
            data = resp.json()
        if not isinstance(data, dict):
            logger.warning(
                "Khalti lookup malformed JSON payload (non-dict): store_id=%s mode=%s",
                store.id,
                mode,
            )
            return KhaltiVerifyResult(
                KHALTI_STATE_UNKNOWN_ERROR,
                None,
                None,
                "Malformed verification response from Khalti.",
            )

        raw_status = data.get("status")
        mapped_state = KHALTI_STATUS_MAP.get(raw_status) if isinstance(raw_status, str) else None
        if not mapped_state:
            logger.warning(
                "Khalti lookup returned unknown status=%r store_id=%s mode=%s",
                raw_status,
                store.id,
                mode,
            )
            return KhaltiVerifyResult(
                KHALTI_STATE_UNKNOWN_ERROR,
                None,
                None,
                "Unexpected payment status returned by Khalti.",
            )

        total_amount_paisa = _parse_paisa_int(data.get("total_amount"))
        if mapped_state == KHALTI_STATE_COMPLETED and total_amount_paisa is None:
            logger.warning(
                "Khalti lookup Completed missing/invalid total_amount: store_id=%s mode=%s",
                store.id,
                mode,
            )
            return KhaltiVerifyResult(
                KHALTI_STATE_UNKNOWN_ERROR,
                None,
                None,
                "Malformed payment amount returned by Khalti.",
            )

        raw_txn = data.get("transaction_id")
        transaction_id = str(raw_txn).strip() if raw_txn else None
        return KhaltiVerifyResult(mapped_state, total_amount_paisa, transaction_id, None)

    except Exception as exc:
        logger.warning(
            "Khalti lookup error: error_class=%s store_id=%s mode=%s",
            type(exc).__name__,
            store.id,
            mode,
        )
        return KhaltiVerifyResult(
            KHALTI_STATE_UNKNOWN_ERROR,
            None,
            None,
            "Unable to reach Khalti payment gateway for verification.",
        )
