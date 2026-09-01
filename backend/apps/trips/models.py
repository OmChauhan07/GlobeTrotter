from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

from apps.activities.models import Activity
from apps.destinations.models import City


class Trip(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="trips")
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")
    cover_image = models.URLField(max_length=500, blank=True, default="")
    cover_image_public_id = models.CharField(max_length=255, blank=True, default="")
    start_date = models.DateField()
    end_date = models.DateField()
    is_public = models.BooleanField(default=False)
    public_slug = models.SlugField(max_length=120, unique=True, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "trips_trip"
        ordering = ["-start_date"]
        indexes = [models.Index(fields=["user", "start_date"])]

    def clean(self):
        if self.start_date and self.end_date and self.start_date > self.end_date:
            raise ValidationError("start_date cannot be after end_date")

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class TripStop(models.Model):
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="stops")
    city = models.ForeignKey(City, on_delete=models.CASCADE, related_name="trip_stops")
    start_date = models.DateField()
    end_date = models.DateField()
    position = models.PositiveIntegerField(default=0)
    notes = models.TextField(blank=True, default="")

    class Meta:
        db_table = "trips_trip_stop"
        ordering = ["position"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(start_date__lte=models.F("end_date")),
                name="trip_stop_date_order_valid",
            ),
        ]

    def clean(self):
        if self.start_date and self.end_date and self.start_date > self.end_date:
            raise ValidationError("start_date cannot be after end_date")

        if self.trip and self.trip.start_date and self.start_date and self.start_date < self.trip.start_date:
            raise ValidationError("stop start_date must fall within the trip dates.")

        if self.trip and self.trip.end_date and self.end_date and self.end_date > self.trip.end_date:
            raise ValidationError("stop end_date must fall within the trip dates.")

    def save(self, *args, **kwargs):
        if not self.position and self.trip_id:
            max_pos = TripStop.objects.filter(trip_id=self.trip_id).aggregate(models.Max("position"))["position__max"] or 0
            self.position = max_pos + 1
        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.trip.name} - {self.city.name}"


class TripActivity(models.Model):
    trip_stop = models.ForeignKey(TripStop, on_delete=models.CASCADE, related_name="activities")
    activity = models.ForeignKey(Activity, on_delete=models.PROTECT, related_name="trip_activities")
    date = models.DateField()
    start_time = models.TimeField(blank=True, null=True)
    end_time = models.TimeField(blank=True, null=True)
    position = models.PositiveIntegerField(default=0)
    estimated_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    notes = models.TextField(blank=True, default="")

    class Meta:
        db_table = "trips_trip_activity"
        ordering = ["position"]
        constraints = [
            models.UniqueConstraint(fields=["trip_stop", "activity", "date"], name="unique_trip_activity_per_day"),
        ]

    def clean(self):
        if self.start_time and self.end_time and self.start_time > self.end_time:
            raise ValidationError("start_time cannot be after end_time")

        if self.trip_stop is None:
            return

        trip = self.trip_stop.trip
        if trip.start_date and self.date and self.date < trip.start_date:
            raise ValidationError("activity date must fall within the trip dates.")

        if trip.end_date and self.date and self.date > trip.end_date:
            raise ValidationError("activity date must fall within the trip dates.")

        if self.trip_stop.start_date and self.date and self.date < self.trip_stop.start_date:
            raise ValidationError("activity date must fall within the stop dates.")

        if self.trip_stop.end_date and self.date and self.date > self.trip_stop.end_date:
            raise ValidationError("activity date must fall within the stop dates.")

    def save(self, *args, **kwargs):
        if not self.position and self.trip_stop_id:
            max_pos = TripActivity.objects.filter(trip_stop_id=self.trip_stop_id).aggregate(models.Max("position"))["position__max"] or 0
            self.position = max_pos + 1
        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.activity.name} ({self.trip_stop})"
