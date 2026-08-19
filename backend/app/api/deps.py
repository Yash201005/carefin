from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.models import User

# HTTPBearer retrieves the Authorization Bearer header
reusable_oauth2 = HTTPBearer(auto_error=False)

def get_current_user(
    http_auth: HTTPAuthorizationCredentials = Depends(reusable_oauth2),  # noqa: B008
    db: Session = Depends(get_db)  # noqa: B008
) -> User:
    """
    Retrieves the current authenticated user from the bearer JWT.
    """
    if not http_auth:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is missing. Please sign in."
        )
    
    token = http_auth.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired or the token is invalid."
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload is invalid."
        )
        
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="The authenticated user was not found."
        )
        
    return user


def get_current_user_optional(
    http_auth: HTTPAuthorizationCredentials = Depends(reusable_oauth2),  # noqa: B008
    db: Session = Depends(get_db)  # noqa: B008
) -> User | None:
    """
    Optionally retrieves the current authenticated user. Returns None if credentials missing/invalid.
    """
    if not http_auth:
        return None
    try:
        token = http_auth.credentials
        payload = decode_access_token(token)
        if not payload:
            return None
        user_id = payload.get("sub")
        if not user_id:
            return None
        return db.query(User).filter(User.id == int(user_id)).first()
    except Exception:  # noqa: BLE001
        return None
