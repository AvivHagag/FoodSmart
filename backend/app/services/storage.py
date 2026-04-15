from __future__ import annotations

import uuid

from fastapi.responses import RedirectResponse

from app.core.config import get_settings
from app.integrations.r2_client import get_r2_client


def upload_image_bytes(image_data: bytes, content_type: str, filename: str) -> str:
    settings = get_settings()
    client = get_r2_client()
    key = f"{uuid.uuid4()}-{filename}"
    client.put_object(
        Bucket=settings.r2_bucket_name,
        Key=key,
        Body=image_data,
        ContentType=content_type,
    )

    if settings.r2_public_url:
        return f"{settings.r2_public_url.rstrip('/')}/{key}"

    return client.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.r2_bucket_name, "Key": key},
        ExpiresIn=31536000,
    )


def get_image_redirect(filename: str) -> RedirectResponse:
    settings = get_settings()
    client = get_r2_client()

    if settings.r2_public_url:
        return RedirectResponse(f"{settings.r2_public_url.rstrip('/')}/{filename}")

    url = client.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.r2_bucket_name, "Key": filename},
        ExpiresIn=3600,
    )
    return RedirectResponse(url)
