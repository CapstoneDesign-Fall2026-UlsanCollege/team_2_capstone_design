"""
Django settings for ShopCraft core project.
"""

from pathlib import Path
import os
import sys
import dj_database_url
from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv

from core.email_transport import validate_email_transport_settings

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from .env file (if present locally)
load_dotenv(BASE_DIR / ".env")

IS_TEST_COMMAND = "test" in sys.argv
IS_COLLECTSTATIC = "collectstatic" in sys.argv

# Security settings — DEBUG is OFF by default in production
DEBUG = (os.getenv("DJANGO_DEBUG") or os.getenv("DEBUG", "False")).strip().lower() in ("1", "true", "yes")

DEFAULT_DEV_SECRET_KEY = "django-insecure-default-dev-key"
DEFAULT_DEV_FERNET_KEY = "MDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDA="
EPHEMERAL_TEST_FERNET_KEY = "MTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTI="


def validate_production_security_settings(
    *,
    debug: bool,
    secret_key: str,
    field_encryption_key: str,
    allowed_hosts: list[str],
) -> None:
    """
    Fails startup closed when DEBUG is False and mandatory production secrets
    or host allowlists are missing or insecure.
    """
    if debug:
        return
    cleaned_secret = (secret_key or "").strip()
    if (
        not cleaned_secret
        or cleaned_secret == DEFAULT_DEV_SECRET_KEY
        or cleaned_secret.startswith("django-insecure")
        or len(cleaned_secret) < 32
    ):
        raise ImproperlyConfigured(
            "DJANGO_SECRET_KEY must be set to a strong (>=32 characters) secret in production when DEBUG=False."
        )

    cleaned_fernet = (field_encryption_key or "").strip()
    if not cleaned_fernet or cleaned_fernet == DEFAULT_DEV_FERNET_KEY:
        raise ImproperlyConfigured(
            "FIELD_ENCRYPTION_KEY must be set to a non-default Fernet key in production when DEBUG=False."
        )

    if not allowed_hosts:
        raise ImproperlyConfigured(
            "DJANGO_ALLOWED_HOSTS (or ALLOWED_HOSTS) must be configured in production when DEBUG=False."
        )


if IS_TEST_COMMAND or IS_COLLECTSTATIC:
    SECRET_KEY = os.getenv(
        "DJANGO_SECRET_KEY",
        "test-only-ephemeral-secret-key-not-for-prod-0123456789",
    )
    FIELD_ENCRYPTION_KEY = (
        os.getenv("FIELD_ENCRYPTION_KEY", "").strip()
        or os.getenv("FERNET_KEY", "").strip()
        or EPHEMERAL_TEST_FERNET_KEY
    )
else:
    SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", DEFAULT_DEV_SECRET_KEY if DEBUG else "")
    FIELD_ENCRYPTION_KEY = (
        os.getenv("FIELD_ENCRYPTION_KEY", "").strip()
        or os.getenv("FERNET_KEY", "").strip()
        or (DEFAULT_DEV_FERNET_KEY if DEBUG else "")
    )

allowed_hosts_env = (
    os.getenv("DJANGO_ALLOWED_HOSTS", "").strip()
    or os.getenv("ALLOWED_HOSTS", "").strip()
)
if allowed_hosts_env:
    ALLOWED_HOSTS = [h.strip() for h in allowed_hosts_env.split(",") if h.strip()]
elif DEBUG or IS_TEST_COMMAND or IS_COLLECTSTATIC:
    ALLOWED_HOSTS = ["localhost", "127.0.0.1", "testserver"]
else:
    ALLOWED_HOSTS = []

if not IS_TEST_COMMAND and not IS_COLLECTSTATIC:
    validate_production_security_settings(
        debug=DEBUG,
        secret_key=SECRET_KEY,
        field_encryption_key=FIELD_ENCRYPTION_KEY,
        allowed_hosts=ALLOWED_HOSTS,
    )

# Application definition
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "accounts",
    "stores",
    "catalog",
    "orders",
    "subscriptions",
]

AUTH_USER_MODEL = "accounts.User"

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "core.middleware.HashedClientIPMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "core.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "core.wsgi.application"

# Database Configuration & Safety Guard for Legacy Neon Host
LEGACY_NEON_HOST = os.getenv("LEGACY_NEON_HOST", "ep-dark-term-avy8vnke").strip()

test_db_url = os.getenv("TEST_DATABASE_URL", "").strip()
DB_CONN_MAX_AGE = max(0, int(os.getenv("DB_CONN_MAX_AGE", "60")))

TEST_RUNNER = "core.runner.PostgresRLSDiscoverRunner"

if IS_TEST_COMMAND:
    if test_db_url:
        DATABASES = {"default": dj_database_url.parse(test_db_url, conn_max_age=0)}
        DATABASES["default"]["DISABLE_SERVER_SIDE_CURSORS"] = True
    else:
        DATABASES = {"default": dj_database_url.parse("sqlite:///:memory:")}
