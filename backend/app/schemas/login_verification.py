from pydantic import BaseModel, Field


class LoginChallengeResponse(BaseModel):
    otp_required: bool = True
    challenge_id: str
    message: str = "Verification code sent to your email"


class VerifyLoginRequest(BaseModel):
    challenge_id: str
    otp: str = Field(
        min_length=6,
        max_length=6,
        pattern=r"^\d{6}$"
    )


class ResendLoginOTPRequest(BaseModel):
    challenge_id: str
