from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes

from apps.activities.models import Activity
from apps.activities.serializers import (
    ActivityDiscoverySerializer,
    ActivitySerializer,
)
from apps.destinations.models import City
from apps.destinations.services.geoapify import search_activities


class ActivitySearchView(APIView):
    """
    Search activities and places across Geoapify / Database / Curated catalog with category and cost filters.
    """
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        summary="Search activities and experiences",
        description="Search activities with city, category, maximum cost, duration, and keyword filters.",
        parameters=[
            OpenApiParameter("city", OpenApiTypes.STR, description="City name to search activities in"),
            OpenApiParameter("category", OpenApiTypes.STR, description="Category filter (food, culture, nature, adventure, relaxation, nightlife, other)"),
            OpenApiParameter("cost", OpenApiTypes.FLOAT, description="Maximum estimated cost filter"),
            OpenApiParameter("duration", OpenApiTypes.INT, description="Maximum duration in minutes"),
            OpenApiParameter("q", OpenApiTypes.STR, description="Search keyword for activity name or description"),
            OpenApiParameter("limit", OpenApiTypes.INT, description="Maximum number of results to return"),
        ],
        responses={200: ActivityDiscoverySerializer(many=True)},
    )
    def get(self, request):
        city = request.query_params.get("city", "")
        category = request.query_params.get("category", "")
        query = request.query_params.get("q", "")
        
        max_cost = None
        if request.query_params.get("cost"):
            try:
                max_cost = float(request.query_params.get("cost"))
            except (ValueError, TypeError):
                pass

        max_duration = None
        if request.query_params.get("duration"):
            try:
                max_duration = int(request.query_params.get("duration"))
            except (ValueError, TypeError):
                pass

        try:
            limit = min(int(request.query_params.get("limit", 20)), 50)
        except (ValueError, TypeError):
            limit = 20

        results = search_activities(
            city_name=city,
            category=category,
            max_cost=max_cost,
            max_duration=max_duration,
            query=query,
            limit=limit,
        )
        serializer = ActivityDiscoverySerializer(results, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ActivityListView(generics.ListAPIView):
    """
    List database activities with optional city and category filters.
    """
    serializer_class = ActivitySerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = Activity.objects.select_related("city").all()
        city_param = self.request.query_params.get("city")
        category_param = self.request.query_params.get("category")
        if city_param:
            qs = qs.filter(city__name__iexact=city_param.strip())
        if category_param:
            qs = qs.filter(category=category_param.strip())
        return qs


class ActivityDetailView(generics.RetrieveAPIView):
    """
    Retrieve single activity details.
    """
    queryset = Activity.objects.select_related("city").all()
    serializer_class = ActivitySerializer
    permission_classes = [permissions.AllowAny]


class ActivityGetOrCreateView(APIView):
    """
    Ensure a discovered activity is stored in the database under a matching City.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Ensure activity exists in database",
        description="Receives activity metadata and attaches or finds Activity database record.",
        request=ActivityDiscoverySerializer,
        responses={200: ActivitySerializer, 201: ActivitySerializer},
    )
    def post(self, request):
        serializer = ActivityDiscoverySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        city_name = data.get("city_name", "").strip() or "World Destination"
        city, _ = City.objects.get_or_create(
            name__iexact=city_name,
            defaults={"name": city_name, "country": "International"},
        )

        activity, created = Activity.objects.get_or_create(
            city=city,
            name__iexact=data["name"].strip(),
            defaults={
                "name": data["name"].strip(),
                "city": city,
                "description": data.get("description", ""),
                "category": data.get("category", "other"),
                "estimated_cost": data.get("estimated_cost", 0.0),
                "duration": data.get("duration", 60),
                "image_url": data.get("image_url", ""),
                "latitude": data.get("latitude"),
                "longitude": data.get("longitude"),
            },
        )
        return Response(
            ActivitySerializer(activity).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )
