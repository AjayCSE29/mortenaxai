import os

os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ.setdefault("APP_NAME", "Mortenax AI")
os.environ.setdefault("API_VERSION", "v1")
os.environ.setdefault("HOST", "0.0.0.0")
os.environ.setdefault("PORT", "8000")
os.environ.setdefault("VALKEY_HOST", "localhost")
os.environ.setdefault("VALKEY_PORT", "6379")
os.environ.setdefault("OLLAMA_URL", "http://localhost:11434")
os.environ.setdefault("JWT_SECRET", "test-secret")
os.environ.setdefault("JWT_ALGORITHM", "HS256")
os.environ.setdefault("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
os.environ.setdefault("SECRET_KEY", "test-secret-key")
os.environ.setdefault("DEBUG", "False")

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database.base import Base
from app.database.session import get_db
from app.api.v1.endpoints import auth

import app.database.models  # noqa: F401  (register all models on Base.metadata)

engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)

TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(monkeypatch):
    sent_emails = []

    def fake_send_verification_otp(email, otp):
        sent_emails.append({"email": email, "otp": otp, "kind": "verification"})

    def fake_send_login_otp(email, otp):
        sent_emails.append({"email": email, "otp": otp, "kind": "login"})

    monkeypatch.setattr(
        auth,
        "send_verification_otp",
        fake_send_verification_otp
    )
    monkeypatch.setattr(
        auth,
        "send_login_otp",
        fake_send_login_otp
    )

    return _build_test_client(sent_emails)


@pytest.fixture
def client_factory(monkeypatch):
    sent_emails = []

    def fake_send_verification_otp(email, otp):
        sent_emails.append({"email": email, "otp": otp, "kind": "verification"})

    def fake_send_login_otp(email, otp):
        sent_emails.append({"email": email, "otp": otp, "kind": "login"})

    monkeypatch.setattr(
        auth,
        "send_verification_otp",
        fake_send_verification_otp
    )
    monkeypatch.setattr(
        auth,
        "send_login_otp",
        fake_send_login_otp
    )

    def _make(client_host=None):
        return _build_test_client(sent_emails, client_host)

    return _make


def _build_test_client(sent_emails, client_host=None):
    app = FastAPI()
    app.include_router(auth.router, prefix="/auth")

    def override_get_db():
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db

    kwargs = {}
    if client_host is not None:
        kwargs["client"] = (client_host, 50000)

    test_client = TestClient(app, **kwargs)

    def get_latest_otp(email, kind=None):
        for item in reversed(sent_emails):
            if item["email"] == email and (kind is None or item["kind"] == kind):
                return item["otp"]
        return None

    def count_emails(kind=None):
        if kind is None:
            return len(sent_emails)
        return sum(1 for item in sent_emails if item["kind"] == kind)

    test_client.sent_emails = sent_emails
    test_client.get_latest_otp = get_latest_otp
    test_client.count_emails = count_emails

    return test_client
