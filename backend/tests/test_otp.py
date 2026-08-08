from datetime import datetime, timedelta, UTC

import pytest

from app.database.models.email_verification import EmailVerification
from app.database.models.user import User
from app.core.security import hash_password
from app.services import otp_service


def make_user(db, email="user@example.com", username="user"):
    user = User(
        username=username,
        email=email,
        hashed_password=hash_password("password123")
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def register_via_api(client, email="user@example.com"):
    response = client.post(
        "/auth/register",
        json={
            "username": "user",
            "email": email,
            "password": "password123"
        }
    )
    assert response.status_code == 200
    return response


# 1. OTP generation
def test_generate_otp_format_and_uniqueness():
    otp1 = otp_service.generate_otp()
    otp2 = otp_service.generate_otp()

    assert len(otp1) == 6
    assert otp1.isdigit()
    assert otp1 != otp2


# 2. OTP hashing / comparison
def test_otp_hash_and_verification():
    otp = "123456"
    otp_hash = otp_service.hash_otp(otp)

    assert otp_service.verify_otp_hash("123456", otp_hash)
    assert not otp_service.verify_otp_hash("654321", otp_hash)
    assert otp_hash != otp


# 3. OTP verification (correct OTP)
def test_verify_correct_otp_marks_user_verified(db):
    user = make_user(db)

    _, otp = otp_service.create_verification(db, user)

    result = otp_service.verify_otp(db, user, otp)

    assert result.email_verified is True
    assert user.email_verified is True

    active = (
        db.query(EmailVerification)
        .filter(
            EmailVerification.user_id == user.id,
            EmailVerification.used_at.is_(None)
        )
        .count()
    )
    assert active == 0


# 4. Incorrect OTP
def test_verify_incorrect_otp_increments_attempts(db):
    user = make_user(db)

    otp_service.create_verification(db, user)

    with pytest.raises(otp_service.OTPInvalidError):
        otp_service.verify_otp(db, user, "000000")

    record = (
        db.query(EmailVerification)
        .filter(EmailVerification.user_id == user.id)
        .first()
    )
    assert record.attempts == 1
    assert user.email_verified is False


# 5. Expired OTP
def test_verify_expired_otp_rejected(db):
    user = make_user(db)

    record, otp = otp_service.create_verification(db, user)
    record.expires_at = datetime.now(UTC) - timedelta(minutes=10)
    db.commit()

    with pytest.raises(otp_service.OTPExpiredError):
        otp_service.verify_otp(db, user, otp)


# 6. Maximum attempts
def test_verify_max_attempts_rejected(db):
    user = make_user(db)

    record, otp = otp_service.create_verification(db, user)
    record.attempts = 5
    db.commit()

    with pytest.raises(otp_service.OTPAttemptsExceededError):
        otp_service.verify_otp(db, user, otp)


# 7. OTP unusable after successful verification
def test_otp_unusable_after_successful_verification(db):
    user = make_user(db)

    _, otp = otp_service.create_verification(db, user)
    otp_service.verify_otp(db, user, otp)

    with pytest.raises(otp_service.OTPNotFoundError):
        otp_service.verify_otp(db, user, otp)

    record = (
        db.query(EmailVerification)
        .filter(EmailVerification.user_id == user.id)
        .first()
    )
    assert record.used_at is not None


# 8. Resend invalidates previous OTP
def test_resend_invalidates_previous_otp(db):
    user = make_user(db)

    otp_service.create_verification(db, user)

    record1 = (
        db.query(EmailVerification)
        .filter(EmailVerification.user_id == user.id)
        .order_by(EmailVerification.created_at.desc())
        .first()
    )

    otp_service.create_verification(db, user)

    db.refresh(record1)
    assert record1.used_at is not None

    active = (
        db.query(EmailVerification)
        .filter(
            EmailVerification.user_id == user.id,
            EmailVerification.used_at.is_(None)
        )
        .count()
    )
    assert active == 1


# 9. Resend cooldown
def test_resend_cooldown_enforced(db):
    user = make_user(db)

    record, _ = otp_service.create_verification(db, user)

    assert otp_service.can_resend(db, user) is False

    record.created_at = datetime.now(UTC) - timedelta(seconds=61)
    db.commit()

    assert otp_service.can_resend(db, user) is True


# 10. Already verified user
def test_verify_already_verified_user_rejected(client):
    register_via_api(client)

    otp = client.get_latest_otp("user@example.com")
    assert otp is not None

    first = client.post(
        "/auth/verify-email",
        json={"email": "user@example.com", "otp": otp}
    )
    assert first.status_code == 200
    assert first.json()["message"] == "Email verified successfully"

    second = client.post(
        "/auth/verify-email",
        json={"email": "user@example.com", "otp": otp}
    )
    assert second.status_code == 400
    assert second.json()["detail"] == "Email already verified"


# API: registration stores hashed OTP and leaves email unverified
def test_register_sends_otp_and_stores_hash(client, db):
    response = register_via_api(client)
    assert response.json()["email_verified"] is False

    otp = client.get_latest_otp("user@example.com")
    assert otp is not None

    record = (
        db.query(EmailVerification)
        .filter(EmailVerification.user_id == response.json()["id"])
        .first()
    )
    assert record is not None
    assert record.otp_hash == otp_service.hash_otp(otp)
    assert record.otp_hash != otp
    assert record.used_at is None


# API: successful verification
def test_verify_email_endpoint_success(client, db):
    response = register_via_api(client)
    otp = client.get_latest_otp("user@example.com")

    result = client.post(
        "/auth/verify-email",
        json={"email": "user@example.com", "otp": otp}
    )

    assert result.status_code == 200
    assert result.json()["email"] == "user@example.com"

    user = db.query(User).filter(User.id == response.json()["id"]).first()
    assert user.email_verified is True


# API: incorrect OTP
def test_verify_email_endpoint_invalid_otp(client):
    register_via_api(client)

    response = client.post(
        "/auth/verify-email",
        json={"email": "user@example.com", "otp": "000000"}
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid verification code"


# API: expired OTP
def test_verify_email_endpoint_expired_otp(client, db):
    register_via_api(client)

    record = (
        db.query(EmailVerification)
        .order_by(EmailVerification.created_at.desc())
        .first()
    )
    record.expires_at = datetime.now(UTC) - timedelta(minutes=10)
    db.commit()

    otp = client.get_latest_otp("user@example.com")

    response = client.post(
        "/auth/verify-email",
        json={"email": "user@example.com", "otp": otp}
    )

    assert response.status_code == 400
    assert "expired" in response.json()["detail"]


# API: maximum attempts exceeded
def test_verify_email_endpoint_max_attempts(client):
    register_via_api(client)

    for _ in range(5):
        response = client.post(
            "/auth/verify-email",
            json={"email": "user@example.com", "otp": "000000"}
        )
        assert response.status_code == 400

    response = client.post(
        "/auth/verify-email",
        json={"email": "user@example.com", "otp": "000000"}
    )
    assert response.status_code == 400
    assert "Maximum verification attempts" in response.json()["detail"]


# API: user not found
def test_verify_email_endpoint_user_not_found(client):
    response = client.post(
        "/auth/verify-email",
        json={"email": "ghost@example.com", "otp": "123456"}
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "User not found"


# API: resend respects cooldown, then invalidates previous OTP
def test_resend_cooldown_and_invalidation(client, db):
    register_via_api(client)

    cooldown = client.post(
        "/auth/resend-verification",
        json={"email": "user@example.com"}
    )
    assert cooldown.status_code == 429

    record = (
        db.query(EmailVerification)
        .order_by(EmailVerification.created_at.desc())
        .first()
    )
    record.created_at = datetime.now(UTC) - timedelta(seconds=61)
    db.commit()

    result = client.post(
        "/auth/resend-verification",
        json={"email": "user@example.com"}
    )
    assert result.status_code == 200
    assert result.json()["message"] == "Verification code sent"

    new_otp = client.get_latest_otp("user@example.com")
    assert new_otp is not None

    db.refresh(record)
    assert record.used_at is not None

    active = (
        db.query(EmailVerification)
        .filter(
            EmailVerification.user_id == record.user_id,
            EmailVerification.used_at.is_(None)
        )
        .count()
    )
    assert active == 1


# API: resend for already verified user
def test_resend_already_verified(client):
    register_via_api(client)
    otp = client.get_latest_otp("user@example.com")

    client.post(
        "/auth/verify-email",
        json={"email": "user@example.com", "otp": otp}
    )

    response = client.post(
        "/auth/resend-verification",
        json={"email": "user@example.com"}
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Email already verified"


# Login: unverified user cannot obtain a JWT, verified user can
def test_login_requires_email_verification(client):
    register_via_api(client)

    unverified = client.post(
        "/auth/login",
        data={"username": "user@example.com", "password": "password123"}
    )
    assert unverified.status_code == 403
    assert unverified.json()["detail"] == "Email verification required"
    assert "access_token" not in unverified.json()

    otp = client.get_latest_otp("user@example.com", kind="verification")
    verified = client.post(
        "/auth/verify-email",
        json={"email": "user@example.com", "otp": otp}
    )
    assert verified.status_code == 200

    login = client.post(
        "/auth/login",
        data={"username": "user@example.com", "password": "password123"}
    )
    assert login.status_code == 200
    assert login.json()["otp_required"] is True
    assert login.json()["challenge_id"]

    login_otp = client.get_latest_otp("user@example.com", kind="login")
    token_response = client.post(
        "/auth/verify-login",
        json={"challenge_id": login.json()["challenge_id"], "otp": login_otp}
    )
    assert token_response.status_code == 200
    assert token_response.json()["token_type"] == "bearer"
    assert token_response.json()["access_token"]
