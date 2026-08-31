from rest_framework import generics, permissions, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes

from apps.expenses.models import Expense
from apps.expenses.serializers import ExpenseSerializer, TripBudgetSerializer
from apps.expenses.services.budget import calculate_trip_budget
from apps.trips.models import Trip


class IsTripOwnerPermission(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if hasattr(obj, "user"):
            return obj.user == request.user
        if hasattr(obj, "trip"):
            return obj.trip.user == request.user
        return False


class TripBudgetAnalyticsView(APIView):
    """
    Get calculated trip budget analytics, category breakdowns, daily timeline, and over-budget alerts.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Get trip budget analytics",
        description="Calculates total expenses, category distribution, daily breakdown, and over-budget days.",
        parameters=[
            OpenApiParameter("daily_limit", OpenApiTypes.FLOAT, description="Optional custom daily budget limit for over-budget detection"),
        ],
        responses={200: TripBudgetSerializer},
    )
    def get(self, request, pk):
        trip = generics.get_object_or_404(Trip, pk=pk)
        if trip.user != request.user and not trip.is_public:
            raise PermissionDenied("You do not have permission to view this trip's budget.")

        daily_limit = None
        if request.query_params.get("daily_limit"):
            try:
                daily_limit = float(request.query_params.get("daily_limit"))
            except (ValueError, TypeError):
                pass

        budget_data = calculate_trip_budget(trip, daily_budget_limit=daily_limit)
        serializer = TripBudgetSerializer(budget_data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class TripExpenseListCreateView(generics.ListCreateAPIView):
    """
    List or create expenses logged for a trip.
    """
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_trip(self):
        trip = generics.get_object_or_404(Trip, pk=self.kwargs["pk"])
        if trip.user != self.request.user and not trip.is_public:
            raise PermissionDenied("You do not have permission to view this trip's expenses.")
        return trip

    def get_queryset(self):
        trip = self.get_trip()
        return Expense.objects.filter(trip=trip).select_related("trip_stop", "trip_stop__city")

    def perform_create(self, serializer):
        trip = self.get_trip()
        if trip.user != self.request.user:
            raise PermissionDenied("You can only add expenses to your own trips.")
        serializer.save(trip=trip)


class ExpenseDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a single expense.
    """
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated, IsTripOwnerPermission]
    queryset = Expense.objects.select_related("trip", "trip_stop", "trip_stop__city").all()
