from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
from email.utils import formataddr, parseaddr
import html
import logging
import os
import threading
import requests
from requests.adapters import HTTPAdapter

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured, ValidationError
from django.core.mail import EmailMultiAlternatives, get_connection
from django.core.validators import validate_email
from django.db import transaction

logger = logging.getLogger(__name__)

RESEND_API_URL = "https://api.resend.com/emails"
MAX_RESEND_TIMEOUT_SECONDS = 5.0
MAX_SMTP_TIMEOUT_SECONDS = 10
SUPPORTED_EMAIL_TRANSPORTS = ("resend_api", "smtp")

_init_lock = threading.Lock()
_http_session: requests.Session | None = None
_http_session_pid: int | None = None
_email_executor: ThreadPoolExecutor | None = None
_email_executor_pid: int | None = None


class EmailTransportError(RuntimeError):
    """Raised on email provider failure without embedding PII or secrets."""


def get_shared_http_session() -> requests.Session:
    """
    Returns a lazily initialized, post-fork-safe shared requests.Session
    with connection pooling and zero request-path retries.
    """
    global _http_session, _http_session_pid
    pid = os.getpid()
    if _http_session is None or _http_session_pid != pid:
        with _init_lock:
            if _http_session is None or _http_session_pid != pid:
                session = requests.Session()
                adapter = HTTPAdapter(max_retries=0, pool_connections=4, pool_maxsize=8)
                session.mount("https://", adapter)
                session.mount("http://", adapter)
                _http_session = session
                _http_session_pid = pid
    return _http_session


def get_email_executor() -> ThreadPoolExecutor:
    """
    Returns a lazily initialized, post-fork-safe ThreadPoolExecutor(max_workers=2)
    for non-blocking transactional email sends after DB commit.
    """
    global _email_executor, _email_executor_pid
    pid = os.getpid()
    if _email_executor is None or _email_executor_pid != pid:
        with _init_lock:
            if _email_executor is None or _email_executor_pid != pid:
                _email_executor = ThreadPoolExecutor(
                    max_workers=2,
                    thread_name_prefix="shopcraft-email",
                )
                _email_executor_pid = pid
    return _email_executor


def extract_bare_email(raw_from_email: str) -> str:
    _, addr = parseaddr((raw_from_email or "").strip())
    return (addr or raw_from_email or "").strip()


def format_sender_header(sender_name: str, default_from_email: str) -> str:
    bare_addr = extract_bare_email(default_from_email)
    clean_name = (sender_name or "").strip()
    if clean_name:
        return formataddr((clean_name, bare_addr))
    return bare_addr


def validate_email_transport_settings(
    *,
    debug: bool,
    email_transport: str,
    default_from_email: str,
    resend_api_key: str,
    resend_timeout: float,
    email_host: str,
    email_port: int,
    email_use_ssl: bool,
    email_use_tls: bool,
    email_host_user: str,
    email_host_password: str,
    email_timeout: int,
) -> None:
    if email_transport not in SUPPORTED_EMAIL_TRANSPORTS:
        raise ImproperlyConfigured(
            f"EMAIL_TRANSPORT must be one of {SUPPORTED_EMAIL_TRANSPORTS}; got {email_transport!r}."
        )

    if resend_timeout <= 0 or resend_timeout > MAX_RESEND_TIMEOUT_SECONDS:
        raise ImproperlyConfigured(
            f"RESEND_TIMEOUT must be > 0 and <= {MAX_RESEND_TIMEOUT_SECONDS}s."
        )

    if email_timeout <= 0 or email_timeout > MAX_SMTP_TIMEOUT_SECONDS:
        raise ImproperlyConfigured(
            f"EMAIL_TIMEOUT must be > 0 and <= {MAX_SMTP_TIMEOUT_SECONDS}s."
        )

    if email_use_ssl and email_use_tls:
        raise ImproperlyConfigured("EMAIL_USE_SSL and EMAIL_USE_TLS are mutually exclusive.")

    if debug:
        return

    bare_from = extract_bare_email(default_from_email)
    if not bare_from:
        raise ImproperlyConfigured("DEFAULT_FROM_EMAIL must be set in production when DEBUG=False.")
    try:
        validate_email(bare_from)
    except ValidationError as exc:
        raise ImproperlyConfigured("DEFAULT_FROM_EMAIL must be a valid email address in production.") from exc

    if email_transport == "resend_api":
        if not (resend_api_key or "").strip():
            raise ImproperlyConfigured(
                "RESEND_API_KEY must be set in production when EMAIL_TRANSPORT='resend_api'."
            )
    elif email_transport == "smtp":
        if not (email_host or "").strip():
            raise ImproperlyConfigured(
                "EMAIL_HOST must be set in production when EMAIL_TRANSPORT='smtp'."
            )
        if not (1 <= int(email_port) <= 65535):
            raise ImproperlyConfigured(
                "EMAIL_PORT must be a valid TCP port when EMAIL_TRANSPORT='smtp'."
            )
        if not (email_host_user or "").strip() or not (email_host_password or "").strip():
            raise ImproperlyConfigured(
                "EMAIL_HOST_USER and EMAIL_HOST_PASSWORD must be set in production when EMAIL_TRANSPORT='smtp'."
            )


