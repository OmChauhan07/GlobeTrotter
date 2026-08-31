from datetime import date, time

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase

from apps.activities.models import Activity
from apps.destinations.models import City
from apps.trips.models import Trip, TripActivity, TripStop

User = get_user_model()


class TripModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="traveler", email="traveler@example.com", password="StrongPass123!")
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

    def test_trip_activity_date_must_fit_within_stop_dates(self):
        invalid_activity = TripActivity(
            trip_stop=self.trip_stop,
            activity=self.activity,
            date=date(2026, 6, 3),
            start_time=time(9, 0),
            end_time=time(10, 0),
            position=2,
        )

        with self.assertRaises(ValidationError):
            invalid_activity.full_clean()


class TripAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="traveler", email="traveler@example.com", password="StrongPass123!")
        self.other_user = User.objects.create_user(username="other", email="other@example.com", password="StrongPass123!")
        self.city = City.objects.create(name="Lisbon", country="Portugal")
        self.activity = Activity.objects.create(city=self.city, name="Tram 28", category="culture")

    def test_authenticated_user_can_crud_own_trip(self):
        payload = {
            "name": "Portugal getaway",
            "description": "Weekend trip",
            "start_date": "2026-06-01",
            "end_date": "2026-06-05",
        }

        self.client.force_authenticate(user=self.user)
        response = self.client.post(reverse("trips:trip-list"), payload, format="json")
        self.assertEqual(response.status_code, 201)

        trip_id = response.data["id"]
        self.assertEqual(self.client.get(reverse("trips:trip-list")).status_code, 200)
        self.assertEqual(self.client.get(reverse("trips:trip-detail", kwargs={"pk": trip_id})).status_code, 200)

        patch_response = self.client.patch(
            reverse("trips:trip-detail", kwargs={"pk": trip_id}),
            {"name": "Updated getaway"},
            format="json",
        )
        self.assertEqual(patch_response.status_code, 200)
        self.assertEqual(patch_response.data["name"], "Updated getaway")

        delete_response = self.client.delete(reverse("trips:trip-detail", kwargs={"pk": trip_id}))
        self.assertEqual(delete_response.status_code, 204)
        self.assertFalse(Trip.objects.filter(id=trip_id).exists())

    def test_unauthenticated_requests_fail(self):
        response = self.client.get(reverse("trips:trip-list"))
        self.assertEqual(response.status_code, 401)

    def test_user_cannot_access_another_users_trip(self):
        self.client.force_authenticate(user=self.user)
        other_trip = Trip.objects.create(
            user=self.other_user,
            name="Hidden trip",
            start_date=date(2026, 8, 1),
            end_date=date(2026, 8, 3),
        )

        response = self.client.get(reverse("trips:trip-detail", kwargs={"pk": other_trip.pk}))
        self.assertEqual(response.status_code, 404)

    def test_invalid_trip_dates_fail(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            reverse("trips:trip-list"),
            {
                "name": "Broken trip",
                "start_date": "2026-06-05",
                "end_date": "2026-06-01",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_stop_creation_and_activity_assignment_work(self):
        self.client.force_authenticate(user=self.user)
        trip = Trip.objects.create(
            user=self.user,
            name="Lisbon trip",
            start_date=date(2026, 6, 1),
            end_date=date(2026, 6, 5),
        )

        stop_response = self.client.post(
            reverse("trips:trip-stop-list-create", kwargs={"pk": trip.pk}),
            {"city": self.city.pk, "start_date": "2026-06-01", "end_date": "2026-06-02", "position": 1},
            format="json",
        )
        self.assertEqual(stop_response.status_code, 201)
        stop_id = stop_response.data["id"]

        activity_response = self.client.post(
            reverse("trips:trip-activity-create", kwargs={"pk": stop_id}),
            {
                "activity": self.activity.pk,
                "date": "2026-06-01",
                "start_time": "09:00:00",
                "end_time": "10:30:00",
                "position": 1,
            },
            format="json",
        )
        self.assertEqual(activity_response.status_code, 201)
        self.assertEqual(activity_response.data["activity"], self.activity.pk)

    def test_reorder_operations_persist(self):
        self.client.force_authenticate(user=self.user)
        trip = Trip.objects.create(
            user=self.user,
            name="Reorder trip",
            start_date=date(2026, 6, 1),
            end_date=date(2026, 6, 8),
        )
        stop_1 = TripStop.objects.create(trip=trip, city=self.city, start_date=date(2026, 6, 1), end_date=date(2026, 6, 2), position=1)
        stop_2 = TripStop.objects.create(trip=trip, city=self.city, start_date=date(2026, 6, 3), end_date=date(2026, 6, 4), position=2)
        stop_3 = TripStop.objects.create(trip=trip, city=self.city, start_date=date(2026, 6, 5), end_date=date(2026, 6, 6), position=3)

        reorder_response = self.client.patch(
            reverse("trips:trip-reorder-stops", kwargs={"pk": trip.pk}),
            {"order": [stop_3.pk, stop_1.pk, stop_2.pk]},
            format="json",
        )
        self.assertEqual(reorder_response.status_code, 200)
        self.assertEqual([item["id"] for item in reorder_response.data["stops"]], [stop_3.pk, stop_1.pk, stop_2.pk])

        activity_1 = TripActivity.objects.create(
            trip_stop=stop_1,
            activity=self.activity,
            date=date(2026, 6, 1),
            start_time=time(9, 0),
            end_time=time(10, 0),
            position=1,
        )
        activity_2 = TripActivity.objects.create(
            trip_stop=stop_1,
            activity=self.activity,
            date=date(2026, 6, 2),
            start_time=time(11, 0),
            end_time=time(12, 0),
            position=2,
        )

        activity_reorder = self.client.patch(
            reverse("trips:trip-activity-reorder", kwargs={"pk": stop_1.pk}),
            {"order": [activity_2.pk, activity_1.pk]},
            format="json",
        )
        self.assertEqual(activity_reorder.status_code, 200)
        self.assertEqual([item["id"] for item in activity_reorder.data["activities"]], [activity_2.pk, activity_1.pk])

    def test_stop_date_outside_trip_range_fails(self):
        self.client.force_authenticate(user=self.user)
        trip = Trip.objects.create(
            user=self.user,
            name="Date test trip",
            start_date=date(2026, 6, 1),
            end_date=date(2026, 6, 5),
        )

        response = self.client.post(
            reverse("trips:trip-stop-list-create", kwargs={"pk": trip.pk}),
            {"city": self.city.pk, "start_date": "2026-05-30", "end_date": "2026-06-02"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

        response2 = self.client.post(
            reverse("trips:trip-stop-list-create", kwargs={"pk": trip.pk}),
            {"city": self.city.pk, "start_date": "2026-06-02", "end_date": "2026-06-10"},
            format="json",
        )
        self.assertEqual(response2.status_code, 400)

    def test_activity_date_outside_stop_range_fails(self):
        self.client.force_authenticate(user=self.user)
        trip = Trip.objects.create(
            user=self.user,
            name="Activity date trip",
            start_date=date(2026, 6, 1),
            end_date=date(2026, 6, 10),
        )
        stop = TripStop.objects.create(
            trip=trip,
            city=self.city,
            start_date=date(2026, 6, 2),
            end_date=date(2026, 6, 4),
        )

        response = self.client.post(
            reverse("trips:trip-activity-create", kwargs={"pk": stop.pk}),
            {
                "activity": self.activity.pk,
                "date": "2026-06-05",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_stop_and_activity_deletion(self):
        self.client.force_authenticate(user=self.user)
        trip = Trip.objects.create(
            user=self.user,
            name="Delete test trip",
            start_date=date(2026, 6, 1),
            end_date=date(2026, 6, 10),
        )
        stop = TripStop.objects.create(
            trip=trip,
            city=self.city,
            start_date=date(2026, 6, 2),
            end_date=date(2026, 6, 4),
        )
        activity = TripActivity.objects.create(
            trip_stop=stop,
            activity=self.activity,
            date=date(2026, 6, 2),
        )

        act_del = self.client.delete(reverse("trips:trip-activity-detail", kwargs={"pk": activity.pk}))
        self.assertEqual(act_del.status_code, 204)
        self.assertFalse(TripActivity.objects.filter(pk=activity.pk).exists())

        stop_del = self.client.delete(reverse("trips:stop-detail", kwargs={"pk": stop.pk}))
        self.assertEqual(stop_del.status_code, 204)
        self.assertFalse(TripStop.objects.filter(pk=stop.pk).exists())

    def test_auto_position_assignment_for_stops_and_activities(self):
        self.client.force_authenticate(user=self.user)
        trip = Trip.objects.create(
            user=self.user,
            name="Auto pos trip",
            start_date=date(2026, 6, 1),
            end_date=date(2026, 6, 10),
        )
        stop1 = TripStop.objects.create(trip=trip, city=self.city, start_date=date(2026, 6, 1), end_date=date(2026, 6, 3))
        stop2 = TripStop.objects.create(trip=trip, city=self.city, start_date=date(2026, 6, 4), end_date=date(2026, 6, 6))

        self.assertEqual(stop1.position, 1)
        self.assertEqual(stop2.position, 2)

