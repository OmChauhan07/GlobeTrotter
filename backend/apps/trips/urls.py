from django.urls import path

from .views import (
    PublicTripDetailView,
    ReorderTripActivitiesView,
    ReorderTripStopsView,
    TripActivityCreateView,
    TripActivityDetailView,
    TripCloneView,
    TripCoverUploadView,
    TripDetailView,
    TripListCreateView,
    TripPublishToggleView,
    TripStopDetailView,
    TripStopListCreateView,
)

urlpatterns = [
    path("", TripListCreateView.as_view(), name="trip-list"),
    path("public/<slug:slug>/", PublicTripDetailView.as_view(), name="trip-public-detail"),
    path("public/<slug:slug>/copy/", TripCloneView.as_view(), name="trip-public-copy"),
    path("public/<slug:slug>/clone/", TripCloneView.as_view(), name="trip-public-clone"),
    path("<int:pk>/", TripDetailView.as_view(), name="trip-detail"),
    path("<int:pk>/cover/", TripCoverUploadView.as_view(), name="trip-cover-upload"),
    path("<int:pk>/publish/", TripPublishToggleView.as_view(), name="trip-publish-toggle"),
    path("<int:pk>/copy/", TripCloneView.as_view(), name="trip-copy"),
    path("<int:pk>/clone/", TripCloneView.as_view(), name="trip-clone"),
    path("<int:pk>/stops/", TripStopListCreateView.as_view(), name="trip-stop-list-create"),
    path("<int:pk>/reorder-stops/", ReorderTripStopsView.as_view(), name="trip-reorder-stops"),
    path("stops/<int:pk>/", TripStopDetailView.as_view(), name="stop-detail"),
    path("stops/<int:pk>/activities/", TripActivityCreateView.as_view(), name="trip-activity-create"),
    path("stops/<int:pk>/reorder-activities/", ReorderTripActivitiesView.as_view(), name="trip-activity-reorder"),
    path("trip-activities/<int:pk>/", TripActivityDetailView.as_view(), name="trip-activity-detail"),
]