else:
    shopcraft_db = os.getenv("SHOPCRAFT_DATABASE_URL", "").strip()
    runtime_db_url = os.getenv("DATABASE_URL", "").strip()
    direct_db_url = (
        os.getenv("DIRECT_DATABASE_URL", "").strip()
        or os.getenv("DATABASE_URL_DIRECT", "").strip()
    )
    is_migration = any(cmd in sys.argv for cmd in ["migrate", "makemigrations", "showmigrations"])

    # Release-phase schema migrations: use unpooled direct connection when DATABASE_URL_DIRECT is set
    if is_migration and direct_db_url:
        DATABASES = {"default": dj_database_url.parse(direct_db_url, conn_max_age=0)}
        DATABASES["default"]["DISABLE_SERVER_SIDE_CURSORS"] = True
    elif shopcraft_db or runtime_db_url:
        pooled_url = shopcraft_db or runtime_db_url
        DATABASES = {
            "default": dj_database_url.parse(
                pooled_url,
                conn_max_age=0 if is_migration else DB_CONN_MAX_AGE,
                conn_health_checks=True,
            )
        }
        DATABASES["default"]["DISABLE_SERVER_SIDE_CURSORS"] = True
    elif DEBUG or IS_COLLECTSTATIC:
        sqlite_path = "sqlite:///" + str(BASE_DIR / "shopcraft_dev.sqlite3")
        DATABASES = {"default": dj_database_url.parse(sqlite_path)}
    else:
        raise ImproperlyConfigured(
            "DATABASE_URL must be configured to Neon Postgres in production when DEBUG=False."
        )

db_str = str(DATABASES["default"])
db_host = str(DATABASES["default"].get("HOST", ""))
db_name = str(DATABASES["default"].get("NAME", ""))
if LEGACY_NEON_HOST and (
    LEGACY_NEON_HOST in db_str or LEGACY_NEON_HOST in db_host or LEGACY_NEON_HOST in db_name
):
    raise ImproperlyConfigured(f"Refusing to connect to legacy Neon host: {LEGACY_NEON_HOST}")

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# Internationalization
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# Static files & WhiteNoise compressed manifest storage
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": (
            "django.contrib.staticfiles.storage.StaticFilesStorage"
            if IS_TEST_COMMAND
            else "whitenoise.storage.CompressedManifestStaticFilesStorage"
        ),
    },
}

# Email Configuration (Resend API default | built-in SMTP)
EMAIL_TRANSPORT = os.getenv("EMAIL_TRANSPORT", "resend_api").strip().lower()
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "").strip()
RESEND_TIMEOUT = float(os.getenv("RESEND_TIMEOUT", "4.5"))
DEFAULT_FROM_EMAIL = os.getenv(
    "DEFAULT_FROM_EMAIL",
    "noreply@shopcraft.com.np" if DEBUG else "",
).strip()
EMAIL_SEND_ASYNC = os.getenv("EMAIL_SEND_ASYNC", "True").strip().lower() in ("1", "true", "yes")

EMAIL_HOST = os.getenv("EMAIL_HOST", "").strip()
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_USE_SSL = os.getenv("EMAIL_USE_SSL", "False").strip().lower() in ("1", "true", "yes")
EMAIL_USE_TLS = os.getenv(
    "EMAIL_USE_TLS",
    "False" if EMAIL_USE_SSL else "True",
).strip().lower() in ("1", "true", "yes")
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "").strip()
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "").strip()
EMAIL_TIMEOUT = int(os.getenv("EMAIL_TIMEOUT", "10"))

if EMAIL_TRANSPORT == "smtp" and (not DEBUG or EMAIL_HOST):
    EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
else:
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

if not IS_COLLECTSTATIC and not IS_TEST_COMMAND:
    validate_email_transport_settings(
        debug=DEBUG,
        email_transport=EMAIL_TRANSPORT,
        default_from_email=DEFAULT_FROM_EMAIL,
        resend_api_key=RESEND_API_KEY,
        resend_timeout=RESEND_TIMEOUT,
        email_host=EMAIL_HOST,
        email_port=EMAIL_PORT,
        email_use_ssl=EMAIL_USE_SSL,
        email_use_tls=EMAIL_USE_TLS,
        email_host_user=EMAIL_HOST_USER,
        email_host_password=EMAIL_HOST_PASSWORD,
        email_timeout=EMAIL_TIMEOUT,
    )

# Proxy, Client-IP Verification, Google Auth, Khalti, & Cloudinary
TRUSTED_PROXY_HEADER = (
    os.getenv("TRUSTED_PROXY_HEADER", "HTTP_X_FORWARDED_FOR" if not DEBUG else "").strip()
    or None
)
LOG_HASHED_CLIENT_IP = os.getenv("LOG_HASHED_CLIENT_IP", "False").strip().lower() in ("1", "true", "yes")

GOOGLE_CLIENT_ID = (
    os.getenv("GOOGLE_CLIENT_ID", "").strip()
    or os.getenv("GOOGLE_OAUTH_CLIENT_ID", "").strip()
)

