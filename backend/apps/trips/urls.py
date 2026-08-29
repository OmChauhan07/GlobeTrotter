from django.urls import path

from .views import (
    ReorderTripActivitiesView,
    ReorderTripStopsView,
    TripActivityCreateView,
    TripActivityDetailView,
    TripDetailView,
    TripListCreateView,
    TripStopDetailView,
    TripStopListCreateView,
)

urlpatterns = [
    path("", TripListCreateView.as_view(), name="trip-list"),
    path("<int:pk>/", TripDetailView.as_view(), name="trip-detail"),
    path("<int:pk>/stops/", TripStopListCreateView.as_view(), name="trip-stop-list-create"),
    path("<int:pk>/reorder-stops/", ReorderTripStopsView.as_view(), name="trip-reorder-stops"),
    path("stops/<int:pk>/", TripStopDetailView.as_view(), name="stop-detail"),
    path("stops/<int:pk>/activities/", TripActivityCreateView.as_view(), name="trip-activity-create"),
    path("stops/<int:pk>/reorder-activities/", ReorderTripActivitiesView.as_view(), name="trip-activity-reorder"),
    path("trip-activities/<int:pk>/", TripActivityDetailView.as_view(), name="trip-activity-detail"),
]
