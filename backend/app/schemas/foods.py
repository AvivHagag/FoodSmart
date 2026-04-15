from __future__ import annotations

from pydantic import BaseModel


class FoodLookupRequest(BaseModel):
    name: str


class FoodLookupResponse(BaseModel):
    name: str
    unit: str
    piece_avg_weight: float | None = None
    avg_gram: float | None = None
    cal: float
    protein: float
    fat: float
    carbohydrates: float
