import re
from datetime import timedelta
from django.db import transaction
from django.db.models import Count, Q, Sum
from django.http import Http404
from django.utils import timezone
from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from catalog.models import Discount
from core.tenant_context import BypassRLSContext
from orders.models import Order, OrderItem
from stores.models import Customer, MerchantAuditLog, StoreMembership
from subscriptions.models import Subscription


DISTRICT_TO_PROVINCE = {
    "kathmandu": "Bagmati",
    "lalitpur": "Bagmati",
    "bhaktapur": "Bagmati",
    "chitwan": "Bagmati",
    "makwanpur": "Bagmati",
    "kavrepalanchok": "Bagmati",
    "nuwakot": "Bagmati",
    "dhading": "Bagmati",
    "sindhupalchok": "Bagmati",
    "dolakha": "Bagmati",
    "ramechhap": "Bagmati",
    "sindhuli": "Bagmati",
    "rasuwa": "Bagmati",
    "kaski": "Gandaki",
    "pokhara": "Gandaki",
    "tanahun": "Gandaki",
    "gorkha": "Gandaki",
    "syangja": "Gandaki",
    "lamjung": "Gandaki",
    "baglung": "Gandaki",
    "nawalpur": "Gandaki",
    "parbat": "Gandaki",
    "myagdi": "Gandaki",
    "mustang": "Gandaki",
    "manang": "Gandaki",
    "morang": "Koshi",
    "sunsari": "Koshi",
    "jhapa": "Koshi",
    "ilam": "Koshi",
    "dhankuta": "Koshi",
    "udayapur": "Koshi",
    "panchthar": "Koshi",
    "taplejung": "Koshi",
    "solukhumbu": "Koshi",
    "rupandehi": "Lumbini",
    "banke": "Lumbini",
    "dang": "Lumbini",
    "palpa": "Lumbini",
    "gulmi": "Lumbini",
    "kapilvastu": "Lumbini",
    "bardiya": "Lumbini",
    "parsa": "Madhesh",
    "bara": "Madhesh",
    "rautahat": "Madhesh",
    "sarlahi": "Madhesh",
    "mahottari": "Madhesh",
    "dhanusha": "Madhesh",
    "siraha": "Madhesh",
    "saptari": "Madhesh",
    "surkhet": "Karnali",
    "jumla": "Karnali",
    "dailekh": "Karnali",
    "kailali": "Sudurpashchim",
    "kanchanpur": "Sudurpashchim",
    "doti": "Sudurpashchim",
    "dadeldhura": "Sudurpashchim",
}

NEPAL_PROVINCES = [
    "Bagmati",
    "Gandaki",
    "Koshi",
    "Lumbini",
    "Madhesh",
    "Karnali",
    "Sudurpashchim",
]


def normalize_nepal_province(snap: dict | None) -> str:
    if not isinstance(snap, dict):
        return "Bagmati"
    raw_prov = str(snap.get("province") or "").strip()
    if raw_prov:
        cleaned = raw_prov.replace("Province", "").strip()
        for p in NEPAL_PROVINCES:
            if p.lower() in cleaned.lower():
                return p
    raw_dist = str(snap.get("district") or snap.get("city") or "").strip().lower()
    if raw_dist in DISTRICT_TO_PROVINCE:
        return DISTRICT_TO_PROVINCE[raw_dist]
    return "Bagmati"


class DiscountSerializer(serializers.ModelSerializer):
    is_expired = serializers.SerializerMethodField()

    class Meta:
        model = Discount
        fields = [
            "id",
            "code",
            "description",
            "discount_type",
            "value",
            "min_subtotal_minor",
            "max_uses",
            "used_count",
            "starts_at",
            "expires_at",
            "is_active",
            "is_expired",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "used_count", "is_expired", "created_at", "updated_at"]

    def get_is_expired(self, obj):
        if obj.expires_at and timezone.now() > obj.expires_at:
            return True
        if obj.max_uses is not None and obj.used_count >= obj.max_uses:
            return True
        return False


