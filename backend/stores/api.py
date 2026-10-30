from django.http import Http404
from django.urls import path
from rest_framework import permissions, serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from catalog.models import Product, SellingPlan, Variant
from orders.models import Order, OrderItem
from stores.models import Customer, Store, StoreMembership, provision_store_customer
from subscriptions.models import Subscription


# -----------------------------------------------------------------------------
# Mixins
# -----------------------------------------------------------------------------

class StorePublicMixin:
    """Resolves active store from URL slug or raises HTTP 404."""
    store = None

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        store_slug = self.kwargs.get("store_slug")
        self.store = Store.objects.filter(slug=store_slug, is_active=True).first()
        if not self.store:
            raise Http404("Store not found or inactive.")


class StoreMerchantMixin:
    """
    Requires authentication and verifies the user is a member of the store.
    Raises HTTP 404 if the store does not exist or user is not a member (D-03).
    """
    store = None
    permission_classes = [permissions.IsAuthenticated]

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        store_slug = self.kwargs.get("store_slug")
        store = Store.objects.filter(slug=store_slug).first()
        if not store:
            raise Http404("Store not found.")

        # Check membership
        is_member = StoreMembership.objects.for_store(store).filter(user=request.user).exists()
        if not is_member:
            raise Http404("Store not found.")

        self.store = store


class StoreScopedSerializerMixin(serializers.ModelSerializer):
    """Prevents tenant reassignment by ignoring incoming store fields."""
    def to_internal_value(self, data):
        clean_data = data.copy() if hasattr(data, "copy") else dict(data)
        clean_data.pop("store", None)
        clean_data.pop("store_id", None)
        return super().to_internal_value(clean_data)


# -----------------------------------------------------------------------------
# Serializers
# -----------------------------------------------------------------------------

class StorePublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Store
        fields = [
            "slug",
            "name",
            "tagline",
            "currency",
            "theme_preset",
            "logo_url",
            "accent_color",
            "contact_phone",
            "inside_valley_shipping_minor",
            "outside_valley_shipping_minor",
            "free_shipping_threshold_minor",
        ]


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ["id", "email", "full_name", "phone", "created_at"]
        read_only_fields = ["id", "created_at"]


class VariantSerializer(StoreScopedSerializerMixin):
    class Meta:
        model = Variant
        fields = [
            "id",
            "sku",
            "label",
            "weight_grams",
            "price_minor",
            "allow_one_time",
            "allow_subscription",
            "in_stock",
            "is_active",
            "sort_order",
        ]
        read_only_fields = ["id"]


class ProductSerializer(StoreScopedSerializerMixin):
    variants = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "slug",
            "name",
            "description",
            "image_url",
            "attributes",
            "allow_one_time",
            "allow_subscription",
            "is_active",
            "sort_order",
            "variants",
        ]
        read_only_fields = ["id"]

    def get_variants(self, obj):
        active_variants = obj.variants.filter(is_active=True).order_by("sort_order", "price_minor")
        return VariantSerializer(active_variants, many=True).data


class SellingPlanSerializer(StoreScopedSerializerMixin):
    class Meta:
        model = SellingPlan
        fields = [
            "id",
            "code",
            "name",
            "interval_unit",
            "interval_count",
            "commitment_cycles",
            "discount_pct",
            "is_prepaid",
            "is_active",
            "sort_order",
        ]
        read_only_fields = ["id"]


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product_name_snapshot",
            "variant_label_snapshot",
            "unit_price_minor",
            "quantity",
            "line_total_minor",
        ]
        read_only_fields = ["id"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "order_type",
            "status",
            "payment_method",
            "payment_status",
            "payment_ref",
            "subtotal_minor",
            "shipping_minor",
            "discount_minor",
            "total_minor",
            "currency",
            "shipping_address_snapshot",
            "created_at",
            "items",
        ]
        read_only_fields = ["id", "created_at"]


