from django.urls import path
from apps.activities.views import (
    ActivityDetailView,
    ActivityGetOrCreateView,
    ActivityListView,
    ActivitySearchView,
)

urlpatterns = [
    path("activities/search/", ActivitySearchView.as_view(), name="activity-search"),
    path("activities/get-or-create/", ActivityGetOrCreateView.as_view(), name="activity-get-or-create"),
    path("activities/", ActivityListView.as_view(), name="activity-list"),
    path("activities/<int:pk>/", ActivityDetailView.as_view(), name="activity-detail"),
]
