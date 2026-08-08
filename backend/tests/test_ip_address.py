import pytest

from app.database.models.user import User
from app.core.security import hash_password


def make_user(db, email="existing@example.com", username="existing", ip_address=None):
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


def register_via_api(client, email="user@example.com", username="user"):
    response = client.post(
        "/auth/register",
        json={
            "username": username,
            "email": email,
            "password": "password123"
        }
    )
    return response


def login_via_api(client, email="user@example.com"):
    return client.post(
        "/auth/login",
        data={"username": email, "password": "password123"}
    )


def verify_login_via_api(client, challenge_id, email="user@example.com"):
    otp = client.get_latest_otp(email, kind="login")
    return client.post(
        "/auth/verify-login",
        json={"challenge_id": challenge_id, "otp": otp}
    )


def get_user(db, email="user@example.com"):
    return (
        db.query(User)
        .filter(User.email == email)
        .first()
    )


def test_register_saves_client_ip(client_factory, db):
    client = client_factory(client_host="192.168.1.100")
    response = register_via_api(client)

    assert response.status_code == 200
    assert get_user(db).ip_address == "192.168.1.100"


def test_same_ip_login_keeps_ip(client_factory, db):
    client = client_factory(client_host="10.0.0.5")
    register_via_api(client)

    otp = client.get_latest_otp("user@example.com")
    client.post(
        "/auth/verify-email",
        json={"email": "user@example.com", "otp": otp}
    )

    response = login_via_api(client)
    assert response.status_code == 200
    assert get_user(db).ip_address == "10.0.0.5"


def test_different_ip_login_updates_ip(client_factory, db):
    client = client_factory(client_host="10.0.0.5")
    register_via_api(client)

    otp = client.get_latest_otp("user@example.com")
    client.post(
        "/auth/verify-email",
        json={"email": "user@example.com", "otp": otp}
    )

    assert get_user(db).ip_address == "10.0.0.5"

    other_client = client_factory(client_host="203.0.113.9")
    login = login_via_api(other_client)

    assert login.status_code == 200
    assert get_user(db).ip_address == "10.0.0.5"

    verified = verify_login_via_api(other_client, login.json()["challenge_id"])
    assert verified.status_code == 200

    assert get_user(db).ip_address == "203.0.113.9"


def test_failed_login_does_not_update_ip(client_factory, db):
    client = client_factory(client_host="10.0.0.5")
    register_via_api(client)

    otp = client.get_latest_otp("user@example.com")
    client.post(
        "/auth/verify-email",
        json={"email": "user@example.com", "otp": otp}
    )

    wrong_pw_client = client_factory(client_host="203.0.113.9")
    response = wrong_pw_client.post(
        "/auth/login",
        data={"username": "user@example.com", "password": "wrong-password"}
    )

    assert response.status_code == 401
    assert get_user(db).ip_address == "10.0.0.5"


def test_unverified_login_does_not_update_ip(client_factory, db):
    client = client_factory(client_host="10.0.0.5")
    register_via_api(client)

    other_client = client_factory(client_host="203.0.113.9")
    response = login_via_api(other_client)

    assert response.status_code == 403
    assert get_user(db).ip_address == "10.0.0.5"


def test_ipv6_address_stored(client_factory, db):
    client = client_factory(client_host="2001:db8::1")
    response = register_via_api(client)

    assert response.status_code == 200
    assert get_user(db).ip_address == "2001:db8::1"


def test_existing_user_without_ip_stays_null(db, client_factory):
    make_user(db, ip_address=None)
    client = client_factory(client_host="10.0.0.5")

    assert get_user(db, email="existing@example.com").ip_address is None

    response = client.post(
        "/auth/login",
        data={"username": "existing@example.com", "password": "password123"}
    )
    assert response.status_code == 403

    assert get_user(db, email="existing@example.com").ip_address is None


def test_register_response_does_not_expose_ip(client_factory):
    client = client_factory(client_host="192.168.1.100")
    response = register_via_api(client)

    assert response.status_code == 200
    assert "ip_address" not in response.json()


@pytest.mark.parametrize("ip,expected", [
    ("192.168.1.100", "192.168.1.100"),
    ("2001:db8::1", "2001:db8::1"),
])
def test_register_then_me_does_not_expose_ip(client_factory, ip, expected):
    client = client_factory(client_host=ip)
    register_via_api(client)

    otp = client.get_latest_otp("user@example.com")
    client.post(
        "/auth/verify-email",
        json={"email": "user@example.com", "otp": otp}
    )

    login = login_via_api(client)
    token_response = verify_login_via_api(client, login.json()["challenge_id"])
    token = token_response.json()["access_token"]

    me = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me.status_code == 200
    assert "ip_address" not in me.json()
