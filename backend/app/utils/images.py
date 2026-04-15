from __future__ import annotations

import base64

from fastapi import UploadFile

from app.core.exceptions import AppException


MAX_IMAGE_SIZE = 10 * 1024 * 1024
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}


async def read_and_validate_image(upload: UploadFile) -> tuple[bytes, str]:
    content_type = upload.content_type or ""
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise AppException(
            400,
            "Unsupported image type",
            "unsupported_image_type",
        )

    data = await upload.read()
    if not data:
        raise AppException(400, "Empty image file", "empty_image")
    if len(data) > MAX_IMAGE_SIZE:
        raise AppException(400, "Image too large (max 10MB)", "image_too_large")
    return data, content_type


def build_data_url(image_data: bytes, mime_type: str) -> str:
    encoded = base64.b64encode(image_data).decode("utf-8")
    return f"data:{mime_type};base64,{encoded}"
