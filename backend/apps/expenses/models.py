from django.db import models

from apps.trips.models import Trip, TripStop


class Expense(models.Model):
    CATEGORY_CHOICES = [
        ("flight", "Flight"),
        ("lodging", "Lodging"),
        ("food", "Food"),
        ("transport", "Transport"),
        ("activity", "Activity"),
        ("shopping", "Shopping"),
        ("other", "Other"),
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
        ordering = ["-date"]
        indexes = [models.Index(fields=["trip", "date"])]

    def __str__(self):
        return f"{self.name} - {self.amount} {self.currency}"
