from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import PendingRegistration, Role, UserProfile
from .otp_service import (
    OTP_COOLDOWN_SECONDS,
    OTP_MAX_ATTEMPTS,
    generate_otp,
    get_otp_expiry,
    hash_otp,
    send_otp_email,
    verify_otp_hash,
)
from .serializers import (
    RegisterSerializer,
    RequestOTPSerializer,
    ResendOTPSerializer,
    UserSerializer,
    VerifyOTPSerializer,
)

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)
        data = {
            "user": UserSerializer(user).data,
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }
        return Response(data, status=status.HTTP_201_CREATED)


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class AvatarUploadView(APIView):
    """
    Upload profile avatar image to Cloudinary and update UserProfile.avatar_url & avatar_public_id.
    Safely cleans up previously uploaded avatar asset after successful database update.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        uploaded_file = request.FILES.get("avatar") or request.FILES.get("file")
        if not uploaded_file:
            return Response(
                {"detail": "No image file provided. Use form field 'avatar' or 'file'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from .services.media import FOLDER_USERS, delete_image, upload_image

        try:
            asset = upload_image(uploaded_file, folder=FOLDER_USERS)
        except Exception as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        old_public_id = profile.avatar_public_id

        try:
            profile.avatar_url = asset["url"]
            profile.avatar_public_id = asset["public_id"]
            profile.save()
        except Exception as db_exc:
            # Clean up orphan upload if database save failed
            delete_image(asset["public_id"])
            return Response(
                {"detail": "Failed to save avatar to user profile."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Safely clean up old asset now that DB persistence succeeded
        if old_public_id and old_public_id != asset["public_id"]:
            delete_image(old_public_id)

        return Response(
            {
                "message": "Avatar uploaded successfully.",
                "avatar_url": asset["url"],
                "avatar_public_id": asset["public_id"],
                "user": UserSerializer(request.user).data,
            },
            status=status.HTTP_200_OK,
        )


class RequestRegistrationOTPView(APIView):
    """
    Step 1 of registration: validate payload, generate hashed 6-digit OTP,
    store pending registration, and send email via Resend.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = RequestOTPSerializer(data=request.data)
        if not serializer.is_valid():
            errors = serializer.errors
            first_err = next(iter(errors.values()))[0] if errors else "Invalid data provided."
            code = "EMAIL_ALREADY_EXISTS" if "email" in errors else "INVALID_PAYLOAD"
            return Response(
                {"code": code, "message": str(first_err), "errors": errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        validated = serializer.validated_data
        email = validated["email"]
        raw_password = validated["password"]
        first_name = validated.get("first_name", "")
        last_name = validated.get("last_name", "")
        username = validated.get("username", "") or email.split("@")[0]

        # Ensure unique username
        base_username = username
        counter = 1
        while User.objects.filter(username__iexact=username).exists():
            username = f"{base_username}{counter}"
            counter += 1

        # Check existing pending registration rate limit cooldown
        existing_pending = PendingRegistration.objects.filter(email=email).first()
        now = timezone.now()
        if existing_pending:
            elapsed = (now - existing_pending.last_sent_at).total_seconds()
            if elapsed < OTP_COOLDOWN_SECONDS:
                remaining = int(OTP_COOLDOWN_SECONDS - elapsed)
                return Response(
                    {
                        "code": "OTP_RATE_LIMITED",
                        "message": f"Please wait {remaining} seconds before requesting a new verification code.",
                        "remaining_seconds": remaining,
                    },
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )

        # Generate 6-digit numeric OTP & hashes
        otp = generate_otp()
        hashed_otp = hash_otp(otp)
        password_hash = make_password(raw_password)
        expires_at = get_otp_expiry()

        if existing_pending:
            existing_pending.password_hash = password_hash
            existing_pending.first_name = first_name
            existing_pending.last_name = last_name
            existing_pending.username = username
            existing_pending.otp_hash = hashed_otp
            existing_pending.otp_expires_at = expires_at
            existing_pending.attempt_count = 0
            existing_pending.save()
        else:
            PendingRegistration.objects.create(
                email=email,
                password_hash=password_hash,
                first_name=first_name,
                last_name=last_name,
                username=username,
                otp_hash=hashed_otp,
                otp_expires_at=expires_at,
                attempt_count=0,
            )

        # Dispatch email
        email_res = send_otp_email(email=email, otp=otp, first_name=first_name)

        response_data = {
            "message": "Verification code sent to your email address.",
            "email": email,
            "expires_in_minutes": 10,
            "cooldown_seconds": OTP_COOLDOWN_SECONDS,
        }
        if email_res.get("dev_otp"):
            response_data["dev_otp"] = email_res["dev_otp"]

        return Response(response_data, status=status.HTTP_200_OK)


class VerifyRegistrationOTPView(APIView):
    """
    Step 2 of registration: verify 6-digit OTP, create verified User (role=traveler),
    delete pending registration, and return JWT credentials.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = VerifyOTPSerializer(data=request.data)
        if not serializer.is_valid():
            errors = serializer.errors
            first_err = next(iter(errors.values()))[0] if errors else "Invalid code provided."
            return Response(
                {"code": "OTP_INVALID", "message": str(first_err), "errors": errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = serializer.validated_data["email"]
        raw_otp = serializer.validated_data["otp"]

        pending = PendingRegistration.objects.filter(email=email).first()
        if not pending:
            return Response(
                {
                    "code": "REGISTRATION_NOT_FOUND",
                    "message": "No pending registration found for this email. Please sign up again.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        now = timezone.now()
        if now > pending.otp_expires_at:
            return Response(
                {
                    "code": "OTP_EXPIRED",
                    "message": "This verification code has expired. Please request a new code.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if pending.attempt_count >= OTP_MAX_ATTEMPTS:
            return Response(
                {
                    "code": "OTP_TOO_MANY_ATTEMPTS",
                    "message": "Maximum verification attempts exceeded. Please request a new code.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not verify_otp_hash(raw_otp, pending.otp_hash):
            pending.attempt_count += 1
            pending.save(update_fields=["attempt_count", "updated_at"])
            remaining = max(0, OTP_MAX_ATTEMPTS - pending.attempt_count)
            return Response(
                {
                    "code": "OTP_INVALID",
                    "message": f"That verification code doesn't match. ({remaining} attempts remaining)",
                    "remaining_attempts": remaining,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Successful verification: create User & traveler profile
        if User.objects.filter(email__iexact=email).exists():
            pending.delete()
            return Response(
                {
                    "code": "EMAIL_ALREADY_EXISTS",
                    "message": "An account with this email already exists. Please sign in.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Unique username
        username = pending.username or email.split("@")[0]
        base_username = username
        counter = 1
        while User.objects.filter(username__iexact=username).exists():
            username = f"{base_username}{counter}"
            counter += 1

        user = User(
            username=username,
            email=pending.email,
            first_name=pending.first_name,
            last_name=pending.last_name,
            password=pending.password_hash,
        )
        user.save()

        # Enforce traveler role strictly
        if hasattr(user, "profile") and user.profile:
            user.profile.role = Role.TRAVELER
            user.profile.save()

        # Delete pending record so OTP cannot be reused
        pending.delete()

        # Generate JWT tokens for instant auto-login
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "message": "Account successfully verified and created.",
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class ResendRegistrationOTPView(APIView):
    """
    Resend 6-digit OTP to pending registration after enforcing cooldown.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = ResendOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"code": "INVALID_PAYLOAD", "message": "Valid email is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = serializer.validated_data["email"]
        pending = PendingRegistration.objects.filter(email=email).first()
        if not pending:
            return Response(
                {
                    "code": "REGISTRATION_NOT_FOUND",
                    "message": "No pending registration found for this email. Please sign up.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        now = timezone.now()
        elapsed = (now - pending.last_sent_at).total_seconds()
        if elapsed < OTP_COOLDOWN_SECONDS:
            remaining = int(OTP_COOLDOWN_SECONDS - elapsed)
            return Response(
                {
                    "code": "OTP_RATE_LIMITED",
                    "message": f"Please wait {remaining} seconds before requesting a new code.",
                    "remaining_seconds": remaining,
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        # Generate new OTP & update
        otp = generate_otp()
        pending.otp_hash = hash_otp(otp)
        pending.otp_expires_at = get_otp_expiry()
        pending.attempt_count = 0
        pending.save()

        # Send email
        email_res = send_otp_email(email=email, otp=otp, first_name=pending.first_name)

        response_data = {
            "message": "A fresh verification code has been sent to your email.",
            "cooldown_seconds": OTP_COOLDOWN_SECONDS,
        }
        if email_res.get("dev_otp"):
            response_data["dev_otp"] = email_res["dev_otp"]

        return Response(response_data, status=status.HTTP_200_OK)


