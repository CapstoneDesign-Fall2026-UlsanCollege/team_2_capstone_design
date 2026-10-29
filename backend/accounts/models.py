import secrets
from datetime import timedelta
from django.conf import settings
from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.hashers import check_password, make_password
from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator
from django.db import models, transaction
from django.utils import timezone


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

    def __str__(self):
        return self.email


class EmailOTPChallenge(models.Model):
    email = models.EmailField(db_index=True)
    code_hash = models.CharField(max_length=256)
    expires_at = models.DateTimeField()
    attempt_count = models.PositiveSmallIntegerField(default=0)
    consumed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    @classmethod
    def issue_for_email(cls, email: str) -> tuple["EmailOTPChallenge", str]:
        email = email.strip().lower()
        now = timezone.now()
        with transaction.atomic():
            cls.objects.filter(email=email, consumed_at__isnull=True).update(consumed_at=now)
            raw_code = f"{secrets.randbelow(1_000_000):06d}"
            code_hash = make_password(raw_code)
            expires_at = now + timedelta(minutes=10)
            challenge = cls.objects.create(
                email=email,
                code_hash=code_hash,
                expires_at=expires_at,
                attempt_count=0
            )
            return challenge, raw_code

    @classmethod
    def verify_code(cls, email: str, raw_code: str) -> bool:
        email = email.strip().lower()
        now = timezone.now()
        with transaction.atomic():
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

            if check_password(raw_code, challenge.code_hash):
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
