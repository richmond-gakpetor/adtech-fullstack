from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.config import settings
from app.core.exceptions import UnauthorizedException


# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ============= Password Utilities =============

def hash_password(password: str) -> str:
    """
    Hash a plain password using bcrypt.
    
    Args:
        password: Plain text password
        
    Returns:
        Hashed password
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against a hashed password.
    
    Args:
        plain_password: Plain text password to verify
        hashed_password: Hashed password from database
        
    Returns:
        True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)


# ============= JWT Token Utilities =============

def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: Dictionary containing token payload (user_id, email, etc.)
        expires_delta: Optional expiration time delta
        
    Returns:
        Encoded JWT token
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access"
    })
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def create_refresh_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT refresh token.
    
    Args:
        data: Dictionary containing token payload (user_id, email, etc.)
        expires_delta: Optional expiration time delta
        
    Returns:
        Encoded JWT token
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "refresh"
    })
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def create_password_reset_token(email: str) -> str:
    """
    Create a JWT token for password reset.
    
    Args:
        email: User email address
        
    Returns:
        Encoded JWT token
    """
    expire = datetime.utcnow() + timedelta(
        hours=settings.PASSWORD_RESET_TOKEN_EXPIRE_HOURS
    )
    
    to_encode = {
        "sub": email,
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "password_reset"
    }
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def decode_token(token: str) -> Dict[str, Any]:
    """
    Decode and verify a JWT token.
    
    Args:
        token: JWT token to decode
        
    Returns:
        Dictionary containing token payload
        
    Raises:
        UnauthorizedException: If token is invalid or expired
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError as e:
        raise UnauthorizedException(detail=f"Invalid token: {str(e)}")


def verify_access_token(token: str) -> Dict[str, Any]:
    """
    Verify an access token and return its payload.
    
    Args:
        token: Access token to verify
        
    Returns:
        Dictionary containing token payload
        
    Raises:
        UnauthorizedException: If token is invalid, expired, or not an access token
    """
    payload = decode_token(token)
    
    if payload.get("type") != "access":
        raise UnauthorizedException(detail="Invalid token type")
    
    return payload


def verify_refresh_token(token: str) -> Dict[str, Any]:
    """
    Verify a refresh token and return its payload.
    
    Args:
        token: Refresh token to verify
        
    Returns:
        Dictionary containing token payload
        
    Raises:
        UnauthorizedException: If token is invalid, expired, or not a refresh token
    """
    payload = decode_token(token)
    
    if payload.get("type") != "refresh":
        raise UnauthorizedException(detail="Invalid token type")
    
    return payload


def verify_password_reset_token(token: str) -> str:
    """
    Verify a password reset token and return the email.
    
    Args:
        token: Password reset token to verify
        
    Returns:
        Email address from token
        
    Raises:
        UnauthorizedException: If token is invalid, expired, or not a password reset token
    """
    payload = decode_token(token)
    
    if payload.get("type") != "password_reset":
        raise UnauthorizedException(detail="Invalid token type")
    
    email: str = payload.get("sub")
    if not email:
        raise UnauthorizedException(detail="Invalid token payload")
    
    return email