class SubscriptionSerializer(serializers.ModelSerializer):
    variant_label = serializers.CharField(source="variant.label", read_only=True)
    product_name = serializers.CharField(source="variant.product.name", read_only=True)
    plan_name = serializers.CharField(source="selling_plan.name", read_only=True)

    class Meta:
        model = Subscription
        fields = [
            "id",
            "status",
            "unit_price_minor",
            "next_delivery_date",
            "cycles_total",
            "cycles_remaining",
            "shipping_address_snapshot",
            "variant_label",
            "product_name",
            "plan_name",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


# -----------------------------------------------------------------------------
# Public Store Views
# -----------------------------------------------------------------------------

class StoreDetailView(StorePublicMixin, APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, store_slug):
        return Response(StorePublicSerializer(self.store).data)


class StoreCatalogView(StorePublicMixin, APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, store_slug):
        products = (
            Product.objects.for_store(self.store)
            .filter(is_active=True)
            .order_by("sort_order", "id")
        )
        selling_plans = (
            SellingPlan.objects.for_store(self.store)
            .filter(is_active=True)
            .order_by("sort_order", "id")
        )
        return Response({
            "products": ProductSerializer(products, many=True).data,
            "selling_plans": SellingPlanSerializer(selling_plans, many=True).data,
        })


class CustomerBootstrapView(StorePublicMixin, APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, store_slug):
        customer = provision_store_customer(self.store, request.user)
        return Response(CustomerSerializer(customer).data, status=status.HTTP_200_OK)


class ShopperOrderListView(StorePublicMixin, APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, store_slug):
        orders = (
            Order.objects.for_store(self.store)
            .filter(customer__user=request.user)
            .order_by("-created_at")
        )
        return Response(OrderSerializer(orders, many=True).data)


class ShopperOrderDetailView(StorePublicMixin, APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, store_slug, order_id):
        order = (
            Order.objects.for_store(self.store)
            .filter(customer__user=request.user, id=order_id)
            .first()
        )
        if not order:
            raise Http404("Order not found.")
        return Response(OrderSerializer(order).data)


# -----------------------------------------------------------------------------
# Merchant Console Views
# -----------------------------------------------------------------------------

class MerchantStoreOverviewView(StoreMerchantMixin, APIView):
    def get(self, request, store_slug):
        products_count = Product.objects.for_store(self.store).count()
        orders_count = Order.objects.for_store(self.store).count()
        customers_count = Customer.objects.for_store(self.store).count()
        return Response({
            "store": StorePublicSerializer(self.store).data,
            "products_count": products_count,
            "orders_count": orders_count,
            "customers_count": customers_count,
        })


class MerchantProductListCreateView(StoreMerchantMixin, APIView):
    def get(self, request, store_slug):
        products = Product.objects.for_store(self.store).order_by("sort_order", "-id")
        return Response(ProductSerializer(products, many=True).data)

    def post(self, request, store_slug):
        serializer = ProductSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product = serializer.save(store=self.store)
        return Response(ProductSerializer(product).data, status=status.HTTP_201_CREATED)


class MerchantOrderListView(StoreMerchantMixin, APIView):
    def get(self, request, store_slug):
        orders = Order.objects.for_store(self.store).order_by("-created_at")
        return Response(OrderSerializer(orders, many=True).data)


class MerchantCustomerListView(StoreMerchantMixin, APIView):
    def get(self, request, store_slug):
        customers = Customer.objects.for_store(self.store).order_by("-created_at")
        return Response(CustomerSerializer(customers, many=True).data)


class MerchantSubscriptionListView(StoreMerchantMixin, APIView):
    def get(self, request, store_slug):
        subs = Subscription.objects.for_store(self.store).order_by("-created_at")
        return Response(SubscriptionSerializer(subs, many=True).data)


class ShopperSubscriptionListView(StorePublicMixin, APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, store_slug):
        subs = (
            Subscription.objects.for_store(self.store)
            .filter(customer__user=request.user)
            .order_by("-created_at")
        )
        return Response(SubscriptionSerializer(subs, many=True).data)


# -----------------------------------------------------------------------------
# URL Patterns
# -----------------------------------------------------------------------------

urlpatterns = [
    # Public Storefront
    path("stores/<slug:store_slug>/", StoreDetailView.as_view(), name="store_public_detail"),
    path("stores/<slug:store_slug>/catalog/", StoreCatalogView.as_view(), name="store_public_catalog"),
    path("stores/<slug:store_slug>/customer/bootstrap/", CustomerBootstrapView.as_view(), name="store_customer_bootstrap"),
    path("stores/<slug:store_slug>/orders/", ShopperOrderListView.as_view(), name="shopper_order_list"),
    path("stores/<slug:store_slug>/orders/<int:order_id>/", ShopperOrderDetailView.as_view(), name="shopper_order_detail"),
    path("stores/<slug:store_slug>/subscriptions/", ShopperSubscriptionListView.as_view(), name="shopper_subscription_list"),

    # Merchant Console
    path("merchant/stores/<slug:store_slug>/overview/", MerchantStoreOverviewView.as_view(), name="merchant_store_overview"),
    path("merchant/stores/<slug:store_slug>/products/", MerchantProductListCreateView.as_view(), name="merchant_product_list_create"),
    path("merchant/stores/<slug:store_slug>/orders/", MerchantOrderListView.as_view(), name="merchant_order_list"),
    path("merchant/stores/<slug:store_slug>/customers/", MerchantCustomerListView.as_view(), name="merchant_customer_list"),
    path("merchant/stores/<slug:store_slug>/subscriptions/", MerchantSubscriptionListView.as_view(), name="merchant_subscription_list"),
]