def build_slice6_views(StoreMerchantMixin):
    """
    Factory binding Slice 6 merchant views to StoreMerchantMixin without circular imports.
    """

    class MerchantAnalyticsView(StoreMerchantMixin, APIView):
        def get(self, request, store_slug):
            from subscriptions.services import compute_plan_interval_days

            range_key = str(request.query_params.get("range", "30d")).strip().lower()
            now = timezone.now()
            today = now.date()

            if range_key == "7d":
                days = 7
                cutoff_dt = now - timedelta(days=7)
            elif range_key == "90d":
                days = 90
                cutoff_dt = now - timedelta(days=90)
            elif range_key == "all":
                days = 30
                cutoff_dt = None
            else:
                range_key = "30d"
                days = 30
                cutoff_dt = now - timedelta(days=30)

            base_orders = Order.objects.for_store(self.store)
            if cutoff_dt is not None:
                scoped_orders = list(base_orders.filter(created_at__gte=cutoff_dt).order_by("created_at"))
            else:
                scoped_orders = list(base_orders.order_by("created_at"))

            valid_orders = [
                o for o in scoped_orders if o.status not in ("CANCELLED", "PAYMENT_FAILED")
            ]

            gross_sales_minor = sum(o.total_minor for o in valid_orders)
            paid_sales_minor = sum(
                o.total_minor for o in valid_orders if o.payment_status == "PAID"
            )
            cod_pending_minor = sum(
                o.total_minor for o in valid_orders if o.payment_status == "COD_PENDING"
            )
            discounts_given_minor = sum(o.discount_minor for o in valid_orders)
            orders_count = len(valid_orders)
            aov_minor = round(gross_sales_minor / orders_count) if orders_count > 0 else 0

            # Repeat customer rate across store (excluding cancelled & failed orders)
            cust_order_counts = (
                Customer.objects.for_store(self.store)
                .annotate(
                    valid_orders=Count(
                        "orders",
                        filter=~Q(orders__status__in=["CANCELLED", "PAYMENT_FAILED"]),
                    )
                )
                .filter(valid_orders__gt=0)
                .values_list("valid_orders", flat=True)
            )
            cust_counts_list = list(cust_order_counts)
            buying_customers = len(cust_counts_list)
            repeat_customers = sum(1 for c in cust_counts_list if c >= 2)
            repeat_customer_rate_pct = (
                round((repeat_customers / buying_customers) * 100)
                if buying_customers > 0
                else 0
            )

            # Active MRR
            active_subs = (
                Subscription.objects.for_store(self.store)
                .filter(status="ACTIVE")
                .select_related("selling_plan")
            )
            active_mrr_minor = 0
            for sub in active_subs:
                interval_days = max(1, compute_plan_interval_days(sub.selling_plan))
                active_mrr_minor += round(sub.unit_price_minor * (30 / interval_days))

            # Daily chart series (up to 14 or 30 daily points for crisp Polaris bar chart)
            chart_days = 7 if range_key == "7d" else 14
            daily_map = {}
            for i in range(chart_days - 1, -1, -1):
                d = today - timedelta(days=i)
                daily_map[d.isoformat()] = {
                    "date": d.isoformat(),
                    "label": d.strftime("%b %d"),
                    "revenue_minor": 0,
                    "orders_count": 0,
                }
            for o in valid_orders:
                d_iso = timezone.localtime(o.created_at).date().isoformat()
                if d_iso in daily_map:
                    daily_map[d_iso]["revenue_minor"] += o.total_minor
                    daily_map[d_iso]["orders_count"] += 1
            daily_series = list(daily_map.values())

            # Sales by Nepal Province (all 7 provinces represented)
            prov_agg = {
                p: {"province": p, "orders_count": 0, "revenue_minor": 0}
                for p in NEPAL_PROVINCES
            }
            for o in valid_orders:
                prov = normalize_nepal_province(o.shipping_address_snapshot)
                prov_agg[prov]["orders_count"] += 1
                prov_agg[prov]["revenue_minor"] += o.total_minor

            sales_by_province = sorted(
                prov_agg.values(),
                key=lambda x: (
                    -x["revenue_minor"],
                    -x["orders_count"],
                    NEPAL_PROVINCES.index(x["province"]),
                ),
            )
            for row in sales_by_province:
                row["share_pct"] = (
                    round((row["revenue_minor"] / gross_sales_minor) * 100)
                    if gross_sales_minor > 0
                    else (
                        round((row["orders_count"] / orders_count) * 100)
                        if orders_count > 0
                        else 0
                    )
                )

            # Payment Rail Mix
            khalti_orders = [o for o in valid_orders if o.payment_method == "KHALTI" and o.total_minor > 0]
            cod_orders = [o for o in valid_orders if o.payment_method == "COD"]
            prepaid_cycle_orders = [o for o in valid_orders if o.total_minor == 0 and o.order_type == "SUBSCRIPTION_CYCLE"]

            payment_mix = []
            for code, label, bucket in [
                ("KHALTI", "Khalti Digital Wallet", khalti_orders),
                ("COD", "Cash on Delivery (COD)", cod_orders),
                ("PREPAID_CYCLE", "Prepaid Cycle Dispatch (Rs. 0)", prepaid_cycle_orders),
            ]:
                rev = sum(o.total_minor for o in bucket)
                cnt = len(bucket)
                share_pct = (
                    round((rev / gross_sales_minor) * 100)
                    if gross_sales_minor > 0
                    else (round((cnt / orders_count) * 100) if orders_count > 0 else 0)
                )
                payment_mix.append({
                    "method": code,
                    "label": label,
                    "orders_count": cnt,
                    "revenue_minor": rev,
                    "share_pct": share_pct,
                })

            # Top Products
            valid_order_ids = [o.id for o in valid_orders]
            top_products_qs = (
                OrderItem.objects.for_store(self.store)
                .filter(order_id__in=valid_order_ids)
                .values("product_name_snapshot")
                .annotate(
                    units_sold=Sum("quantity"),
                    revenue_minor=Sum("line_total_minor"),
                )
                .order_by("-revenue_minor", "-units_sold")[:6]
            )
            top_products = [
                {
                    "product_name": row["product_name_snapshot"],
                    "units_sold": row["units_sold"] or 0,
                    "revenue_minor": row["revenue_minor"] or 0,
                }
                for row in top_products_qs
            ]

            return Response({
                "range": range_key,
                "kpis": {
                    "gross_sales_minor": gross_sales_minor,
                    "paid_sales_minor": paid_sales_minor,
                    "cod_pending_minor": cod_pending_minor,
                    "discounts_given_minor": discounts_given_minor,
                    "orders_count": orders_count,
                    "aov_minor": aov_minor,
                    "repeat_customer_rate_pct": repeat_customer_rate_pct,
                    "total_customers": buying_customers,
                    "repeat_customers": repeat_customers,
                    "active_mrr_minor": active_mrr_minor,
                },
                "daily_series": daily_series,
                "sales_by_province": sales_by_province,
                "payment_mix": payment_mix,
                "top_products": top_products,
            })

    class MerchantDiscountListCreateView(StoreMerchantMixin, APIView):
        def get(self, request, store_slug):
            discounts = list(Discount.objects.for_store(self.store).order_by("-created_at", "-id"))
            serialized = DiscountSerializer(discounts, many=True).data
            active_count = sum(1 for d in serialized if d["is_active"] and not d["is_expired"])
            expired_count = sum(1 for d in serialized if d["is_expired"])
            total_redemptions = sum(d["used_count"] for d in serialized)
            return Response({
                "metrics": {
                    "active_count": active_count,
                    "expired_count": expired_count,
                    "total_redemptions": total_redemptions,
                },
                "discounts": serialized,
            })

        def post(self, request, store_slug):
            raw_code = str(request.data.get("code") or "").strip().upper()
            if not raw_code or not re.match(r"^[A-Z0-9_-]{3,32}$", raw_code):
                return Response(
                    {"error": "Promo code must be 3–32 uppercase letters, numbers, or hyphens (e.g. DASHAIN15)."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if Discount.objects.for_store(self.store).filter(code__iexact=raw_code).exists():
                return Response(
                    {"error": f"Promo code '{raw_code}' already exists in this store."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            discount_type = str(request.data.get("discount_type") or "PERCENTAGE").strip().upper()
            if discount_type not in ("PERCENTAGE", "FIXED_AMOUNT"):
                return Response(
                    {"error": "discount_type must be PERCENTAGE or FIXED_AMOUNT."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            try:
                value = int(request.data.get("value", 0))
            except (TypeError, ValueError):
                return Response({"error": "Valid discount value is required."}, status=status.HTTP_400_BAD_REQUEST)

            if discount_type == "PERCENTAGE" and not (1 <= value <= 90):
                return Response(
                    {"error": "Percentage discount must be between 1% and 90%."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if discount_type == "FIXED_AMOUNT" and value < 100:
                return Response(
                    {"error": "Fixed discount must be at least Rs. 1 (100 paisa)."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            try:
                min_subtotal_minor = max(0, int(request.data.get("min_subtotal_minor") or 0))
            except (TypeError, ValueError):
                min_subtotal_minor = 0

            raw_max = request.data.get("max_uses")
            max_uses = None
            if raw_max not in (None, ""):
                try:
                    max_uses = max(1, int(raw_max))
                except (TypeError, ValueError):
                    return Response({"error": "Invalid max_uses limit."}, status=status.HTTP_400_BAD_REQUEST)

            expires_at = None
            raw_exp = request.data.get("expires_at")
            if raw_exp:
                from django.utils.dateparse import parse_datetime, parse_date
                dt = parse_datetime(str(raw_exp))
                if dt is None:
                    d = parse_date(str(raw_exp))
                    if d is not None:
                        from datetime import datetime, time
                        dt = timezone.make_aware(datetime.combine(d, time(23, 59, 59)))
                expires_at = dt

            description = str(request.data.get("description") or "").strip()[:160]
            is_active = bool(request.data.get("is_active", True))

            discount = Discount.objects.create(
                store=self.store,
                code=raw_code,
                description=description,
                discount_type=discount_type,
                value=value,
                min_subtotal_minor=min_subtotal_minor,
                max_uses=max_uses,
                expires_at=expires_at,
                is_active=is_active,
            )

            MerchantAuditLog.objects.create(
                store=self.store,
                actor=request.user,
                action="DISCOUNT_CREATE",
                entity_type="Discount",
                entity_id=str(discount.id),
                details={
                    "code": discount.code,
                    "discount_type": discount.discount_type,
                    "value": discount.value,
                },
                ip_address=request.META.get("REMOTE_ADDR"),
            )
            return Response(DiscountSerializer(discount).data, status=status.HTTP_201_CREATED)

    class MerchantDiscountDetailView(StoreMerchantMixin, APIView):
        def get_object(self, discount_id):
            disc = Discount.objects.for_store(self.store).filter(id=discount_id).first()
            if not disc:
                raise Http404("Discount not found.")
            return disc

        def patch(self, request, store_slug, discount_id):
            disc = self.get_object(discount_id)
            data = request.data

            if "description" in data:
                disc.description = str(data["description"] or "").strip()[:160]
            if "is_active" in data:
                disc.is_active = bool(data["is_active"])
            if "value" in data:
                try:
                    val = int(data["value"])
                    if disc.discount_type == "PERCENTAGE" and not (1 <= val <= 90):
                        return Response(
                            {"error": "Percentage discount must be between 1% and 90%."},
                            status=status.HTTP_400_BAD_REQUEST,
                        )
                    if disc.discount_type == "FIXED_AMOUNT" and val < 100:
                        return Response(
                            {"error": "Fixed discount must be at least Rs. 1."},
                            status=status.HTTP_400_BAD_REQUEST,
                        )
                    disc.value = val
                except (TypeError, ValueError):
                    return Response({"error": "Invalid discount value."}, status=status.HTTP_400_BAD_REQUEST)
            if "min_subtotal_minor" in data:
                try:
                    disc.min_subtotal_minor = max(0, int(data["min_subtotal_minor"] or 0))
                except (TypeError, ValueError):
                    pass
            if "max_uses" in data:
                if data["max_uses"] in (None, ""):
                    disc.max_uses = None
                else:
                    try:
                        disc.max_uses = max(1, int(data["max_uses"]))
                    except (TypeError, ValueError):
                        pass

            disc.save()
            MerchantAuditLog.objects.create(
                store=self.store,
                actor=request.user,
                action="DISCOUNT_UPDATE",
                entity_type="Discount",
                entity_id=str(disc.id),
                details={"code": disc.code, "is_active": disc.is_active},
                ip_address=request.META.get("REMOTE_ADDR"),
            )
            return Response(DiscountSerializer(disc).data)

        def delete(self, request, store_slug, discount_id):
            disc = self.get_object(discount_id)
            code = disc.code
            disc_id = str(disc.id)
            if disc.used_count > 0:
                disc.is_active = False
                disc.save(update_fields=["is_active", "updated_at"])
                action_name = "DISCOUNT_ARCHIVE"
                detail_msg = f"Promo code {code} deactivated (preserves historical order records)."
            else:
                disc.delete()
                action_name = "DISCOUNT_DELETE"
                detail_msg = f"Promo code {code} deleted."

            MerchantAuditLog.objects.create(
                store=self.store,
                actor=request.user,
                action=action_name,
                entity_type="Discount",
                entity_id=disc_id,
                details={"code": code},
                ip_address=request.META.get("REMOTE_ADDR"),
            )
            return Response({"detail": detail_msg, "code": code})

    class MerchantStaffListCreateView(StoreMerchantMixin, APIView):
        def get(self, request, store_slug):
            memberships = (
                StoreMembership.objects.for_store(self.store)
                .select_related("user")
                .order_by("role", "created_at")
            )
            members = [
                {
                    "id": m.id,
                    "user_id": m.user_id,
                    "email": m.user.email,
                    "full_name": m.user.full_name or m.user.email.split("@")[0],
                    "phone": getattr(m.user, "phone", "") or "",
                    "role": m.role,
                    "is_current_user": m.user_id == request.user.id,
                    "created_at": m.created_at.isoformat(),
                }
                for m in memberships
            ]
            return Response({
                "current_role": self.member_role,
                "current_user_role": self.member_role,
                "members": members,
            })

        def post(self, request, store_slug):
            if self.member_role != "OWNER":
                return Response(
                    {"detail": "Only store owners can invite or manage staff members."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            email = str(request.data.get("email") or "").strip().lower()
            full_name = str(request.data.get("full_name") or "").strip()
            role = str(request.data.get("role") or "STAFF").strip().upper()

            if not email or "@" not in email:
                return Response(
                    {"error": "Please enter a valid staff email address."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if role not in ("OWNER", "STAFF"):
                return Response(
                    {"error": "Role must be OWNER or STAFF."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            with BypassRLSContext():
                target_user, _ = User.objects.get_or_create(
                    email=email,
                    defaults={"full_name": full_name or email.split("@")[0]},
                )
                if full_name and not target_user.full_name:
                    target_user.full_name = full_name
                    target_user.save(update_fields=["full_name"])

            if StoreMembership.objects.for_store(self.store).filter(user=target_user).exists():
                return Response(
                    {"error": f"{email} is already a member of {self.store.name}."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            membership = StoreMembership.objects.create(
                store=self.store,
                user=target_user,
                role=role,
            )
            MerchantAuditLog.objects.create(
                store=self.store,
                actor=request.user,
                action="STAFF_INVITE",
                entity_type="StoreMembership",
                entity_id=str(membership.id),
                details={"email": email, "role": role},
                ip_address=request.META.get("REMOTE_ADDR"),
            )
            return Response(
                {
                    "id": membership.id,
                    "user_id": target_user.id,
                    "email": target_user.email,
                    "full_name": target_user.full_name or email.split("@")[0],
                    "phone": getattr(target_user, "phone", "") or "",
                    "role": membership.role,
                    "is_current_user": target_user.id == request.user.id,
                    "created_at": membership.created_at.isoformat(),
                },
                status=status.HTTP_201_CREATED,
            )

    class MerchantStaffDetailView(StoreMerchantMixin, APIView):
        def get_object(self, membership_id):
            m = (
                StoreMembership.objects.for_store(self.store)
                .select_related("user")
                .filter(id=membership_id)
                .first()
            )
            if not m:
                raise Http404("Staff membership not found.")
            return m

        def patch(self, request, store_slug, membership_id):
            if self.member_role != "OWNER":
                return Response(
                    {"detail": "Only store owners can change staff roles."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            m = self.get_object(membership_id)
            new_role = str(request.data.get("role") or "").strip().upper()
            if new_role not in ("OWNER", "STAFF"):
                return Response({"error": "Role must be OWNER or STAFF."}, status=status.HTTP_400_BAD_REQUEST)

            if m.role == "OWNER" and new_role == "STAFF":
                owners_count = StoreMembership.objects.for_store(self.store).filter(role="OWNER").count()
                if owners_count <= 1:
                    return Response(
                        {"error": "Store must retain at least one owner."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            m.role = new_role
            m.save(update_fields=["role"])

            MerchantAuditLog.objects.create(
                store=self.store,
                actor=request.user,
                action="STAFF_ROLE_UPDATE",
                entity_type="StoreMembership",
                entity_id=str(m.id),
                details={"email": m.user.email, "role": new_role},
                ip_address=request.META.get("REMOTE_ADDR"),
            )
            return Response({
                "id": m.id,
                "user_id": m.user_id,
                "email": m.user.email,
                "full_name": m.user.full_name or m.user.email.split("@")[0],
                "role": m.role,
                "is_current_user": m.user_id == request.user.id,
                "created_at": m.created_at.isoformat(),
            })

        def delete(self, request, store_slug, membership_id):
            if self.member_role != "OWNER":
                return Response(
                    {"detail": "Only store owners can remove staff members."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            m = self.get_object(membership_id)
            if m.role == "OWNER":
                owners_count = StoreMembership.objects.for_store(self.store).filter(role="OWNER").count()
                if owners_count <= 1:
                    return Response(
                        {"error": "Cannot remove the sole owner of this store."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            removed_email = m.user.email
            m_id = str(m.id)
            m.delete()

            MerchantAuditLog.objects.create(
                store=self.store,
                actor=request.user,
                action="STAFF_REMOVE",
                entity_type="StoreMembership",
                entity_id=m_id,
                details={"email": removed_email},
                ip_address=request.META.get("REMOTE_ADDR"),
            )
            return Response({"detail": f"Removed {removed_email} from {self.store.name}."})

    return {
        "MerchantAnalyticsView": MerchantAnalyticsView,
        "MerchantDiscountListCreateView": MerchantDiscountListCreateView,
        "MerchantDiscountDetailView": MerchantDiscountDetailView,
        "MerchantStaffListCreateView": MerchantStaffListCreateView,
        "MerchantStaffDetailView": MerchantStaffDetailView,
    }
