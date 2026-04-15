from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class MealEntryInput(BaseModel):
    items: str
    time: datetime
    calories: float
    fat: float
    protein: float
    carbo: float
    imageUri: str | None = None


class CreateMealRequest(BaseModel):
    date: date
    entries: list[MealEntryInput]


class UpdateMealRequest(BaseModel):
    entryName: str
    calories: float
    fat: float
    protein: float
    carbo: float
    items: str


class DeleteMealRequest(BaseModel):
    entryName: str


class MealEntryResponse(BaseModel):
    name: str
    time: datetime
    calories: float
    fat: float
    protein: float
    carbo: float
    items: str
    imageUri: str | None = None


class MealDayResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(alias="_id")
    userId: str
    date: datetime
    totalCalories: float
    totalFat: float
    totalProtein: float
    totalCarbo: float
    mealsList: list[MealEntryResponse]


class MealDayEnvelope(BaseModel):
    mealDay: MealDayResponse | None


class UploadImageResponse(BaseModel):
    url: str
