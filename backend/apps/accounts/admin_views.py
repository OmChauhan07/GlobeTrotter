from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.db.models import Count, Sum

from apps.accounts.permissions import IsAdmin
from apps.trips.models import Trip, TripStop, TripActivity
from apps.destinations.models import City
from apps.expenses.models import Expense

User = get_user_model()


class AdminAnalyticsView(APIView):
    """
    Administrative overview of GlobeTrotter platform analytics.
    Requires role='admin' or superuser.
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        total_users = User.objects.count()
        total_trips = Trip.objects.count()
        public_trips = Trip.objects.filter(is_public=True).count()
        total_stops = TripStop.objects.count()
        total_activities = TripActivity.objects.count()
        total_destinations = City.objects.count()

        expense_agg = Expense.objects.aggregate(total_spent=Sum("amount"))
        total_platform_spent = float(expense_agg["total_spent"] or 0)

        # Popular destinations by stops count
        popular_stops = (
            TripStop.objects.values("city__name", "city__country")
            .annotate(count=Count("id"))
            .order_by("-count")[:5]
        )
        popular_destinations_data = [
            {
                "name": f"{p['city__name']}, {p['city__country']}" if p.get("city__name") else "Unknown",
                "count": p["count"],
            }
            for p in popular_stops
        ]

        # Recent trips
        recent_trips = (
            Trip.objects.select_related("user")
            .order_by("-created_at")[:6]
        )
        recent_trips_data = [
            {
                "id": t.id,
                "name": t.name,
                "user": t.user.username,
                "start_date": str(t.start_date),
                "end_date": str(t.end_date),
                "is_public": t.is_public,
                "stops_count": t.stops.count(),
                "created_at": t.created_at.isoformat() if hasattr(t, "created_at") and t.created_at else "",
            }
            for t in recent_trips
        ]

        return Response(
            {
                "summary": {
                    "total_users": total_users,
                    "total_trips": total_trips,
                    "public_trips": public_trips,
                    "total_stops": total_stops,
                    "total_activities": total_activities,
                    "total_destinations": total_destinations,
                    "total_platform_spent": total_platform_spent,
                },
                "popular_destinations": popular_destinations_data,
                "recent_trips": recent_trips_data,
            },
            status=status.HTTP_200_OK,
        )
