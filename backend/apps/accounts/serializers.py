from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["username", "email", "password", "password_confirm"]

    def validate(self, attrs):
        password = attrs.get("password")
        password_confirm = attrs.get("password_confirm")

        if password != password_confirm:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})

        validate_password(password)
        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm", None)
        # Security: Public registration must always create a traveler role
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
        )
        if hasattr(user, "profile") and user.profile:
            user.profile.role = getattr(User.Role, "TRAVELER", "traveler")
            user.profile.save()
        return user


class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "role"]
        read_only_fields = fields

    def get_role(self, obj):
        if hasattr(obj, "role"):
            return obj.role
        if hasattr(obj, "profile") and obj.profile:
            return obj.profile.role
        if getattr(obj, "is_superuser", False) or getattr(obj, "is_staff", False):
            return "admin"
        return "traveler"

