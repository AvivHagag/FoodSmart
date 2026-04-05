"""
One-time database setup script for FoodSmart.

Run from the backend directory after creating / restoring a MongoDB cluster:

    python3 setup_db.py

What it does:
  - Verifies the connection (fails fast with guidance if unreachable)
  - Creates all 4 collections with JSON-Schema validators matching every
    field written by the backend routes and the frontend API calls
  - Creates every index required by the application's query patterns
  - Is idempotent — safe to re-run; existing collections/indexes are updated
    in-place without data loss

Prerequisites:
  - MONGO_URI set in ../.env (or as an environment variable)
  - pip install pymongo python-dotenv certifi
"""

import os
import sys
from pathlib import Path

import certifi
from dotenv import load_dotenv
from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.errors import PyMongoError, ServerSelectionTimeoutError, OperationFailure

# ---------------------------------------------------------------------------
# Connection
# ---------------------------------------------------------------------------
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    print("ERROR: MONGO_URI is not set. Add it to .env or export it.", file=sys.stderr)
    sys.exit(1)

print("Connecting to MongoDB …")
try:
    client = MongoClient(
        MONGO_URI,
        tlsCAFile=certifi.where(),
        serverSelectionTimeoutMS=10_000,
        connectTimeoutMS=10_000,
        socketTimeoutMS=10_000,
    )
    client.admin.command("ping")
    print("Connection OK\n")
except ServerSelectionTimeoutError as e:
    print(f"ERROR: Cannot reach MongoDB:\n  {e}", file=sys.stderr)
    print(
        "\nMake sure:\n"
        "  1. The Atlas cluster is running.\n"
        "  2. Your current IP is allowed under Network Access.\n"
        "  3. MONGO_URI in .env is the current connection string.",
        file=sys.stderr,
    )
    sys.exit(1)
except PyMongoError as e:
    print(f"ERROR: {e}", file=sys.stderr)
    sys.exit(1)

# Extract database name from URI (default: Project1)
_db_name = MONGO_URI.split("/")[-1].split("?")[0].strip() or "Project1"
db = client[_db_name]
print(f"Database : {_db_name}\n")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def ensure_collection(name: str, validator: dict | None = None) -> None:
    """
    Create collection if it doesn't exist, then apply / refresh the validator.
    Uses validationLevel='moderate' so existing documents that pre-date the
    schema are never rejected — only new writes are validated.
    """
    if name not in db.list_collection_names():
        opts: dict = {}
        if validator:
            opts["validator"] = validator
            opts["validationLevel"] = "moderate"
            opts["validationAction"] = "error"
        db.create_collection(name, **opts)
        print(f"  [+] created collection : {name}")
    else:
        print(f"  [ok] exists            : {name}")
        if validator:
            try:
                db.command(
                    "collMod",
                    name,
                    validator=validator,
                    validationLevel="moderate",
                    validationAction="error",
                )
                print(f"       validator applied  : {name}")
            except OperationFailure as e:
                print(f"       validator skipped  : {e}")


def ensure_index(collection_name: str, index_spec: list, **kwargs) -> None:
    """
    Create index if it doesn't already exist (idempotent).
    Catches OperationFailure when a conflicting index of the same name
    already exists so re-runs never crash.
    """
    coll = db[collection_name]
    parts = ", ".join(
        f"{k}:{'asc' if v == ASCENDING else 'desc'}" for k, v in index_spec
    )
    tag = " [unique]" if kwargs.get("unique") else ""
    try:
        idx_name = coll.create_index(index_spec, **kwargs)
        print(f"  [+] index ({parts}){tag} -> {idx_name}")
    except OperationFailure as e:
        print(f"  [!] index ({parts}){tag} skipped — {e.details.get('codeName', e)}")


