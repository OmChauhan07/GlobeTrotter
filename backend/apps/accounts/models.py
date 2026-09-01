from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver

User = get_user_model()


class Role(models.TextChoices):
    TRAVELER = "traveler", "Traveler"
    ADMIN = "admin", "Admin"


class UserProfile(models.Model):
    Role = Role

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.TRAVELER)
    avatar_url = models.URLField(max_length=500, blank=True, default="")
    home_airport = models.CharField(max_length=50, blank=True, default="")
    currency = models.CharField(max_length=10, default="USD")
    bio = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} ({self.role})"


def get_user_role(user_obj):
    try:
        if hasattr(user_obj, "profile") and user_obj.profile:
            return str(user_obj.profile.role)
    except Exception:
        pass
    if getattr(user_obj, "is_superuser", False) or getattr(user_obj, "is_staff", False):
        return Role.ADMIN
    return Role.TRAVELER


def set_user_role(user_obj, value):
    profile, _ = UserProfile.objects.get_or_create(user=user_obj)
    profile.role = value
    profile.save()
    try:
        user_obj.profile = profile
    except Exception:
        pass


User.Role = Role
User.role = property(get_user_role, set_user_role)


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_or_save_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.get_or_create(user=instance)
    else:
        if hasattr(instance, "profile") and instance.profile:
            instance.profile.save()


class PendingRegistration(models.Model):
    email = models.EmailField(unique=True)
    password_hash = models.CharField(max_length=255)
    first_name = models.CharField(max_length=150, blank=True, default="")
    last_name = models.CharField(max_length=150, blank=True, default="")
    username = models.CharField(max_length=150, blank=True, default="")
    otp_hash = models.CharField(max_length=255)
    otp_expires_at = models.DateTimeField()
    attempt_count = models.PositiveIntegerField(default=0)
    last_sent_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"PendingRegistration<{self.email}>"


