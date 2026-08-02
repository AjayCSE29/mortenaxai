import valkey

from app.core.config import settings

client = valkey.Valkey(
    host = settings.VALKEY_HOST,
    port = settings.VALKEY_PORT,
    decode_responses = True
)
