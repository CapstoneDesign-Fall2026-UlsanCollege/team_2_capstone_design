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

# Load environment variables from .env file
load_dotenv(BASE_DIR / ".env")

# Security settings
DEBUG = os.getenv("DJANGO_DEBUG", "True").lower() in ("1", "true", "yes")

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "django-insecure-default-dev-key")

DEFAULT_DEV_FERNET_KEY = "MDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDA="
FIELD_ENCRYPTION_KEY = os.getenv("FIELD_ENCRYPTION_KEY", DEFAULT_DEV_FERNET_KEY)

if not DEBUG:
    if not SECRET_KEY or SECRET_KEY == "django-insecure-default-dev-key":
        raise ImproperlyConfigured("DJANGO_SECRET_KEY must be set in production when DEBUG=False.")
    if not os.getenv("FIELD_ENCRYPTION_KEY"):
        raise ImproperlyConfigured("FIELD_ENCRYPTION_KEY must be set in production when DEBUG=False.")

allowed_hosts_env = os.getenv("DJANGO_ALLOWED_HOSTS", "")
if allowed_hosts_env:
    ALLOWED_HOSTS = [h.strip() for h in allowed_hosts_env.split(",") if h.strip()]
else:
    ALLOWED_HOSTS = ["localhost", "127.0.0.1", "testserver"]

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

TEST_RUNNER = "core.runner.PostgresRLSDiscoverRunner"

if "test" in sys.argv:
    if test_db_url:
        DATABASES = {"default": dj_database_url.parse(test_db_url, conn_max_age=0)}
        DATABASES["default"]["DISABLE_SERVER_SIDE_CURSORS"] = True
    else:
        DATABASES = {"default": dj_database_url.parse("sqlite:///:memory:")}
else:
    shopcraft_db = os.getenv("SHOPCRAFT_DATABASE_URL", "").strip()
    allow_db_url = os.getenv("SHOPCRAFT_ALLOW_DATABASE_URL", "").strip() == "1"
    direct_db_url = os.getenv("DATABASE_URL_DIRECT", "").strip()
    is_migration = any(cmd in sys.argv for cmd in ["migrate", "makemigrations", "showmigrations"])

    # Release-phase schema migrations: use unpooled direct connection when DATABASE_URL_DIRECT is set
    if is_migration and direct_db_url:
        DATABASES = {"default": dj_database_url.parse(direct_db_url, conn_max_age=0)}
    elif shopcraft_db:
        DATABASES = {"default": dj_database_url.parse(shopcraft_db, conn_max_age=600, conn_health_checks=True)}
        DATABASES["default"]["DISABLE_SERVER_SIDE_CURSORS"] = True
    elif allow_db_url and os.getenv("DATABASE_URL"):
        DATABASES = {"default": dj_database_url.parse(os.environ["DATABASE_URL"], conn_max_age=600, conn_health_checks=True)}
        DATABASES["default"]["DISABLE_SERVER_SIDE_CURSORS"] = True
    else:
        sqlite_path = "sqlite:///" + str(BASE_DIR / "shopcraft_dev.sqlite3")
        DATABASES = {
            "default": dj_database_url.parse(sqlite_path)
        }

db_str = str(DATABASES["default"])
db_host = str(DATABASES["default"].get("HOST", ""))
db_name = str(DATABASES["default"].get("NAME", ""))
if LEGACY_NEON_HOST and (
    LEGACY_NEON_HOST in db_str or LEGACY_NEON_HOST in db_host or LEGACY_NEON_HOST in db_name
):
    raise ImproperlyConfigured(f"Refusing to connect to legacy Neon host: {LEGACY_NEON_HOST}")

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

# Internationalization
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

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

if "collectstatic" not in sys.argv and "test" not in sys.argv:
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

TRUSTED_PROXY_HEADER = (
    os.getenv("TRUSTED_PROXY_HEADER", "HTTP_X_FORWARDED_FOR" if not DEBUG else "").strip()
    or None
)

# Google Identity Services OAuth Client ID (shared web client ID for merchant & storefront)
GOOGLE_CLIENT_ID = (
    os.getenv("GOOGLE_CLIENT_ID", "").strip()
    or os.getenv("GOOGLE_OAUTH_CLIENT_ID", "").strip()
)

# Cache Configuration
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "shopcraft-cache",
    }
}

# CORS & CSRF
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOW_CREDENTIALS = True

cors_origins_env = os.getenv("CORS_ALLOWED_ORIGINS", "")
if cors_origins_env:
    CORS_ALLOWED_ORIGINS = [o.strip() for o in cors_origins_env.split(",") if o.strip()]
else:
    CORS_ALLOWED_ORIGINS = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

csrf_origins_env = os.getenv("CSRF_TRUSTED_ORIGINS", "")
if csrf_origins_env:
    CSRF_TRUSTED_ORIGINS = [o.strip() for o in csrf_origins_env.split(",") if o.strip()]
else:
    CSRF_TRUSTED_ORIGINS = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

# Session and CSRF Cookies (ASVS V3.4 / D-07)
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_SECURE = not DEBUG

CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SECURE = not DEBUG

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
