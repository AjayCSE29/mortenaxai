import logging

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

BREVO_TRANSACTIONAL_EMAIL_URL = "https://api.brevo.com/v3/smtp/email"
BREVO_API_TIMEOUT_SECONDS = 10.0


class EmailDeliveryError(Exception):
    pass


def send_verification_otp(
    email: str,
    otp: str
) -> None:
    subject = "Mortenax AI - Email Verification"

    text_content = (
        "Your Mortenax AI verification code is:\n\n"
        f"{otp}\n\n"
        "This code expires in 5 minutes.\n\n"
        "If you did not create a Mortenax AI account, you can ignore this email."
    )

    html_content = (
        "<p>Your Mortenax AI verification code is:</p>"
        f"<h2 style=\"margin: 16px 0;\">{otp}</h2>"
        "<p>This code expires in 5 minutes.</p>"
        "<p>If you did not create a Mortenax AI account, you can ignore this email.</p>"
    )

    _send_email(subject, text_content, html_content, email)


def send_login_otp(
    email: str,
    otp: str
) -> None:
    subject = "Mortenax AI Login Verification Code"

    text_content = (
        "Your Mortenax AI login verification code is:\n\n"
        f"{otp}\n\n"
        "This code expires in 5 minutes.\n\n"
        "If you did not attempt to log in to your Mortenax AI account, "
        "you can ignore this email."
    )

    html_content = (
        "<p>Your Mortenax AI login verification code is:</p>"
        f"<h2 style=\"margin: 16px 0;\">{otp}</h2>"
        "<p>This code expires in 5 minutes.</p>"
        "<p>If you did not attempt to log in to your Mortenax AI account, "
        "you can ignore this email.</p>"
    )

    _send_email(subject, text_content, html_content, email)


def _send_email(
    subject: str,
    text_content: str,
    html_content: str,
    email: str
) -> None:
    payload = {
        "sender": {
            "name": settings.BREVO_SENDER_NAME,
            "email": settings.BREVO_SENDER_EMAIL
        },
        "to": [
            {
                "email": email
            }
        ],
        "subject": subject,
        "htmlContent": html_content,
        "textContent": text_content
    }

    headers = {
        "api-key": settings.BREVO_API_KEY,
        "Content-Type": "application/json"
    }

    try:
        response = httpx.post(
            BREVO_TRANSACTIONAL_EMAIL_URL,
            json=payload,
            headers=headers,
            timeout=BREVO_API_TIMEOUT_SECONDS
        )
        response.raise_for_status()
    except httpx.HTTPError as exc:
        logger.warning(
            "Failed to send verification email to %s: %s",
            email,
            exc,
            exc_info=settings.DEBUG
        )
        raise EmailDeliveryError(
            "Failed to send verification email"
        ) from exc
