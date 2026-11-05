import requests
from datetime import timedelta
from django.conf import settings
from django.db import transaction
from django.db.models import Count, F, Q, Sum
from django.http import Http404
from django.urls import path
from django.utils import timezone
from rest_framework import permissions, serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from catalog.models import Discount, Product, Variant
from orders.models import Order, OrderItem, OrderEvent
from core.tenant_context import set_current_tenant_id, reset_current_tenant_id, BypassRLSContext
from stores.models import (
    MerchantAuditLog,
    Customer,
    Store,
    StoreMembership,
    RESERVED_STORE_SLUGS,
    SLUG_REGEX,
    provision_store_customer,
)


# -----------------------------------------------------------------------------
# Mixins
# -----------------------------------------------------------------------------

class StorePublicMixin:
    """Resolves active store from URL slug or raises HTTP 404. Sets Postgres RLS context."""
    store = None

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        store_slug = self.kwargs.get("store_slug")
        self.store = Store.objects.filter(slug=store_slug, is_active=True).first()
        if not self.store:
            raise Http404("Store not found or inactive.")
        set_current_tenant_id(self.store.id)

    def finalize_response(self, request, response, *args, **kwargs):
        reset_current_tenant_id()
        return super().finalize_response(request, response, *args, **kwargs)


class StoreMerchantMixin:
    """
    Requires authentication and verifies the user is a member of the store.
    Raises HTTP 404 if the store does not exist or user is not a member (D-03).
    """
    store = None
    membership = None
    member_role = "OWNER"
    permission_classes = [permissions.IsAuthenticated]

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        store_slug = self.kwargs.get("store_slug")
        store = Store.objects.filter(slug=store_slug).first()
        if not store:
            raise Http404("Store not found.")

        # Check membership & role
        membership = StoreMembership.objects.for_store(store).filter(user=request.user).first()
        is_member = membership is not None
        if not is_member and (
            getattr(request.user, "is_staff", False)
            or getattr(request.user, "is_superuser", False)
        ):
            is_member = True
        if not is_member:
            raise Http404("Store not found.")

        self.store = store
        self.membership = membership
        self.member_role = membership.role if membership else "OWNER"
        set_current_tenant_id(self.store.id)

    def finalize_response(self, request, response, *args, **kwargs):
        reset_current_tenant_id()
        return super().finalize_response(request, response, *args, **kwargs)


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
            "category",
            "city",
            "province",
            "currency",
            "theme_preset",
            "logo_url",
            "accent_color",
            "contact_phone",
            "contact_email",
            "address",
            "story_headline",
            "about_text",
            "banner_url",
            "instagram_url",
            "facebook_url",
            "inside_valley_shipping_minor",
            "outside_valley_shipping_minor",
            "free_shipping_threshold_minor",
            "cod_enabled",
            "custom_domain",
        ]


