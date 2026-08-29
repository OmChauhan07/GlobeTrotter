from django.db import models

from apps.destinations.models import City


class Activity(models.Model):
    CATEGORY_CHOICES = [
        ("food", "Food"),
        ("culture", "Culture"),
        ("nature", "Nature"),
        ("adventure", "Adventure"),
        ("relaxation", "Relaxation"),
        ("nightlife", "Nightlife"),
        ("other", "Other"),
    ]

    city = models.ForeignKey(City, on_delete=models.CASCADE, related_name="activities")
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default="other")
    estimated_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    duration = models.PositiveIntegerField(default=60, help_text="Minutes")
    image_url = models.URLField(max_length=500, blank=True, default="")
    latitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "activities_activity"
        indexes = [models.Index(fields=["city", "category"])]
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.city})"
