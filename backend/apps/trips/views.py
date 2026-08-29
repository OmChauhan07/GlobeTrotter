from django.db import transaction
from rest_framework import generics, permissions, status
from rest_framework.response import Response

from apps.activities.models import Activity
from apps.trips.models import Trip, TripActivity, TripStop
from apps.trips.serializers import TripActivitySerializer, TripSerializer, TripStopSerializer


class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.user == request.user if hasattr(obj, "user") else obj.trip.user == request.user


class TripListCreateView(generics.ListCreateAPIView):
    serializer_class = TripSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Trip.objects.filter(user=self.request.user).order_by("-start_date")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TripDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TripSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        return Trip.objects.filter(user=self.request.user)


class TripStopListCreateView(generics.ListCreateAPIView):
    serializer_class = TripStopSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        trip = Trip.objects.get(pk=self.kwargs["pk"], user=self.request.user)
        return TripStop.objects.filter(trip=trip).order_by("position")

    def create(self, request, *args, **kwargs):
        trip = Trip.objects.get(pk=self.kwargs["pk"], user=self.request.user)
        data = request.data.copy()
        data["trip"] = trip.pk
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        trip = Trip.objects.get(pk=self.kwargs["pk"], user=self.request.user)
        serializer.save(trip=trip)


class TripStopDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TripStopSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        return TripStop.objects.filter(trip__user=self.request.user)


class TripActivityCreateView(generics.CreateAPIView):
    serializer_class = TripActivitySerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        return TripActivity.objects.filter(trip_stop__trip__user=self.request.user)

    def create(self, request, *args, **kwargs):
        stop = TripStop.objects.get(pk=self.kwargs["pk"], trip__user=self.request.user)
        data = request.data.copy()
        data["trip_stop"] = stop.pk
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        stop = TripStop.objects.get(pk=self.kwargs["pk"], trip__user=self.request.user)
        serializer.save(trip_stop=stop)


class TripActivityDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TripActivitySerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        return TripActivity.objects.filter(trip_stop__trip__user=self.request.user)


class ReorderTripStopsView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

    def patch(self, request, *args, **kwargs):
        trip = Trip.objects.get(pk=self.kwargs["pk"], user=request.user)
        order = request.data.get("order", [])

        if not order:
            return Response({"detail": "order is required."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            for index, stop_id in enumerate(order, start=1):
                stop = TripStop.objects.get(pk=stop_id, trip=trip)
                stop.position = index
                stop.save(update_fields=["position"])

        stops = TripStop.objects.filter(trip=trip).order_by("position")
        serializer = TripStopSerializer(stops, many=True)
        return Response({"stops": serializer.data}, status=status.HTTP_200_OK)


class ReorderTripActivitiesView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

    def patch(self, request, *args, **kwargs):
        stop = TripStop.objects.get(pk=self.kwargs["pk"], trip__user=request.user)
        order = request.data.get("order", [])

        if not order:
            return Response({"detail": "order is required."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            for index, activity_id in enumerate(order, start=1):
                activity = TripActivity.objects.get(pk=activity_id, trip_stop=stop)
                activity.position = index
                activity.save(update_fields=["position"])

        activities = TripActivity.objects.filter(trip_stop=stop).order_by("position")
        serializer = TripActivitySerializer(activities, many=True)
        return Response({"activities": serializer.data}, status=status.HTTP_200_OK)
