from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.models.models import User
from app.schemas.security import TokenResponse, UserLogin, UserRegister, UserResponse

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(payload: UserRegister, db: Session = Depends(get_db)):  # noqa: B008
    """
    Registers a new user in the database with secure password hashing.
    """
    # Check duplicate username
    existing_username = db.query(User).filter(User.username == payload.username).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered. Please choose another."
        )

    # Check duplicate email
    existing_email = db.query(User).filter(User.email == payload.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address already registered."
        )

    # Hash and save
    hashed = hash_password(payload.password)
    user = User(
        username=payload.username,
        email=payload.email,
        hashed_password=hashed
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login", response_model=TokenResponse)
def login_user(payload: UserLogin, db: Session = Depends(get_db)):  # noqa: B008
    """
    Authenticates username or email and returns a signed access token.
    """
    # Find user by username or email
    user = db.query(User).filter(
        (User.username == payload.username_or_email) | 
        (User.email == payload.username_or_email)
    ).first()
    
    if not user or not verify_password(user.hashed_password, payload.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password."
        )

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token)

@router.post("/logout")
def logout_user():
    """
    Invalidates current session on client-side (stateless token clearance).
    """
    return {"detail": "Successfully logged out."}
