from django.contrib import admin
from django.db import connection
from django.http import JsonResponse
from django.urls import include, path


def health_view(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        db_status = "ok"
    except Exception as e:
        return JsonResponse(
            {
                "status": "error",
                "service": "shopcraft-api",
                "database": "unavailable",
                "detail": str(e),
            },
            status=503,
        )
    return JsonResponse({"status": "ok", "service": "shopcraft-api", "database": db_status})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health_view, name="health_check"),
    path("api/auth/", include("accounts.api")),
    path("api/", include("stores.api")),
]
