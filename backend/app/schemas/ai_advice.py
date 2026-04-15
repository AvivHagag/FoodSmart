from __future__ import annotations

from typing import Any

from pydantic import BaseModel


class DailyAdviceRequest(BaseModel):
    date: str | None = None


class DailyAdviceResponse(BaseModel):
    advice: dict[str, Any]
    date: str


class WeeklySummaryResponse(BaseModel):
    advice: dict[str, Any]
    weekly_data: dict[str, Any]
