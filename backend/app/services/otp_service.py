import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, UTC

from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.models.email_verification import EmailVerification
from app.database.models.user import User


class OTPNotFoundError(Exception):
    pass


class OTPExpiredError(Exception):
    pass


class OTPAttemptsExceededError(Exception):
    pass


class OTPInvalidError(Exception):
    pass


def _ensure_aware(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


def generate_otp() -> str:
    upper_bound = 10 ** settings.OTP_LENGTH
    return f"{secrets.randbelow(upper_bound):0{settings.OTP_LENGTH}d}"


def hash_otp(otp: str) -> str:
    return hashlib.sha256(otp.encode("utf-8")).hexdigest()


def verify_otp_hash(submitted_otp: str, otp_hash: str) -> bool:
    return hmac.compare_digest(
        hash_otp(submitted_otp),
        otp_hash
    )


def create_verification(
    db: Session,
    user: User
) -> tuple[EmailVerification, str]:
    now = datetime.now(UTC)

    db.query(EmailVerification).filter(
        EmailVerification.user_id == user.id,
        EmailVerification.used_at.is_(None)
    ).update(
        {"used_at": now},
        synchronize_session=False
    )

    otp = generate_otp()

    record = EmailVerification(
        user_id=user.id,
        otp_hash=hash_otp(otp),
        expires_at=now + timedelta(minutes=settings.OTP_EXPIRATION_MINUTES),
        attempts=0,
        created_at=now
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    return record, otp


def get_last_verification(
    db: Session,
    user: User
) -> EmailVerification | None:
    return (
        db.query(EmailVerification)
        .filter(EmailVerification.user_id == user.id)
        .order_by(EmailVerification.created_at.desc())
        .first()
    )


def can_resend(
    db: Session,
    user: User
) -> bool:
    last = get_last_verification(db, user)

    if last is None or last.created_at is None:
        return True

    elapsed = (
        datetime.now(UTC)
        - _ensure_aware(last.created_at)
    ).total_seconds()

    return elapsed >= settings.OTP_RESEND_COOLDOWN_SECONDS


def verify_otp(
    db: Session,
    user: User,
    submitted_otp: str
) -> User:
    record = (
        db.query(EmailVerification)
        .filter(
            EmailVerification.user_id == user.id,
            EmailVerification.used_at.is_(None)
        )
        .order_by(EmailVerification.created_at.desc())
        .first()
    )

    if record is None:
        raise OTPNotFoundError()

    if _ensure_aware(record.expires_at) < datetime.now(UTC):
        raise OTPExpiredError()

    if record.attempts >= settings.OTP_MAX_ATTEMPTS:
        raise OTPAttemptsExceededError()

    if not verify_otp_hash(submitted_otp, record.otp_hash):
        record.attempts += 1
        db.commit()
        raise OTPInvalidError()

    now = datetime.now(UTC)

    user.email_verified = True

    db.query(EmailVerification).filter(
        EmailVerification.user_id == user.id,
        EmailVerification.used_at.is_(None)
    ).update(
        {"used_at": now},
        synchronize_session=False
    )

    db.commit()

    return user
