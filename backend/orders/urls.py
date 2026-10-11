from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrderViewSet, api_register, api_login

router = DefaultRouter()
router.register(r'orders', OrderViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/auth/register/', api_register, name='api_register'),
    path('api/auth/login/', api_login, name='api_login'),
]
