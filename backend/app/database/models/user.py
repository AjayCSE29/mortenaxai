from sqlalchemy import Boolean, Column, Integer, String, text
from app.database.base import Base
from sqlalchemy.orm import relationship

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    username = Column(
        String,
        unique=True,
        nullable=False
    )

    email = Column(
        String,
        unique=True,
        nullable=False,
        index=True
    )

    hashed_password = Column(
        String,
        nullable=False
    )

    email_verified = Column(
        Boolean,
        nullable=False,
        default=False,
        server_default=text("false")
    )

    ip_address = Column(
        String(45),
        nullable=True
    )

    conversations = relationship(
    "Conversation",
    back_populates="user",
    cascade="all, delete"
    )

    email_verifications = relationship(
        "EmailVerification",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    login_verifications = relationship(
        "LoginVerification",
        back_populates="user",
        cascade="all, delete-orphan"
    )