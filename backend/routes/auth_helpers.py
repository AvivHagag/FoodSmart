"""
Shared auth helpers for routes that require JWT ownership verification.
"""
from flask import jsonify
from flask_jwt_extended import get_jwt_identity


def require_own_user(user_id: str):
    """
    Returns (None, None) if the JWT identity matches user_id.
    Returns (response, status_code) if not — caller should return that immediately.
    """
    current_user_id = get_jwt_identity()
    if current_user_id != user_id:
        return jsonify({"error": "Forbidden: you can only access your own data"}), 403
    return None, None
