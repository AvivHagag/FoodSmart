from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class SupportMessageCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str | None = None
    inquiryType: str
    priority: str = "medium"
    subject: str
    message: str


class SupportStatusUpdate(BaseModel):
    status: str


class SupportMessageResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(alias="_id")
    name: str
    email: EmailStr
    phone: str | None = None
    inquiryType: str
    priority: str
    subject: str
    message: str
    status: str
    createdAt: datetime
    updatedAt: datetime
    responses: list = []
    assignedTo: str | None = None
    tags: list[str] = []


class SupportCreateResponse(BaseModel):
    message: str
    ticketId: str


class SupportListResponse(BaseModel):
    messages: list[SupportMessageResponse]
    pagination: dict


class SupportStatsResponse(BaseModel):
    total_messages: int
    status_counts: dict[str, int]
    priority_counts: dict[str, int]
    inquiry_counts: dict[str, int]
    recent_messages: list[SupportMessageResponse]
