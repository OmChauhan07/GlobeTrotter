from django.db import transaction
from rest_framework import generics, permissions, status
from rest_framework.response import Response

from apps.activities.models import Activity
from apps.trips.models import Trip, TripActivity, TripStop
from apps.trips.serializers import (
    PublicTripSerializer,
    TripActivitySerializer,
    TripCloneResponseSerializer,
    TripSerializer,
    TripStopSerializer,
)


class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if hasattr(obj, "user"):
            return obj.user == request.user
        if hasattr(obj, "trip"):
            return obj.trip.user == request.user
        if hasattr(obj, "trip_stop"):
            return obj.trip_stop.trip.user == request.user
        return False


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
        trip = generics.get_object_or_404(Trip, pk=self.kwargs["pk"], user=self.request.user)
        return TripStop.objects.filter(trip=trip).order_by("position")

    def create(self, request, *args, **kwargs):
        trip = generics.get_object_or_404(Trip, pk=self.kwargs["pk"], user=self.request.user)
        data = request.data.copy()
        data["trip"] = trip.pk
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        trip = generics.get_object_or_404(Trip, pk=self.kwargs["pk"], user=self.request.user)
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
        stop = generics.get_object_or_404(TripStop, pk=self.kwargs["pk"], trip__user=self.request.user)
        data = request.data.copy()
        data["trip_stop"] = stop.pk
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        stop = generics.get_object_or_404(TripStop, pk=self.kwargs["pk"], trip__user=self.request.user)
        serializer.save(trip_stop=stop)


class TripActivityDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TripActivitySerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        return TripActivity.objects.filter(trip_stop__trip__user=self.request.user)


class ReorderTripStopsView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

    def patch(self, request, *args, **kwargs):
        trip = generics.get_object_or_404(Trip, pk=self.kwargs["pk"], user=request.user)
        order = request.data.get("order", [])

        if not isinstance(order, list) or not order:
            return Response({"detail": "order must be a non-empty list of stop IDs."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            for index, stop_id in enumerate(order, start=1):
                TripStop.objects.filter(pk=stop_id, trip=trip).update(position=index)

        stops = TripStop.objects.filter(trip=trip).order_by("position")
        serializer = TripStopSerializer(stops, many=True)
        return Response({"stops": serializer.data}, status=status.HTTP_200_OK)


class ReorderTripActivitiesView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

    def patch(self, request, *args, **kwargs):
        stop = generics.get_object_or_404(TripStop, pk=self.kwargs["pk"], trip__user=request.user)
        order = request.data.get("order", [])

        if not isinstance(order, list) or not order:
            return Response({"detail": "order must be a non-empty list of activity IDs."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            for index, activity_id in enumerate(order, start=1):
                TripActivity.objects.filter(pk=activity_id, trip_stop=stop).update(position=index)

        activities = TripActivity.objects.filter(trip_stop=stop).order_by("position")
        serializer = TripActivitySerializer(activities, many=True)
        return Response({"activities": serializer.data}, status=status.HTTP_200_OK)


class PublicTripDetailView(generics.RetrieveAPIView):
    """
    Public view for viewing a published trip and its complete itinerary by public_slug.
    """
    serializer_class = PublicTripSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "public_slug"
    lookup_url_kwarg = "slug"

    def get_queryset(self):
        return Trip.objects.filter(is_public=True).select_related("user").prefetch_related("stops", "stops__activities", "stops__city")


class TripPublishToggleView(generics.GenericAPIView):
    """
    Toggle a trip's public sharing status and return the share slug and URL.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        import uuid
        from django.utils.text import slugify

        trip = generics.get_object_or_404(Trip, pk=self.kwargs["pk"], user=request.user)
        is_public_param = request.data.get("is_public")

        if is_public_param is not None:
            trip.is_public = bool(is_public_param)
        else:
            trip.is_public = not trip.is_public

        if trip.is_public and not trip.public_slug:
            base_slug = slugify(trip.name)[:60] or "trip"
            unique_suffix = uuid.uuid4().hex[:8]
            trip.public_slug = f"{base_slug}-{unique_suffix}"

        trip.save()
        return Response({
            "id": trip.id,
            "name": trip.name,
            "is_public": trip.is_public,
            "public_slug": trip.public_slug,
            "share_url": f"/public/trip/{trip.public_slug}" if trip.public_slug else None,
        }, status=status.HTTP_200_OK)


class TripCloneView(generics.GenericAPIView):
    """
    Deep-clone an entire trip, its stops, and its activities into the current user's account.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        pk = self.kwargs.get("pk")
        slug = self.kwargs.get("slug")

        if pk:
            source_trip = generics.get_object_or_404(Trip, pk=pk)
            if source_trip.user != request.user and not source_trip.is_public:
                return Response({"detail": "You do not have permission to clone this trip."}, status=status.HTTP_403_FORBIDDEN)
        elif slug:
            source_trip = generics.get_object_or_404(Trip, public_slug=slug, is_public=True)
        else:
            return Response({"detail": "Target trip not specified."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            new_trip_name = request.data.get("name") or f"Copy of {source_trip.name}"
            new_trip = Trip.objects.create(
                user=request.user,
                name=new_trip_name,
                description=source_trip.description,
                cover_image=source_trip.cover_image,
                start_date=source_trip.start_date,
                end_date=source_trip.end_date,
                is_public=False,
            )

            # Duplicate all stops and nested activities
            for stop in source_trip.stops.order_by("position"):
                new_stop = TripStop.objects.create(
                    trip=new_trip,
                    city=stop.city,
                    start_date=stop.start_date,
                    end_date=stop.end_date,
                    position=stop.position,
                    notes=stop.notes,
                )

                for act in stop.activities.order_by("position"):
                    TripActivity.objects.create(
                        trip_stop=new_stop,
                        activity=act.activity,
                        date=act.date,
                        start_time=act.start_time,
                        end_time=act.end_time,
                        position=act.position,
                        estimated_cost=act.estimated_cost,
                        notes=act.notes,
                    )

        return Response({
            "detail": "Trip cloned successfully.",
            "trip": TripSerializer(new_trip).data,
        }, status=status.HTTP_201_CREATED)
