from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.core.dependencies import require_admin
from app.schemas.common import MessageResponse
from app.schemas.support import SupportMessageCreate, SupportStatusUpdate
from app.services.support import (
    create_support_message,
    get_support_message,
    get_support_stats,
    list_support_messages,
    update_support_message_status,
)


router = APIRouter()


@router.post("/messages")
def submit_support_message(payload: SupportMessageCreate):
    return create_support_message(payload)


@router.get("/messages")
def get_messages(
    status: str | None = Query(default=None),
    priority: str | None = Query(default=None),
    inquiryType: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    admin=Depends(require_admin),
):
    del admin
    return list_support_messages(status, priority, inquiryType, page, limit)


@router.get("/messages/{message_id}")
def get_message(message_id: str, admin=Depends(require_admin)):
    del admin
    return get_support_message(message_id)


@router.patch("/messages/{message_id}/status", response_model=MessageResponse)
def patch_message_status(
    message_id: str,
    payload: SupportStatusUpdate,
    admin=Depends(require_admin),
):
    del admin
    return update_support_message_status(message_id, payload.status)


@router.get("/stats")
def support_stats(admin=Depends(require_admin)):
    del admin
    return get_support_stats()
