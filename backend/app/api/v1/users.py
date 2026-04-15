from __future__ import annotations

from fastapi import APIRouter, Depends, File, Form, UploadFile

from app.core.dependencies import get_current_user, get_current_user_id
from app.schemas.common import MessageResponse
from app.schemas.users import BasicInfoUpdateRequest, PasswordUpdateRequest, ProfileUpdateRequest
from app.services import users as users_service
from app.services.storage import upload_image_bytes
from app.utils.images import read_and_validate_image


router = APIRouter()


@router.get("/me")
def get_me(current_user=Depends(get_current_user)):
    return users_service.get_current_user_profile(str(current_user["_id"]))


@router.patch("/me/profile")
def update_profile(payload: ProfileUpdateRequest, current_user=Depends(get_current_user)):
    return users_service.update_profile(str(current_user["_id"]), payload)


@router.patch("/me/basic-info")
async def update_basic_info(
    fullname: str = Form(...),
    email: str = Form(...),
    image: UploadFile | None = File(default=None),
    current_user=Depends(get_current_user),
):
    image_url = None
    if image is not None:
        image_data, mime_type = await read_and_validate_image(image)
        image_url = upload_image_bytes(image_data, mime_type, image.filename or "image.jpg")
    payload = BasicInfoUpdateRequest(fullname=fullname, email=email)
    return users_service.update_basic_info(str(current_user["_id"]), payload, image_url)


@router.patch("/me/password", response_model=MessageResponse)
def update_password(
    payload: PasswordUpdateRequest,
    current_user_id: str = Depends(get_current_user_id),
):
    return users_service.update_password(current_user_id, payload)


@router.delete("/me", response_model=MessageResponse)
def delete_me(current_user_id: str = Depends(get_current_user_id)):
    return users_service.delete_user(current_user_id)
