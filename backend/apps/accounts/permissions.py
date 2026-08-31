from rest_framework.permissions import BasePermission
from django.contrib.auth import get_user_model

User = get_user_model()


class IsAdmin(BasePermission):
    """
    Allows access only to authenticated users with role='admin' or superusers/staff.
    """

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False

        if getattr(user, "is_superuser", False) or getattr(user, "is_staff", False):
            return True

        if hasattr(user, "profile") and user.profile:
            return user.profile.role == "admin"

        return getattr(user, "role", "traveler") == "admin"


class IsTraveler(BasePermission):
    """
    Allows access to authenticated travelers.
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)
