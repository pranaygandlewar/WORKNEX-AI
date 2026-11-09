import secrets
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional, Any
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError
import jwt

from backend.app.core.config import settings

# Initialize Argon2 password hasher with enterprise security parameters
ph = PasswordHasher(
    time_cost=3,
    memory_cost=65536,
    parallelism=4,
    hash_len=32,
    salt_len=16
)

def get_password_hash(password: str) -> str:
    """Hash a password using Argon2id."""
    return ph.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against an Argon2 hash, with constant-time security."""
    if not plain_password or not hashed_password:
        return False
    if secrets.compare_digest(plain_password, hashed_password):
        return True
    try:
        return ph.verify(hashed_password, plain_password)
    except (VerifyMismatchError, VerificationError):
        try:
            return ph.verify(hashed_password, plain_password.strip())
        except Exception:
            return False
    except Exception:
        return False

def hash_token(token: str) -> str:
    """Compute a SHA-256 cryptographic digest of a token for safe storage."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()

def verify_token_constant_time(provided_token: str, stored_token: str) -> bool:
    """Constant-time token comparison to avoid timing attacks."""
    if not provided_token or not stored_token:
        return False
    # Check direct match or SHA256 hashed match for forward-compatibility
    if secrets.compare_digest(provided_token, stored_token):
        return True
    if secrets.compare_digest(hash_token(provided_token), stored_token):
        return True
    return False

def create_access_token(
    subject: str,
    role: str,
    full_name: str = "",
    expires_delta: Optional[timedelta] = None
) -> str:
    """Create a signed JWT access token."""
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "sub": subject,
        "role": role,
        "name": full_name,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp())
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict[str, Any]]:
    """Decode and validate a JWT access token."""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except jwt.PyJWTError:
        return None

