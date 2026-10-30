from django.db import transaction
from django.db.models import Sum
from django.http import Http404
from django.urls import path
from rest_framework import permissions, serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from catalog.models import Product, SellingPlan, Variant
from orders.models import Order, OrderItem
from stores.models import (
    Customer,
    Store,
    StoreMembership,
    RESERVED_STORE_SLUGS,
    SLUG_REGEX,
    provision_store_customer,
)
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
        orders_qs = Order.objects.for_store(self.store)
        orders_count = orders_qs.count()
        revenue_agg = orders_qs.filter(payment_status__in=["PAID", "CONFIRMED"]).aggregate(
            total_rev=Sum("total_minor")
        )
        revenue_minor = revenue_agg["total_rev"] or 0
        products_count = Product.objects.for_store(self.store).filter(is_active=True).count()
        customers_count = Customer.objects.for_store(self.store).count()

        checklist = {
            "has_products": products_count > 0,
            "has_shipping": bool(self.store.inside_valley_shipping_minor > 0),
            "has_khalti": bool(self.store.khalti_secret_key_encrypted),
        }

        return Response({
            "store": StorePublicSerializer(self.store).data,
            "products_count": products_count,
            "orders_count": orders_count,
            "revenue_minor": revenue_minor,
            "customers_count": customers_count,
            "checklist": checklist,
        })


class MerchantStoreSettingsView(StoreMerchantMixin, APIView):
    def get(self, request, store_slug):
        data = StorePublicSerializer(self.store).data
        has_custom_key = bool(self.store.khalti_secret_key_encrypted)
        masked_key = ""
        if has_custom_key:
            try:
                raw_key = self.store.get_khalti_secret_key()
                if len(raw_key) > 4:
                    masked_key = "••••••••••••" + raw_key[-4:]
                else:
                    masked_key = "••••••••••••"
            except Exception:
                masked_key = "••••••••••••"

        data["has_custom_khalti_key"] = has_custom_key
        data["khalti_mode"] = self.store.khalti_mode
        data["khalti_key_masked"] = masked_key
        return Response(data)

    def patch(self, request, store_slug):
        store = self.store
        data = request.data

        if "name" in data and str(data["name"]).strip():
            store.name = str(data["name"]).strip()
        if "tagline" in data:
            store.tagline = str(data["tagline"]).strip()
        if "contact_phone" in data:
            store.contact_phone = str(data["contact_phone"]).strip()
        if "theme_preset" in data:
            preset = str(data["theme_preset"]).strip()
            if preset in [c[0] for c in Store.THEME_PRESET_CHOICES]:
                store.theme_preset = preset
        if "accent_color" in data:
            store.accent_color = str(data["accent_color"]).strip()
        if "logo_url" in data:
            store.logo_url = str(data["logo_url"]).strip()

        if "inside_valley_shipping_minor" in data:
            try:
                val = int(data["inside_valley_shipping_minor"])
                if val >= 0:
                    store.inside_valley_shipping_minor = val
            except (ValueError, TypeError):
                pass

        if "outside_valley_shipping_minor" in data:
            try:
                val = int(data["outside_valley_shipping_minor"])
                if val >= 0:
                    store.outside_valley_shipping_minor = val
            except (ValueError, TypeError):
                pass

        if "free_shipping_threshold_minor" in data:
            raw_threshold = data["free_shipping_threshold_minor"]
            if raw_threshold is None or raw_threshold == "":
                store.free_shipping_threshold_minor = None
            else:
                try:
                    val = int(raw_threshold)
                    store.free_shipping_threshold_minor = val if val >= 0 else None
                except (ValueError, TypeError):
                    pass

        if "khalti_mode" in data:
            mode = str(data["khalti_mode"]).strip().upper()
            if mode in ["TEST", "LIVE"]:
                store.khalti_mode = mode

        if "khalti_secret_key" in data:
            raw_key = str(data["khalti_secret_key"]).strip()
            store.set_khalti_secret_key(raw_key)

        store.save()
        return self.get(request, store_slug)


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


class StoreSlugCheckView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        raw_slug = request.query_params.get("slug", "").strip().lower()
        if not raw_slug:
            return Response({"available": False, "reason": "Slug cannot be empty."})
        if raw_slug in RESERVED_STORE_SLUGS or not SLUG_REGEX.match(raw_slug):
            return Response({"available": False, "reason": "Invalid or reserved slug."})
        exists = Store.objects.filter(slug=raw_slug).exists()
        return Response({"available": not exists, "slug": raw_slug})


class StoreCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        name = request.data.get("name", "").strip()
        slug = request.data.get("slug", "").strip().lower()
        theme_preset = request.data.get("theme_preset", "editorial-warm")
        tagline = request.data.get("tagline", "").strip()
        contact_phone = request.data.get("contact_phone", "").strip()

        if not name:
            return Response({"name": ["Store name is required."]}, status=status.HTTP_400_BAD_REQUEST)
        if not slug:
            return Response({"slug": ["Store slug is required."]}, status=status.HTTP_400_BAD_REQUEST)
        if slug in RESERVED_STORE_SLUGS or not SLUG_REGEX.match(slug):
            return Response({"slug": ["Invalid or reserved store slug."]}, status=status.HTTP_400_BAD_REQUEST)
        if Store.objects.filter(slug=slug).exists():
            return Response({"slug": ["This URL slug is already taken."]}, status=status.HTTP_400_BAD_REQUEST)

        valid_presets = [c[0] for c in Store.THEME_PRESET_CHOICES]
        if theme_preset not in valid_presets:
            theme_preset = "editorial-warm"

        with transaction.atomic():
            store = Store.objects.create(
                name=name,
                slug=slug,
                theme_preset=theme_preset,
                tagline=tagline,
                contact_phone=contact_phone,
            )
            StoreMembership.objects.create(
                store=store,
                user=request.user,
                role="OWNER",
            )
            # Create a starter sample product so the new store immediately has items in its catalog!
            starter_product = Product.objects.create(
                store=store,
                slug="starter-offering",
                name=f"{name} Signature Offering",
                description="Our introductory small-batch product, crafted and packaged in Nepal.",
                allow_one_time=True,
                allow_subscription=True,
            )
            Variant.objects.create(
                store=store,
                product=starter_product,
                sku=f"{slug.upper()[:4]}-001",
                label="Standard Edition",
                price_minor=125000,
                allow_one_time=True,
                allow_subscription=True,
                in_stock=True,
                is_active=True,
            )

        return Response(StorePublicSerializer(store).data, status=status.HTTP_201_CREATED)


# -----------------------------------------------------------------------------
# URL Patterns
# -----------------------------------------------------------------------------

urlpatterns = [
    # Store Creation & Slug Validation
    path("stores/check-slug/", StoreSlugCheckView.as_view(), name="store_check_slug"),
    path("stores/create/", StoreCreateView.as_view(), name="store_create"),

    # Public Storefront
    path("stores/<slug:store_slug>/", StoreDetailView.as_view(), name="store_public_detail"),
    path("stores/<slug:store_slug>/catalog/", StoreCatalogView.as_view(), name="store_public_catalog"),
    path("stores/<slug:store_slug>/customer/bootstrap/", CustomerBootstrapView.as_view(), name="store_customer_bootstrap"),
    path("stores/<slug:store_slug>/orders/", ShopperOrderListView.as_view(), name="shopper_order_list"),
    path("stores/<slug:store_slug>/orders/<int:order_id>/", ShopperOrderDetailView.as_view(), name="shopper_order_detail"),
    path("stores/<slug:store_slug>/subscriptions/", ShopperSubscriptionListView.as_view(), name="shopper_subscription_list"),

    # Merchant Console
    path("merchant/stores/<slug:store_slug>/overview/", MerchantStoreOverviewView.as_view(), name="merchant_store_overview"),
    path("merchant/stores/<slug:store_slug>/settings/", MerchantStoreSettingsView.as_view(), name="merchant_store_settings"),
    path("merchant/stores/<slug:store_slug>/products/", MerchantProductListCreateView.as_view(), name="merchant_product_list_create"),
    path("merchant/stores/<slug:store_slug>/orders/", MerchantOrderListView.as_view(), name="merchant_order_list"),
    path("merchant/stores/<slug:store_slug>/customers/", MerchantCustomerListView.as_view(), name="merchant_customer_list"),
    path("merchant/stores/<slug:store_slug>/subscriptions/", MerchantSubscriptionListView.as_view(), name="merchant_subscription_list"),
]
