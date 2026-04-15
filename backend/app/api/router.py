from __future__ import annotations

from fastapi import APIRouter

from app.api.v1 import ai_advice, auth, detection, foods, meals, statistics, support, users


api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(meals.router, prefix="/meals", tags=["meals"])
api_router.include_router(detection.router, prefix="/detection", tags=["detection"])
api_router.include_router(foods.router, prefix="/foods", tags=["foods"])
api_router.include_router(statistics.router, prefix="/statistics", tags=["statistics"])
api_router.include_router(ai_advice.router, prefix="/ai-advice", tags=["ai-advice"])
api_router.include_router(support.router, prefix="/support", tags=["support"])
