from django.contrib.auth import get_user_model
from django.test import TestCase

from apps.destinations.models import City, SavedDestination

User = get_user_model()


class DestinationModelTests(TestCase):
    def test_saved_destination_unique_per_user(self):
        user = User.objects.create_user(username="testuser", email="user@example.com", password="StrongPass123!")
        city = City.objects.create(name="Paris", country="France")

        SavedDestination.objects.create(user=user, city=city)

        self.assertEqual(SavedDestination.objects.filter(user=user, city=city).count(), 1)

    def test_city_string_representation(self):
        city = City.objects.create(name="Rome", country="Italy")

        self.assertIn("Rome", str(city))
