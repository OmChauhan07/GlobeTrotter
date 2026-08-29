from django.conf import settings
from django.db import models

from apps.trips.models import Trip


class TripShare(models.Model):
    PERMISSION_CHOICES = [
        ("view", "View"),
        ("edit", "Edit"),
        ("owner", "Owner"),
    ]

    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="shares")
    shared_with_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="shared_trips")
    permission = models.CharField(max_length=20, choices=PERMISSION_CHOICES, default="view")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "sharing_trip_share"
        unique_together = ("trip", "shared_with_user")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.trip} shared with {self.shared_with_user}"
