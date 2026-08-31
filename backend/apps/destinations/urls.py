from django.urls import path
from apps.destinations.views import (
    CityDetailView,
    CityGetOrCreateView,
    CityListView,
    CitySearchView,
    SavedDestinationDestroyView,
    SavedDestinationListCreateView,
)

urlpatterns = [
    path("cities/search/", CitySearchView.as_view(), name="city-search"),
    path("cities/get-or-create/", CityGetOrCreateView.as_view(), name="city-get-or-create"),
    path("cities/", CityListView.as_view(), name="city-list"),
    path("cities/<int:pk>/", CityDetailView.as_view(), name="city-detail"),
    path("destinations/saved/", SavedDestinationListCreateView.as_view(), name="saved-destination-list-create"),
    path("destinations/saved/<int:pk>/", SavedDestinationDestroyView.as_view(), name="saved-destination-destroy"),
]
