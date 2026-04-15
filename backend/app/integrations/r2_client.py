from __future__ import annotations

from functools import lru_cache

import boto3

from app.core.config import get_settings
from app.core.exceptions import AppException


@lru_cache
def get_r2_client():
    settings = get_settings()
    if not (
        settings.r2_endpoint_url
        and settings.r2_access_key_id
        and settings.r2_secret_access_key
        and settings.r2_bucket_name
    ):
        raise AppException(503, "R2 storage is not configured", "storage_not_configured")

    return boto3.client(
        "s3",
        endpoint_url=settings.r2_endpoint_url,
        aws_access_key_id=settings.r2_access_key_id,
        aws_secret_access_key=settings.r2_secret_access_key,
        region_name="auto",
    )
