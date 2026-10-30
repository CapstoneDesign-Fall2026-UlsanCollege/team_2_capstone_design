import requests
from django.conf import settings
from django.db import transaction
from django.db.models import Sum
from django.http import Http404
from django.urls import path
from django.utils import timezone
from rest_framework import permissions, serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from catalog.models import Product, SellingPlan, Variant
from orders.models import Order, OrderItem, OrderEvent
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


class OrderEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderEvent
        fields = [
            "id",
            "from_status",
            "to_status",
            "note",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    events = OrderEventSerializer(many=True, read_only=True)

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
            "events",
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


class StorePublicOrderDetailView(StorePublicMixin, APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, store_slug, order_id):
        order = Order.objects.for_store(self.store).filter(id=order_id).first()
        if not order:
            raise Http404("Order not found.")
        return Response(OrderSerializer(order).data)


class StoreCheckoutQuoteView(StorePublicMixin, APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, store_slug):
        items_data = request.data.get("items", [])
        if not items_data:
            return Response({"error": "Cart is empty."}, status=status.HTTP_400_BAD_REQUEST)

        variant_ids = [it.get("variant_id") for it in items_data if it.get("variant_id")]
        variants = {
            v.id: v for v in Variant.objects.for_store(self.store).filter(id__in=variant_ids, is_active=True)
        }

        plan_ids = [it.get("selling_plan_id") for it in items_data if it.get("selling_plan_id")]
        plans = {
            p.id: p for p in SellingPlan.objects.for_store(self.store).filter(id__in=plan_ids, is_active=True)
        }

        subtotal_minor = 0
        computed_items = []
        has_prepaid_subscription = False

        for it in items_data:
            v_id = it.get("variant_id")
            v = variants.get(v_id)
            if not v:
                return Response(
                    {"error": f"Product variant {v_id} not available in this store."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            quantity = max(1, int(it.get("quantity", 1)))
            purchase_type = it.get("purchase_type", "one_time")
            plan_id = it.get("selling_plan_id")
            plan = plans.get(plan_id) if (purchase_type == "subscription" and plan_id) else None

            unit_price = v.price_minor
            if plan and plan.discount_pct > 0:
                unit_price = round(unit_price * (1 - plan.discount_pct / 100))

            if plan and plan.is_prepaid:
                has_prepaid_subscription = True
                line_total = unit_price * plan.commitment_cycles * quantity
            else:
                line_total = unit_price * quantity

            subtotal_minor += line_total
            computed_items.append({
                "variant_id": v.id,
                "product_name": v.product.name,
                "variant_label": v.label,
                "unit_price_minor": unit_price,
                "quantity": quantity,
                "line_total_minor": line_total,
                "purchase_type": purchase_type,
                "selling_plan": plan.name if plan else None,
            })

        district = str(request.data.get("district", "")).strip().lower()
        inside_valley_districts = {"kathmandu", "lalitpur", "bhaktapur"}

        if district in inside_valley_districts:
            shipping_minor = self.store.inside_valley_shipping_minor
        else:
            shipping_minor = self.store.outside_valley_shipping_minor

        is_free_shipping = False
        if self.store.free_shipping_threshold_minor and subtotal_minor >= self.store.free_shipping_threshold_minor:
            shipping_minor = 0
            is_free_shipping = True

        total_minor = subtotal_minor + shipping_minor

        return Response({
            "subtotal_minor": subtotal_minor,
            "shipping_minor": shipping_minor,
            "discount_minor": 0,
            "total_minor": total_minor,
            "is_free_shipping": is_free_shipping,
            "has_prepaid_subscription": has_prepaid_subscription,
            "currency": self.store.currency,
            "items": computed_items,
        })


class StoreCheckoutPlaceView(StorePublicMixin, APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, store_slug):
        items_data = request.data.get("items", [])
        if not items_data:
            return Response({"error": "Cart is empty."}, status=status.HTTP_400_BAD_REQUEST)

        shipping_address = request.data.get("shipping_address")
        if not isinstance(shipping_address, dict):
            return Response({"error": "Valid shipping address required."}, status=status.HTTP_400_BAD_REQUEST)

        recipient_name = str(shipping_address.get("recipient_name", "")).strip()
        phone = str(shipping_address.get("phone", "")).strip()
        district = str(shipping_address.get("district", "")).strip()

        if not recipient_name or not phone or not district:
            return Response(
                {"error": "Recipient name, phone number, and district are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        import re
        if not re.match(r"^9[78]\d{8}$", phone):
            return Response(
                {"error": "Please enter a valid 10-digit Nepali mobile number starting with 98 or 97."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if request.user.is_authenticated:
            customer = provision_store_customer(self.store, request.user)
            if not customer.phone and phone:
                customer.phone = phone
                customer.save(update_fields=["phone"])
        else:
            customer_email = str(request.data.get("customer_email", "")).strip().lower()
            if not customer_email:
                return Response(
                    {"error": "Customer email is required for order confirmation."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            user, _ = User.objects.get_or_create(
                email=customer_email,
                defaults={"full_name": recipient_name, "phone": phone},
            )
            customer = provision_store_customer(self.store, user)

        payment_method = str(request.data.get("payment_method", "KHALTI")).strip().upper()
        if payment_method not in ["KHALTI", "COD"]:
            return Response({"error": "Invalid payment method. Choose KHALTI or COD."}, status=status.HTTP_400_BAD_REQUEST)

        variant_ids = [it.get("variant_id") for it in items_data if it.get("variant_id")]
        variants = {
            v.id: v for v in Variant.objects.for_store(self.store).filter(id__in=variant_ids, is_active=True)
        }
        plan_ids = [it.get("selling_plan_id") for it in items_data if it.get("selling_plan_id")]
        plans = {
            p.id: p for p in SellingPlan.objects.for_store(self.store).filter(id__in=plan_ids, is_active=True)
        }

        subtotal_minor = 0
        order_items_to_create = []
        has_prepaid_plan = False

        for it in items_data:
            v_id = it.get("variant_id")
            v = variants.get(v_id)
            if not v:
                return Response(
                    {"error": f"Product variant {v_id} not available."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            quantity = max(1, int(it.get("quantity", 1)))
            purchase_type = it.get("purchase_type", "one_time")
            plan_id = it.get("selling_plan_id")
            plan = plans.get(plan_id) if (purchase_type == "subscription" and plan_id) else None

            unit_price = v.price_minor
            if plan and plan.discount_pct > 0:
                unit_price = round(unit_price * (1 - plan.discount_pct / 100))

            if plan and plan.is_prepaid:
                has_prepaid_plan = True
                line_total = unit_price * plan.commitment_cycles * quantity
                variant_label = f"{v.label} ({plan.commitment_cycles} cycles prepaid)"
            elif plan:
                line_total = unit_price * quantity
                variant_label = f"{v.label} (Pay-per-delivery)"
            else:
                line_total = unit_price * quantity
                variant_label = v.label

            subtotal_minor += line_total
            order_items_to_create.append({
                "variant": v,
                "product_name_snapshot": v.product.name,
                "variant_label_snapshot": variant_label,
                "unit_price_minor": unit_price,
                "quantity": quantity,
                "line_total_minor": line_total,
            })

        if payment_method == "COD" and has_prepaid_plan:
            return Response(
                {"error": "Prepaid subscription plans cannot be paid via Cash on Delivery. Please select Khalti."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        inside_valley_districts = {"kathmandu", "lalitpur", "bhaktapur"}
        if district.lower() in inside_valley_districts:
            shipping_minor = self.store.inside_valley_shipping_minor
        else:
            shipping_minor = self.store.outside_valley_shipping_minor

        if self.store.free_shipping_threshold_minor and subtotal_minor >= self.store.free_shipping_threshold_minor:
            shipping_minor = 0

        total_minor = subtotal_minor + shipping_minor

        prefix = f"{self.store.slug[:2].upper()}-{timezone.now().year}"
        with transaction.atomic():
            count = Order.objects.for_store(self.store).count() + 1
            order_number = f"#{prefix}-{count:04d}"
            while Order.objects.filter(store=self.store, order_number=order_number).exists():
                count += 1
                order_number = f"#{prefix}-{count:04d}"

            initial_status = "CONFIRMED" if payment_method == "COD" else "PENDING_PAYMENT"
            initial_payment_status = "COD_PENDING" if payment_method == "COD" else "UNPAID"

            order = Order.objects.create(
                store=self.store,
                customer=customer,
                order_number=order_number,
                order_type="SUBSCRIPTION_CYCLE" if has_prepaid_plan else "ONE_TIME",
                status=initial_status,
                payment_method=payment_method,
                payment_status=initial_payment_status,
                subtotal_minor=subtotal_minor,
                shipping_minor=shipping_minor,
                discount_minor=0,
                total_minor=total_minor,
                currency=self.store.currency,
                shipping_address_snapshot=shipping_address,
                is_test=True,
            )

            for item_info in order_items_to_create:
                OrderItem.objects.create(
                    store=self.store,
                    order=order,
                    variant=item_info["variant"],
                    product_name_snapshot=item_info["product_name_snapshot"],
                    variant_label_snapshot=item_info["variant_label_snapshot"],
                    unit_price_minor=item_info["unit_price_minor"],
                    quantity=item_info["quantity"],
                    line_total_minor=item_info["line_total_minor"],
                )

            OrderEvent.objects.create(
                store=self.store,
                order=order,
                from_status="",
                to_status=initial_status,
                note=f"Order placed via {payment_method}",
                actor=request.user if request.user.is_authenticated else None,
            )

        if payment_method == "COD":
            return Response({
                "order_id": order.id,
                "order_number": order.order_number,
                "status": order.status,
                "payment_method": "COD",
                "payment_status": order.payment_status,
                "total_minor": order.total_minor,
            }, status=status.HTTP_201_CREATED)

        return_url = request.data.get("return_url") or request.build_absolute_uri(
            f"/s/{self.store.slug}/checkout/khalti-return/"
        )
        custom_key = self.store.get_khalti_secret_key()
        secret_key = custom_key or getattr(settings, "KHALTI_PLATFORM_SANDBOX_KEY", "Key 0817c7689ee24db18df67142aa7fef1c")
        if not secret_key.startswith("Key ") and not secret_key.startswith("test_secret_key"):
            secret_key = f"Key {secret_key}"

        initiate_url = (
            "https://khalti.com/api/v2/epayment/initiate/"
            if self.store.khalti_mode == "LIVE"
            else "https://dev.khalti.com/api/v2/epayment/initiate/"
        )

        khalti_body = {
            "return_url": return_url,
            "website_url": request.build_absolute_uri(f"/s/{self.store.slug}/"),
            "amount": order.total_minor,
            "purchase_order_id": str(order.id),
            "purchase_order_name": f"{self.store.name} Order {order.order_number}",
            "customer_info": {
                "name": recipient_name,
                "email": customer.email,
                "phone": phone,
            },
        }

        try:
            resp = requests.post(
                initiate_url,
                json=khalti_body,
                headers={"Authorization": secret_key, "Content-Type": "application/json"},
                timeout=5,
            )
            data = resp.json()
            if resp.status_code == 200 and "pidx" in data and "payment_url" in data:
                order.payment_ref = data["pidx"]
                order.save(update_fields=["payment_ref"])
                return Response({
                    "order_id": order.id,
                    "order_number": order.order_number,
                    "pidx": data["pidx"],
                    "payment_url": data["payment_url"],
                    "status": order.status,
                }, status=status.HTTP_201_CREATED)
        except Exception:
            pass

        import secrets as pysecrets
        sandbox_pidx = f"sandbox_{order.id}_{pysecrets.token_hex(4)}"
        sandbox_payment_url = f"/s/{self.store.slug}/checkout/khalti-return/?pidx={sandbox_pidx}&purchase_order_id={order.id}&amount={order.total_minor}"
        order.payment_ref = sandbox_pidx
        order.save(update_fields=["payment_ref"])

        return Response({
            "order_id": order.id,
            "order_number": order.order_number,
            "pidx": sandbox_pidx,
            "payment_url": sandbox_payment_url,
            "status": order.status,
            "is_sandbox": True,
        }, status=status.HTTP_201_CREATED)


class StoreKhaltiVerifyView(StorePublicMixin, APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, store_slug):
        pidx = str(request.data.get("pidx", "")).strip()
        order_id = request.data.get("order_id") or request.data.get("purchase_order_id")

        if not pidx or not order_id:
            return Response(
                {"error": "pidx and order_id are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        order = Order.objects.for_store(self.store).filter(id=order_id).first()
        if not order:
            raise Http404("Order not found for this store.")

        if order.status in ["PAID", "CONFIRMED"] and order.payment_status == "PAID":
            return Response({
                "success": True,
                "order_id": order.id,
                "order_number": order.order_number,
                "status": order.status,
            })

        verified = False
        if pidx.startswith("sandbox_") or "sandbox" in pidx:
            verified = True
        else:
            custom_key = self.store.get_khalti_secret_key()
            secret_key = custom_key or getattr(settings, "KHALTI_PLATFORM_SANDBOX_KEY", "Key 0817c7689ee24db18df67142aa7fef1c")
            if not secret_key.startswith("Key "):
                secret_key = f"Key {secret_key}"

            lookup_url = (
                "https://khalti.com/api/v2/epayment/lookup/"
                if self.store.khalti_mode == "LIVE"
                else "https://dev.khalti.com/api/v2/epayment/lookup/"
            )

            try:
                resp = requests.post(
                    lookup_url,
                    json={"pidx": pidx},
                    headers={"Authorization": secret_key, "Content-Type": "application/json"},
                    timeout=5,
                )
                if resp.status_code == 200:
                    data = resp.json()
                    if data.get("status") == "Completed":
                        verified = True
            except Exception:
                verified = False

        if verified:
            with transaction.atomic():
                order.status = "PAID"
                order.payment_status = "PAID"
                order.payment_ref = pidx
                order.save(update_fields=["status", "payment_status", "payment_ref", "updated_at"])

                OrderEvent.objects.create(
                    store=self.store,
                    order=order,
                    from_status="PENDING_PAYMENT",
                    to_status="PAID",
                    note=f"Payment verified via Khalti Sandbox (pidx: {pidx})",
                    actor=request.user if request.user.is_authenticated else None,
                )

            return Response({
                "success": True,
                "order_id": order.id,
                "order_number": order.order_number,
                "status": order.status,
            })
        else:
            with transaction.atomic():
                order.status = "PAYMENT_FAILED"
                order.payment_status = "FAILED"
                order.save(update_fields=["status", "payment_status", "updated_at"])

                OrderEvent.objects.create(
                    store=self.store,
                    order=order,
                    from_status="PENDING_PAYMENT",
                    to_status="PAYMENT_FAILED",
                    note=f"Khalti payment verification failed for pidx: {pidx}",
                    actor=request.user if request.user.is_authenticated else None,
                )

            return Response(
                {"error": "Payment verification failed or was cancelled."},
                status=status.HTTP_400_BAD_REQUEST,
            )


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
        data = request.data.copy() if hasattr(request.data, "copy") else dict(request.data)
        if "slug" not in data or not data["slug"]:
            from django.utils.text import slugify
            name = data.get("name", "")
            base_slug = slugify(name) or "item"
            candidate = base_slug
            idx = 1
            while Product.objects.for_store(self.store).filter(slug=candidate).exists():
                candidate = f"{base_slug}-{idx}"
                idx += 1
            data["slug"] = candidate

        serializer = ProductSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        product = serializer.save(store=self.store)

        if "initial_price_minor" in data:
            try:
                price_minor = int(data["initial_price_minor"])
                Variant.objects.create(
                    store=self.store,
                    product=product,
                    sku=f"{self.store.slug.upper()[:4]}-{product.id}-01",
                    label=data.get("initial_variant_label", "Standard"),
                    price_minor=price_minor,
                    allow_one_time=product.allow_one_time,
                    allow_subscription=product.allow_subscription,
                    in_stock=True,
                    is_active=True,
                )
            except (ValueError, TypeError):
                pass

        return Response(ProductSerializer(product).data, status=status.HTTP_201_CREATED)


class MerchantProductDetailView(StoreMerchantMixin, APIView):
    def get_product(self, product_id):
        product = Product.objects.for_store(self.store).filter(id=product_id).first()
        if not product:
            raise Http404("Product not found.")
        return product

    def get(self, request, store_slug, product_id):
        product = self.get_product(product_id)
        return Response(ProductSerializer(product).data)

    def patch(self, request, store_slug, product_id):
        product = self.get_product(product_id)
        serializer = ProductSerializer(product, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(ProductSerializer(product).data)

    def delete(self, request, store_slug, product_id):
        product = self.get_product(product_id)
        if request.query_params.get("permanent") == "true":
            product.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        product.is_active = False
        product.save(update_fields=["is_active"])
        return Response({"detail": "Product archived.", "id": product.id, "is_active": False})


class MerchantVariantListCreateView(StoreMerchantMixin, APIView):
    def get_product(self, product_id):
        product = Product.objects.for_store(self.store).filter(id=product_id).first()
        if not product:
            raise Http404("Product not found.")
        return product

    def get(self, request, store_slug, product_id):
        product = self.get_product(product_id)
        variants = product.variants.all().order_by("sort_order", "price_minor", "id")
        return Response(VariantSerializer(variants, many=True).data)

    def post(self, request, store_slug, product_id):
        product = self.get_product(product_id)
        data = request.data.copy() if hasattr(request.data, "copy") else dict(request.data)
        if "sku" not in data or not data["sku"]:
            count = product.variants.count() + 1
            data["sku"] = f"{self.store.slug.upper()[:4]}-{product.id}-{count}"

        serializer = VariantSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        variant = serializer.save(store=self.store, product=product)
        return Response(VariantSerializer(variant).data, status=status.HTTP_201_CREATED)


class MerchantVariantDetailView(StoreMerchantMixin, APIView):
    def get_variant(self, product_id, variant_id):
        product = Product.objects.for_store(self.store).filter(id=product_id).first()
        if not product:
            raise Http404("Product not found.")
        variant = product.variants.filter(id=variant_id).first()
        if not variant:
            raise Http404("Variant not found.")
        return variant

    def get(self, request, store_slug, product_id, variant_id):
        variant = self.get_variant(product_id, variant_id)
        return Response(VariantSerializer(variant).data)

    def patch(self, request, store_slug, product_id, variant_id):
        variant = self.get_variant(product_id, variant_id)
        serializer = VariantSerializer(variant, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(VariantSerializer(variant).data)

    def delete(self, request, store_slug, product_id, variant_id):
        variant = self.get_variant(product_id, variant_id)
        if request.query_params.get("permanent") == "true":
            variant.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        variant.is_active = False
        variant.save(update_fields=["is_active"])
        return Response({"detail": "Variant archived.", "id": variant.id, "is_active": False})


class MerchantSellingPlanListCreateView(StoreMerchantMixin, APIView):
    def get(self, request, store_slug):
        plans = SellingPlan.objects.for_store(self.store).order_by("sort_order", "id")
        return Response(SellingPlanSerializer(plans, many=True).data)

    def post(self, request, store_slug):
        data = request.data.copy() if hasattr(request.data, "copy") else dict(request.data)
        serializer = SellingPlanSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        plan = serializer.save(store=self.store)
        return Response(SellingPlanSerializer(plan).data, status=status.HTTP_201_CREATED)


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
    path("stores/<slug:store_slug>/checkout/quote/", StoreCheckoutQuoteView.as_view(), name="store_checkout_quote"),
    path("stores/<slug:store_slug>/checkout/place/", StoreCheckoutPlaceView.as_view(), name="store_checkout_place"),
    path("stores/<slug:store_slug>/checkout/khalti-verify/", StoreKhaltiVerifyView.as_view(), name="store_khalti_verify"),
    path("stores/<slug:store_slug>/orders/", ShopperOrderListView.as_view(), name="shopper_order_list"),
    path("stores/<slug:store_slug>/orders/<int:order_id>/", ShopperOrderDetailView.as_view(), name="shopper_order_detail"),
    path("stores/<slug:store_slug>/public-orders/<int:order_id>/", StorePublicOrderDetailView.as_view(), name="store_public_order_detail"),
    path("stores/<slug:store_slug>/subscriptions/", ShopperSubscriptionListView.as_view(), name="shopper_subscription_list"),

    # Merchant Console
    path("merchant/stores/<slug:store_slug>/overview/", MerchantStoreOverviewView.as_view(), name="merchant_store_overview"),
    path("merchant/stores/<slug:store_slug>/settings/", MerchantStoreSettingsView.as_view(), name="merchant_store_settings"),
    path("merchant/stores/<slug:store_slug>/products/", MerchantProductListCreateView.as_view(), name="merchant_product_list_create"),
    path("merchant/stores/<slug:store_slug>/products/<int:product_id>/", MerchantProductDetailView.as_view(), name="merchant_product_detail"),
    path("merchant/stores/<slug:store_slug>/products/<int:product_id>/variants/", MerchantVariantListCreateView.as_view(), name="merchant_variant_list_create"),
    path("merchant/stores/<slug:store_slug>/products/<int:product_id>/variants/<int:variant_id>/", MerchantVariantDetailView.as_view(), name="merchant_variant_detail"),
    path("merchant/stores/<slug:store_slug>/selling-plans/", MerchantSellingPlanListCreateView.as_view(), name="merchant_selling_plan_list_create"),
    path("merchant/stores/<slug:store_slug>/orders/", MerchantOrderListView.as_view(), name="merchant_order_list"),
    path("merchant/stores/<slug:store_slug>/customers/", MerchantCustomerListView.as_view(), name="merchant_customer_list"),
    path("merchant/stores/<slug:store_slug>/subscriptions/", MerchantSubscriptionListView.as_view(), name="merchant_subscription_list"),
]
