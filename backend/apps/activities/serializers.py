from rest_framework import serializers
from apps.activities.models import Activity
from apps.destinations.models import City


class ActivitySerializer(serializers.ModelSerializer):
    city_name = serializers.CharField(source="city.name", read_only=True)
    city_country = serializers.CharField(source="city.country", read_only=True)

    class Meta:
        model = Activity
        fields = [
            "id",
            "city",
            "city_name",
            "city_country",
            "name",
            "description",
            "category",
            "estimated_cost",
            "duration",
            "image_url",
            "latitude",
            "longitude",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class ActivityDiscoverySerializer(serializers.Serializer):
    id = serializers.IntegerField(allow_null=True, required=False)
    name = serializers.CharField(max_length=200)
    city_name = serializers.CharField(max_length=150)
    description = serializers.CharField(allow_blank=True, default="")
    category = serializers.CharField(max_length=50, default="other")
    estimated_cost = serializers.FloatField(default=0.0)
    duration = serializers.IntegerField(default=60)
    image_url = serializers.CharField(allow_blank=True, default="")
    latitude = serializers.FloatField(allow_null=True, required=False)
    longitude = serializers.FloatField(allow_null=True, required=False)
    source = serializers.CharField(default="catalog")
