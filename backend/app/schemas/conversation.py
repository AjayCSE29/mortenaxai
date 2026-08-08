from pydantic import BaseModel
from datetime import datetime
from datetime import datetime
from app.schemas.message import MessageResponse

from pydantic import BaseModel


class ConversationCreate(BaseModel):
    title: str


class ConversationResponse(BaseModel):
    id: int
    title: str
    created_at: datetime
    updated_at: datetime

    messages: list[MessageResponse] = []

    model_config = {
        "from_attributes": True
    }

class ConversationCreate(BaseModel):
    title: str = "New Chat"


class ConversationResponse(BaseModel):
    id: int
    title: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True