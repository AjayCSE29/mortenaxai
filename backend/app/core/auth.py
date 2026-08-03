from datetime import datetime, timedelta, UTC

from jose import jwt

from app.core.config import settings

ALGORITHM = "HS256"


def create_access_token(data: dict, expires_minutes: int = 60):
    to_encode = data.copy()

    expire = datetime.now(UTC) + timedelta(minutes=expires_minutes)

    to_encode.update({"exp": expire})

    return jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=ALGORITHM
    )