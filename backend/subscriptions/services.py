import logging
from contextlib import nullcontext
from datetime import timedelta
from django.db import transaction
from django.utils import timezone
from core.tenant_context import TenantDatabaseContext, get_current_tenant_id
from orders.models import Order, OrderEvent, OrderItem
from stores.models import Store
from subscriptions.models import Subscription

logger = logging.getLogger(__name__)


def compute_plan_interval_days(selling_plan) -> int:
    """
    Computes cadence interval in days from SellingPlan.interval_unit and interval_count.
    Supports both WEEK (7 days * count) and MONTH (30 days * count).
    """
    unit = str(getattr(selling_plan, "interval_unit", "MONTH") or "MONTH").upper()
    count = max(1, int(getattr(selling_plan, "interval_count", 1) or 1))
    if unit == "WEEK":
        return 7 * count
    return 30 * count


def create_subscription_for_item(
    store,
    customer,
    variant,
    selling_plan,
    order,
    shipping_address,
    unit_price_minor,
    status="PENDING_PAYMENT",
):
    """
    Creates a Subscription instance from a checkout order item.
    """
    is_prepaid = selling_plan.is_prepaid
    cycles_total = selling_plan.commitment_cycles if is_prepaid else None
    # Initial order fulfills cycle 1; remaining cycles are total - 1
    cycles_remaining = (cycles_total - 1) if (is_prepaid and cycles_total) else None

    interval_days = compute_plan_interval_days(selling_plan)
    next_delivery_date = timezone.now().date() + timedelta(days=interval_days)

    return Subscription.objects.create(
        store=store,
        customer=customer,
        variant=variant,
        selling_plan=selling_plan,
        order=order,
        status=status,
        unit_price_minor=unit_price_minor,
        next_delivery_date=next_delivery_date,
        cycles_total=cycles_total,
        cycles_remaining=cycles_remaining,
        shipping_address_snapshot=shipping_address or {},
    )


def activate_order_subscriptions(order):
    """
    Activates any pending subscriptions tied to an order (e.g. after Khalti verification or COD confirmation).
    """
    updated = Subscription.objects.for_store(order.store).filter(
        order=order,
        status="PENDING_PAYMENT",
    ).update(status="ACTIVE")
    return updated


def get_pending_renewal_order(sub: Subscription):
    """
    Returns the active unpaid/failed renewal (or initial) Order for a subscription, if any.
    """
    cycle_unpaid = (
        Order.objects.for_store(sub.store)
        .filter(
            subscription=sub,
            status__in=["PENDING_PAYMENT", "PAYMENT_FAILED"],
            payment_status__in=["UNPAID", "FAILED"],
        )
        .order_by("-created_at")
        .first()
    )
    if cycle_unpaid:
        return cycle_unpaid

    # Fallback check for legacy cycle orders matched via payment_ref prefix
    legacy_unpaid = (
        Order.objects.for_store(sub.store)
        .filter(
            customer=sub.customer,
            order_type="SUBSCRIPTION_CYCLE",
            payment_ref__startswith=f"SUB-CYCLE-{sub.id}-",
            status__in=["PENDING_PAYMENT", "PAYMENT_FAILED"],
            payment_status__in=["UNPAID", "FAILED"],
        )
        .order_by("-created_at")
        .first()
    )
    if legacy_unpaid:
        return legacy_unpaid

    if sub.status == "PENDING_PAYMENT" and sub.order_id:
        orig = Order.objects.for_store(sub.store).filter(id=sub.order_id).first()
        if orig and orig.payment_status in ["UNPAID", "FAILED"] and orig.status in ["PENDING_PAYMENT", "PAYMENT_FAILED"]:
            return orig

    return None


