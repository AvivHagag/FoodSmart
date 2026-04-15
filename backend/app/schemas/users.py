from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(alias="_id")
    email: EmailStr
    fullname: str
    createdAt: datetime | None = None
    age: int | None = None
    weight: float | None = None
    height: float | None = None
    image: str | None = None
    gender: str | None = None
    activityLevel: str | None = None
    goal: str | None = None
    bmi: float | None = None
    tdee: float | None = None
    isAdmin: bool | None = None


class ProfileUpdateRequest(BaseModel):
    age: int
    weight: float
    height: float
    gender: str
    activityLevel: str
    goal: str
    bmi: float
    tdee: float


class BasicInfoUpdateRequest(BaseModel):
    fullname: str
    email: EmailStr


class PasswordUpdateRequest(BaseModel):
    currentPassword: str
    newPassword: str
