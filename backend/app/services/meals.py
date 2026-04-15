from __future__ import annotations

from datetime import datetime

from bson import ObjectId

from app.core.exceptions import AppException
from app.repositories import meals as meals_repository
from app.schemas.meals import CreateMealRequest, DeleteMealRequest, UpdateMealRequest
from app.utils.dates import day_bounds
from app.utils.serialization import serialize_document


def _coerce_entry(entry) -> dict:
    return {
        "items": entry.items,
        "time": entry.time,
        "calories": float(entry.calories),
        "fat": float(entry.fat),
        "protein": float(entry.protein),
        "carbo": float(entry.carbo),
        "imageUri": entry.imageUri,
    }


def _recalculate_totals(entries: list[dict]) -> dict[str, float]:
    return {
        "totalCalories": round(sum(float(item.get("calories", 0)) for item in entries), 1),
        "totalFat": round(sum(float(item.get("fat", 0)) for item in entries), 1),
        "totalProtein": round(sum(float(item.get("protein", 0)) for item in entries), 1),
        "totalCarbo": round(sum(float(item.get("carbo", 0)) for item in entries), 1),
    }


def get_meal_day(user_id: str, target_date) -> dict | None:
    start, _ = day_bounds(target_date)
    existing = meals_repository.find_day_by_user_and_date(user_id, start)
    return serialize_document(existing) if existing else None


def save_new_day(user_id: str, start: datetime, named_entries: list[dict]) -> dict:
    totals = _recalculate_totals(named_entries)
    meals_repository.insert_day(
        {
            "userId": ObjectId(user_id),
            "date": start,
            **totals,
            "mealsList": named_entries,
        }
    )
    meal_day = meals_repository.find_day_by_user_and_date(user_id, start)
    if not meal_day:
        raise AppException(500, "Failed to save meal", "meal_save_failed")
    return serialize_document(meal_day)


def create_meal_day_or_append(user_id: str, payload: CreateMealRequest) -> dict:
    start, _ = day_bounds(payload.date)
    existing = meals_repository.find_day_by_user_and_date(user_id, start)

    incoming_entries = [_coerce_entry(entry) for entry in payload.entries]

    if existing:
        current_entries = existing.get("mealsList", [])
        start_index = len(current_entries)
        named_entries = [
            {"name": f"Meal {start_index + index}", **entry}
            for index, entry in enumerate(incoming_entries, start=1)
        ]
        updated_entries = current_entries + named_entries
        totals = _recalculate_totals(updated_entries)
        meals_repository.update_day_by_id(
            str(existing["_id"]),
            {
                "mealsList": updated_entries,
                **totals,
            },
        )
        meal_day = meals_repository.find_day_by_user_and_date(user_id, start)
        if not meal_day:
            raise AppException(500, "Failed to save meal", "meal_save_failed")
        return serialize_document(meal_day)

    return save_new_day(
        user_id,
        start,
        [
            {"name": f"Meal {index}", **entry}
            for index, entry in enumerate(incoming_entries, start=1)
        ],
    )


def update_meal_entry(user_id: str, meal_day_id: str, payload: UpdateMealRequest) -> dict:
    meal_day = meals_repository.find_day_by_id_and_user(meal_day_id, user_id)
    if not meal_day:
        raise AppException(404, "Meal day not found", "meal_day_not_found")

    entries = list(meal_day.get("mealsList", []))
    updated = False
    for entry in entries:
        if entry.get("name") == payload.entryName:
            entry.update(
                {
                    "calories": round(float(payload.calories), 1),
                    "protein": round(float(payload.protein), 1),
                    "carbo": round(float(payload.carbo), 1),
                    "fat": round(float(payload.fat), 1),
                    "items": payload.items,
                }
            )
            updated = True
            break

    if not updated:
        raise AppException(404, "Meal entry not found", "meal_entry_not_found")

    totals = _recalculate_totals(entries)
    meals_repository.update_day_by_id(
        meal_day_id,
        {
            "mealsList": entries,
            **totals,
        },
    )
    updated_day = meals_repository.find_day_by_id_and_user(meal_day_id, user_id)
    if not updated_day:
        raise AppException(500, "Failed to update meal", "meal_update_failed")
    return serialize_document(updated_day)


def delete_meal_entry(user_id: str, meal_day_id: str, payload: DeleteMealRequest) -> dict:
    meal_day = meals_repository.find_day_by_id_and_user(meal_day_id, user_id)
    if not meal_day:
        raise AppException(404, "Meal day not found", "meal_day_not_found")

    current_entries = list(meal_day.get("mealsList", []))
    remaining = [entry for entry in current_entries if entry.get("name") != payload.entryName]
    if len(remaining) == len(current_entries):
        raise AppException(404, "Meal entry not found", "meal_entry_not_found")

    renumbered = []
    for index, entry in enumerate(remaining, start=1):
        updated_entry = dict(entry)
        updated_entry["name"] = f"Meal {index}"
        renumbered.append(updated_entry)

    totals = _recalculate_totals(renumbered)
    meals_repository.update_day_by_id(
        meal_day_id,
        {
            "mealsList": renumbered,
            **totals,
        },
    )
    updated_day = meals_repository.find_day_by_id_and_user(meal_day_id, user_id)
    if not updated_day:
        raise AppException(500, "Failed to delete meal", "meal_delete_failed")
    return serialize_document(updated_day)
