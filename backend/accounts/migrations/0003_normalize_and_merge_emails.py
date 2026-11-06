from collections import defaultdict
from django.db import migrations, transaction


def normalize_and_merge_emails(apps, schema_editor):
    from core.tenant_context import BypassRLSContext

    with BypassRLSContext(), transaction.atomic():
        User = apps.get_model("accounts", "User")
        Customer = apps.get_model("stores", "Customer")
        Order = apps.get_model("orders", "Order")
        DeliveryAddress = apps.get_model("accounts", "DeliveryAddress")
        StoreMembership = apps.get_model("stores", "StoreMembership")

        initial_user_count = User.objects.count()
        initial_customer_count = Customer.objects.count()

        # -----------------------------------------------------------------
        # 1. Normalize and merge User accounts
        # -----------------------------------------------------------------
        users_by_normalized_email = defaultdict(list)
        for user in User.objects.all():
            norm_email = user.email.strip().lower() if user.email else ""
            users_by_normalized_email[norm_email].append(user)

        merged_users_count = 0
        normalized_users_count = 0

        for norm_email, user_list in users_by_normalized_email.items():
            if not norm_email:
                continue

            if len(user_list) == 1:
                u = user_list[0]
                if u.email != norm_email:
                    u.email = norm_email
                    u.save(update_fields=["email"])
                normalized_users_count += 1
            else:
                # Rank users: prefer superusers/staff, then users with memberships, then last_login
                def rank_user(u):
                    score = 0
                    if getattr(u, "is_superuser", False):
                        score += 100
                    if getattr(u, "is_staff", False):
                        score += 50
                    if StoreMembership.objects.filter(user=u).exists():
                        score += 25
                    if DeliveryAddress.objects.filter(user=u).exists():
                        score += 10
                    return score

                sorted_users = sorted(user_list, key=rank_user, reverse=True)
                primary_user = sorted_users[0]
                duplicate_users = sorted_users[1:]

                for dup in duplicate_users:
                    # Reassign DeliveryAddress records
                    DeliveryAddress.objects.filter(user=dup).update(user=primary_user)

                    # Reassign StoreMembership records
                    for mem in StoreMembership.objects.filter(user=dup):
                        if not StoreMembership.objects.filter(store=mem.store, user=primary_user).exists():
                            mem.user = primary_user
                            mem.save(update_fields=["user"])
                        else:
                            mem.delete()

                    # Reassign customer profiles pointing to dup
                    for cust in Customer.objects.filter(user=dup):
                        existing_primary_cust = Customer.objects.filter(
                            store=cust.store, user=primary_user
                        ).first()
                        if not existing_primary_cust:
                            cust.user = primary_user
                            cust.save(update_fields=["user"])

                    dup.delete()
                    merged_users_count += 1

                primary_user.email = norm_email
                primary_user.save(update_fields=["email"])
                normalized_users_count += 1

        # -----------------------------------------------------------------
        # 2. Normalize and merge Customer records per store
        # -----------------------------------------------------------------
        customers_by_store_and_email = defaultdict(list)
        for cust in Customer.objects.all():
            norm_email = cust.email.strip().lower() if cust.email else ""
            customers_by_store_and_email[(cust.store_id, norm_email)].append(cust)

        merged_customers_count = 0
        normalized_customers_count = 0

        for (store_id, norm_email), cust_list in customers_by_store_and_email.items():
            if not norm_email:
                continue

            if len(cust_list) == 1:
                c = cust_list[0]
                if c.email != norm_email:
                    c.email = norm_email
                    c.save(update_fields=["email"])
                normalized_customers_count += 1
            else:
                # Rank customers: prefer records with user set, then higher orders_count, then latest updated
                def rank_customer(c):
                    score = 0
                    if c.user_id is not None:
                        score += 50
                    score += getattr(c, "orders_count", 0)
                    return score

                sorted_custs = sorted(cust_list, key=rank_customer, reverse=True)
                primary_cust = sorted_custs[0]
                duplicate_custs = sorted_custs[1:]

                for dup in duplicate_custs:
                    # Repoint orders belonging to dup
                    Order.objects.filter(customer=dup).update(customer=primary_cust)

                    # Merge contact details if missing
                    if not primary_cust.phone and getattr(dup, "phone", ""):
                        primary_cust.phone = dup.phone
                    if not primary_cust.full_name and getattr(dup, "full_name", ""):
                        primary_cust.full_name = dup.full_name

                    dup.delete()
                    merged_customers_count += 1

                # Recompute orders count
                primary_cust.orders_count = Order.objects.filter(customer=primary_cust).count()
                primary_cust.email = norm_email
                primary_cust.save()
                normalized_customers_count += 1

        # -----------------------------------------------------------------
        # 3. Assertions & fail-loudly verification
        # -----------------------------------------------------------------
        final_user_count = User.objects.count()
        final_customer_count = Customer.objects.count()

        if initial_user_count > 0:
            if normalized_users_count == 0 or final_user_count == 0:
                raise RuntimeError(
                    f"User normalization assertion failed: initial={initial_user_count}, "
                    f"normalized={normalized_users_count}, final={final_user_count}"
                )
            expected_users = initial_user_count - merged_users_count
            if final_user_count != expected_users:
                raise RuntimeError(
                    f"User count mismatch: expected {expected_users}, found {final_user_count}"
                )

        if initial_customer_count > 0:
            if normalized_customers_count == 0 or final_customer_count == 0:
                raise RuntimeError(
                    f"Customer normalization assertion failed: initial={initial_customer_count}, "
                    f"normalized={normalized_customers_count}, final={final_customer_count}"
                )
            expected_customers = initial_customer_count - merged_customers_count
            if final_customer_count != expected_customers:
                raise RuntimeError(
                    f"Customer count mismatch: expected {expected_customers}, found {final_customer_count}"
                )

        # Confirm all emails in DB are strictly stripped and lowercase
        unnormalized_users = [u.id for u in User.objects.all() if u.email != u.email.strip().lower()]
        if unnormalized_users:
            raise RuntimeError(f"Unnormalized User emails detected for user IDs: {unnormalized_users}")

        unnormalized_customers = [c.id for c in Customer.objects.all() if c.email != c.email.strip().lower()]
        if unnormalized_customers:
            raise RuntimeError(f"Unnormalized Customer emails detected for customer IDs: {unnormalized_customers}")


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0002_emailotpchallenge_ip_address"),
        ("stores", "0006_store_cod_enabled_store_custom_domain"),
        ("orders", "0005_remove_subscription_fields"),
    ]

    operations = [
        migrations.RunPython(normalize_and_merge_emails, reverse_code=migrations.RunPython.noop),
    ]