class CustomerSerializer(serializers.ModelSerializer):
    orders_count = serializers.IntegerField(read_only=True, default=0)
    total_spent_minor = serializers.IntegerField(read_only=True, default=0)
    city = serializers.SerializerMethodField()

    class Meta:
        model = Customer
        fields = [
            "id",
            "email",
            "full_name",
            "phone",
            "orders_count",
            "total_spent_minor",
            "city",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def get_city(self, obj):
        last_order = obj.orders.order_by("-created_at").first()
        if last_order and isinstance(last_order.shipping_address_snapshot, dict):
            return (
                last_order.shipping_address_snapshot.get("district")
                or last_order.shipping_address_snapshot.get("city")
                or "Kathmandu"
            )
        return "Kathmandu"

    def to_representation(self, instance):
        data = super().to_representation(instance)
        last_order = instance.orders.order_by("-created_at").first()
        if not data.get("phone") and last_order:
            snap = getattr(last_order, "shipping_address_snapshot", None)
            if isinstance(snap, dict) and snap.get("phone"):
                data["phone"] = snap.get("phone")

        if not data.get("full_name") and last_order:
            snap = getattr(last_order, "shipping_address_snapshot", None)
            if isinstance(snap, dict) and snap.get("recipient_name"):
                data["full_name"] = snap.get("recipient_name")
        return data


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
            "is_active",
            "sort_order",
            "variants",
        ]
        read_only_fields = ["id"]

    def get_variants(self, obj):
        active_variants = obj.variants.filter(is_active=True).order_by("sort_order", "price_minor")
        return VariantSerializer(active_variants, many=True).data


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
    customer_name = serializers.CharField(source="customer.full_name", read_only=True)
    customer_email = serializers.CharField(source="customer.email", read_only=True)
    customer_phone = serializers.CharField(source="customer.phone", read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "token",
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
            "customer_name",
            "customer_email",
            "customer_phone",
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
        response = Response(OrderSerializer(order).data)
        response["Cache-Control"] = "no-store, no-cache, must-revalidate, private"
        return response


class StorePublicOrderDetailView(StorePublicMixin, APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, store_slug, order_id):
        import uuid
        token_param = request.query_params.get("token", "").strip()
        order = None

        # Check if order_id is a UUID token
        try:
            uuid_token = uuid.UUID(str(order_id))
            order = Order.objects.for_store(self.store).filter(token=uuid_token).first()
        except ValueError:
            # Looked up by integer ID
            try:
                oid = int(order_id)
                if token_param:
                    try:
                        param_uuid = uuid.UUID(token_param)
                        order = Order.objects.for_store(self.store).filter(id=oid, token=param_uuid).first()
                    except ValueError:
                        pass
                elif request.user.is_authenticated:
                    # Authenticated shopper viewing their own order
                    order = Order.objects.for_store(self.store).filter(id=oid, customer__user=request.user).first()
            except ValueError:
                pass

        if not order:
            raise Http404("Order not found.")
        response = Response(OrderSerializer(order).data)
        response["Cache-Control"] = "no-store, no-cache, must-revalidate, private"
        return response


class StorePublicOrderPayView(StorePublicMixin, APIView):
    """
    Allows a shopper holding a valid unguessable order access token (e.g. from a
    pay-per-delivery renewal link or failed Khalti return) to pay via Khalti or confirm COD.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, store_slug, order_id):
        import uuid
        token_param = str(
            request.data.get("token") or request.query_params.get("token") or ""
        ).strip()
        order = None

        try:
            uuid_token = uuid.UUID(str(order_id))
            order = Order.objects.for_store(self.store).filter(token=uuid_token).first()
        except ValueError:
            try:
                oid = int(order_id)
                if token_param:
                    try:
                        param_uuid = uuid.UUID(token_param)
                        order = Order.objects.for_store(self.store).filter(id=oid, token=param_uuid).first()
                    except ValueError:
                        pass
                elif request.user.is_authenticated:
                    order = Order.objects.for_store(self.store).filter(id=oid, customer__user=request.user).first()
            except ValueError:
                pass

        if not order:
            raise Http404("Order not found.")

        if order.payment_status == "PAID" or order.status not in ["PENDING_PAYMENT", "PAYMENT_FAILED"]:
            return Response(
                {"error": "This order does not have a pending payment balance."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        payment_method = str(request.data.get("payment_method", "KHALTI")).strip().upper()
        if payment_method not in ["KHALTI", "COD"]:
            return Response(
                {"error": "Invalid payment method. Choose KHALTI or COD."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if payment_method == "COD" and not self.store.cod_enabled:
            return Response(
                {"error": "Cash on Delivery is currently disabled for this store. Please pay via Khalti."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        has_prepaid_sub = order.originating_subscriptions.filter(selling_plan__is_prepaid=True).exists()
        if payment_method == "COD" and has_prepaid_sub:
            return Response(
                {"error": "Prepaid subscription plans cannot be paid via Cash on Delivery. Please select Khalti."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if payment_method == "COD":
            with transaction.atomic():
                old_status = order.status
                order.status = "CONFIRMED"
                order.payment_method = "COD"
                order.payment_status = "COD_PENDING"
                order.save(update_fields=["status", "payment_method", "payment_status", "updated_at"])

                from subscriptions.services import activate_order_subscriptions
                activate_order_subscriptions(order)

                OrderEvent.objects.create(
                    store=self.store,
                    order=order,
                    from_status=old_status,
                    to_status="CONFIRMED",
                    note="Renewal / order confirmed via Cash on Delivery link.",
                    actor=request.user if request.user.is_authenticated else None,
                )

            return Response({
                "order_id": order.id,
                "token": str(order.token),
                "order_number": order.order_number,
                "status": order.status,
                "payment_method": "COD",
                "payment_status": order.payment_status,
                "total_minor": order.total_minor,
            })

        # Khalti initiation for renewal / retry payment
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

        snap = order.shipping_address_snapshot or {}
        recipient_name = snap.get("recipient_name") or order.customer.full_name or "Shopper"
        phone = snap.get("phone") or order.customer.phone or "9800000000"

        khalti_body = {
            "return_url": return_url,
            "website_url": request.build_absolute_uri(f"/s/{self.store.slug}/"),
            "amount": order.total_minor,
            "purchase_order_id": str(order.id),
            "purchase_order_name": f"{self.store.name} Renewal {order.order_number}",
            "customer_info": {
                "name": recipient_name,
                "email": order.customer.email,
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
                order.payment_method = "KHALTI"
                order.payment_ref = data["pidx"]
                order.save(update_fields=["payment_method", "payment_ref", "updated_at"])
                return Response({
                    "order_id": order.id,
                    "token": str(order.token),
                    "order_number": order.order_number,
                    "pidx": data["pidx"],
                    "payment_url": data["payment_url"],
                    "status": order.status,
                })
        except Exception:
            pass

        if self.store.khalti_mode != "TEST":
            return Response(
                {"error": "Unable to reach Khalti payment gateway. Please try again shortly."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        import secrets as pysecrets
        sandbox_pidx = f"sandbox_{order.id}_{pysecrets.token_hex(4)}"
        sandbox_payment_url = (
            f"/s/{self.store.slug}/checkout/khalti-return/"
            f"?pidx={sandbox_pidx}&purchase_order_id={order.id}&amount={order.total_minor}"
        )
        order.payment_method = "KHALTI"
        order.payment_ref = sandbox_pidx
        order.save(update_fields=["payment_method", "payment_ref", "updated_at"])

        return Response({
            "order_id": order.id,
            "token": str(order.token),
            "order_number": order.order_number,
            "pidx": sandbox_pidx,
            "payment_url": sandbox_payment_url,
            "status": order.status,
            "is_sandbox": True,
        })


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

        discount_minor = 0
        applied_discount_code = None
        raw_discount_code = str(request.data.get("discount_code") or "").strip().upper()
        if raw_discount_code:
            disc = Discount.objects.for_store(self.store).filter(code__iexact=raw_discount_code).first()
            if not disc:
                return Response(
                    {"error": f"Promo code '{raw_discount_code}' is not valid for this store."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            ok, reason = disc.check_eligibility(subtotal_minor)
            if not ok:
                return Response({"error": reason}, status=status.HTTP_400_BAD_REQUEST)
            discount_minor = disc.compute_discount_minor(subtotal_minor)
            applied_discount_code = disc.code

        total_minor = max(0, subtotal_minor - discount_minor) + shipping_minor

        return Response({
            "subtotal_minor": subtotal_minor,
            "shipping_minor": shipping_minor,
            "discount_minor": discount_minor,
            "discount_code": applied_discount_code,
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
            customer_email = str(
                request.data.get("customer_email")
                or request.data.get("email")
                or shipping_address.get("email")
                or ""
            ).strip().lower()
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

        if payment_method == "COD" and not self.store.cod_enabled:
            return Response(
                {"error": "Cash on Delivery is currently disabled for this store. Please pay via Khalti."},
                status=status.HTTP_400_BAD_REQUEST,
            )

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
                "plan": plan,
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

        raw_discount_code = str(request.data.get("discount_code") or "").strip().upper()
        disc_candidate = None
        if raw_discount_code:
            disc_candidate = Discount.objects.for_store(self.store).filter(code__iexact=raw_discount_code).first()
            if not disc_candidate:
                return Response(
                    {"error": f"Promo code '{raw_discount_code}' is not valid for this store."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            ok, reason = disc_candidate.check_eligibility(subtotal_minor)
            if not ok:
                return Response({"error": reason}, status=status.HTTP_400_BAD_REQUEST)

        prefix = f"{self.store.slug[:2].upper()}-{timezone.now().year}"
        with transaction.atomic():
            discount_minor = 0
            applied_promo_note = ""
            if disc_candidate is not None:
                locked_disc = Discount.objects.select_for_update().for_store(self.store).filter(id=disc_candidate.id).first()
                if not locked_disc:
                    return Response({"error": "Promo code is no longer valid."}, status=status.HTTP_400_BAD_REQUEST)
                ok, reason = locked_disc.check_eligibility(subtotal_minor)
                if not ok:
                    return Response({"error": reason}, status=status.HTTP_400_BAD_REQUEST)
                discount_minor = locked_disc.compute_discount_minor(subtotal_minor)
                Discount.objects.for_store(self.store).filter(id=locked_disc.id).update(used_count=F("used_count") + 1)
                applied_promo_note = f" (Promo: {locked_disc.code})"

            total_minor = max(0, subtotal_minor - discount_minor) + shipping_minor

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
                discount_minor=discount_minor,
                total_minor=total_minor,
                currency=self.store.currency,
                shipping_address_snapshot=shipping_address,
                is_test=True,
            )

            from subscriptions.services import create_subscription_for_item
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
                if item_info.get("plan"):
                    sub_status = "ACTIVE" if payment_method == "COD" else "PENDING_PAYMENT"
                    create_subscription_for_item(
                        store=self.store,
                        customer=customer,
                        variant=item_info["variant"],
                        selling_plan=item_info["plan"],
                        order=order,
                        shipping_address=shipping_address,
                        unit_price_minor=item_info["unit_price_minor"],
                        status=sub_status,
                    )

            OrderEvent.objects.create(
                store=self.store,
                order=order,
                from_status="",
                to_status=initial_status,
                note=f"Order placed via {payment_method}{applied_promo_note}",
                actor=request.user if request.user.is_authenticated else None,
            )

        if payment_method == "COD":
            return Response({
                "order_id": order.id,
                "token": str(order.token),
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
                    "token": str(order.token),
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
            "token": str(order.token),
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
                "token": str(order.token),
                "order_number": order.order_number,
                "status": order.status,
            })

        verified = False
        if pidx.startswith("sandbox_") or "sandbox" in pidx:
            if self.store.khalti_mode == "TEST":
                verified = True
            else:
                verified = False
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

                from subscriptions.services import activate_order_subscriptions
                activate_order_subscriptions(order)

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
                "token": str(order.token),
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
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        seven_days_start = (now - timedelta(days=6)).replace(hour=0, minute=0, second=0, microsecond=0)

        orders_qs = Order.objects.for_store(self.store)
        valid_orders_qs = orders_qs.exclude(status__in=["CANCELLED", "PAYMENT_FAILED"])

        orders_count = orders_qs.count()
        revenue_agg = orders_qs.filter(payment_status__in=["PAID", "CONFIRMED"]).aggregate(
            total_rev=Sum("total_minor")
        )
        revenue_minor = revenue_agg["total_rev"] or 0

        today_orders_qs = valid_orders_qs.filter(created_at__gte=today_start)
        today_orders_count = today_orders_qs.count()
        today_sales_minor = (
            today_orders_qs.aggregate(total=Sum("total_minor"))["total"] or 0
        )

        pending_fulfillment_count = orders_qs.filter(
            status__in=["CONFIRMED", "PAID", "PROCESSING"]
        ).count()
        cod_pending_minor = (
            orders_qs.filter(payment_status="COD_PENDING")
            .exclude(status="CANCELLED")
            .aggregate(total=Sum("total_minor"))["total"]
            or 0
        )

        products_count = Product.objects.for_store(self.store).filter(is_active=True).count()
        customers_count = Customer.objects.for_store(self.store).count()
        active_subscriptions_count = Subscription.objects.for_store(self.store).filter(
            status="ACTIVE"
        ).count()
        active_discounts_count = Discount.objects.for_store(self.store).filter(
            is_active=True
        ).count()

        # 7-day daily revenue & order count series (single query)
        daily_buckets = {}
        for offset in range(7):
            d = (seven_days_start + timedelta(days=offset)).date()
            daily_buckets[d.isoformat()] = {
                "date": d.isoformat(),
                "label": d.strftime("%b %d"),
                "revenue_minor": 0,
                "orders_count": 0,
            }
        recent_7d_rows = list(
            valid_orders_qs.filter(created_at__gte=seven_days_start).values(
                "created_at", "total_minor"
            )
        )
        for row in recent_7d_rows:
            dt_key = timezone.localtime(row["created_at"]).date().isoformat()
            if dt_key in daily_buckets:
                daily_buckets[dt_key]["revenue_minor"] += row["total_minor"] or 0
                daily_buckets[dt_key]["orders_count"] += 1

        recent_orders_qs = (
            orders_qs.select_related("customer").order_by("-created_at")[:5]
        )
        recent_orders = [
            {
                "id": o.id,
                "order_number": o.order_number,
                "customer_name": (
                    (o.shipping_address_snapshot or {}).get("recipient_name")
                    or o.customer.full_name
                    or o.customer.email
                ),
                "total_minor": o.total_minor,
                "status": o.status,
                "payment_method": o.payment_method,
                "payment_status": o.payment_status,
                "created_at": o.created_at.isoformat(),
            }
            for o in recent_orders_qs
        ]

        checklist = {
            "has_products": products_count > 0,
            "has_shipping": bool(self.store.inside_valley_shipping_minor > 0),
            "has_khalti": bool(self.store.khalti_secret_key_encrypted),
            "has_story": bool(self.store.story_headline or self.store.about_text),
        }

        return Response({
            "store": StorePublicSerializer(self.store).data,
            "member_role": self.member_role,
            "products_count": products_count,
            "orders_count": orders_count,
            "revenue_minor": revenue_minor,
            "customers_count": customers_count,
            "today_sales_minor": today_sales_minor,
            "today_orders_count": today_orders_count,
            "pending_fulfillment_count": pending_fulfillment_count,
            "cod_pending_minor": cod_pending_minor,
            "active_subscriptions_count": active_subscriptions_count,
            "active_discounts_count": active_discounts_count,
            "daily_sales_7d": list(daily_buckets.values()),
            "recent_orders": recent_orders,
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
        data["cod_enabled"] = self.store.cod_enabled
        data["custom_domain"] = self.store.custom_domain
        data["member_role"] = self.member_role
        return Response(data)

    def patch(self, request, store_slug):
        store = self.store
        data = request.data

        owner_only_fields = ("khalti_secret_key", "clear_khalti_secret_key", "khalti_mode", "custom_domain")
        if any(field in data for field in owner_only_fields) and self.member_role != "OWNER":
            return Response(
                {"detail": "Only store owners can modify payment gateway keys or custom domains."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if "name" in data and str(data["name"]).strip():
            store.name = str(data["name"]).strip()
        if "tagline" in data:
            store.tagline = str(data["tagline"]).strip()
        if "category" in data and str(data["category"]).strip():
            cat = str(data["category"]).strip()
            if cat in [c[0] for c in Store.CATEGORY_CHOICES]:
                store.category = cat
        if "city" in data and str(data["city"]).strip():
            store.city = str(data["city"]).strip()
        if "province" in data and str(data["province"]).strip():
            store.province = str(data["province"]).strip()
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
        if "banner_url" in data:
            store.banner_url = str(data["banner_url"]).strip()
        if "contact_email" in data:
            store.contact_email = str(data["contact_email"]).strip()
        if "address" in data:
            store.address = str(data["address"]).strip()
        if "story_headline" in data:
            store.story_headline = str(data["story_headline"]).strip()
        if "about_text" in data:
            store.about_text = str(data["about_text"]).strip()
        if "instagram_url" in data:
            store.instagram_url = str(data["instagram_url"]).strip()
        if "facebook_url" in data:
            store.facebook_url = str(data["facebook_url"]).strip()

        if "cod_enabled" in data:
            raw_cod = data["cod_enabled"]
            if isinstance(raw_cod, bool):
                store.cod_enabled = raw_cod
            elif isinstance(raw_cod, str):
                store.cod_enabled = raw_cod.lower() in ("true", "1", "yes")

        if "custom_domain" in data:
            raw_domain = str(data["custom_domain"] or "").strip().lower()
            raw_domain = raw_domain.replace("https://", "").replace("http://", "").split("/")[0].strip()
            store.custom_domain = raw_domain[:160]

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

        if data.get("clear_khalti_secret_key"):
            store.set_khalti_secret_key("")
        elif "khalti_secret_key" in data:
            raw_key = str(data["khalti_secret_key"]).strip()
            if raw_key:
                store.set_khalti_secret_key(raw_key)

        store.save()
        MerchantAuditLog.objects.create(
            store=self.store,
            actor=request.user,
            action="SETTINGS_UPDATE",
            entity_type="Store",
            entity_id=str(self.store.id),
            details={"updated_fields": list(data.keys())},
            ip_address=request.META.get("REMOTE_ADDR"),
        )
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

                MerchantAuditLog.objects.create(
            store=self.store,
            actor=request.user,
            action="PRODUCT_CREATE",
            entity_type="Product",
            entity_id=str(product.id),
            details={"name": product.name, "slug": product.slug},
            ip_address=request.META.get("REMOTE_ADDR"),
        )
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


class MerchantOrderListView(StoreMerchantMixin, APIView):
    def get(self, request, store_slug):
        qs = Order.objects.for_store(self.store).order_by("-created_at")

        # Counts across all status categories
        all_count = qs.count()
        new_count = qs.filter(status__in=["CONFIRMED", "PAID"]).count()
        packed_count = qs.filter(status__in=["PROCESSING", "PACKED"]).count()
        shipped_count = qs.filter(status="SHIPPED").count()
        delivered_count = qs.filter(status="DELIVERED").count()

        status_filter = request.query_params.get("status", "").strip().lower()
        if status_filter == "new":
            qs = qs.filter(status__in=["CONFIRMED", "PAID"])
        elif status_filter == "packed":
            qs = qs.filter(status__in=["PROCESSING", "PACKED"])
        elif status_filter == "shipped":
            qs = qs.filter(status="SHIPPED")
        elif status_filter == "delivered":
            qs = qs.filter(status="DELIVERED")

        search = request.query_params.get("search", "").strip()
        if search:
            from django.db.models import Q
            qs = qs.filter(
                Q(order_number__icontains=search)
                | Q(customer__full_name__icontains=search)
                | Q(customer__email__icontains=search)
                | Q(customer__phone__icontains=search)
            )

        return Response({
            "orders": OrderSerializer(qs, many=True).data,
            "counts": {
                "all": all_count,
                "new": new_count,
                "packed": packed_count,
                "shipped": shipped_count,
                "delivered": delivered_count,
            },
        })


class MerchantOrderDetailView(StoreMerchantMixin, APIView):
    def get(self, request, store_slug, order_id):
        order = Order.objects.for_store(self.store).filter(id=order_id).first()
        if not order:
            raise Http404("Order not found.")
        response = Response(OrderSerializer(order).data)
        response["Cache-Control"] = "no-store, no-cache, must-revalidate, private"
        return response


class MerchantOrderStatusTransitionView(StoreMerchantMixin, APIView):
    def post(self, request, store_slug, order_id):
        order = Order.objects.for_store(self.store).filter(id=order_id).first()
        if not order:
            raise Http404("Order not found.")

        target_status = str(request.data.get("to_status", "")).strip().upper()
        note = str(request.data.get("note", "")).strip()

        VALID_FORWARD = {
            "CONFIRMED": ["PROCESSING", "CANCELLED"],
            "PAID": ["PROCESSING", "CANCELLED"],
            "PROCESSING": ["SHIPPED", "CANCELLED"],
            "SHIPPED": ["DELIVERED"],
        }
        VALID_UNDO = {
            "PROCESSING": ["CONFIRMED", "PAID"],
            "SHIPPED": ["PROCESSING"],
            "DELIVERED": ["SHIPPED"],
        }

        current = order.status.upper()
        is_forward = target_status in VALID_FORWARD.get(current, [])
        is_undo = target_status in VALID_UNDO.get(current, [])

        if not is_forward and not is_undo:
            return Response(
                {"error": f"Invalid transition from {current} to {target_status}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            old_status = order.status
            order.status = target_status

            if target_status == "DELIVERED" and order.payment_method == "COD":
                order.payment_status = "PAID"
                if not note:
                    note = f"Delivered · Cash of Rs. {order.total_minor // 100} collected."
            elif old_status == "DELIVERED" and is_undo and order.payment_method == "COD":
                order.payment_status = "COD_PENDING"
                if not note:
                    note = "Undone delivery · Reverted cash collection."

            order.save()

            OrderEvent.objects.create(
                store=self.store,
                order=order,
                from_status=old_status,
                to_status=target_status,
                note=note or f"Status changed from {old_status} to {target_status}",
                actor=request.user,
            )

        return Response(OrderSerializer(order).data)


class MerchantCustomerListView(StoreMerchantMixin, APIView):
    def get(self, request, store_slug):
        q = request.query_params.get("q", "").strip()
        customers = (
            Customer.objects.for_store(self.store)
            .annotate(
                orders_count=Count("orders", distinct=True),
                total_spent_minor=Sum(
                    "orders__total_minor",
                    filter=Q(orders__payment_status__in=["PAID", "CONFIRMED"]),
                    default=0,
                ),
            )
            .order_by("-created_at")
        )
        if q:
            customers = customers.filter(
                Q(full_name__icontains=q) | Q(email__icontains=q) | Q(phone__icontains=q)
            )
        return Response(CustomerSerializer(customers, many=True).data)


class MerchantCustomerDetailView(StoreMerchantMixin, APIView):
    def get(self, request, store_slug, customer_id):
        customer = (
            Customer.objects.for_store(self.store)
            .annotate(
                orders_count=Count("orders", distinct=True),
                total_spent_minor=Sum(
                    "orders__total_minor",
                    filter=Q(orders__payment_status__in=["PAID", "CONFIRMED"]),
                    default=0,
                ),
            )
            .filter(id=customer_id)
            .first()
        )
        if not customer:
            raise Http404("Customer not found.")

        orders = Order.objects.for_store(self.store).filter(customer=customer).order_by("-created_at")[:20]

        return Response({
            "customer": CustomerSerializer(customer).data,
            "orders": OrderSerializer(orders, many=True).data,
        })


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


def seed_starter_catalog(store):
    """Creates 2-3 realistic starter products with authentic photography, descriptions and variants."""
    norm_cat = f"{store.category} {store.theme_preset}".lower()
    prefix = store.slug.upper().replace("-", "")[:4] or "SHOP"

    if any(k in norm_cat for k in ["honey", "herb", "spice", "sage"]):
        items = [
            {
                "name": "Raw Himalayan Wild Cliff Honey",
                "slug": f"{store.slug}-wild-cliff-honey",
                "desc": "Pure unpasteurized honey harvested from wild cliff bee colonies in the Annapurna foothills. Rich in natural pollens, floral aromas, and medicinal enzymes.",
                "image": "https://images.unsplash.com/photo-1587049352847-4a222e784d38?auto=format&fit=crop&w=800&q=80",
                "attrs": {"category": "Wild Cliff Honey", "district": "Lamjung, Nepal"},
                "variants": [
                    ("500g Glass Jar", f"{prefix}-HON-500", 145000),
                    ("250g Jar", f"{prefix}-HON-250", 85000),
                ],
            },
            {
                "name": "High-Altitude White Forest Honey",
                "slug": f"{store.slug}-white-forest-honey",
                "desc": "Delicate and floral white honey sourced from sub-alpine wildflowers in Mustang and Manang valleys. Smooth crystalline texture with mild sweetness.",
                "image": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80",
                "attrs": {"category": "Forest Honey", "district": "Mustang, Nepal"},
                "variants": [
                    ("350g Jar", f"{prefix}-HON-350", 95000),
                ],
            },
            {
                "name": "Himalayan Ginger & Tulsi Honey Infusion",
                "slug": f"{store.slug}-ginger-tulsi-honey",
                "desc": "Hand-infused raw wild honey steeped with fresh mountain ginger root and holy tulsi leaves. Ideal for soothing herbal teas and daily immunity.",
                "image": "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80",
                "attrs": {"category": "Herbal Infusions", "district": "Kathmandu Valley"},
                "variants": [
                    ("250g Jar", f"{prefix}-HON-GIN", 75000),
                ],
            },
        ]
    elif any(k in norm_cat for k in ["coffee", "tea", "roast"]):
        items = [
            {
                "name": "Single-Origin Nuwakot Arabica Whole Bean",
                "slug": f"{store.slug}-nuwakot-arabica",
                "desc": "High-altitude organic arabica grown at 1,400m in Nuwakot. Notes of brown sugar, dried plum, and dark chocolate with a velvety crema.",
                "image": "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80",
                "attrs": {"category": "Specialty Coffee", "district": "Nuwakot, Nepal"},
                "variants": [
                    ("250g Whole Bean", f"{prefix}-COF-250", 95000),
                    ("500g Whole Bean", f"{prefix}-COF-500", 175000),
                ],
            },
            {
                "name": "Ilam First Flush Orthodox Black Tea",
                "slug": f"{store.slug}-ilam-first-flush",
                "desc": "Delicately plucked spring orthodox black tea from eastern Himalayan gardens. Bright amber liquor with a fragrant muscatel finish.",
                "image": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
                "attrs": {"category": "Artisanal Tea", "district": "Ilam, Nepal"},
                "variants": [
                    ("100g Loose Leaf Tin", f"{prefix}-TEA-100", 65000),
                ],
            },
            {
                "name": "Everest Mountain Dark Roast Espresso",
                "slug": f"{store.slug}-everest-espresso",
                "desc": "Bold, low-acidity espresso blend engineered for moka pot, aeropress, and commercial machine extraction.",
                "image": "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=800&q=80",
                "attrs": {"category": "Espresso Blend", "district": "Kathmandu Valley"},
                "variants": [
                    ("250g Ground", f"{prefix}-COF-ESP", 85000),
                ],
            },
        ]
    elif any(k in norm_cat for k in ["streetwear", "fashion", "apparel", "obsidian"]):
        items = [
            {
                "name": "Heavyweight Boxy Drop-Shoulder Tee",
                "slug": f"{store.slug}-heavyweight-tee",
                "desc": "280 GSM combed cotton tee with reinforced ribbed collar and relaxed boxy drape. Hand-dyed and cut in Kathmandu.",
                "image": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
                "attrs": {"category": "Apparel", "district": "Kathmandu, Nepal"},
                "variants": [
                    ("Size M", f"{prefix}-TEE-M", 185000),
                    ("Size L", f"{prefix}-TEE-L", 185000),
                    ("Size XL", f"{prefix}-TEE-XL", 185000),
                ],
            },
            {
                "name": "Raw Himalayan Hemp Utility Tote",
                "slug": f"{store.slug}-hemp-utility-tote",
                "desc": "Heavy-duty unbleached Himalayan hemp canvas with double-stitched webbing straps and inner brass zippered compartment.",
                "image": "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80",
                "attrs": {"category": "Bags & Gear", "district": "Pokhara, Nepal"},
                "variants": [
                    ("Standard Tote", f"{prefix}-BAG-01", 120000),
                ],
            },
            {
                "name": "Ribbed Mountain Wool Fisherman Beanie",
                "slug": f"{store.slug}-fisherman-beanie",
                "desc": "100% mountain wool knit with deep ribbed turn-up brim for warmth in high altitude winds.",
                "image": "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&w=800&q=80",
                "attrs": {"category": "Headwear", "district": "Kathmandu, Nepal"},
                "variants": [
                    ("One Size", f"{prefix}-HAT-01", 85000),
                ],
            },
        ]
    elif any(k in norm_cat for k in ["craft", "handloom", "pashmina"]):
        items = [
            {
                "name": "Hand-Hammered 7-Metal Tibetan Singing Bowl",
                "slug": f"{store.slug}-tibetan-singing-bowl",
                "desc": "Traditional hand-hammered bronze singing bowl tuned to healing vibrational frequencies. Comes with rosewood mallet and brocade cushion.",
                "image": "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80",
                "attrs": {"category": "Sacred Metalwork", "district": "Patan, Nepal"},
                "variants": [
                    ("14cm Diameter", f"{prefix}-BWL-14", 320000),
                ],
            },
            {
                "name": "Pure Dhaka Handwoven Pashmina Stole",
                "slug": f"{store.slug}-dhaka-pashmina-stole",
                "desc": "Ultra-soft cashmere pashmina bordered with authentic Palpali Dhaka geometric handwoven patterns.",
                "image": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
                "attrs": {"category": "Textiles", "district": "Bhaktapur, Nepal"},
                "variants": [
                    ("Standard Stole (200x70cm)", f"{prefix}-STL-01", 240000),
                ],
            },
            {
                "name": "Artisanal Studio Ceramic Matcha Tumbler",
                "slug": f"{store.slug}-ceramic-matcha-tumbler",
                "desc": "Wheel-thrown stoneware pottery with organic wood-ash glaze. Comfortable ergonomic handfeel for warm tea.",
                "image": "https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=800&q=80",
                "attrs": {"category": "Ceramics", "district": "Thimi, Nepal"},
                "variants": [
                    ("280ml Tumbler", f"{prefix}-POT-01", 75000),
                ],
            },
        ]
    elif any(k in norm_cat for k in ["bakery", "sweet", "pastry"]):
        items = [
            {
                "name": "Heritage Sourdough Country Loaf",
                "slug": f"{store.slug}-sourdough-country-loaf",
                "desc": "Naturally leavened with 36-hour slow cold fermentation. Crispy blistered crust and open airy crumb.",
                "image": "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80",
                "attrs": {"category": "Sourdough", "district": "Lalitpur, Nepal"},
                "variants": [
                    ("800g Loaf", f"{prefix}-BRD-01", 45000),
                ],
            },
            {
                "name": "French Butter Almond Croissant (Box of 4)",
                "slug": f"{store.slug}-almond-croissants",
                "desc": "Twice-baked flaky croissant filled with rich almond frangipane cream and topped with toasted almond flakes.",
                "image": "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
                "attrs": {"category": "Viennoiserie", "district": "Kathmandu, Nepal"},
                "variants": [
                    ("Box of 4", f"{prefix}-CRS-04", 80000),
                ],
            },
            {
                "name": "Artisan Dark Chocolate Sea-Salt Brownies",
                "slug": f"{store.slug}-chocolate-sea-salt-brownies",
                "desc": "Fudgy Belgian dark chocolate brownie bars sprinkled with flaky Himalayan mineral sea salt.",
                "image": "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=800&q=80",
                "attrs": {"category": "Confectionery", "district": "Lalitpur, Nepal"},
                "variants": [
                    ("Box of 6", f"{prefix}-BRW-06", 65000),
                ],
            },
        ]
    else:
        items = [
            {
                "name": f"{store.name} Signature Offering",
                "slug": f"{store.slug}-signature-offering",
                "desc": "Our introductory small-batch product, crafted with high standards and packaged in Nepal.",
                "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
                "attrs": {"category": "Signature Edition", "district": f"{store.city}, Nepal"},
                "variants": [
                    ("Standard Edition", f"{prefix}-001", 125000),
                    ("Reserve Edition", f"{prefix}-002", 185000),
                ],
            },
            {
                "name": f"{store.name} Artisanal Reserve",
                "slug": f"{store.slug}-artisanal-reserve",
                "desc": "Curated artisanal edition crafted for discerning clients across Nepal.",
                "image": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
                "attrs": {"category": "Artisanal Reserve", "district": f"{store.city}, Nepal"},
                "variants": [
                    ("Standard Pack", f"{prefix}-003", 85000),
                ],
            },
        ]

    for order_idx, item_data in enumerate(items):
        p = Product.objects.create(
            store=store,
            slug=item_data["slug"],
            name=item_data["name"],
            description=item_data["desc"],
            image_url=item_data["image"],
            attributes=item_data.get("attrs", {}),
            allow_one_time=True,
            allow_subscription=True,
            is_active=True,
            sort_order=order_idx,
        )
        for v_label, v_sku, v_price in item_data["variants"]:
            Variant.objects.create(
                store=store,
                product=p,
                sku=v_sku,
                label=v_label,
                price_minor=v_price,
                allow_one_time=True,
                allow_subscription=True,
                in_stock=True,
                is_active=True,
            )


class StoreCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        name = request.data.get("name", "").strip()
        slug = request.data.get("slug", "").strip().lower()
        theme_preset = request.data.get("theme_preset", "editorial-warm")
        category = request.data.get("category", "").strip() or "Specialty Goods"
        city = request.data.get("city", "").strip() or "Kathmandu"
        province = request.data.get("province", "").strip() or "Bagmati"
        tagline = request.data.get("tagline", "").strip()
        contact_phone = request.data.get("contact_phone", "").strip()
        contact_email = request.data.get("contact_email", "").strip() or (request.user.email if request.user.is_authenticated else "")
        address = request.data.get("address", "").strip() or f"{city}, {province}, Nepal"
        story_headline = request.data.get("story_headline", "").strip() or f"Welcome to {name}"
        about_text = request.data.get("about_text", "").strip() or (
            f"Founded with a passion for authentic quality and local craftsmanship, {name} brings carefully crafted products "
            f"directly to your doorstep across Nepal.\n\n"
            f"We prioritize customer satisfaction, reliable express courier delivery, and honest service."
        )

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

        banner_url = request.data.get("banner_url", "").strip()
        if not banner_url:
            norm_cat = f"{category} {theme_preset}".lower()
            if any(k in norm_cat for k in ["honey", "herb", "spice", "sage"]):
                banner_url = "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=1200&q=80"
            elif any(k in norm_cat for k in ["coffee", "tea", "roast"]):
                banner_url = "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1200&q=80"
            elif any(k in norm_cat for k in ["streetwear", "fashion", "apparel", "obsidian"]):
                banner_url = "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1200&q=80"
            elif any(k in norm_cat for k in ["craft", "handloom", "pashmina"]):
                banner_url = "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1200&q=80"
            elif any(k in norm_cat for k in ["bakery", "sweet", "pastry"]):
                banner_url = "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80"
            else:
                banner_url = "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1200&q=80"

        with transaction.atomic():
            store = Store.objects.create(
                name=name,
                slug=slug,
                category=category,
                city=city,
                province=province,
                theme_preset=theme_preset,
                tagline=tagline,
                banner_url=banner_url,
                contact_phone=contact_phone,
                contact_email=contact_email,
                address=address,
                story_headline=story_headline,
                about_text=about_text,
            )
            StoreMembership.objects.create(
                store=store,
                user=request.user,
                role="OWNER",
            )
            MerchantAuditLog.objects.create(
                store=store,
                actor=request.user,
                action="STORE_CREATE",
                entity_type="Store",
                entity_id=str(store.id),
                details={
                    "name": store.name,
                    "slug": store.slug,
                    "category": category,
                    "theme_preset": store.theme_preset,
                },
                ip_address=request.META.get("REMOTE_ADDR"),
            )
            # Create rich starter catalog with curated category photography & variants
            seed_starter_catalog(store)

        return Response(StorePublicSerializer(store).data, status=status.HTTP_201_CREATED)


class MerchantMyStoresView(APIView):
    """
    Returns the authenticated user's store memberships across all stores.
    Powers the Shopify-style store switcher dropdown and /merchant auto-routing.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        with BypassRLSContext():
            memberships = (
                StoreMembership.all_objects.filter(user=request.user, store__is_active=True)
                .select_related("store")
                .order_by("-created_at")
            )
            stores_data = []
            for m in memberships:
                st = m.store
                stores_data.append({
                    "id": st.id,
                    "name": st.name,
                    "slug": st.slug,
                    "category": getattr(st, "category", "Specialty Goods"),
                    "city": getattr(st, "city", "Kathmandu"),
                    "province": getattr(st, "province", "Bagmati"),
                    "theme_preset": st.theme_preset,
                    "logo_url": st.logo_url,
                    "accent_color": st.accent_color,
                    "role": m.role,
                    "created_at": st.created_at.isoformat(),
                })
        return Response({"stores": stores_data})



class MerchantAuditLogSerializer(serializers.ModelSerializer):
    actor_email = serializers.CharField(source="actor.email", read_only=True)
    actor_name = serializers.CharField(source="actor.full_name", read_only=True)

    class Meta:
        model = MerchantAuditLog
        fields = [
            "id",
            "actor_email",
            "actor_name",
            "action",
            "entity_type",
            "entity_id",
            "details",
            "ip_address",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class MerchantAuditLogListView(StoreMerchantMixin, APIView):
    def get(self, request, store_slug):
        logs = MerchantAuditLog.objects.for_store(self.store).order_by("-created_at")[:100]
        return Response(MerchantAuditLogSerializer(logs, many=True).data)


class MerchantMediaUploadView(StoreMerchantMixin, APIView):
    """
    Store-prefixed and authenticated image upload for merchant product catalog and branding.
    Scopes uploads strictly to uploads/stores/<store_slug>/products/.
    """
    def post(self, request, store_slug):
        uploaded_file = request.FILES.get("file")
        if not uploaded_file:
            return Response({"error": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)

        if uploaded_file.size > 5 * 1024 * 1024:
            return Response({"error": "Image size exceeds 5MB limit."}, status=status.HTTP_400_BAD_REQUEST)

        allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]
        content_type = getattr(uploaded_file, "content_type", "")
        if content_type not in allowed_types:
            return Response(
                {"error": "Unsupported image format. Please upload JPG, PNG, or WebP."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        import re
        import secrets
        from pathlib import Path

        clean_slug = re.sub(r"[^a-z0-9_-]", "", self.store.slug.lower())
        if not clean_slug:
            return Response({"error": "Invalid store context."}, status=status.HTTP_400_BAD_REQUEST)

        allowed_exts = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"}
        raw_ext = Path(uploaded_file.name).suffix.lower()
        ext = raw_ext if raw_ext in allowed_exts else ".jpg"

        filename = f"prod_{int(timezone.now().timestamp())}_{secrets.token_hex(8)}{ext}"
        base_dir = (settings.BASE_DIR.parent / "frontend" / "public" / "uploads" / "stores" / clean_slug / "products").resolve()
        trusted_root = (settings.BASE_DIR.parent / "frontend" / "public" / "uploads").resolve()

        if not str(base_dir).startswith(str(trusted_root)):
            return Response({"error": "Invalid upload destination."}, status=status.HTTP_400_BAD_REQUEST)

        base_dir.mkdir(parents=True, exist_ok=True)
        file_path = base_dir / filename

        with open(file_path, "wb+") as dest:
            for chunk in uploaded_file.chunks():
                dest.write(chunk)

        url = f"/uploads/stores/{clean_slug}/products/{filename}"

        MerchantAuditLog.objects.create(
            store=self.store,
            actor=request.user,
            action="MEDIA_UPLOAD",
            entity_type="MediaAsset",
            entity_id=filename,
            details={"filename": filename, "url": url, "size": uploaded_file.size},
            ip_address=request.META.get("REMOTE_ADDR"),
        )

        return Response({
            "success": True,
            "filename": filename,
            "url": url,
            "relativeUrl": url,
        }, status=status.HTTP_201_CREATED)

# -----------------------------------------------------------------------------
# Slice 6 Views (Analytics, Discounts, Staff RBAC) & URL Patterns
# -----------------------------------------------------------------------------

from stores.analytics_discounts_api import build_slice6_views

_slice6_views = build_slice6_views(StoreMerchantMixin)
MerchantAnalyticsView = _slice6_views["MerchantAnalyticsView"]
MerchantDiscountListCreateView = _slice6_views["MerchantDiscountListCreateView"]
MerchantDiscountDetailView = _slice6_views["MerchantDiscountDetailView"]
MerchantStaffListCreateView = _slice6_views["MerchantStaffListCreateView"]
MerchantStaffDetailView = _slice6_views["MerchantStaffDetailView"]

urlpatterns = [
    # Store Creation & Slug Validation
    path("stores/check-slug/", StoreSlugCheckView.as_view(), name="store_check_slug"),
    path("stores/create/", StoreCreateView.as_view(), name="store_create"),
    path("stores/my-stores/", MerchantMyStoresView.as_view(), name="merchant_my_stores"),
    path("merchant/my-stores/", MerchantMyStoresView.as_view(), name="merchant_my_stores_alt"),

    # Public Storefront
    path("stores/<slug:store_slug>/", StoreDetailView.as_view(), name="store_public_detail"),
    path("stores/<slug:store_slug>/catalog/", StoreCatalogView.as_view(), name="store_public_catalog"),
    path("stores/<slug:store_slug>/customer/bootstrap/", CustomerBootstrapView.as_view(), name="store_customer_bootstrap"),
    path("stores/<slug:store_slug>/checkout/quote/", StoreCheckoutQuoteView.as_view(), name="store_checkout_quote"),
    path("stores/<slug:store_slug>/checkout/place/", StoreCheckoutPlaceView.as_view(), name="store_checkout_place"),
    path("stores/<slug:store_slug>/checkout/khalti-verify/", StoreKhaltiVerifyView.as_view(), name="store_khalti_verify"),
    path("stores/<slug:store_slug>/orders/", ShopperOrderListView.as_view(), name="shopper_order_list"),
    path("stores/<slug:store_slug>/orders/<int:order_id>/", ShopperOrderDetailView.as_view(), name="shopper_order_detail"),
    path("stores/<slug:store_slug>/public-orders/<str:order_id>/", StorePublicOrderDetailView.as_view(), name="store_public_order_detail"),
    path("stores/<slug:store_slug>/public-orders/<str:order_id>/pay/", StorePublicOrderPayView.as_view(), name="store_public_order_pay"),

    # Merchant Console
    path("merchant/stores/<slug:store_slug>/overview/", MerchantStoreOverviewView.as_view(), name="merchant_store_overview"),
    path("merchant/stores/<slug:store_slug>/analytics/", MerchantAnalyticsView.as_view(), name="merchant_store_analytics"),
    path("merchant/stores/<slug:store_slug>/discounts/", MerchantDiscountListCreateView.as_view(), name="merchant_discount_list_create"),
    path("merchant/stores/<slug:store_slug>/discounts/<int:discount_id>/", MerchantDiscountDetailView.as_view(), name="merchant_discount_detail"),
    path("merchant/stores/<slug:store_slug>/staff/", MerchantStaffListCreateView.as_view(), name="merchant_staff_list_create"),
    path("merchant/stores/<slug:store_slug>/staff/<int:membership_id>/", MerchantStaffDetailView.as_view(), name="merchant_staff_detail"),
    path("merchant/stores/<slug:store_slug>/settings/", MerchantStoreSettingsView.as_view(), name="merchant_store_settings"),
    path("merchant/stores/<slug:store_slug>/media/upload/", MerchantMediaUploadView.as_view(), name="merchant_media_upload"),
    path("merchant/stores/<slug:store_slug>/audit-logs/", MerchantAuditLogListView.as_view(), name="merchant_audit_logs"),
    path("merchant/stores/<slug:store_slug>/products/", MerchantProductListCreateView.as_view(), name="merchant_product_list_create"),
    path("merchant/stores/<slug:store_slug>/products/<int:product_id>/", MerchantProductDetailView.as_view(), name="merchant_product_detail"),
    path("merchant/stores/<slug:store_slug>/products/<int:product_id>/variants/", MerchantVariantListCreateView.as_view(), name="merchant_variant_list_create"),
    path("merchant/stores/<slug:store_slug>/products/<int:product_id>/variants/<int:variant_id>/", MerchantVariantDetailView.as_view(), name="merchant_variant_detail"),
    path("merchant/stores/<slug:store_slug>/orders/", MerchantOrderListView.as_view(), name="merchant_order_list"),
    path("merchant/stores/<slug:store_slug>/orders/<int:order_id>/", MerchantOrderDetailView.as_view(), name="merchant_order_detail"),
    path("merchant/stores/<slug:store_slug>/orders/<int:order_id>/transition/", MerchantOrderStatusTransitionView.as_view(), name="merchant_order_transition"),
    path("merchant/stores/<slug:store_slug>/customers/", MerchantCustomerListView.as_view(), name="merchant_customer_list"),
    path("merchant/stores/<slug:store_slug>/customers/<int:customer_id>/", MerchantCustomerDetailView.as_view(), name="merchant_customer_detail"),
]
