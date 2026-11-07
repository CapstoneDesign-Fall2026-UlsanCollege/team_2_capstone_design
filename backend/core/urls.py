from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def health_view(request):
    """
    Lightweight, DB-free health check for uptime monitors and Heroku router checks.
    Does not touch Neon Postgres so sleeping computes can scale to zero cleanly.
    """
    response = JsonResponse({"status": "ok", "service": "shopcraft-api"})
    response["Cache-Control"] = "no-store"
    return response


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health_view, name="health_check"),
    path("api/auth/", include("accounts.api")),
    path("api/", include("stores.api")),
]
