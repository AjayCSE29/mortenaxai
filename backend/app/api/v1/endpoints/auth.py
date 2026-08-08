import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.database.models.user import User
from app.schemas.user import UserCreate, UserResponse
from app.core.security import hash_password
from app.dependencies.auth import get_current_user
from fastapi.security import OAuth2PasswordRequestForm

from app.schemas.token import LoginRequest, Token
from app.core.security import (
    verify_password,
    create_access_token
)

from app.services import otp_service, login_otp_service
from app.services.otp_service import (
    OTPNotFoundError,
    OTPExpiredError,
    OTPAttemptsExceededError,
    OTPInvalidError
)
from app.services.email_service import (
    send_verification_otp,
    send_login_otp,
    EmailDeliveryError
)
from app.utils.ip import get_client_ip
from app.schemas.verification import (
    VerifyEmailRequest,
    ResendVerificationRequest,
    VerifyEmailResponse
)
from app.schemas.login_verification import (
    LoginChallengeResponse,
    VerifyLoginRequest,
    ResendLoginOTPRequest
)

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post(
    "/register",
    response_model=UserResponse
)
def register(
    user: UserCreate,
    request: Request,
    db: Session = Depends(get_db)
):

    existing_email = (
        db.query(User)
        .filter(User.email == user.email)
        .first()
    )

    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )

    existing_username = (
        db.query(User)
        .filter(User.username == user.username)
        .first()
    )

    if existing_username:
        raise HTTPException(
            status_code=400,
            detail="Username already exists"
        )

    hashed_password = hash_password(user.password)

    new_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hash_password(user.password),
        ip_address=get_client_ip(request)
    )

    db.add(new_user)

    db.commit()

    db.refresh(new_user)

    try:
        _, otp = otp_service.create_verification(db, new_user)
        send_verification_otp(new_user.email, otp)
    except EmailDeliveryError:
        logger.warning(
            "Verification email could not be sent to newly registered user %s",
            new_user.email
        )

    return new_user


@router.post(
    "/verify-email",
    response_model=VerifyEmailResponse
)
def verify_email(
    payload: VerifyEmailRequest,
    db: Session = Depends(get_db)
):

    user = (
        db.query(User)
        .filter(User.email == payload.email)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if user.email_verified:
        raise HTTPException(
            status_code=400,
            detail="Email already verified"
        )

    try:
        otp_service.verify_otp(db, user, payload.otp)
    except otp_service.OTPNotFoundError:
        raise HTTPException(
            status_code=400,
            detail="No active verification code. Please request a new one."
        )
    except otp_service.OTPExpiredError:
        raise HTTPException(
            status_code=400,
            detail="Verification code has expired. Please request a new one."
        )
    except otp_service.OTPAttemptsExceededError:
        raise HTTPException(
            status_code=400,
            detail="Maximum verification attempts exceeded. Please request a new code."
        )
    except otp_service.OTPInvalidError:
        raise HTTPException(
            status_code=400,
            detail="Invalid verification code"
        )

    return {
        "message": "Email verified successfully",
        "email": user.email
    }


@router.post(
    "/resend-verification",
    response_model=VerifyEmailResponse
)
def resend_verification(
    payload: ResendVerificationRequest,
    db: Session = Depends(get_db)
):

    user = (
        db.query(User)
        .filter(User.email == payload.email)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if user.email_verified:
        raise HTTPException(
            status_code=400,
            detail="Email already verified"
        )

    if not otp_service.can_resend(db, user):
        raise HTTPException(
            status_code=429,
            detail="Please wait before requesting a new code"
        )

    _, otp = otp_service.create_verification(db, user)

    try:
        send_verification_otp(user.email, otp)
    except EmailDeliveryError:
        raise HTTPException(
            status_code=502,
            detail="Unable to send the verification email. Please try again."
        )

    return {
        "message": "Verification code sent",
        "email": user.email
    }


@router.post(
    "/login",
    response_model=LoginChallengeResponse
)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):

    user = (
        db.query(User)
        .filter(User.email == form_data.username)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(
        form_data.password,
        user.hashed_password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not user.email_verified:
        raise HTTPException(
            status_code=403,
            detail="Email verification required"
        )

    record, otp = login_otp_service.create_challenge(db, user)

    try:
        send_login_otp(user.email, otp)
    except EmailDeliveryError:
        logger.warning(
            "Login verification email could not be sent to %s",
            user.email
        )

    return {
        "otp_required": True,
        "challenge_id": record.challenge_id,
        "message": "Verification code sent to your email"
    }


@router.post(
    "/verify-login",
    response_model=Token
)
def verify_login(
    payload: VerifyLoginRequest,
    request: Request,
    db: Session = Depends(get_db)
):

    challenge = login_otp_service.get_challenge(db, payload.challenge_id)

    if challenge is None:
        raise HTTPException(
            status_code=404,
            detail="Login challenge not found"
        )

    try:
        login_otp_service.verify_login_otp(db, challenge, payload.otp)
    except login_otp_service.OTPAlreadyUsedError:
        raise HTTPException(
            status_code=400,
            detail="Login code already used. Please log in again."
        )
    except OTPExpiredError:
        raise HTTPException(
            status_code=400,
            detail="Login code has expired. Please log in again."
        )
    except OTPAttemptsExceededError:
        raise HTTPException(
            status_code=400,
            detail="Too many failed attempts. Please log in again."
        )
    except OTPInvalidError:
        raise HTTPException(
            status_code=400,
            detail="Invalid login code"
        )

    user = challenge.user
    user.ip_address = get_client_ip(request)

    db.commit()

    access_token = create_access_token(
        {
            "sub": str(user.id)
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.post(
    "/resend-login-otp",
    response_model=LoginChallengeResponse
)
def resend_login_otp(
    payload: ResendLoginOTPRequest,
    db: Session = Depends(get_db)
):

    challenge = login_otp_service.get_challenge(db, payload.challenge_id)

    if challenge is None:
        raise HTTPException(
            status_code=404,
            detail="Login challenge not found"
        )

    if challenge.used_at is not None:
        raise HTTPException(
            status_code=400,
            detail="Login challenge already used"
        )

    if login_otp_service.is_expired(challenge):
        raise HTTPException(
            status_code=400,
            detail="Login challenge has expired. Please log in again."
        )

    if not login_otp_service.can_resend(challenge):
        raise HTTPException(
            status_code=429,
            detail="Please wait before requesting a new code"
        )

    _, otp = login_otp_service.resend_otp(db, challenge)

    try:
        send_login_otp(challenge.user.email, otp)
    except EmailDeliveryError:
        raise HTTPException(
            status_code=502,
            detail="Unable to send the login code. Please try again."
        )

    return {
        "otp_required": True,
        "challenge_id": challenge.challenge_id,
        "message": "Verification code sent to your email"
    }

@router.get(
    "/me",
    response_model=UserResponse
)
def get_me(
    current_user: User = Depends(get_current_user)
):
    return current_user
