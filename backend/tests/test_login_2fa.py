from datetime import datetime, timedelta, UTC

import pytest

from app.database.models.user import User
from app.database.models.login_verification import LoginVerification
from app.core.security import hash_password
from app.services import otp_service


def make_user(db, email="user@example.com", username="user", ip_address=None):
    user = User(
        username=username,
        email=email,
        hashed_password=hash_password("password123"),
        ip_address=ip_address
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def make_verified_user(db, email="user@example.com", username="user", ip_address=None):
    user = make_user(db, email, username, ip_address)
    user.email_verified = True
    db.commit()
    db.refresh(user)
    return user


def register_via_api(client, email="user@example.com", username="user"):
    response = client.post(
        "/auth/register",
        json={
            "username": username,
            "email": email,
            "password": "password123"
        }
    )
    assert response.status_code == 200
    return response


def verify_email_via_api(client, email="user@example.com"):
    otp = client.get_latest_otp(email, kind="verification")
    return client.post(
        "/auth/verify-email",
        json={"email": email, "otp": otp}
    )


def login_via_api(client, email="user@example.com", password="password123"):
    return client.post(
        "/auth/login",
        data={"username": email, "password": password}
    )


def verify_login_via_api(client, challenge_id, otp):
    return client.post(
        "/auth/verify-login",
        json={"challenge_id": challenge_id, "otp": otp}
    )


def register_verified(client, email="user@example.com", username="user"):
    register_via_api(client, email, username)
    response = verify_email_via_api(client, email)
    assert response.status_code == 200


def get_challenge(db, challenge_id):
    return (
        db.query(LoginVerification)
        .filter(LoginVerification.challenge_id == challenge_id)
        .first()
    )


def expire_challenge(db, challenge_id):
    record = get_challenge(db, challenge_id)
    record.expires_at = datetime.now(UTC) - timedelta(seconds=1)
    db.commit()


def bypass_resend_cooldown(db, challenge_id):
    record = get_challenge(db, challenge_id)
    record.created_at = datetime.now(UTC) - timedelta(seconds=61)
    db.commit()


# 1. Correct password does NOT immediately return JWT
def test_correct_password_returns_challenge_not_jwt(client):
    register_verified(client)

    response = login_via_api(client)

    assert response.status_code == 200
    body = response.json()
    assert body["otp_required"] is True
    assert body["challenge_id"]
    assert body["message"] == "Verification code sent to your email"
    assert "access_token" not in body
    assert "token_type" not in body


# 2. Incorrect password does NOT send OTP
def test_incorrect_password_does_not_send_otp(client):
    register_verified(client)

    before = client.count_emails(kind="login")
    response = login_via_api(client, password="wrong-password")

    assert response.status_code == 401
    assert client.count_emails(kind="login") == before


# 3. Unverified email cannot initiate login OTP
def test_unverified_email_cannot_initiate_login_otp(client):
    register_via_api(client)

    before = client.count_emails(kind="login")
    response = login_via_api(client)

    assert response.status_code == 403
    assert response.json()["detail"] == "Email verification required"
    assert "access_token" not in response.json()
    assert client.count_emails(kind="login") == before


# 4. Correct password generates a login OTP
def test_correct_password_generates_login_otp(client, db):
    register_verified(client)

    response = login_via_api(client)

    assert response.status_code == 200
    challenge = get_challenge(db, response.json()["challenge_id"])
    assert challenge is not None
    assert challenge.otp_hash
    assert client.count_emails(kind="login") == 1
    assert client.get_latest_otp("user@example.com", kind="login") is not None


# 5. Login OTP is stored hashed, never plaintext
def test_login_otp_stored_hashed_not_plaintext(client, db):
    register_verified(client)

    response = login_via_api(client)

    otp = client.get_latest_otp("user@example.com", kind="login")
    challenge = get_challenge(db, response.json()["challenge_id"])

    assert challenge.otp_hash == otp_service.hash_otp(otp)
    assert challenge.otp_hash != otp


# 6. Correct login OTP issues JWT
def test_correct_login_otp_issues_jwt(client, db):
    register_verified(client)

    login = login_via_api(client)
    challenge_id = login.json()["challenge_id"]
    otp = client.get_latest_otp("user@example.com", kind="login")

    response = verify_login_via_api(client, challenge_id, otp)

    assert response.status_code == 200
    assert response.json()["token_type"] == "bearer"
    assert response.json()["access_token"]

    challenge = get_challenge(db, challenge_id)
    assert challenge.used_at is not None


# 7. Incorrect login OTP does NOT issue JWT
def test_incorrect_login_otp_does_not_issue_jwt(client, db):
    register_verified(client)

    login = login_via_api(client)
    challenge_id = login.json()["challenge_id"]

    response = verify_login_via_api(client, challenge_id, "000000")

    assert response.status_code == 400
    assert "access_token" not in response.json()

    challenge = get_challenge(db, challenge_id)
    assert challenge.attempts == 1


# 8. Expired login OTP does NOT issue JWT
def test_expired_login_otp_does_not_issue_jwt(client, db):
    register_verified(client)

    login = login_via_api(client)
    challenge_id = login.json()["challenge_id"]
    expire_challenge(db, challenge_id)
    otp = client.get_latest_otp("user@example.com", kind="login")

    response = verify_login_via_api(client, challenge_id, otp)

    assert response.status_code == 400
    assert "access_token" not in response.json()


# 9. Login OTP cannot be reused
def test_login_otp_cannot_be_reused(client, db):
    register_verified(client)

    login = login_via_api(client)
    challenge_id = login.json()["challenge_id"]
    otp = client.get_latest_otp("user@example.com", kind="login")

    first = verify_login_via_api(client, challenge_id, otp)
    assert first.status_code == 200
    assert first.json()["access_token"]

    second = verify_login_via_api(client, challenge_id, otp)
    assert second.status_code == 400
    assert "access_token" not in second.json()


# 10. Maximum OTP attempts invalidate the challenge
def test_max_otp_attempts_invalidate_challenge(client, db):
    register_verified(client)

    login = login_via_api(client)
    challenge_id = login.json()["challenge_id"]
    otp = client.get_latest_otp("user@example.com", kind="login")

    for _ in range(5):
        response = verify_login_via_api(client, challenge_id, "000000")
        assert response.status_code == 400

    challenge = get_challenge(db, challenge_id)
    assert challenge.attempts == 5
    assert challenge.used_at is not None

    final = verify_login_via_api(client, challenge_id, otp)
    assert final.status_code == 400
    assert "access_token" not in final.json()


# 11. Resend login OTP works
def test_resend_login_otp_works(client, db):
    register_verified(client)

    login = login_via_api(client)
    challenge_id = login.json()["challenge_id"]
    original_otp = client.get_latest_otp("user@example.com", kind="login")
    bypass_resend_cooldown(db, challenge_id)

    response = client.post(
        "/auth/resend-login-otp",
        json={"challenge_id": challenge_id}
    )

    assert response.status_code == 200
    assert response.json()["otp_required"] is True
    assert response.json()["challenge_id"] == challenge_id

    new_otp = client.get_latest_otp("user@example.com", kind="login")
    assert new_otp != original_otp


# 12. Resend cooldown is enforced
def test_resend_cooldown_enforced(client):
    register_verified(client)

    login = login_via_api(client)
    challenge_id = login.json()["challenge_id"]

    response = client.post(
        "/auth/resend-login-otp",
        json={"challenge_id": challenge_id}
    )

    assert response.status_code == 429


# 13. Resending invalidates the previous OTP
def test_resend_invalidates_previous_otp(client, db):
    register_verified(client)

    login = login_via_api(client)
    challenge_id = login.json()["challenge_id"]
    original_otp = client.get_latest_otp("user@example.com", kind="login")
    bypass_resend_cooldown(db, challenge_id)

    client.post(
        "/auth/resend-login-otp",
        json={"challenge_id": challenge_id}
    )
    new_otp = client.get_latest_otp("user@example.com", kind="login")

    old_response = verify_login_via_api(client, challenge_id, original_otp)
    assert old_response.status_code == 400

    new_response = verify_login_via_api(client, challenge_id, new_otp)
    assert new_response.status_code == 200
    assert new_response.json()["access_token"]


# 14. Successful login OTP updates users.ip_address
def test_successful_login_otp_updates_ip(client_factory, db):
    client = client_factory(client_host="192.168.1.100")
    register_verified(client)
    assert get_user_ip(db, "user@example.com") == "192.168.1.100"

    login_client = client_factory(client_host="203.0.113.50")
    login = login_via_api(login_client)
    assert login.status_code == 200

    assert get_user_ip(db, "user@example.com") == "192.168.1.100"

    otp = login_client.get_latest_otp("user@example.com", kind="login")
    verified = verify_login_via_api(login_client, login.json()["challenge_id"], otp)
    assert verified.status_code == 200

    assert get_user_ip(db, "user@example.com") == "203.0.113.50"


# 15. Failed login OTP does NOT update users.ip_address
def test_failed_login_otp_does_not_update_ip(client_factory, db):
    client = client_factory(client_host="192.168.1.100")
    register_verified(client)

    login_client = client_factory(client_host="203.0.113.50")
    login = login_via_api(login_client)

    response = verify_login_via_api(login_client, login.json()["challenge_id"], "000000")
    assert response.status_code == 400

    assert get_user_ip(db, "user@example.com") == "192.168.1.100"


# 16. Failed password does NOT update users.ip_address
def test_failed_password_does_not_update_ip(client_factory, db):
    client = client_factory(client_host="192.168.1.100")
    register_verified(client)

    attacker = client_factory(client_host="203.0.113.50")
    response = login_via_api(attacker, password="wrong-password")
    assert response.status_code == 401

    assert get_user_ip(db, "user@example.com") == "192.168.1.100"


# 17. Existing registration OTP flow still works
def test_registration_otp_flow_still_works(client, db):
    register_via_api(client)

    user = (
        db.query(User)
        .filter(User.email == "user@example.com")
        .first()
    )
    assert user.email_verified is False

    response = verify_email_via_api(client)
    assert response.status_code == 200

    db.refresh(user)
    assert user.email_verified is True


# 18. Existing verified users can complete the new login flow
def test_existing_verified_user_can_complete_login_flow(client, db):
    make_verified_user(db)

    login = login_via_api(client)
    assert login.status_code == 200

    otp = client.get_latest_otp("user@example.com", kind="login")
    response = verify_login_via_api(client, login.json()["challenge_id"], otp)

    assert response.status_code == 200
    assert response.json()["access_token"]


# 19. Existing JWT-protected endpoints continue working after login OTP
def test_jwt_endpoints_work_after_login_otp(client, db):
    register_verified(client)

    login = login_via_api(client)
    otp = client.get_latest_otp("user@example.com", kind="login")
    token_response = verify_login_via_api(client, login.json()["challenge_id"], otp)
    token = token_response.json()["access_token"]

    me = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me.status_code == 200
    assert me.json()["email"] == "user@example.com"


def get_user_ip(db, email):
    return (
        db.query(User)
        .filter(User.email == email)
        .first()
    ).ip_address
