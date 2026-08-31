from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    CustomTokenObtainPairView,
    MeView,
    RegisterView,
    RequestRegistrationOTPView,
    ResendRegistrationOTPView,
    VerifyRegistrationOTPView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("register/request-otp/", RequestRegistrationOTPView.as_view(), name="register_request_otp"),
    path("register/verify-otp/", VerifyRegistrationOTPView.as_view(), name="register_verify_otp"),
    path("register/resend-otp/", ResendRegistrationOTPView.as_view(), name="register_resend_otp"),
    path("login/", CustomTokenObtainPairView.as_view(), name="login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("me/", MeView.as_view(), name="me"),
]