# ---------------------------------------------------------------------------
# Collection: users
#
# Written by : register.py
# Read/updated: login, get_user, update_user, update_basic_info,
#               update_password, delete_user, statistics, ai_nutrition_advisor
#
# Fields
#   _id           ObjectId   auto
#   email         str        unique, always lowercased before insert/query
#   fullname      str
#   password      str        bcrypt hash (never exposed via API)
#   createdAt     date       datetime.utcnow() at registration
#   age           num|null
#   weight        num|null
#   height        num|null
#   image         str|null   Cloudflare R2 public URL
#   gender        str|null
#   activityLevel str|null   e.g. "sedentary","light","moderate","active","very_active"
#   goal          str|null   e.g. "lose_weight","maintain","gain_weight"
#   bmi           num|null   computed by client, stored on update_user
#   tdee          num|null   computed by client, stored on update_user
# ---------------------------------------------------------------------------
print("=== users ===")
ensure_collection(
    "users",
    validator={
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["email", "fullname", "password", "createdAt"],
            "additionalProperties": True,   # allow forward-compatible new fields
            "properties": {
                "_id":           {"bsonType": "objectId"},
                "email":         {"bsonType": "string"},
                "fullname":      {"bsonType": "string"},
                "password":      {"bsonType": "string"},
                "createdAt":     {"bsonType": "date"},
                "age":           {"bsonType": ["int", "double", "null"]},
                "weight":        {"bsonType": ["int", "double", "null"]},
                "height":        {"bsonType": ["int", "double", "null"]},
                "image":         {"bsonType": ["string", "null"]},
                "gender":        {"bsonType": ["string", "null"]},
                "activityLevel": {"bsonType": ["string", "null"]},
                "goal":          {"bsonType": ["string", "null"]},
                "bmi":           {"bsonType": ["int", "double", "null"]},
                "tdee":          {"bsonType": ["int", "double", "null"]},
            },
        }
    },
)
# Speeds up login (find_one by email) and enforces email uniqueness.
# register.py catches DuplicateKeyError on this index.
# update_basic_info.py also queries {email, _id: {$ne: ...}} to check uniqueness
# before allowing an email change — this index covers that query too.
ensure_index("users", [("email", ASCENDING)], unique=True, name="users_email_unique")
print()


# ---------------------------------------------------------------------------
# Collection: meals
#
# Written by : meals.py  — one document per (userId, calendar-day) pair
# Read/updated: get_meals, delete_meal, update_meal, statistics,
#               ai_nutrition_advisor
#
# Top-level fields
#   _id           ObjectId   auto
#   userId        ObjectId   → users._id
#   date          date       stored as midnight UTC from strptime("%d/%m/%Y")
#   totalCalories num
#   totalFat      num
#   totalProtein  num
#   totalCarbo    num        note: frontend also uses "carbs" locally but stores "totalCarbo"
#   mealsList     array of MealItem (embedded)
#
# MealItem (embedded sub-document)
#   name          str        "Meal 1", "Meal 2", … (re-numbered on delete)
#   items         str|null   comma-separated ingredient string from food detection
#   time          date       ISO datetime from client, stored as date
#   calories      num
#   fat           num
#   protein       num
#   carbo         num        matches totalCarbo naming convention
#   imageUri      str|null   Cloudflare R2 public URL after /meals/upload
# ---------------------------------------------------------------------------
print("=== meals ===")
ensure_collection(
    "meals",
    validator={
        "$jsonSchema": {
            "bsonType": "object",
            "required": [
                "userId", "date",
                "totalCalories", "totalFat", "totalProtein", "totalCarbo",
                "mealsList",
            ],
            "additionalProperties": True,
            "properties": {
                "_id":           {"bsonType": "objectId"},
                "userId":        {"bsonType": "objectId"},
                "date":          {"bsonType": "date"},
                "totalCalories": {"bsonType": ["int", "double"]},
                "totalFat":      {"bsonType": ["int", "double"]},
                "totalProtein":  {"bsonType": ["int", "double"]},
                "totalCarbo":    {"bsonType": ["int", "double"]},
                "mealsList": {
                    "bsonType": "array",
                    "items": {
                        "bsonType": "object",
                        "required": ["name", "time", "calories", "fat", "protein", "carbo"],
                        "additionalProperties": True,
                        "properties": {
                            "name":     {"bsonType": "string"},
                            "items":    {"bsonType": ["string", "null"]},
                            "time":     {"bsonType": "date"},
                            "calories": {"bsonType": ["int", "double"]},
                            "fat":      {"bsonType": ["int", "double"]},
                            "protein":  {"bsonType": ["int", "double"]},
                            "carbo":    {"bsonType": ["int", "double"]},
                            "imageUri": {"bsonType": ["string", "null"]},
                        },
                    },
                },
            },
        }
    },
)

# PRIMARY index — covers every meals.py / get_meals / statistics / AI query:
#   - equality on userId + date  (day document lookup before insert/update)
#   - range on date with userId  ($gte/$lt  for get_meals single-day)
#   - range on date with userId  ($gte/$lte for statistics / AI weekly)
#   - sort on date ascending     (statistics charts, AI weekly summaries)
# unique=True: the backend is designed for exactly one document per (user, day).
# meals.py always does find_one(userId+date) → update existing OR insert new.
# The unique constraint prevents duplicate-day documents from race conditions.
ensure_index(
    "meals",
    [("userId", ASCENDING), ("date", ASCENDING)],
    unique=True,
    name="meals_userId_date_unique",
)
print()


