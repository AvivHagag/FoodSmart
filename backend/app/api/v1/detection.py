from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, File, UploadFile

from app.core.dependencies import get_current_user_id
from app.services.detection import analyze_food_image
from app.utils.images import read_and_validate_image


router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/analyze")
async def analyze(
    image: UploadFile = File(...),
    current_user_id: str = Depends(get_current_user_id),
):
    del current_user_id
    image_data, mime_type = await read_and_validate_image(image)
    logger.info(
        "Received detection upload filename=%s mime_type=%s image_bytes=%s",
        image.filename or "upload",
        mime_type,
        len(image_data),
    )
    return analyze_food_image(image_data, mime_type)
