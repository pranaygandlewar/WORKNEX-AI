from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from backend.app.api.dependencies import get_db, require_admin, require_authenticated
from backend.app.models import User
from backend.app.schemas import UserResponse, UserCreate, UserUpdate
from backend.app.core.security import get_password_hash
from backend.app.core.permissions import RoleEnum
from backend.app.services.audit_service import record_audit

router = APIRouter(prefix="/users", tags=["User & Access Management"])

@router.get("", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """List all registered enterprise users (Administrator only)."""
    return db.query(User).order_by(User.username.asc()).all()

@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Create a new user with Argon2 password hashing (Administrator only)."""
    existing_user = db.query(User).filter(
        (User.username == user_in.username) | (User.email == user_in.email)
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this username or email already exists."
        )

    # Validate role
    if user_in.role not in [r.value for r in RoleEnum]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Allowed roles: {[r.value for r in RoleEnum]}"
        )

    new_user = User(
        id=f"usr-{uuid.uuid4().hex[:8]}",
        username=user_in.username,
        email=user_in.email,
        full_name=user_in.full_name,
        role=user_in.role,
        is_active=user_in.is_active,
        hashed_password=get_password_hash(user_in.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    record_audit(
        tool_name="create_user",
        arguments={"username": new_user.username, "role": new_user.role, "email": new_user.email},
        result=f"Created user {new_user.username} with role {new_user.role}",
        actor=current_user.username,
        action_type="USER_MANAGEMENT",
        db=db
    )

    return new_user

@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: str,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update user account, role, or credentials (Administrator only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user_in.email:
        user.email = user_in.email
    if user_in.full_name:
        user.full_name = user_in.full_name
    if user_in.role:
        if user_in.role not in [r.value for r in RoleEnum]:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role specified")
        user.role = user_in.role
    if user_in.is_active is not None:
        user.is_active = user_in.is_active
    if user_in.password:
        user.hashed_password = get_password_hash(user_in.password)

    db.commit()
    db.refresh(user)

    record_audit(
        tool_name="update_user",
        arguments={"user_id": user_id, "updated_fields": user_in.model_dump(exclude_unset=True, exclude={"password"})},
        result=f"Updated user {user.username}",
        actor=current_user.username,
        action_type="USER_MANAGEMENT",
        db=db
    )

    return user

@router.get("/roles", response_model=List[str])
def get_roles(current_user: User = Depends(require_authenticated)):
    """List available system roles."""
    return [r.value for r in RoleEnum]

