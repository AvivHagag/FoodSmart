from __future__ import annotations

from datetime import date, datetime, time, timedelta


def parse_iso_date(value: str) -> date:
    raw = value.strip()
    if not raw:
        raise ValueError("Date is required")

    if "/" in raw:
        return datetime.strptime(raw, "%d/%m/%Y").date()

    normalized = raw.replace("Z", "+00:00")
    if "T" in normalized:
        return datetime.fromisoformat(normalized).date()
    return date.fromisoformat(normalized)


def day_bounds(day: date) -> tuple[datetime, datetime]:
    start = datetime.combine(day, time.min)
    end = start + timedelta(days=1)
    return start, end


def statistics_bounds(range_name: str) -> tuple[datetime, datetime]:
    end_date = datetime.now().replace(hour=23, minute=59, second=59, microsecond=999999)
    days = {"Week": 6, "30 Days": 29, "60 Days": 59, "90 Days": 89}.get(range_name, 6)
    start_date = (end_date - timedelta(days=days)).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    return start_date, end_date
