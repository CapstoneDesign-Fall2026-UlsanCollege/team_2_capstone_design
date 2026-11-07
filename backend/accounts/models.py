import secrets
from contextlib import nullcontext
from datetime import timedelta
from django.conf import settings
from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator
from django.db import connection, models, transaction
from django.utils import timezone
from accounts.otp import check_otp_hash, compute_otp_hash


NEPALI_MOBILE_VALIDATOR = RegexValidator(
    regex=r"^9[78]\d{8}$",
    message="Enter a 10-digit number starting with 98 or 97."
)


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email).strip().lower()
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    username = None
    email = models.EmailField(unique=True, db_index=True)
    full_name = models.CharField(max_length=150, blank=True, default="")
    phone = models.CharField(max_length=16, blank=True, default="")

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    def save(self, *args, **kwargs):
        if self.email:
            self.email = self.email.strip().lower()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.email


class EmailOTPChallenge(models.Model):
    email = models.EmailField(db_index=True)
    code_hash = models.CharField(max_length=256)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    expires_at = models.DateTimeField()
    attempt_count = models.PositiveSmallIntegerField(default=0)
    consumed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["email", "-created_at"], name="otp_email_created_idx"),
            models.Index(fields=["ip_address", "created_at"], name="otp_ip_created_idx"),
            models.Index(fields=["created_at"], name="otp_created_idx"),
        ]

    @classmethod
    def check_rate_limits(cls, email: str, ip_address: str | None = None) -> tuple[bool, str | None, int]:
        """
        Enforces rate limits using DB queries only:
        - 60s cooldown per email
        - Max 3 sends per email per 15 minutes
        - Max 10 sends per IP per hour
        Returns (is_allowed, reason, retry_after_seconds).
        """
        email = email.strip().lower()
        now = timezone.now()
        fifteen_min_ago = now - timedelta(minutes=15)

        # Single indexed query covers both 60s cooldown and 3/15min window
        recent_timestamps = list(
            cls.objects.filter(email=email, created_at__gte=fifteen_min_ago)
            .order_by("-created_at")
            .values_list("created_at", flat=True)[:3]
        )
        if recent_timestamps:
            elapsed = (now - recent_timestamps[0]).total_seconds()
            if elapsed < 60:
                return False, "COOLDOWN", max(1, int(60 - elapsed))
            if len(recent_timestamps) >= 3:
                oldest_ts = recent_timestamps[-1]
                retry_after = int(15 * 60 - (now - oldest_ts).total_seconds())
                return False, "EMAIL_LIMIT", max(1, retry_after)

        # 3. Max 10 per hour per IP
        if ip_address:
            one_hour_ago = now - timedelta(hours=1)
            recent_ip_count = cls.objects.filter(ip_address=ip_address, created_at__gte=one_hour_ago).count()
            if recent_ip_count >= 10:
                return False, "IP_LIMIT", 3600

        return True, None, 0

    @classmethod
    def issue_for_email(cls, email: str, ip_address: str | None = None) -> tuple["EmailOTPChallenge", str]:
        email = email.strip().lower()
        now = timezone.now()
        atomic_ctx = nullcontext() if connection.in_atomic_block else transaction.atomic()
        with atomic_ctx:
            # Invalidate prior unconsumed challenges for this email
            cls.objects.filter(email=email, consumed_at__isnull=True).update(consumed_at=now)

            # Generate new 6-digit code from secrets module
            raw_code = f"{secrets.randbelow(1_000_000):06d}"
            code_hash = compute_otp_hash(email, raw_code)
            expires_at = now + timedelta(minutes=10)

            challenge = cls.objects.create(
                email=email,
                code_hash=code_hash,
                ip_address=ip_address,
                expires_at=expires_at,
                attempt_count=0
            )

            # Opportunistic cleanup: delete rows older than 24h so rate-limit windows keep working
            cls.objects.filter(created_at__lt=now - timedelta(hours=24)).delete()

            return challenge, raw_code

    @classmethod
    def verify_code(cls, email: str, raw_code: str) -> bool:
        email = email.strip().lower()
        now = timezone.now()
        atomic_ctx = nullcontext() if connection.in_atomic_block else transaction.atomic()
        with atomic_ctx:
            challenge = (
                cls.objects.select_for_update()
                .filter(email=email, consumed_at__isnull=True)
                .order_by("-created_at")
                .first()
            )
            if not challenge:
                return False

            if now > challenge.expires_at or challenge.attempt_count >= 5:
                return False

            if check_otp_hash(email, raw_code, challenge.code_hash):
                challenge.consumed_at = now
                challenge.save(update_fields=["consumed_at"])
                return True
            else:
                challenge.attempt_count += 1
                challenge.save(update_fields=["attempt_count"])
                return False


class DeliveryAddress(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="delivery_addresses"
    )
    label = models.CharField(max_length=40, default="Home")
    recipient_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=10, validators=[NEPALI_MOBILE_VALIDATOR])
    province = models.CharField(max_length=80)
    district = models.CharField(max_length=80)
    municipality = models.CharField(max_length=120)
    ward = models.PositiveSmallIntegerField()
    street_landmark = models.CharField(max_length=255)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-is_default", "-created_at"]
        indexes = [
            models.Index(fields=["user", "-is_default", "-updated_at"], name="addr_user_def_upd_idx"),
        ]

    def save(self, *args, **kwargs):
        with transaction.atomic():
            existing_count = DeliveryAddress.objects.filter(user=self.user).exclude(pk=self.pk).count()
            if existing_count == 0:
                self.is_default = True
            elif self.is_default:
                DeliveryAddress.objects.filter(user=self.user).exclude(pk=self.pk).update(is_default=False)
            super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.label} - {self.recipient_name} ({self.municipality})"
