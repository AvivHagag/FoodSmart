from __future__ import annotations

from fastapi import APIRouter, status

from app.schemas.auth import LoginRequest, LoginResponse, RegisterRequest
from app.schemas.common import MessageResponse
from app.services.auth import login_user, register_user


router = APIRouter()


@router.post("/register", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest):
    return register_user(payload)


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest):
    return login_user(payload)
