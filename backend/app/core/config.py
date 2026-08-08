from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str
    API_VERSION: str
    HOST: str
    PORT: int
    DATABASE_URL: str
    VALKEY_HOST: str
    VALKEY_PORT: int
    OLLAMA_URL: str
    JWT_SECRET: str
    JWT_ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    SECRET_KEY: str
    DEBUG: bool

    BREVO_API_KEY: str = ""
    BREVO_SENDER_EMAIL: str = ""
    BREVO_SENDER_NAME: str = "Mortenax AI"

    OTP_LENGTH: int = 6
    OTP_EXPIRATION_MINUTES: int = 5
    OTP_MAX_ATTEMPTS: int = 5
    OTP_RESEND_COOLDOWN_SECONDS: int = 60

    TRUST_PROXY_HEADERS: bool = False
    
    model_config = SettingsConfigDict(env_file=".env", 
                                      case_sensitive=True,
                                      extra="ignore")

settings = Settings()   