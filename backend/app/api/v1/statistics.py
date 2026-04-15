from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.core.dependencies import get_current_user_id
from app.services.statistics import get_statistics


router = APIRouter()


@router.get("")
def statistics(
    range: str = Query(default="Week"),
    current_user_id: str = Depends(get_current_user_id),
):
    return get_statistics(current_user_id, range)
