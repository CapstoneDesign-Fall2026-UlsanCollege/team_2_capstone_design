"""
Isolated Django settings for local load testing ONLY.

Imports the real project settings (so middleware, throttles, cache and REST
config are exactly what production uses) but force-replaces the database with a
local SQLite file. It refuses to run against anything else, so a load test can
never touch the production Neon database configured in backend/.env.
"""
import os

# Neutralise any DB URLs that backend/.env might load, before core.settings runs.
for _key in ("SHOPCRAFT_DATABASE_URL", "DATABASE_URL", "DATABASE_URL_DIRECT", "DIRECT_DATABASE_URL", "TEST_DATABASE_URL"):
    os.environ[_key] = ""
os.environ["DJANGO_DEBUG"] = "true"

from core.settings import *  # noqa: E402,F401,F403

_db_path = os.environ.get("LOADTEST_DB", "").strip()
if not _db_path:
    raise RuntimeError("Set LOADTEST_DB to a local SQLite file path for load testing.")

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": _db_path,
        "OPTIONS": {"timeout": 30},
    }
}

assert DATABASES["default"]["ENGINE"].endswith("sqlite3"), "Load tests must use local SQLite only."

ALLOWED_HOSTS = ["127.0.0.1", "localhost"]
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
