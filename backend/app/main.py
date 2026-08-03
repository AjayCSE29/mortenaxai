from fastapi import FastAPI
from app.core.config import settings

from app.database.base import Base
from app.database.database import engine
from app.database.models import User

from app.api.router import router as api_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title = settings.APP_NAME,
    version = settings.API_VERSION,
    debug = settings.DEBUG
)

app.include_router(
    api_router,
    prefix="/api"
)

@app.get("/")
def root():
    return {"message": "Welcome to MoternaxAI!"}

@app.get("/health")
def health():
    return {"status": "healthy",
            "version": settings.API_VERSION,
            "debug": settings.DEBUG,
            "app" : settings.APP_NAME
        }

