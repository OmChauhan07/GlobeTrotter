from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

from rest_framework.response import Response
from rest_framework.views import APIView
from apps.accounts.admin_views import AdminAnalyticsView
from apps.trips.views import PublicTripDetailView, TripCloneView


class HealthCheckView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request, *args, **kwargs):
        return Response({"status": "ok"})


urlpatterns = [
    path("health/", HealthCheckView.as_view(), name="health-check"),
    path("accounts/", include(("apps.accounts.urls", "accounts"), namespace="accounts")),
    path("auth/", include(("apps.accounts.urls", "auth"), namespace="auth")),
    path("admin/analytics/", AdminAnalyticsView.as_view(), name="admin-analytics"),
    path("trips/", include(("apps.trips.urls", "trips"), namespace="trips")),
    path("public/trips/<slug:slug>/", PublicTripDetailView.as_view(), name="public-trip-detail"),
    path("public/trips/<slug:slug>/copy/", TripCloneView.as_view(), name="public-trip-copy"),
    path("public/trips/<slug:slug>/clone/", TripCloneView.as_view(), name="public-trip-clone"),
    path("", include("apps.destinations.urls")),
    path("", include("apps.activities.urls")),
    path("", include("apps.expenses.urls")),
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path(
        "redoc/",
        SpectacularRedocView.as_view(url_name="schema"),
        name="redoc",
    ),
]