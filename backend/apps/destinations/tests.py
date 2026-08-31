from unittest.mock import patch
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from apps.destinations.models import City, SavedDestination
from apps.destinations.services.geoapify import search_cities

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


class CityDiscoveryAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="traveler",
            email="traveler@example.com",
            password="StrongPass123!",
        )

    def test_city_search_fallback_catalog(self):
        response = self.client.get("/api/cities/search/", {"q": "Tokyo"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertTrue(any(c["name"] == "Tokyo" for c in response.data))

    def test_city_search_country_filter(self):
        response = self.client.get("/api/cities/search/", {"country": "Japan"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(all(c["country"] == "Japan" for c in response.data))

    @patch("apps.destinations.services.geoapify.make_geoapify_request")
    def test_city_search_geoapify_mock_success(self, mock_request):
        mock_request.return_value = {
            "results": [
                {
                    "city": "Kyoto",
                    "country": "Japan",
                    "state": "Kansai",
                    "lat": 35.0116,
                    "lon": 135.7681,
                    "formatted": "Kyoto, Japan",
                }
            ]
        }

        with self.settings(GEOAPIFY_API_KEY="test-fake-key"):
            results = search_cities("Kyoto")
            self.assertTrue(any(c["name"] == "Kyoto" for c in results))
            self.assertEqual(results[0]["source"], "geoapify")

    @patch("apps.destinations.services.geoapify.make_geoapify_request")
    def test_city_search_geoapify_network_failure_fallback(self, mock_request):
        mock_request.return_value = None  # Simulates network timeout or HTTP failure

        with self.settings(GEOAPIFY_API_KEY="test-fake-key"):
            results = search_cities("Paris")
            self.assertTrue(any(c["name"] == "Paris" for c in results))
            # Should have fallen back to database or catalog
            self.assertIn(results[0]["source"], ["database", "catalog"])

    def test_city_get_or_create(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            "name": "Barcelona",
            "country": "Spain",
            "region": "Catalonia",
            "cost_index": 3.0,
            "popularity": 4.8,
            "image_url": "https://example.com/barcelona.jpg",
        }
        response = self.client.post("/api/cities/get-or-create/", payload, format="json")
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])
        self.assertEqual(response.data["name"], "Barcelona")
        self.assertTrue(City.objects.filter(name__iexact="Barcelona").exists())

    def test_saved_destinations_crud(self):
        self.client.force_authenticate(user=self.user)
        city = City.objects.create(name="Sydney", country="Australia")

        # Save destination
        post_res = self.client.post("/api/destinations/saved/", {"city": city.id}, format="json")
        self.assertEqual(post_res.status_code, status.HTTP_201_CREATED)
        saved_id = post_res.data["id"]

        # List saved destinations
        list_res = self.client.get("/api/destinations/saved/")
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_res.data), 1)
        self.assertEqual(list_res.data[0]["city_name"], "Sydney")

        # Delete saved destination
        del_res = self.client.delete(f"/api/destinations/saved/{saved_id}/")
        self.assertEqual(del_res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(SavedDestination.objects.filter(user=self.user).count(), 0)
