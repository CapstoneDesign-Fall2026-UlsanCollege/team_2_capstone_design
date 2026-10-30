import logging
from datetime import timedelta
from django.db import transaction
from django.utils import timezone
from orders.models import Order, OrderEvent, OrderItem
from subscriptions.models import Subscription

logger = logging.getLogger(__name__)


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

    interval_days = 30 * getattr(selling_plan, "interval_count", 1)
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
    Activates any pending subscriptions tied to an order (e.g. after Khalti verification).
    """
    updated = Subscription.objects.filter(
        order=order,
        status="PENDING_PAYMENT"
    ).update(status="ACTIVE")
    return updated


def execute_due_subscription_cycles(store=None, target_date=None):
    """
    Idempotent recurring billing runner.
    Finds active subscriptions with next_delivery_date <= target_date,
    and generates fulfillment orders.
    """
    target_date = target_date or timezone.now().date()

    query = Subscription.objects.filter(
        status="ACTIVE",
        next_delivery_date__lte=target_date,
    ).select_related("store", "customer", "variant", "variant__product", "selling_plan")

    if store:
        query = query.filter(store=store)

    generated_orders = []
    completed_subs = 0

    for sub in query:
        # Air-tight idempotency key based on subscription ID and target date
        cycle_ref = f"SUB-CYCLE-{sub.id}-{target_date.isoformat()}"

        # If an order with this cycle reference was already created, skip it
        if Order.objects.filter(store=sub.store, payment_ref=cycle_ref).exists():
            continue

        try:
            with transaction.atomic():
                is_prepaid = sub.selling_plan.is_prepaid
                inside_valley_districts = {"kathmandu", "lalitpur", "bhaktapur"}
                district = str(sub.shipping_address_snapshot.get("district", "")).lower()

                if is_prepaid:
                    # Prepaid subscription: fulfilled as zero-rupee order (customer already paid)
                    subtotal_minor = 0
                    shipping_minor = 0
                    total_minor = 0
                    order_status = "CONFIRMED"
                    payment_status = "PAID"
                    payment_method = "KHALTI"
                    item_unit_price = 0
                    item_label = f"{sub.variant.label} (Prepaid cycle fulfillment)"
                else:
                    # Pay-per-delivery subscription: renewal order requiring payment
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
                    payment_method = "COD"
                    item_unit_price = sub.unit_price_minor
                    item_label = f"{sub.variant.label} (Pay-per-delivery cycle)"

                prefix = f"{sub.store.slug[:2].upper()}-{timezone.now().year}"
                count = Order.objects.for_store(sub.store).count() + 1
                order_number = f"#{prefix}-{count:04d}"
                while Order.objects.filter(store=sub.store, order_number=order_number).exists():
                    count += 1
                    order_number = f"#{prefix}-{count:04d}"

                order = Order.objects.create(
                    store=sub.store,
                    customer=sub.customer,
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

                # Advance next delivery date by interval count
                interval_days = 30 * getattr(sub.selling_plan, "interval_count", 1)
                sub.next_delivery_date = sub.next_delivery_date + timedelta(days=interval_days)

                event_note = f"Recurring subscription cycle order created ({cycle_ref})"

                if is_prepaid and sub.cycles_remaining is not None:
                    sub.cycles_remaining = max(0, sub.cycles_remaining - 1)
                    event_note += f". {sub.cycles_remaining} cycles remaining."
                    if sub.cycles_remaining == 0:
                        sub.status = "COMPLETED"
                        completed_subs += 1

                sub.save()

                OrderEvent.objects.create(
                    store=sub.store,
                    order=order,
                    from_status="",
                    to_status=order_status,
                    note=event_note,
                )

                generated_orders.append(order)

        except Exception as e:
            logger.exception(f"Failed to process cycle for subscription {sub.id}: {e}")
            continue

    return {
        "orders_generated": len(generated_orders),
        "orders": generated_orders,
        "completed_subscriptions": completed_subs,
    }
