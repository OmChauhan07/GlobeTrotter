import logging
import os
import resend
from django.conf import settings

logger = logging.getLogger(__name__)

DEFAULT_FROM_EMAIL = "GlobeTrotter <onboarding@resend.dev>"


def send_email(to: str | list[str], subject: str, html: str, text: str | None = None) -> dict:
    """
    Send an email via the Resend Python SDK.
    Uses settings.RESEND_API_KEY / RESEND_API_KEY environment variable and
    settings.EMAIL_FROM / EMAIL_FROM environment variable (default: GlobeTrotter <onboarding@resend.dev>).
    """
    api_key = getattr(settings, "RESEND_API_KEY", None) or os.environ.get("RESEND_API_KEY", "")
    if not api_key:
        logger.warning("[Email] RESEND_API_KEY is not configured. Email not dispatched.")
        return {"sent": False, "error": "RESEND_API_KEY is not set"}

    resend.api_key = api_key
    email_from = (
        getattr(settings, "EMAIL_FROM", None)
        or os.environ.get("EMAIL_FROM")
        or DEFAULT_FROM_EMAIL
    )

    recipient_list = [to] if isinstance(to, str) else list(to)

    params: resend.Emails.SendParams = {
        "from": email_from,
        "to": recipient_list,
        "subject": subject,
        "html": html,
    }
    if text:
        params["text"] = text

    try:
        response = resend.Emails.send(params)
        logger.info("[Email] Dispatched via Resend to %s. Response ID: %s", recipient_list, getattr(response, "id", response))
        return {"sent": True, "provider": "resend", "response": response}
    except Exception as exc:
        logger.error("[Email] Failed to dispatch email via Resend to %s: %s", recipient_list, exc)
        return {"sent": False, "error": str(exc)}