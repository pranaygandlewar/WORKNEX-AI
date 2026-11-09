from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.api.dependencies import get_db, get_current_user
from backend.app.models import User
from backend.app.schemas import LoginRequest, TokenResponse, UserResponse
from backend.app.core.security import verify_password, create_access_token
from backend.app.services.audit_service import record_audit

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user with username and Argon2 password hash."""
    user = db.query(User).filter(User.username == credentials.username).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        record_audit(
            tool_name="user_login",
            arguments={"username": credentials.username},
            result="Login FAILED: Invalid credentials",
            actor=credentials.username,
            action_type="AUTH_LOGIN",
            status="FAILURE",
            db=db
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive",
        )

    token = create_access_token(
        subject=user.username,
        role=user.role,
        full_name=user.full_name
    )

    record_audit(
        tool_name="user_login",
        arguments={"username": credentials.username},
        result=f"Login SUCCESS for role {user.role}",
        actor=user.username,
        action_type="AUTH_LOGIN",
        status="SUCCESS",
        db=db
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        role=user.role,
        username=user.username,
        full_name=user.full_name
    )

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """User logout."""
    record_audit(
        tool_name="user_logout",
        arguments={"username": current_user.username},
        result="Logout SUCCESS",
        actor=current_user.username,
        action_type="AUTH_LOGOUT",
        status="SUCCESS",
        db=db
    )
    return {"message": "Successfully logged out"}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Return currently authenticated user profile."""
    return current_user

