from __future__ import annotations

from datetime import datetime

from app.core.exceptions import AppException
from app.repositories import support as support_repository
from app.schemas.support import SupportMessageCreate
from app.utils.serialization import serialize_document


VALID_INQUIRY_TYPES = {
    "general",
    "technical",
    "account",
    "billing",
    "feature",
    "bug",
    "other",
}
VALID_PRIORITIES = {"low", "medium", "high", "urgent"}
VALID_STATUSES = {"open", "in_progress", "resolved", "closed"}


def create_support_message(payload: SupportMessageCreate) -> dict:
    if payload.inquiryType not in VALID_INQUIRY_TYPES:
        raise AppException(400, "Invalid inquiry type", "invalid_inquiry_type")
    if payload.priority not in VALID_PRIORITIES:
        raise AppException(400, "Invalid priority level", "invalid_priority")
    if len(payload.subject.strip()) < 5:
        raise AppException(400, "Subject must be at least 5 characters long", "invalid_subject")
    if len(payload.message.strip()) < 20:
        raise AppException(400, "Message must be at least 20 characters long", "invalid_message")

    now = datetime.utcnow()
    document = {
        "name": payload.name.strip(),
        "email": payload.email.lower(),
        "phone": payload.phone.strip() if payload.phone else None,
        "inquiryType": payload.inquiryType,
        "priority": payload.priority,
        "subject": payload.subject.strip(),
        "message": payload.message.strip(),
        "status": "open",
        "createdAt": now,
        "updatedAt": now,
        "responses": [],
        "assignedTo": None,
        "tags": [],
    }
    result = support_repository.create_message(document)
    return {
        "message": "Support request submitted successfully",
        "ticketId": str(result.inserted_id),
    }


def list_support_messages(status: str | None, priority: str | None, inquiry_type: str | None, page: int, limit: int) -> dict:
    query = {}
    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority
    if inquiry_type:
        query["inquiryType"] = inquiry_type

    messages = support_repository.list_messages(query, page, limit)
    total = support_repository.count_messages(query)
    return {
        "messages": [serialize_document(message) for message in messages],
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit,
        },
    }


def get_support_message(message_id: str) -> dict:
    message = support_repository.find_by_id(message_id)
    if not message:
        raise AppException(404, "Support message not found", "support_not_found")
    return serialize_document(message)


def update_support_message_status(message_id: str, status: str) -> dict:
    if status not in VALID_STATUSES:
        raise AppException(400, "Invalid status", "invalid_status")
    message = support_repository.find_by_id(message_id)
    if not message:
        raise AppException(404, "Support message not found", "support_not_found")
    support_repository.update_status(message_id, {"status": status, "updatedAt": datetime.utcnow()})
    return {"message": "Status updated successfully"}


def get_support_stats() -> dict:
    status_counts, priority_counts, inquiry_counts, recent_messages, total = support_repository.aggregate_stats()
    return {
        "total_messages": total,
        "status_counts": {item["_id"]: item["count"] for item in status_counts},
        "priority_counts": {item["_id"]: item["count"] for item in priority_counts},
        "inquiry_counts": {item["_id"]: item["count"] for item in inquiry_counts},
        "recent_messages": [serialize_document(message) for message in recent_messages],
    }
