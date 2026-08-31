from unittest.mock import patch
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from apps.activities.models import Activity
from apps.destinations.models import City
from apps.destinations.services.geoapify import search_activities

User = get_user_model()


class ActivityDiscoveryAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="traveler",
            email="traveler@example.com",
            password="StrongPass123!",
        )
        self.city = City.objects.create(name="Paris", country="France")
        self.activity = Activity.objects.create(
            city=self.city,
            name="Eiffel Tower Summit Access",
            description="Climb the Eiffel tower and enjoy views of the city",
            category="culture",
            estimated_cost=30.00,
            duration=120,
        )

    def test_activity_search_by_city(self):
        response = self.client.get("/api/activities/search/", {"city": "Paris"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertTrue(any(a["city_name"] == "Paris" for a in response.data))

    def test_activity_search_by_category(self):
        response = self.client.get("/api/activities/search/", {"city": "Paris", "category": "food"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(all(a["category"] == "food" for a in response.data))

    def test_activity_search_by_cost_and_duration_filter(self):
        response = self.client.get("/api/activities/search/", {
            "city": "Paris",
            "cost": 35.00,
            "duration": 100,
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for act in response.data:
            self.assertLessEqual(act["estimated_cost"], 35.00)
            self.assertLessEqual(act["duration"], 100)

    @patch("apps.destinations.services.geoapify.make_geoapify_request")
    def test_activity_search_geoapify_mock_success(self, mock_request):
        def side_effect(url, timeout=5):
            if "geocode" in url:
                return {
                    "results": [
                        {
                            "city": "Paris",
                            "country": "France",
                            "lat": 48.8566,
                            "lon": 2.3522,
                        }
                    ]
                }
            if "places" in url:
                return {
                    "features": [
                        {
                            "properties": {
                                "name": "Orsay Museum",
                                "formatted": "Orsay Museum, Paris, France",
                                "categories": ["entertainment.museum"],
                                "lat": 48.8600,
                                "lon": 2.3266,
                            }
                        }
                    ]
                }
            return None

        mock_request.side_effect = side_effect

        with self.settings(GEOAPIFY_API_KEY="test-fake-key"):
            results = search_activities(city_name="Paris")
            self.assertTrue(any(a["name"] == "Orsay Museum" for a in results))
            matched = next(a for a in results if a["name"] == "Orsay Museum")
            self.assertEqual(matched["category"], "culture")
            self.assertEqual(matched["source"], "geoapify")

    def test_activity_get_or_create(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            "name": "Senso-ji Temple Walk",
            "city_name": "Tokyo",
            "description": "Tokyo's oldest and most significant Buddhist temple.",
            "category": "culture",
            "estimated_cost": 0.0,
            "duration": 60,
            "image_url": "https://example.com/sensoji.jpg",
        }
        response = self.client.post("/api/activities/get-or-create/", payload, format="json")
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])
        self.assertEqual(response.data["name"], "Senso-ji Temple Walk")
        self.assertTrue(Activity.objects.filter(name__iexact="Senso-ji Temple Walk").exists())
