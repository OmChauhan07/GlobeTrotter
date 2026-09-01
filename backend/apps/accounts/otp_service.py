import logging
import os
import secrets
from datetime import timedelta
from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.utils import timezone

logger = logging.getLogger(__name__)

OTP_EXPIRY_MINUTES = 10
OTP_COOLDOWN_SECONDS = 60
OTP_MAX_ATTEMPTS = 5


def generate_otp() -> str:
    """Generate a cryptographically secure 6-digit numeric OTP."""
    return f"{secrets.randbelow(900000) + 100000:06d}"


def hash_otp(raw_otp: str) -> str:
    """Hash raw OTP using Django's secure password hasher."""
    return make_password(raw_otp)


def verify_otp_hash(raw_otp: str, hashed_otp: str) -> bool:
    """Verify raw OTP against stored hash."""
    return check_password(raw_otp, hashed_otp)


def get_otp_expiry():
    """Return timezone-aware expiration timestamp."""
    return timezone.now() + timedelta(minutes=OTP_EXPIRY_MINUTES)


def send_otp_email(email: str, otp: str, first_name: str = "") -> dict:
    """
    Send OTP email using Resend transactional email API.
    Falls back gracefully in development / test environments when RESEND_API_KEY is not set.
    """
    resend_api_key = getattr(settings, "RESEND_API_KEY", os.environ.get("RESEND_API_KEY", ""))
    email_from = getattr(settings, "EMAIL_FROM", os.environ.get("EMAIL_FROM", "GlobeTrotter <onboarding@resend.dev>"))
    is_dev_mode = getattr(settings, "DEV_OTP_MODE", True) or settings.DEBUG

    greeting_name = first_name.strip() if first_name.strip() else "Traveler"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f4ed; margin: 0; padding: 24px; color: #17211c; }}
        .container {{ max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e5dfd5; padding: 36px 32px; }}
        .brand {{ font-size: 22px; font-weight: 700; color: #17211c; margin-bottom: 24px; letter-spacing: -0.5px; }}
        .title {{ font-size: 20px; font-weight: 600; margin-bottom: 12px; color: #17211c; }}
        .code-box {{ font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #b58a4a; background: #faf8f5; border: 1px dashed #d5c3aa; border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0; }}
        .footnote {{ font-size: 13px; color: #768079; line-height: 1.5; margin-top: 24px; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="brand">🌍 GlobeTrotter</div>
        <div class="title">Verify your email</div>
        <p>Hello {greeting_name},</p>
        <p>Use the 6-digit verification code below to complete creating your GlobeTrotter account:</p>
        <div class="code-box">{otp}</div>
        <p>This code will expire in <strong>{OTP_EXPIRY_MINUTES} minutes</strong>. If you did not request this, you can safely ignore this email.</p>
        <div class="footnote">&copy; {timezone.now().year} GlobeTrotter &bull; The Intelligent Journey Planner</div>
      </div>
    </body>
    </html>
    """

    text_content = f"""
    GlobeTrotter — Verify your email

    Hello {greeting_name},

    Your 6-digit verification code is: {otp}

    This code expires in {OTP_EXPIRY_MINUTES} minutes.
    If you did not request this code, please disregard this message.
    """

    logger.info("[OTP] Generated verification code for %s (DevMode=%s)", email, is_dev_mode)
    if is_dev_mode:
        print(f"\n[DEV_OTP] >>> Verification code for {email}: {otp} <<<\n")

    if not resend_api_key:
        return {
            "sent": True,
            "provider": "dev_console",
            "dev_otp": otp if is_dev_mode else None,
        }

    from .services.email import send_email

    subject = f"{otp} is your GlobeTrotter verification code"
    result = send_email(to=email, subject=subject, html=html_content, text=text_content)

    if result.get("sent"):
        return {
            "sent": True,
            "provider": "resend",
            "response": result.get("response"),
            "dev_otp": otp if is_dev_mode else None,
        }

    logger.warning("[OTP] Resend delivery failed for %s (%s). Falling back to dev mode if applicable.", email, result.get("error"))
    if is_dev_mode:
        return {
            "sent": True,
            "provider": "dev_console_fallback",
            "dev_otp": otp,
            "error": result.get("error"),
        }

    return {"sent": False, "error": result.get("error")}

