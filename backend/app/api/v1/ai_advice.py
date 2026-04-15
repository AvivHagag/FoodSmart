from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_user_id
from app.schemas.ai_advice import DailyAdviceRequest
from app.services.ai_advice import get_daily_advice, get_weekly_summary


router = APIRouter()


@router.post("/daily")
def daily_advice(
    payload: DailyAdviceRequest,
    current_user_id: str = Depends(get_current_user_id),
):
    return get_daily_advice(current_user_id, payload.date)


@router.get("/weekly-summary")
def weekly_summary(current_user_id: str = Depends(get_current_user_id)):
    return get_weekly_summary(current_user_id)