def attach_pending_renewal_orders(store, subscriptions_list):
    """
    Batch-prefetches unpaid/failed renewal orders for a list of Subscription instances
    in a single SQL query (eliminating N+1 queries over remote Neon PostgreSQL).
    Sets sub._cached_pending_order on every item in subscriptions_list.
    """
    if not subscriptions_list:
        return subscriptions_list

    unpaid_orders = list(
        Order.objects.for_store(store)
        .filter(
            status__in=["PENDING_PAYMENT", "PAYMENT_FAILED"],
            payment_status__in=["UNPAID", "FAILED"],
        )
        .order_by("-created_at")
    )
    by_sub_id = {}
    for ord_obj in unpaid_orders:
        if ord_obj.subscription_id and ord_obj.subscription_id not in by_sub_id:
            by_sub_id[ord_obj.subscription_id] = ord_obj

    for sub in subscriptions_list:
        matched = by_sub_id.get(sub.id)
        if matched is None:
            prefix = f"SUB-CYCLE-{sub.id}-"
            for ord_obj in unpaid_orders:
                if (
                    ord_obj.customer_id == sub.customer_id
                    and ord_obj.order_type == "SUBSCRIPTION_CYCLE"
                    and (ord_obj.payment_ref or "").startswith(prefix)
                ):
                    matched = ord_obj
                    break
        if matched is None and sub.status == "PENDING_PAYMENT" and sub.order_id:
            orig = getattr(sub, "order", None)
            if orig and orig.payment_status in ["UNPAID", "FAILED"] and orig.status in ["PENDING_PAYMENT", "PAYMENT_FAILED"]:
                matched = orig
        sub._cached_pending_order = matched

    return subscriptions_list


def _build_cycle_order_for_subscription(sub: Subscription, cycle_ref: str, actor=None):
    """
    Internal atomic helper to create a fulfillment or renewal Order for a single subscription.
    Assumes caller is inside the tenant's RLS context.
    """
    with transaction.atomic():
        is_prepaid = sub.selling_plan.is_prepaid
        inside_valley_districts = {"kathmandu", "lalitpur", "bhaktapur"}
        district = str(sub.shipping_address_snapshot.get("district", "")).lower()

        if is_prepaid:
            # Prepaid subscription: fulfilled as zero-rupee order (customer already paid upfront)
            subtotal_minor = 0
            shipping_minor = 0
            total_minor = 0
            order_status = "CONFIRMED"
            payment_status = "PAID"
            payment_method = "KHALTI"
            item_unit_price = 0
            item_label = f"{sub.variant.label} (Prepaid cycle fulfillment)"
        else:
            # Pay-per-delivery subscription: renewal order requiring customer payment link confirmation
            subtotal_minor = sub.unit_price_minor
            if district in inside_valley_districts:
                shipping_minor = sub.store.inside_valley_shipping_minor
            else:
                shipping_minor = sub.store.outside_valley_shipping_minor

            if (
                sub.store.free_shipping_threshold_minor
                and subtotal_minor >= sub.store.free_shipping_threshold_minor
            ):
                shipping_minor = 0

            total_minor = subtotal_minor + shipping_minor
            order_status = "PENDING_PAYMENT"
            payment_status = "UNPAID"
            payment_method = "KHALTI"
            item_unit_price = sub.unit_price_minor
            item_label = f"{sub.variant.label} (Pay-per-delivery renewal)"

        prefix = f"{sub.store.slug[:2].upper()}-{timezone.now().year}"
        count = Order.objects.for_store(sub.store).count() + 1
        order_number = f"#{prefix}-{count:04d}"
        while Order.objects.for_store(sub.store).filter(order_number=order_number).exists():
            count += 1
            order_number = f"#{prefix}-{count:04d}"

        order = Order.objects.create(
            store=sub.store,
            customer=sub.customer,
            subscription=sub,
            order_number=order_number,
            order_type="SUBSCRIPTION_CYCLE",
            status=order_status,
            payment_method=payment_method,
            payment_status=payment_status,
            payment_ref=cycle_ref,
            subtotal_minor=subtotal_minor,
            shipping_minor=shipping_minor,
            discount_minor=0,
            total_minor=total_minor,
            currency=sub.store.currency,
            shipping_address_snapshot=sub.shipping_address_snapshot,
            is_test=True,
        )

        OrderItem.objects.create(
            store=sub.store,
            order=order,
            variant=sub.variant,
            product_name_snapshot=sub.variant.product.name,
            variant_label_snapshot=item_label,
            unit_price_minor=item_unit_price,
            quantity=1,
            line_total_minor=subtotal_minor,
        )

        # Advance next delivery date by interval
        interval_days = compute_plan_interval_days(sub.selling_plan)
        base_date = max(sub.next_delivery_date, timezone.now().date())
        sub.next_delivery_date = base_date + timedelta(days=interval_days)

        event_note = f"Subscription cycle order created ({cycle_ref})"
        completed = False

        if is_prepaid and sub.cycles_remaining is not None:
            sub.cycles_remaining = max(0, sub.cycles_remaining - 1)
            event_note += f". {sub.cycles_remaining} cycles remaining."
            if sub.cycles_remaining == 0:
                sub.status = "COMPLETED"
                completed = True

        sub.save()

        OrderEvent.objects.create(
            store=sub.store,
            order=order,
            from_status="",
            to_status=order_status,
            note=event_note,
            actor=actor,
        )

        return order, completed


