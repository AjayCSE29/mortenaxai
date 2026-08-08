from fastapi import Request

from app.core.config import settings


def get_client_ip(request: Request) -> str | None:
    if settings.TRUST_PROXY_HEADERS:
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()

    client = request.client
    return client.host if client is not None else None