def build_otp_email_bodies(*, brand_name: str, raw_code: str) -> tuple[str, str, str]:
    clean_brand = (brand_name or "Store").strip()
    escaped_brand = html.escape(clean_brand)
    escaped_code = html.escape(raw_code)

    subject = f"Your {clean_brand} sign-in code"
    text_body = (
        f"Your {clean_brand} sign-in code is:\n\n"
        f"{raw_code}\n\n"
        "This code expires in 10 minutes.\n"
        "If you did not request this code, you can ignore this email.\n"
    )
    html_body = (
        "<!DOCTYPE html>"
        '<html lang="en"><body style="margin:0;padding:24px;background:#ffffff;'
        'color:#111318;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">'
        '<div style="max-width:440px;margin:0 auto;">'
        f'<p style="margin:0 0 12px;font-size:15px;line-height:1.5;">Your <strong>{escaped_brand}</strong> sign-in code is:</p>'
        '<div style="margin:16px 0;padding:14px 18px;border:1px solid #e5e7eb;border-radius:8px;'
        'background:#f9fafb;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;'
        'font-size:28px;font-weight:700;letter-spacing:6px;text-align:center;">'
        f"{escaped_code}</div>"
        '<p style="margin:12px 0 0;font-size:13px;color:#4b5563;line-height:1.5;">'
        "This code expires in 10 minutes. If you did not request this code, you can ignore this email."
        "</p></div></body></html>"
    )
    return subject, text_body, html_body


def send_transactional_email(
    *,
    to_email: str,
    subject: str,
    text_body: str,
    html_body: str,
    sender_name: str,
    reply_to_email: str | None = None,
    force_real_smtp: bool = False,
) -> None:
    transport = getattr(settings, "EMAIL_TRANSPORT", "resend_api")
    from_header = format_sender_header(sender_name, getattr(settings, "DEFAULT_FROM_EMAIL", ""))
    clean_reply = (reply_to_email or "").strip()
    reply_to_list = [clean_reply] if clean_reply else None

    if transport == "resend_api":
        api_key = getattr(settings, "RESEND_API_KEY", "").strip()
        if not api_key:
            raise EmailTransportError("Missing Resend API key.")
        raw_timeout = float(getattr(settings, "RESEND_TIMEOUT", MAX_RESEND_TIMEOUT_SECONDS))
        timeout = min(max(raw_timeout, 0.5), MAX_RESEND_TIMEOUT_SECONDS)

        payload: dict[str, object] = {
            "from": from_header,
            "to": [to_email],
            "subject": subject,
            "text": text_body,
            "html": html_body,
        }
        if reply_to_list:
            payload["reply_to"] = reply_to_list

        response = get_shared_http_session().post(
            RESEND_API_URL,
            json=payload,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            timeout=timeout,
        )
        if response.status_code < 200 or response.status_code >= 300:
            raise EmailTransportError(f"Resend HTTP {response.status_code}")
        return

    if transport == "smtp":
        raw_timeout = int(getattr(settings, "EMAIL_TIMEOUT", MAX_SMTP_TIMEOUT_SECONDS) or MAX_SMTP_TIMEOUT_SECONDS)
        timeout = min(max(raw_timeout, 1), MAX_SMTP_TIMEOUT_SECONDS)
        backend_path = (
            "django.core.mail.backends.smtp.EmailBackend"
            if force_real_smtp
            else getattr(settings, "EMAIL_BACKEND", "django.core.mail.backends.smtp.EmailBackend")
        )
        conn_kwargs: dict[str, object] = {"fail_silently": False}
        if backend_path == "django.core.mail.backends.smtp.EmailBackend":
            conn_kwargs["timeout"] = timeout

        connection = get_connection(backend=backend_path, **conn_kwargs)
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_body,
            from_email=from_header,
            to=[to_email],
            reply_to=reply_to_list,
            connection=connection,
        )
        msg.attach_alternative(html_body, "text/html")
        msg.send(fail_silently=False)
        return

    raise EmailTransportError("Unsupported EMAIL_TRANSPORT.")


def _deliver_otp_email_safe(
    *,
    to_email: str,
    subject: str,
    text_body: str,
    html_body: str,
    sender_name: str,
    reply_to_email: str | None,
    store_id: int | None,
) -> None:
    try:
        send_transactional_email(
            to_email=to_email,
            subject=subject,
            text_body=text_body,
            html_body=html_body,
            sender_name=sender_name,
            reply_to_email=reply_to_email,
        )
    except Exception as exc:
        # Strict PII/secret masking: log only exception class and numeric store_id (never email or OTP)
        logger.error(
            "OTP email send failed: error_class=%s store_id=%s",
            exc.__class__.__name__,
            store_id if store_id is not None else "platform",
        )


def schedule_otp_email(
    *,
    to_email: str,
    raw_code: str,
    brand_name: str,
    reply_to_email: str | None = None,
    store_id: int | None = None,
) -> None:
    """
    Schedules an OTP email via transaction.on_commit so the OTP database record
    is guaranteed committed before provider dispatch. Runs on a bounded
    ThreadPoolExecutor(max_workers=2) when settings.EMAIL_SEND_ASYNC is True,
    or synchronously inside on_commit when EMAIL_SEND_ASYNC is False.
    """
    subject, text_body, html_body = build_otp_email_bodies(
        brand_name=brand_name,
        raw_code=raw_code,
    )

    def _on_commit() -> None:
        if getattr(settings, "EMAIL_SEND_ASYNC", True):
            get_email_executor().submit(
                _deliver_otp_email_safe,
                to_email=to_email,
                subject=subject,
                text_body=text_body,
                html_body=html_body,
                sender_name=brand_name,
                reply_to_email=reply_to_email,
                store_id=store_id,
            )
        else:
            _deliver_otp_email_safe(
                to_email=to_email,
                subject=subject,
                text_body=text_body,
                html_body=html_body,
                sender_name=brand_name,
                reply_to_email=reply_to_email,
                store_id=store_id,
            )

    transaction.on_commit(_on_commit)
