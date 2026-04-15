from __future__ import annotations

from pydantic import BaseModel

from app.schemas.meals import MealDayResponse


class UserGoalsResponse(BaseModel):
    tdee: float | int
    goal: str | None = None
    age: int | None = None
    weight: float | None = None
    height: float | None = None
    gender: str | None = None
    activityLevel: str | None = None


class DateRangeResponse(BaseModel):
    start: str
    end: str


class StatisticsResponse(BaseModel):
    meals: list[MealDayResponse]
    userGoals: UserGoalsResponse
    range: str
    dateRange: DateRangeResponse
