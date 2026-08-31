from rest_framework import serializers
from apps.expenses.models import Expense
from apps.trips.models import Trip, TripStop


class ExpenseSerializer(serializers.ModelSerializer):
    stop_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Expense
        fields = [
            "id",
            "trip",
            "trip_stop",
            "stop_name",
            "category",
            "name",
            "amount",
            "currency",
            "date",
            "notes",
            "created_at",
        ]
        read_only_fields = ["id", "trip", "created_at"]

    def get_stop_name(self, obj):
        if obj.trip_stop and obj.trip_stop.city:
            return obj.trip_stop.city.name
        return None

    def validate_amount(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Expense amount cannot be negative.")
        return value

    def validate(self, attrs):
        trip = attrs.get("trip") or (self.instance.trip if self.instance else None)
        if not trip and "view" in self.context and hasattr(self.context["view"], "get_trip"):
            try:
                trip = self.context["view"].get_trip()
            except Exception:
                pass

        date = attrs.get("date") or (self.instance.date if self.instance else None)

        if trip and date:
            if trip.start_date and date < trip.start_date:
                raise serializers.ValidationError({"date": f"Expense date ({date}) cannot be before trip start date ({trip.start_date})."})
            if trip.end_date and date > trip.end_date:
                raise serializers.ValidationError({"date": f"Expense date ({date}) cannot be after trip end date ({trip.end_date})."})

        trip_stop = attrs.get("trip_stop") or (self.instance.trip_stop if self.instance else None)
        if trip_stop and trip and trip_stop.trip_id != trip.id:
            raise serializers.ValidationError({"trip_stop": "The selected stop does not belong to this trip."})

        return attrs


class CategoryMetricSerializer(serializers.Serializer):
    amount = serializers.FloatField()
    percentage = serializers.FloatField()


class DailyBreakdownItemSerializer(serializers.Serializer):
    date = serializers.CharField()
    total = serializers.FloatField()
    items_count = serializers.IntegerField()
    is_over_budget = serializers.BooleanField()
    threshold = serializers.FloatField()
    categories = serializers.DictField(child=serializers.FloatField())


class OverBudgetDayItemSerializer(serializers.Serializer):
    date = serializers.CharField()
    total = serializers.FloatField()
    threshold = serializers.FloatField()
    excess = serializers.FloatField()


class TripBudgetSerializer(serializers.Serializer):
    trip_id = serializers.IntegerField()
    trip_name = serializers.CharField()
    currency = serializers.CharField()
    total = serializers.FloatField()
    average_per_day = serializers.FloatField()
    days_count = serializers.IntegerField()
    daily_threshold = serializers.FloatField()
    category_breakdown = serializers.DictField(child=CategoryMetricSerializer())
    daily_breakdown = serializers.ListField(child=DailyBreakdownItemSerializer())
    over_budget_days = serializers.ListField(child=OverBudgetDayItemSerializer())
    expenses_count = serializers.IntegerField()