# ---------------------------------------------------------------------------
# Collection: advice_history
#
# Written by : ai_nutrition_advisor.py  — one doc per AI advice request
# Read by    : ai_nutrition_advisor.py  — fetch recent N docs for a user
#
# Fields
#   _id        ObjectId   auto
#   user_id    ObjectId   → users._id  (note: snake_case, unlike meals.userId)
#   advice     object     raw AI JSON response (arbitrary nested structure)
#   created_at date       datetime.utcnow()
# ---------------------------------------------------------------------------
print("=== advice_history ===")
ensure_collection(
    "advice_history",
    validator={
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["user_id", "advice", "created_at"],
            "additionalProperties": True,
            "properties": {
                "_id":        {"bsonType": "objectId"},
                "user_id":    {"bsonType": "objectId"},
                # 'advice' is a free-form AI JSON object — allow any sub-structure
                "advice":     {"bsonType": ["object", "array", "string", "null"]},
                "created_at": {"bsonType": "date"},
            },
        }
    },
)
# Covers the only read query: filter by user_id + sort created_at DESC + limit N
# All three parts (filter, sort, limit) are satisfied by this single index.
ensure_index(
    "advice_history",
    [("user_id", ASCENDING), ("created_at", DESCENDING)],
    name="advice_history_user_created",
)
print()


# ---------------------------------------------------------------------------
# Collection: support_messages
#
# Written by : support_message.py
# Read/updated: support_message.py — admin list, status update, stats aggregate
#
# Fields
#   _id          ObjectId   auto
#   name         str        sender full name
#   email        str        sender email
#   phone        str|null
#   inquiryType  str        "general" | "billing" | "technical" | "feedback" | …
#   priority     str        "low" | "normal" | "high" | "urgent"
#   subject      str
#   message      str
#   status       str        "open" | "in_progress" | "resolved" | "closed"
#   createdAt    date       datetime.utcnow() at creation
#   updatedAt    date       datetime.utcnow() at creation; refreshed on status change
#   responses    array      empty on insert; reserved for future reply threads
#   assignedTo   str|null   reserved
#   tags         array      reserved
# ---------------------------------------------------------------------------
print("=== support_messages ===")
ensure_collection(
    "support_messages",
    validator={
        "$jsonSchema": {
            "bsonType": "object",
            "required": [
                "name", "email",
                "inquiryType", "priority",
                "subject", "message", "status",
                "createdAt", "updatedAt",
            ],
            "additionalProperties": True,
            "properties": {
                "_id":         {"bsonType": "objectId"},
                "name":        {"bsonType": "string"},
                "email":       {"bsonType": "string"},
                "phone":       {"bsonType": ["string", "null"]},
                "inquiryType": {"bsonType": "string"},
                "priority":    {"bsonType": "string"},
                "subject":     {"bsonType": "string"},
                "message":     {"bsonType": "string"},
                "status":      {"bsonType": "string"},
                "createdAt":   {"bsonType": "date"},
                "updatedAt":   {"bsonType": "date"},
                "responses":   {"bsonType": "array"},
                "assignedTo":  {"bsonType": ["string", "null"]},
                "tags":        {"bsonType": "array"},
            },
        }
    },
)

# COMPOUND index — covers the admin listing query which filters by any
# combination of status / priority / inquiryType then sorts by createdAt DESC.
# Any leading subset of (status, priority, inquiryType) is used as a prefix.
ensure_index(
    "support_messages",
    [
        ("status", ASCENDING),
        ("priority", ASCENDING),
        ("inquiryType", ASCENDING),
        ("createdAt", DESCENDING),
    ],
    name="support_messages_filter_sort",
)

# Three standalone indexes for the independent $group aggregation pipelines:
#   GET /api/support_stats groups by status, priority, and inquiryType
#   in separate pipeline calls — the compound index above is not usable for
#   each individual grouping, so dedicated single-field indexes are needed.
ensure_index("support_messages", [("status", ASCENDING)],      name="support_messages_status")
ensure_index("support_messages", [("priority", ASCENDING)],    name="support_messages_priority")
ensure_index("support_messages", [("inquiryType", ASCENDING)], name="support_messages_inquiryType")
print()


# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------
print("=" * 58)
print("Setup complete. All collections and indexes are ready.")
print("=" * 58)
client.close()
