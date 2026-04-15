from __future__ import annotations

from app.core.exceptions import AppException
from app.repositories import meals as meals_repository
from app.repositories import users as users_repository
from app.utils.dates import statistics_bounds
from app.utils.serialization import serialize_document


def get_statistics(user_id: str, range_name: str) -> dict:
    user = users_repository.find_by_id(user_id)
    if not user:
        raise AppException(404, "User not found", "user_not_found")

    start_date, end_date = statistics_bounds(range_name)
    meals = meals_repository.find_by_user_and_range_inclusive(user_id, start_date, end_date)

    return {
        "meals": [serialize_document(meal) for meal in meals],
        "userGoals": {
            "tdee": user.get("tdee", 2000),
            "goal": user.get("goal", "maintain"),
            "age": user.get("age"),
            "weight": user.get("weight"),
            "height": user.get("height"),
            "gender": user.get("gender"),
            "activityLevel": user.get("activityLevel"),
        },
        "range": range_name,
        "dateRange": {
            "start": start_date.isoformat(),
            "end": end_date.isoformat(),
        },
    }
