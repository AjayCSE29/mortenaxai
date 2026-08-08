from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, String, text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database.base import Base


class LoginVerification(Base):
    __tablename__ = "login_verifications"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    challenge_id = Column(
        String,
        unique=True,
        nullable=False,
        index=True
    )

    otp_hash = Column(
        String,
        nullable=False
    )

    expires_at = Column(
        DateTime(timezone=True),
        nullable=False
    )

    attempts = Column(
        Integer,
        nullable=False,
        default=0
    )

    used_at = Column(
        DateTime(timezone=True),
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    user = relationship(
        "User",
        back_populates="login_verifications"
    )


Index(
    "uq_login_verifications_active_user",
    "user_id",
    unique=True,
    postgresql_where=text("used_at IS NULL")
)
