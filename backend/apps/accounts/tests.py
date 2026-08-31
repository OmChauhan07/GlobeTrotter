from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.urls import reverse
from rest_framework.test import APITestCase
from apps.accounts.models import Role, UserProfile

User = get_user_model()


class AccountAuthAPITests(APITestCase):
    def test_user_can_register_and_receive_tokens(self):
        payload = {
            "username": "newtraveler",
            "email": "newtraveler@example.com",
            "password": "StrongPass123!",
            "password_confirm": "StrongPass123!",
        }

        response = self.client.post(reverse("accounts:register"), payload, format="json")

        self.assertEqual(response.status_code, 201)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertTrue(User.objects.filter(email="newtraveler@example.com").exists())

    def test_user_registration_forces_traveler_role(self):
        payload = {
            "username": "sneakyadmin",
            "email": "sneaky@example.com",
            "password": "StrongPass123!",
            "password_confirm": "StrongPass123!",
            "role": "admin",
        }

        response = self.client.post(reverse("accounts:register"), payload, format="json")
        self.assertEqual(response.status_code, 201)

        user = User.objects.get(username="sneakyadmin")
        self.assertEqual(user.role, "traveler")
        self.assertEqual(user.profile.role, Role.TRAVELER)

    def test_authenticated_user_can_fetch_profile_with_role(self):
        user = User.objects.create_user(
            username="profileuser",
            email="profile@example.com",
            password="StrongPass123!",
        )
        self.client.force_authenticate(user=user)

        response = self.client.get(reverse("accounts:me"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["email"], "profile@example.com")
        self.assertEqual(response.data["username"], "profileuser")
        self.assertEqual(response.data["role"], "traveler")

    def test_admin_can_access_admin_analytics_api(self):
        admin = User.objects.create_user(
            username="adminuser",
            email="admin@example.com",
            password="StrongPass123!",
        )
        admin.role = "admin"
        admin.save()
        self.client.force_authenticate(user=admin)

        response = self.client.get(reverse("admin-analytics"))
        self.assertEqual(response.status_code, 200)
        self.assertIn("summary", response.data)
        self.assertIn("total_users", response.data["summary"])
        self.assertIn("total_trips", response.data["summary"])

    def test_traveler_is_forbidden_from_admin_analytics_api(self):
        traveler = User.objects.create_user(
            username="normaltraveler",
            email="traveler2@example.com",
            password="StrongPass123!",
        )
        traveler.role = "traveler"
        traveler.save()
        self.client.force_authenticate(user=traveler)

        response = self.client.get(reverse("admin-analytics"))
        self.assertEqual(response.status_code, 403)

    def test_seed_demo_data_command_is_idempotent(self):
        call_command("seed_demo_data")
        call_command("seed_demo_data")

        self.assertTrue(User.objects.filter(username="traveler").exists())
        self.assertTrue(User.objects.filter(username="admin").exists())

        traveler = User.objects.get(username="traveler")
        admin = User.objects.get(username="admin")

        self.assertEqual(traveler.role, "traveler")
        self.assertEqual(admin.role, "admin")

    def test_request_otp_creates_pending_registration(self):
        payload = {
            "email": "otptraveler@example.com",
            "password": "SecurePassword123!",
            "first_name": "Oliver",
            "last_name": "Traveler",
        }
        res = self.client.post(reverse("auth:register_request_otp"), payload, format="json")
        self.assertEqual(res.status_code, 200)
        self.assertIn("dev_otp", res.data)

        from apps.accounts.models import PendingRegistration
        pending = PendingRegistration.objects.get(email="otptraveler@example.com")
        self.assertEqual(pending.first_name, "Oliver")
        self.assertNotEqual(pending.otp_hash, res.data["dev_otp"])

    def test_verify_otp_creates_verified_user_and_tokens(self):
        # 1. Request OTP
        req_res = self.client.post(
            reverse("auth:register_request_otp"),
            {
                "email": "verifyuser@example.com",
                "password": "StrongPassword123!",
                "first_name": "Verify",
                "last_name": "Me",
            },
            format="json",
        )
        otp = req_res.data["dev_otp"]

        # 2. Verify OTP
        verify_res = self.client.post(
            reverse("auth:register_verify_otp"),
            {"email": "verifyuser@example.com", "otp": otp},
            format="json",
        )
        self.assertEqual(verify_res.status_code, 201)
        self.assertIn("access", verify_res.data)
        self.assertIn("refresh", verify_res.data)
        self.assertEqual(verify_res.data["user"]["role"], "traveler")

        # 3. Pending record deleted and user exists
        user = User.objects.get(email="verifyuser@example.com")
        self.assertEqual(user.first_name, "Verify")
        self.assertEqual(user.role, "traveler")

        from apps.accounts.models import PendingRegistration
        self.assertFalse(PendingRegistration.objects.filter(email="verifyuser@example.com").exists())

    def test_invalid_otp_is_rejected(self):
        self.client.post(
            reverse("auth:register_request_otp"),
            {
                "email": "badotp@example.com",
                "password": "StrongPassword123!",
            },
            format="json",
        )

        res = self.client.post(
            reverse("auth:register_verify_otp"),
            {"email": "badotp@example.com", "otp": "000000"},
            format="json",
        )
        self.assertEqual(res.status_code, 400)
        self.assertEqual(res.data["code"], "OTP_INVALID")

    def test_expired_otp_is_rejected(self):
        from datetime import timedelta
        from django.utils import timezone
        from apps.accounts.models import PendingRegistration

        self.client.post(
            reverse("auth:register_request_otp"),
            {
                "email": "expired@example.com",
                "password": "StrongPassword123!",
            },
            format="json",
        )

        pending = PendingRegistration.objects.get(email="expired@example.com")
        pending.otp_expires_at = timezone.now() - timedelta(minutes=1)
        pending.save()

        res = self.client.post(
            reverse("auth:register_verify_otp"),
            {"email": "expired@example.com", "otp": "123456"},
            format="json",
        )
        self.assertEqual(res.status_code, 400)
        self.assertEqual(res.data["code"], "OTP_EXPIRED")

    def test_resend_otp_enforces_cooldown(self):
        # 1. First request
        self.client.post(
            reverse("auth:register_request_otp"),
            {
                "email": "cooldown@example.com",
                "password": "StrongPassword123!",
            },
            format="json",
        )

        # 2. Immediate resend should be rate limited
        res = self.client.post(
            reverse("auth:register_resend_otp"),
            {"email": "cooldown@example.com"},
            format="json",
        )
        self.assertEqual(res.status_code, 429)
        self.assertEqual(res.data["code"], "OTP_RATE_LIMITED")


