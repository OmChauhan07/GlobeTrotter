from django.conf import settings
from django.db import models


class City(models.Model):
    name = models.CharField(max_length=150)
    country = models.CharField(max_length=150)
    region = models.CharField(max_length=150, blank=True, default="")
    latitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    cost_index = models.FloatField(default=0.0)
    popularity = models.FloatField(default=0.0)
    image_url = models.URLField(max_length=500, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "destinations_city"
        indexes = [models.Index(fields=["country", "name"])]
        ordering = ["name"]

    def __str__(self):
        return f"{self.name}, {self.country}"


class SavedDestination(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="saved_destinations")
    city = models.ForeignKey("City", on_delete=models.CASCADE, related_name="saved_by_users")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "destinations_saved_destination"
        unique_together = ("user", "city")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} -> {self.city}"
