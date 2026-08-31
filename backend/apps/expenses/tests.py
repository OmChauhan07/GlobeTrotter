from datetime import date
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from apps.destinations.models import City
from apps.expenses.models import Expense
from apps.expenses.services.budget import calculate_trip_budget
from apps.trips.models import Trip, TripStop

User = get_user_model()


class BudgetEngineUnitTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="traveler",
            email="traveler@example.com",
            password="StrongPass123!",
        )
        self.trip = Trip.objects.create(
            user=self.user,
            name="Paris & Rome Getaway",
            start_date=date(2026, 6, 1),
            end_date=date(2026, 6, 5),  # 5 days
        )
        self.city = City.objects.create(name="Paris", country="France")
        self.stop = TripStop.objects.create(
            trip=self.trip,
            city=self.city,
            start_date=date(2026, 6, 1),
            end_date=date(2026, 6, 3),
        )

    def test_zero_expenses_calculation(self):
        result = calculate_trip_budget(self.trip)
        self.assertEqual(result["total"], 0.0)
        self.assertEqual(result["average_per_day"], 0.0)
        self.assertEqual(result["days_count"], 5)
        self.assertEqual(len(result["daily_breakdown"]), 5)
        self.assertEqual(len(result["over_budget_days"]), 0)
        for day in result["daily_breakdown"]:
            self.assertEqual(day["total"], 0.0)
            self.assertFalse(day["is_over_budget"])

    def test_multi_category_budget_calculations(self):
        # Create expenses across categories
        Expense.objects.create(
            trip=self.trip,
            trip_stop=self.stop,
            category="transport",
            name="Flight to Paris",
            amount=Decimal("400.00"),
            currency="USD",
            date=date(2026, 6, 1),
        )
        Expense.objects.create(
            trip=self.trip,
            trip_stop=self.stop,
            category="accommodation",
            name="Hotel Le Marais",
            amount=Decimal("300.00"),
            currency="USD",
            date=date(2026, 6, 1),
        )
        Expense.objects.create(
            trip=self.trip,
            trip_stop=self.stop,
            category="meals",
            name="Bistro Dinner",
            amount=Decimal("80.00"),
            currency="USD",
            date=date(2026, 6, 2),
        )
        Expense.objects.create(
            trip=self.trip,
            trip_stop=self.stop,
            category="activities",
            name="Louvre Museum Passes",
            amount=Decimal("70.00"),
            currency="USD",
            date=date(2026, 6, 3),
        )

        result = calculate_trip_budget(self.trip)
        self.assertEqual(result["total"], 850.0)
        self.assertEqual(result["days_count"], 5)
        self.assertEqual(result["average_per_day"], 170.0)  # 850 / 5 = 170.0

        # Check category breakdowns
        cats = result["category_breakdown"]
        self.assertEqual(cats["transport"]["amount"], 400.0)
        self.assertAlmostEqual(cats["transport"]["percentage"], 47.1, places=1)
        self.assertEqual(cats["accommodation"]["amount"], 300.0)
        self.assertAlmostEqual(cats["accommodation"]["percentage"], 35.3, places=1)
        self.assertEqual(cats["meals"]["amount"], 80.0)
        self.assertEqual(cats["activities"]["amount"], 70.0)
        self.assertEqual(cats["other"]["amount"], 0.0)

        # Day 1 total is 700.0, which is > 1.5 * 170 (255.0), so day 1 is over budget
        day1 = next(d for d in result["daily_breakdown"] if d["date"] == "2026-06-01")
        self.assertEqual(day1["total"], 700.0)
        self.assertTrue(day1["is_over_budget"])

        self.assertEqual(len(result["over_budget_days"]), 1)
        self.assertEqual(result["over_budget_days"][0]["date"], "2026-06-01")

    def test_single_day_trip_calculation(self):
        single_trip = Trip.objects.create(
            user=self.user,
            name="Day Trip to Kyoto",
            start_date=date(2026, 7, 10),
            end_date=date(2026, 7, 10),  # 1 day
        )
        Expense.objects.create(
            trip=single_trip,
            category="transport",
            name="Shinkansen Bullet Train",
            amount=Decimal("120.00"),
            currency="USD",
            date=date(2026, 7, 10),
        )

        result = calculate_trip_budget(single_trip)
        self.assertEqual(result["days_count"], 1)
        self.assertEqual(result["total"], 120.0)
        self.assertEqual(result["average_per_day"], 120.0)
        self.assertEqual(len(result["daily_breakdown"]), 1)


class ExpenseAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="traveler",
            email="traveler@example.com",
            password="StrongPass123!",
        )
        self.other_user = User.objects.create_user(
            username="other",
            email="other@example.com",
            password="StrongPass123!",
        )
        self.client.force_authenticate(user=self.user)
        self.trip = Trip.objects.create(
            user=self.user,
            name="Japan Summer Tour",
            start_date=date(2026, 8, 1),
            end_date=date(2026, 8, 7),
        )

    def test_create_expense_success(self):
        payload = {
            "category": "transport",
            "name": "Tokyo Metro 72hr Pass",
            "amount": "15.00",
            "currency": "USD",
            "date": "2026-08-02",
            "notes": "Purchased at Narita Airport",
        }
        response = self.client.post(f"/api/trips/{self.trip.id}/expenses/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "Tokyo Metro 72hr Pass")
        self.assertEqual(Expense.objects.filter(trip=self.trip).count(), 1)

    def test_create_expense_negative_amount_fails(self):
        payload = {
            "category": "meals",
            "name": "Ramen",
            "amount": "-15.00",
            "date": "2026-08-02",
        }
        response = self.client.post(f"/api/trips/{self.trip.id}/expenses/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_expense_outside_trip_dates_fails(self):
        payload = {
            "category": "accommodation",
            "name": "Early Hotel Booking",
            "amount": "100.00",
            "date": "2026-07-25",  # Before trip start date (2026-08-01)
        }
        response = self.client.post(f"/api/trips/{self.trip.id}/expenses/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_budget_analytics_endpoint(self):
        Expense.objects.create(
            trip=self.trip,
            category="transport",
            name="Bullet Train",
            amount=Decimal("150.00"),
            currency="USD",
            date=date(2026, 8, 1),
        )
        response = self.client.get(f"/api/trips/{self.trip.id}/budget/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total"], 150.0)
        self.assertEqual(response.data["days_count"], 7)
        self.assertIn("category_breakdown", response.data)
        self.assertIn("daily_breakdown", response.data)

    def test_delete_expense(self):
        exp = Expense.objects.create(
            trip=self.trip,
            category="meals",
            name="Sushi Lunch",
            amount=Decimal("45.00"),
            currency="USD",
            date=date(2026, 8, 3),
        )
        response = self.client.delete(f"/api/expenses/{exp.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Expense.objects.filter(id=exp.id).count(), 0)

    def test_unauthorized_user_cannot_view_or_add_expenses(self):
        self.client.force_authenticate(user=self.other_user)
        response = self.client.get(f"/api/trips/{self.trip.id}/budget/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