def generate_subscription_renewal_order(sub: Subscription, actor=None):
    """
    Merchant-triggered renewal link / next-cycle dispatch generator.
    Idempotent: if an unpaid renewal order already exists for this subscription,
    returns (existing_order, False) without creating duplicate unpaid invoices.
    """
    if sub.status in ["CANCELLED", "COMPLETED"]:
        raise ValueError("Cannot generate a cycle order for a completed or cancelled subscription.")

    if sub.selling_plan.is_prepaid and sub.cycles_remaining is not None and sub.cycles_remaining <= 0:
        raise ValueError("No prepaid cycles remaining on this subscription.")

    ctx = (
        TenantDatabaseContext(sub.store_id)
        if str(get_current_tenant_id()) != str(sub.store_id)
        else nullcontext()
    )
    with ctx:
        existing = get_pending_renewal_order(sub)
        if existing:
            return existing, False

        today_iso = timezone.now().date().isoformat()
        seq = Order.objects.for_store(sub.store).filter(subscription=sub).count() + 1
        cycle_ref = f"SUB-CYCLE-{sub.id}-{today_iso}-M{seq}"
        order, _ = _build_cycle_order_for_subscription(sub, cycle_ref=cycle_ref, actor=actor)
        return order, True


def _execute_due_cycles_for_single_store(store: Store, target_date):
    """
    Runs due subscription cycles strictly inside a single store's PostgreSQL RLS context.
    """
    ctx = (
        TenantDatabaseContext(store.id)
        if str(get_current_tenant_id()) != str(store.id)
        else nullcontext()
    )
    generated_orders = []
    completed_subs = 0

    with ctx:
        query = (
            Subscription.objects.for_store(store)
            .filter(
                status="ACTIVE",
                next_delivery_date__lte=target_date,
            )
            .select_related("store", "customer", "variant", "variant__product", "selling_plan")
        )

        for sub in query:
            cycle_ref = f"SUB-CYCLE-{sub.id}-{target_date.isoformat()}"

            # Idempotency check across both payment_ref and OrderEvent note (survives Khalti pidx overwrite)
            already_generated = (
                Order.objects.for_store(store).filter(payment_ref=cycle_ref).exists()
                or OrderEvent.objects.for_store(store)
                .filter(order__subscription=sub, note__icontains=cycle_ref)
                .exists()
            )
            if already_generated:
                continue

            # Do not stack another unpaid invoice if a pay-per-delivery subscriber already has an unpaid renewal order
            if not sub.selling_plan.is_prepaid and get_pending_renewal_order(sub) is not None:
                continue

            try:
                order, completed = _build_cycle_order_for_subscription(sub, cycle_ref=cycle_ref)
                generated_orders.append(order)
                if completed:
                    completed_subs += 1
            except Exception as e:
                logger.exception(f"Failed to process cycle for subscription {sub.id}: {e}")
                continue

    return generated_orders, completed_subs


def execute_due_subscription_cycles(store=None, target_date=None):
    """
    Idempotent, RLS-isolated subscription cycle runner.
    Finds active subscriptions with next_delivery_date <= target_date,
    and generates Rs. 0 prepaid fulfillment orders or pay-per-delivery renewal orders.
    """
    target_date = target_date or timezone.now().date()
    all_generated_orders = []
    total_completed_subs = 0

    stores_to_process = [store] if store is not None else list(Store.objects.filter(is_active=True))

    for st in stores_to_process:
        orders, completed = _execute_due_cycles_for_single_store(st, target_date)
        all_generated_orders.extend(orders)
        total_completed_subs += completed

    return {
        "orders_generated": len(all_generated_orders),
        "orders": all_generated_orders,
        "completed_subscriptions": total_completed_subs,
    }
