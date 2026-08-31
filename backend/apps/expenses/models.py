from django.core.exceptions import ValidationError
from django.db import models

from apps.trips.models import Trip, TripStop


class Expense(models.Model):
    CATEGORY_CHOICES = [
        ("transport", "Transport"),
        ("accommodation", "Accommodation"),
        ("activities", "Activities"),
        ("meals", "Meals"),
        ("other", "Other"),
        # Backward-compatible aliases
        ("flight", "Flight"),
        ("lodging", "Lodging"),
        ("food", "Food"),
        ("activity", "Activity"),
        ("shopping", "Shopping"),
    ]

    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="expenses")
    trip_stop = models.ForeignKey(TripStop, on_delete=models.SET_NULL, related_name="expenses", blank=True, null=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default="other")
    name = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    currency = models.CharField(max_length=10, default="USD")
    date = models.DateField()
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "expenses_expense"
        ordering = ["-date", "-created_at"]
        indexes = [models.Index(fields=["trip", "date"])]

    def clean(self):
        if self.amount is not None and self.amount < 0:
            raise ValidationError({"amount": "Expense amount cannot be negative."})

        if self.trip and self.trip.start_date and self.date and self.date < self.trip.start_date:
            raise ValidationError({"date": f"Expense date ({self.date}) cannot be before trip start date ({self.trip.start_date})."})

        if self.trip and self.trip.end_date and self.date and self.date > self.trip.end_date:
            raise ValidationError({"date": f"Expense date ({self.date}) cannot be after trip end date ({self.trip.end_date})."})

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} - {self.amount} {self.currency}"

