from django.contrib import admin
from django.db import connection
from django.http import Http404, JsonResponse
from django.urls import path, include
from stores.models import Store


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


def store_public_detail_view(request, store_slug: str):
    store = Store.objects.filter(slug=store_slug, is_active=True).first()
    if not store:
        raise Http404("Store not found or inactive")
    return JsonResponse({
        "slug": store.slug,
        "name": store.name,
        "tagline": store.tagline,
        "currency": store.currency,
        "theme_preset": store.theme_preset,
        "logo_url": store.logo_url,
        "accent_color": store.accent_color,
        "contact_phone": store.contact_phone,
        "inside_valley_shipping_minor": store.inside_valley_shipping_minor,
        "outside_valley_shipping_minor": store.outside_valley_shipping_minor,
        "free_shipping_threshold_minor": store.free_shipping_threshold_minor,
    })


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health_view, name="health_check"),
    path("api/auth/", include("accounts.api")),
    path("api/stores/<slug:store_slug>/", store_public_detail_view, name="store_public_detail"),
]
