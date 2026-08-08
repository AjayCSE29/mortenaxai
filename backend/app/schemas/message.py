from datetime import datetime

from pydantic import BaseModel


class MessageCreate(BaseModel):
    conversation_id: int
    role: str
    content: str


class MessageResponse(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

    model_config = {
        "from_attributes": True
    }