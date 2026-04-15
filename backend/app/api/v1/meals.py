from __future__ import annotations

from fastapi import APIRouter, Depends, File, Query, UploadFile

from app.core.dependencies import get_current_user_id
from app.schemas.common import MessageResponse
from app.schemas.meals import CreateMealRequest, DeleteMealRequest, UpdateMealRequest, UploadImageResponse
from app.services import meals as meals_service
from app.services.storage import get_image_redirect, upload_image_bytes
from app.utils.dates import parse_iso_date
from app.utils.images import read_and_validate_image


router = APIRouter()


@router.get("")
def get_meals(
    date: str | None = Query(default=None),
    current_user_id: str = Depends(get_current_user_id),
):
    if date is None:
        return {"mealDay": None}
    return {"mealDay": meals_service.get_meal_day(current_user_id, parse_iso_date(date))}


@router.post("")
def create_meal(payload: CreateMealRequest, current_user_id: str = Depends(get_current_user_id)):
    return meals_service.create_meal_day_or_append(current_user_id, payload)


@router.patch("/{meal_day_id}")
def update_meal(
    meal_day_id: str,
    payload: UpdateMealRequest,
    current_user_id: str = Depends(get_current_user_id),
):
    return meals_service.update_meal_entry(current_user_id, meal_day_id, payload)


@router.delete("/{meal_day_id}")
def delete_meal(
    meal_day_id: str,
    payload: DeleteMealRequest,
    current_user_id: str = Depends(get_current_user_id),
):
    return meals_service.delete_meal_entry(current_user_id, meal_day_id, payload)


@router.post("/upload-image", response_model=UploadImageResponse)
async def upload_meal_image(
    image: UploadFile = File(...),
    current_user_id: str = Depends(get_current_user_id),
):
    del current_user_id
    image_data, mime_type = await read_and_validate_image(image)
    url = upload_image_bytes(image_data, mime_type, image.filename or "photo.jpg")
    return {"url": url}


@router.get("/images/{filename:path}")
def get_meal_image(filename: str):
    return get_image_redirect(filename)
