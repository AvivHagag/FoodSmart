from __future__ import annotations

from app.core.exceptions import AppException
from app.core.security import get_password_hash, verify_password
from app.repositories import users as users_repository
from app.schemas.users import BasicInfoUpdateRequest, PasswordUpdateRequest, ProfileUpdateRequest
from app.utils.serialization import serialize_document


def get_current_user_profile(user_id: str) -> dict:
    user = users_repository.find_by_id(user_id)
    if not user:
        raise AppException(404, "User not found", "user_not_found")

    user_data = serialize_document(user)
    user_data.pop("password", None)
    return user_data


def update_profile(user_id: str, payload: ProfileUpdateRequest) -> dict:
    user = users_repository.find_by_id(user_id)
    if not user:
        raise AppException(404, "User not found", "user_not_found")

    users_repository.update_by_id(user_id, payload.model_dump())
    return get_current_user_profile(user_id)


def update_basic_info(
    user_id: str,
    payload: BasicInfoUpdateRequest,
    image_url: str | None = None,
) -> dict:
    user = users_repository.find_by_id(user_id)
    if not user:
        raise AppException(404, "User not found", "user_not_found")

    if users_repository.email_exists_for_other_user(payload.email, user_id):
        raise AppException(400, "Email already in use by another account", "email_in_use")

    fields = {
        "fullname": payload.fullname.strip(),
        "email": payload.email.lower(),
    }
    if image_url:
        fields["image"] = image_url

    users_repository.update_by_id(user_id, fields)
    return get_current_user_profile(user_id)


def update_password(user_id: str, payload: PasswordUpdateRequest) -> dict:
    user = users_repository.find_by_id(user_id)
    if not user:
        raise AppException(404, "User not found", "user_not_found")

    if not verify_password(payload.currentPassword, user["password"]):
        raise AppException(400, "Current password is incorrect", "invalid_password")

    users_repository.update_by_id(user_id, {"password": get_password_hash(payload.newPassword)})
    return {"message": "Password updated successfully"}


def delete_user(user_id: str) -> dict:
    result = users_repository.delete_by_id(user_id)
    if result.deleted_count != 1:
        raise AppException(404, "User not found", "user_not_found")
    return {"message": "User deleted successfully"}