# Khalti stays in SANDBOX by default; live mode requires explicit env opt-in
KHALTI_LIVE_ENABLED = os.getenv("KHALTI_LIVE_ENABLED", "False").strip().lower() in ("1", "true", "yes")
KHALTI_PLATFORM_SANDBOX_KEY = os.getenv("KHALTI_PLATFORM_SANDBOX_KEY", "").strip()

CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME", "").strip()
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY", "").strip()
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET", "").strip()
ALLOW_LOCAL_MEDIA_UPLOADS = DEBUG

# Cache Configuration
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "shopcraft-cache",
    }
}

# CORS & CSRF
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOW_CREDENTIALS = os.getenv("CORS_ALLOW_CREDENTIALS", "True").strip().lower() in (
    "1",
    "true",
    "yes",
)

default_cors = [
    "https://shopcraft.me",
    "https://shop.shopcraft.me",
    "https://api.shopcraft.me",
]
if DEBUG:
    default_cors.extend([
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ])

cors_origins_env = os.getenv("CORS_ALLOWED_ORIGINS", "").strip()
if cors_origins_env:
    env_cors = [o.strip() for o in cors_origins_env.split(",") if o.strip()]
    CORS_ALLOWED_ORIGINS = list(dict.fromkeys(default_cors + env_cors))
else:
    CORS_ALLOWED_ORIGINS = default_cors

CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://([a-zA-Z0-9-]+\.)*shopcraft\.me$",
    r"^https://([a-zA-Z0-9-]+\.)*vercel\.app$",
]

default_csrf = [
    "https://shopcraft.me",
    "https://*.shopcraft.me",
    "https://shop.shopcraft.me",
    "https://api.shopcraft.me",
    "https://*.vercel.app",
]
if DEBUG:
    default_csrf.extend([
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ])

csrf_origins_env = os.getenv("CSRF_TRUSTED_ORIGINS", "").strip()
if csrf_origins_env:
    env_csrf = [o.strip() for o in csrf_origins_env.split(",") if o.strip()]
    CSRF_TRUSTED_ORIGINS = list(dict.fromkeys(default_csrf + env_csrf))
else:
    CSRF_TRUSTED_ORIGINS = default_csrf

# HTTPS, Proxy SSL, HSTS (short 1-day max-age initially, no subdomains, no preload), & Security Headers
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = os.getenv("SECURE_SSL_REDIRECT", str(not DEBUG)).strip().lower() in (
    "1",
    "true",
    "yes",
)
SECURE_REDIRECT_EXEMPT = [r"^api/health/?$"]

if not DEBUG:
    SECURE_HSTS_SECONDS = int(os.getenv("SECURE_HSTS_SECONDS", "86400"))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = os.getenv(
        "SECURE_HSTS_INCLUDE_SUBDOMAINS", "False"
    ).strip().lower() in ("1", "true", "yes")
    SECURE_HSTS_PRELOAD = os.getenv("SECURE_HSTS_PRELOAD", "False").strip().lower() in (
        "1",
        "true",
        "yes",
    )
else:
    SECURE_HSTS_SECONDS = 0
    SECURE_HSTS_INCLUDE_SUBDOMAINS = False
    SECURE_HSTS_PRELOAD = False

SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
X_FRAME_OPTIONS = "DENY"

# Session and CSRF Cookies (SameSite=Lax across shop.<domain> and api.<domain>)
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = os.getenv("SESSION_COOKIE_SAMESITE", "Lax").strip() or "Lax"
SESSION_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_DOMAIN = os.getenv("SESSION_COOKIE_DOMAIN", "").strip() or None

# Explicit CSRF_COOKIE_HTTPONLY=False so shop.<domain> can read csrftoken and send X-CSRFToken
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = os.getenv("CSRF_COOKIE_SAMESITE", "Lax").strip() or "Lax"
CSRF_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_DOMAIN = os.getenv("CSRF_COOKIE_DOMAIN", "").strip() or None

# Django REST Framework
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
    ] if not DEBUG else [
        "rest_framework.authentication.SessionAuthentication",
        "rest_framework.authentication.BasicAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticatedOrReadOnly",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "otp_request": "5/min",
        "otp_verify": "10/min",
        "auth_google": "15/min",
        "anon": "60/min",
        "user": "120/min",
    },
}

# Structured PII-free production logging to stdout (Heroku logplex friendly)
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "structured": {
            "format": "%(asctime)s level=%(levelname)s logger=%(name)s msg=%(message)s",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "structured",
        },
        "null": {
            "class": "logging.NullHandler",
        },
    },
    "loggers": {
        "django.security.DisallowedHost": {
            "handlers": ["null"],
            "propagate": False,
        },
        "django.request": {
            "handlers": ["console"],
            "level": "WARNING",
            "propagate": False,
        },
        "shopcraft": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
    },
    "root": {
        "handlers": ["console"],
        "level": os.getenv("DJANGO_LOG_LEVEL", "INFO").upper(),
    },
}
