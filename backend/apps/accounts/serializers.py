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
    avatar_url = serializers.SerializerMethodField()
    bio = serializers.SerializerMethodField()
    home_airport = serializers.SerializerMethodField()
    currency = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "role", "avatar_url", "bio", "home_airport", "currency"]
        read_only_fields = fields

    def get_role(self, obj) -> str:
        if hasattr(obj, "role"):
            return str(obj.role)
        if hasattr(obj, "profile") and obj.profile:
            return str(obj.profile.role)
        if getattr(obj, "is_superuser", False) or getattr(obj, "is_staff", False):
            return "admin"
        return "traveler"

    def get_avatar_url(self, obj) -> str:
        if hasattr(obj, "profile") and obj.profile:
            return str(obj.profile.avatar_url)
        return ""

    def get_bio(self, obj) -> str:
        if hasattr(obj, "profile") and obj.profile:
            return str(obj.profile.bio)
        return ""

    def get_home_airport(self, obj) -> str:
        if hasattr(obj, "profile") and obj.profile:
            return str(obj.profile.home_airport)
        return ""

    def get_currency(self, obj) -> str:
        if hasattr(obj, "profile") and obj.profile:
            return str(obj.profile.currency)
        return "USD"


class RequestOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField(required=False, allow_blank=True, default="")
    last_name = serializers.CharField(required=False, allow_blank=True, default="")
    username = serializers.CharField(required=False, allow_blank=True, default="")

    def validate_email(self, value):
        normalized = value.strip().lower()
        if User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError("An account with this email address already exists.")
        return normalized

    def validate_password(self, value):
        validate_password(value)
        return value


class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(min_length=6, max_length=6)

    def validate_email(self, value):
        return value.strip().lower()

    def validate_otp(self, value):
        cleaned = value.strip()
        if not cleaned.isdigit() or len(cleaned) != 6:
            raise serializers.ValidationError("OTP must be a 6-digit numeric code.")
        return cleaned


class ResendOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        return value.strip().lower()


