from datetime import date, time

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase

from apps.activities.models import Activity
from apps.destinations.models import City
from apps.trips.models import Trip, TripActivity, TripStop

User = get_user_model()


class TripModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="traveler@example.com", password="StrongPass123!")
        self.city = City.objects.create(name="Lisbon", country="Portugal")
        self.trip = Trip.objects.create(
            user=self.user,
            name="Portugal getaway",
            start_date=date(2026, 6, 1),
            end_date=date(2026, 6, 5),
        )
        self.trip_stop = TripStop.objects.create(
            trip=self.trip,
            city=self.city,
            start_date=date(2026, 6, 1),
            end_date=date(2026, 6, 2),
            position=1,
        )
        self.activity = Activity.objects.create(
            city=self.city,
            name="Sintra Day Trip",
            category="culture",
        )

    def test_trip_stop_date_order_validation(self):
        invalid_stop = TripStop(
            trip=self.trip,
            city=self.city,
            start_date=date(2026, 6, 3),
            end_date=date(2026, 6, 2),
            position=2,
        )

        with self.assertRaises(ValidationError):
            invalid_stop.full_clean()

    def test_trip_activity_unique_constraint(self):
        TripActivity.objects.create(
            trip_stop=self.trip_stop,
            activity=self.activity,
            date=date(2026, 6, 1),
            start_time=time(9, 0),
            end_time=time(10, 0),
            position=1,
        )

        duplicate = TripActivity(
            trip_stop=self.trip_stop,
            activity=self.activity,
            date=date(2026, 6, 1),
            start_time=time(11, 0),
            end_time=time(12, 0),
            position=2,
        )

        with self.assertRaises(ValidationError):
            duplicate.full_clean()
