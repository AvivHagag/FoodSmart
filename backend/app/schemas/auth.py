from __future__ import annotations

from pydantic import BaseModel, EmailStr

from app.schemas.users import UserResponse


class RegisterRequest(BaseModel):
    fullname: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    token: str
    user: UserResponse
