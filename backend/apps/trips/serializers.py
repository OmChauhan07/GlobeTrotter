from django.db import transaction
from rest_framework import serializers

from apps.activities.models import Activity
from apps.destinations.models import City
from apps.trips.models import Trip, TripActivity, TripStop


class TripSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trip
        fields = [
            "id",
            "name",
            "description",
            "cover_image",
            "start_date",
            "end_date",
            "is_public",
            "public_slug",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "public_slug"]

    def validate(self, attrs):
        start_date = attrs.get("start_date", getattr(self.instance, "start_date", None))
        end_date = attrs.get("end_date", getattr(self.instance, "end_date", None))

        if start_date and end_date and start_date > end_date:
            raise serializers.ValidationError({"detail": "start_date cannot be after end_date"})

        return attrs


class TripStopSerializer(serializers.ModelSerializer):
    class Meta:
        model = TripStop
        fields = [
            "id",
            "trip",
            "city",
            "start_date",
            "end_date",
            "position",
            "notes",
        ]
        read_only_fields = ["id"]

    def validate(self, attrs):
        trip = attrs.get("trip", getattr(self.instance, "trip", None))
        start_date = attrs.get("start_date", getattr(self.instance, "start_date", None))
        end_date = attrs.get("end_date", getattr(self.instance, "end_date", None))
        city = attrs.get("city", getattr(self.instance, "city", None))

        if not trip or not city:
            raise serializers.ValidationError({"detail": "trip and city are required."})

        if start_date and end_date and start_date > end_date:
            raise serializers.ValidationError({"detail": "start_date cannot be after end_date"})

        if trip.start_date and start_date and start_date < trip.start_date:
            raise serializers.ValidationError({"detail": "stop start_date must fall within the trip dates."})

        if trip.end_date and end_date and end_date > trip.end_date:
            raise serializers.ValidationError({"detail": "stop end_date must fall within the trip dates."})

        return attrs


class TripActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = TripActivity
        fields = [
            "id",
            "trip_stop",
            "activity",
            "date",
            "start_time",
            "end_time",
            "position",
            "estimated_cost",
            "notes",
        ]
        read_only_fields = ["id"]

    def validate(self, attrs):
        start_time = attrs.get("start_time", getattr(self.instance, "start_time", None))
        end_time = attrs.get("end_time", getattr(self.instance, "end_time", None))
        trip_stop = attrs.get("trip_stop", getattr(self.instance, "trip_stop", None))
        activity = attrs.get("activity", getattr(self.instance, "activity", None))
        activity_date = attrs.get("date", getattr(self.instance, "date", None))

        if start_time and end_time and start_time > end_time:
            raise serializers.ValidationError({"detail": "start_time cannot be after end_time"})

        if trip_stop is None:
            raise serializers.ValidationError({"detail": "trip_stop is required."})

        if activity is None:
            raise serializers.ValidationError({"detail": "activity is required."})

        if trip_stop.trip.start_date and activity_date and activity_date < trip_stop.trip.start_date:
            raise serializers.ValidationError({"detail": "activity date must fall within the trip dates."})

        if trip_stop.trip.end_date and activity_date and activity_date > trip_stop.trip.end_date:
            raise serializers.ValidationError({"detail": "activity date must fall within the trip dates."})

        return attrs
