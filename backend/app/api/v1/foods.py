from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_user_id
from app.schemas.foods import FoodLookupRequest
from app.services.foods import lookup_food_nutrition


router = APIRouter()


@router.post("/lookup")
def lookup_food(payload: FoodLookupRequest, current_user_id: str = Depends(get_current_user_id)):
    del current_user_id
    return lookup_food_nutrition(payload)
