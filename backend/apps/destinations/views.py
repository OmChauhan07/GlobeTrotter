from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes

from apps.destinations.models import City, SavedDestination
from apps.destinations.serializers import (
    CityDiscoverySerializer,
    CitySerializer,
    SavedDestinationSerializer,
)
from apps.destinations.services.geoapify import search_cities


class CitySearchView(APIView):
    """
    Search cities using Geoapify / Database / Curated catalog with country and text filters.
    """
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        summary="Search destinations and cities",
        description="Search world cities with auto-complete, country filters, and popularity/cost metrics.",
        parameters=[
            OpenApiParameter("q", OpenApiTypes.STR, description="Search keyword for city or country name"),
            OpenApiParameter("country", OpenApiTypes.STR, description="Country filter (name or ISO code)"),
            OpenApiParameter("limit", OpenApiTypes.INT, description="Maximum number of results to return"),
        ],
        responses={200: CityDiscoverySerializer(many=True)},
    )
    def get(self, request):
        query = request.query_params.get("q", "")
        country = request.query_params.get("country", "")
        try:
            limit = min(int(request.query_params.get("limit", 12)), 50)
        except (ValueError, TypeError):
            limit = 12

        results = search_cities(query=query, country=country, limit=limit)
        serializer = CityDiscoverySerializer(results, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CityListView(generics.ListAPIView):
    """
    List popular or saved cities in the database.
    """
    queryset = City.objects.all().order_by("-popularity", "name")
    serializer_class = CitySerializer
    permission_classes = [permissions.AllowAny]


class CityDetailView(generics.RetrieveAPIView):
    """
    Retrieve single city details.
    """
    queryset = City.objects.all()
    serializer_class = CitySerializer
    permission_classes = [permissions.AllowAny]


class CityGetOrCreateView(APIView):
    """
    Ensure a discovered city is persisted in the database, returning its primary key.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Ensure city exists in database",
        description="Receives city metadata and returns existing or newly created City record.",
        request=CityDiscoverySerializer,
        responses={200: CitySerializer, 201: CitySerializer},
    )
    def post(self, request):
        serializer = CityDiscoverySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        city, created = City.objects.get_or_create(
            name__iexact=data["name"].strip(),
            country__iexact=data["country"].strip(),
            defaults={
                "name": data["name"].strip(),
                "country": data["country"].strip(),
                "region": data.get("region", ""),
                "latitude": data.get("latitude"),
                "longitude": data.get("longitude"),
                "cost_index": data.get("cost_index", 0.0),
                "popularity": data.get("popularity", 0.0),
                "image_url": data.get("image_url", ""),
            },
        )
        return Response(
            CitySerializer(city).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class SavedDestinationListCreateView(generics.ListCreateAPIView):
    """
    List or create bookmarked destinations for the authenticated user.
    """
    serializer_class = SavedDestinationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SavedDestination.objects.filter(user=self.request.user).select_related("city")


class SavedDestinationDestroyView(generics.DestroyAPIView):
    """
    Remove a bookmarked destination.
    """
    serializer_class = SavedDestinationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SavedDestination.objects.filter(user=self.request.user)
