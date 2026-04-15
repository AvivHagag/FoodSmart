from __future__ import annotations

from bson import ObjectId
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import get_settings
from app.core.exceptions import AppException
from app.core.security import decode_access_token
from app.repositories import users as users_repository


bearer_scheme = HTTPBearer(auto_error=False)


def parse_object_id(value: str, field_name: str = "id") -> ObjectId:
    if not ObjectId.is_valid(value):
        raise AppException(400, f"Invalid {field_name}", "invalid_object_id")
    return ObjectId(value)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
):
    if credentials is None or not credentials.credentials:
        raise AppException(401, "Authentication required", "auth_required")

    payload = decode_access_token(credentials.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise AppException(401, "Invalid access token", "invalid_token")

    user = users_repository.find_by_id(user_id)
    if not user:
        raise AppException(401, "User not found", "user_not_found")
    return user


def get_current_user_id(current_user=Depends(get_current_user)) -> str:
    return str(current_user["_id"])


def require_admin(current_user=Depends(get_current_user)):
    settings = get_settings()
    email = str(current_user.get("email", "")).lower()
    is_admin = bool(current_user.get("isAdmin")) or email in settings.admin_emails
    if not is_admin:
        raise AppException(403, "Admin access required", "admin_required")
    return current_user
