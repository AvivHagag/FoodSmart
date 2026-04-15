from __future__ import annotations

from datetime import datetime

from pymongo.errors import DuplicateKeyError

from app.core.exceptions import AppException
from app.core.security import create_access_token, get_password_hash, verify_password
from app.repositories import users as users_repository
from app.schemas.auth import LoginRequest, RegisterRequest
from app.utils.serialization import serialize_document


def register_user(payload: RegisterRequest) -> dict:
    existing = users_repository.find_by_email(payload.email)
    if existing:
        raise AppException(409, "Email already exists", "email_exists")

    document = {
        "email": payload.email.lower(),
        "fullname": payload.fullname.strip(),
        "password": get_password_hash(payload.password),
        "createdAt": datetime.utcnow(),
        "age": None,
        "weight": None,
        "height": None,
        "image": None,
        "gender": None,
        "activityLevel": None,
        "goal": None,
        "bmi": None,
        "tdee": None,
        "isAdmin": False,
    }

    try:
        users_repository.create_user(document)
    except DuplicateKeyError as exc:
        raise AppException(409, "Email already exists", "email_exists") from exc

    return {"message": "User created successfully"}


def login_user(payload: LoginRequest) -> dict:
    user = users_repository.find_by_email(payload.email)
    if not user or not verify_password(payload.password, user["password"]):
        raise AppException(401, "Invalid email or password", "invalid_credentials")

    token = create_access_token(str(user["_id"]))
    user_copy = serialize_document(user)
    user_copy.pop("password", None)

    return {"token": token, "user": user_copy}
