from pydantic import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "Moternax AI"
    API_VERSION: str = "v1"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DATABASE_URL: str
    VALKEY_HOST: str
    VALKEY_PORT: int
    OLLAMA_URL: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

settings = Settings()   