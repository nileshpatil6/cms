from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from supabase import Client
from ..schemas.users import UserCreate, UserResponse, Token
from ..db import supabase
from ..utils.auth_utils import create_access_token, get_current_user

router = APIRouter()

@router.post("/register", response_model=UserResponse)
async def register_user(user: UserCreate):
    try:
        # Supabase handles password hashing internally for sign_up
        response = supabase.auth.sign_up({
            "email": user.email,
            "password": user.password
        })
        if response.user:
            return UserResponse(id=response.user.id, email=response.user.email)
        else:
            # Supabase sign_up might return data but no user if email confirmation is required
            # or if there's an issue. Check response.error for more details.
            if response.session and response.session.user:
                return UserResponse(id=response.session.user.id, email=response.session.user.email)
            raise HTTPException(status_code=400, detail="User registration failed. Check if email is already registered or requires confirmation.")
    except Exception as e:
        # Catching a broader exception to log/handle unexpected errors from Supabase client
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Registration error: {str(e)}")

@router.post("/login", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    try:
        response = supabase.auth.sign_in_with_password({
            "email": form_data.username,
            "password": form_data.password
        })
        if response.user and response.session:
            access_token = create_access_token(data={"sub": response.user.id})
            return {"access_token": access_token, "token_type": "bearer"}
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Login error: {str(e)}")

@router.get("/users/me", response_model=UserResponse)
async def read_users_me(current_user: dict = Depends(get_current_user)):
    # In a real app, you'd fetch the user details from your DB using current_user['id']
    # For now, we'll return a mock UserResponse based on the authenticated user's ID
    return UserResponse(id=current_user['id'], email=f"user_{current_user['id']}@example.com")