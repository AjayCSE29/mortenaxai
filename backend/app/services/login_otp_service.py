import secrets
from datetime import datetime, timedelta, UTC

from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.models.login_verification import LoginVerification
from app.database.models.user import User
from app.services.otp_service import (
    OTPAttemptsExceededError,
    OTPExpiredError,
    OTPInvalidError,
    OTPNotFoundError,
    _ensure_aware,
    generate_otp,
    hash_otp,
    verify_otp_hash,
)


class OTPAlreadyUsedError(Exception):
    pass


def create_challenge(
    db: Session,
    user: User
) -> tuple[LoginVerification, str]:
    now = datetime.now(UTC)

    db.query(LoginVerification).filter(
        LoginVerification.user_id == user.id,
        LoginVerification.used_at.is_(None)
    ).update(
        {"used_at": now},
        synchronize_session=False
    )

    challenge_id = secrets.token_urlsafe(32)

    otp = generate_otp()

    record = LoginVerification(
        user_id=user.id,
        challenge_id=challenge_id,
        otp_hash=hash_otp(otp),
        expires_at=now + timedelta(minutes=settings.OTP_EXPIRATION_MINUTES),
        attempts=0,
        created_at=now
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    return record, otp


def get_challenge(
    db: Session,
    challenge_id: str
) -> LoginVerification | None:
    return (
        db.query(LoginVerification)
        .filter(LoginVerification.challenge_id == challenge_id)
        .first()
    )


def is_expired(record: LoginVerification) -> bool:
    return _ensure_aware(record.expires_at) < datetime.now(UTC)


def can_resend(record: LoginVerification) -> bool:
    if record.created_at is None:
        return True

    elapsed = (
        datetime.now(UTC)
        - _ensure_aware(record.created_at)
    ).total_seconds()

    return elapsed >= settings.OTP_RESEND_COOLDOWN_SECONDS


def resend_otp(
    db: Session,
    record: LoginVerification
) -> tuple[LoginVerification, str]:
    otp = generate_otp()
    now = datetime.now(UTC)

    record.otp_hash = hash_otp(otp)
    record.expires_at = now + timedelta(minutes=settings.OTP_EXPIRATION_MINUTES)
    record.attempts = 0

    db.commit()
    db.refresh(record)

    return record, otp


def verify_login_otp(
    db: Session,
    record: LoginVerification,
    submitted_otp: str
) -> LoginVerification:
    now = datetime.now(UTC)

    if record.used_at is not None:
        raise OTPAlreadyUsedError()

    if _ensure_aware(record.expires_at) < now:
        record.used_at = now
        db.commit()
        raise OTPExpiredError()

    if record.attempts >= settings.OTP_MAX_ATTEMPTS:
        record.used_at = now
        db.commit()
        raise OTPAttemptsExceededError()

    if not verify_otp_hash(submitted_otp, record.otp_hash):
        record.attempts += 1
        if record.attempts >= settings.OTP_MAX_ATTEMPTS:
            record.used_at = now
        db.commit()
        raise OTPInvalidError()

    record.used_at = now

    db.commit()

    return record
