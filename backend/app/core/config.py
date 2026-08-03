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
    DEBUG: bool

    model_config = SettingsConfigDict(env_file=".env", 
                                      case_sensitive=True,
                                      extra="ignore")

settings = Settings()   