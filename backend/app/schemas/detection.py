from __future__ import annotations

from pydantic import BaseModel


class AnalyzedFoodItem(BaseModel):
    label: str
    confidence: float
    estimated_grams: float
    unit: str
    count: int | None = None
    piece_avg_weight: float | None = None
    cal: float
    protein: float
    fat: float
    carbohydrates: float
