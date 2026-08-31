from rest_framework import serializers
from apps.destinations.models import City, SavedDestination


class CitySerializer(serializers.ModelSerializer):
    class Meta:
        model = City
        fields = [
            "id",
            "name",
            "country",
            "region",
            "latitude",
            "longitude",
            "cost_index",
            "popularity",
            "image_url",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class CityDiscoverySerializer(serializers.Serializer):
    id = serializers.IntegerField(allow_null=True, required=False)
    name = serializers.CharField(max_length=150)
    country = serializers.CharField(max_length=150)
    region = serializers.CharField(max_length=150, allow_blank=True, default="")
    latitude = serializers.FloatField(allow_null=True, required=False)
    longitude = serializers.FloatField(allow_null=True, required=False)
    cost_index = serializers.FloatField(default=0.0)
    popularity = serializers.FloatField(default=0.0)
    image_url = serializers.CharField(allow_blank=True, default="")
    source = serializers.CharField(default="catalog")


class SavedDestinationSerializer(serializers.ModelSerializer):
    city_name = serializers.CharField(source="city.name", read_only=True)
    country = serializers.CharField(source="city.country", read_only=True)
    image_url = serializers.CharField(source="city.image_url", read_only=True)
    cost_index = serializers.FloatField(source="city.cost_index", read_only=True)
    popularity = serializers.FloatField(source="city.popularity", read_only=True)

    class Meta:
        model = SavedDestination
        fields = [
            "id",
            "city",
            "city_name",
            "country",
            "image_url",
            "cost_index",
            "popularity",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def create(self, validated_data):
        user = self.context["request"].user
        city = validated_data["city"]
        saved, _ = SavedDestination.objects.get_or_create(user=user, city=city)
        return saved
