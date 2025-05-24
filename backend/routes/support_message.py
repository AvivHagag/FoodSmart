from flask import Blueprint, jsonify, request
from extensions import mongo
from datetime import datetime
import re

support_message_bp = Blueprint('support_message_bp', __name__)

def validate_email(email):
    """Validate email format"""
    email_pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    return re.match(email_pattern, email) is not None

@support_message_bp.route('/api/support_message', methods=['POST'])
def submit_support_message():
    try:
        data = request.get_json()
        
        # Extract data from request
        name = (data.get('name') or '').strip()
        email = (data.get('email') or '').strip().lower()
        phone = (data.get('phone') or '').strip()
        inquiry_type = (data.get('inquiryType') or '').strip()
        priority = (data.get('priority') or 'medium').strip()
        subject = (data.get('subject') or '').strip()
        message = (data.get('message') or '').strip()
        
        # Validation
        if not name:
            return jsonify({"error": "Name is required"}), 400
            
        if not email:
            return jsonify({"error": "Email is required"}), 400
            
        if not validate_email(email):
            return jsonify({"error": "Please enter a valid email address"}), 400
            
        if not inquiry_type:
            return jsonify({"error": "Inquiry type is required"}), 400
            
        if not subject:
            return jsonify({"error": "Subject is required"}), 400
            
        if len(subject) < 5:
            return jsonify({"error": "Subject must be at least 5 characters long"}), 400
            
        if not message:
            return jsonify({"error": "Message is required"}), 400
            
        if len(message) < 20:
            return jsonify({"error": "Message must be at least 20 characters long"}), 400
            
        # Validate inquiry type
        valid_inquiry_types = [
            'general', 'technical', 'account', 'billing', 
            'feature', 'bug', 'other'
        ]
        if inquiry_type not in valid_inquiry_types:
            return jsonify({"error": "Invalid inquiry type"}), 400
            
        # Validate priority
        valid_priorities = ['low', 'medium', 'high', 'urgent']
        if priority not in valid_priorities:
            return jsonify({"error": "Invalid priority level"}), 400
        
        # Create support message document
        support_message_doc = {
            "name": name,
            "email": email,
            "phone": phone if phone else None,
            "inquiryType": inquiry_type,
            "priority": priority,
            "subject": subject,
            "message": message,
            "status": "open",  # open, in_progress, resolved, closed
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
            "responses": [],  # Array for admin responses
            "assignedTo": None,  # For admin assignment
            "tags": []  # For categorization
        }
        
        # Insert into database
        result = mongo.db.support_messages.insert_one(support_message_doc)
        
        if result.inserted_id:
            return jsonify({
                "message": "Support request submitted successfully",
                "ticketId": str(result.inserted_id)
            }), 201
        else:
            return jsonify({"error": "Failed to submit support request"}), 500
            
    except Exception as e:
        print(f"Error submitting support message: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@support_message_bp.route('/api/support_messages', methods=['GET'])
def get_support_messages():
    """Get all support messages (for admin use)"""
    try:
        # Get query parameters for filtering
        status = request.args.get('status')
        priority = request.args.get('priority')
        inquiry_type = request.args.get('inquiryType')
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        
        # Build query
        query = {}
        if status:
            query['status'] = status
        if priority:
            query['priority'] = priority
        if inquiry_type:
            query['inquiryType'] = inquiry_type
            
        # Calculate skip value for pagination
        skip = (page - 1) * limit
        
        # Get messages with pagination
        messages = list(mongo.db.support_messages.find(query)
                       .sort("createdAt", -1)
                       .skip(skip)
                       .limit(limit))
        
        # Convert ObjectId to string for JSON serialization
        for message in messages:
            message['_id'] = str(message['_id'])
            
        # Get total count for pagination
        total_count = mongo.db.support_messages.count_documents(query)
        
        return jsonify({
            "messages": messages,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total_count,
                "pages": (total_count + limit - 1) // limit
            }
        }), 200
        
    except Exception as e:
        print(f"Error fetching support messages: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@support_message_bp.route('/api/support_message/<message_id>', methods=['GET'])
def get_support_message(message_id):
    """Get a specific support message by ID"""
    try:
        from bson import ObjectId
        
        # Validate ObjectId format
        if not ObjectId.is_valid(message_id):
            return jsonify({"error": "Invalid message ID"}), 400
            
        message = mongo.db.support_messages.find_one({"_id": ObjectId(message_id)})
        
        if not message:
            return jsonify({"error": "Support message not found"}), 404
            
        # Convert ObjectId to string
        message['_id'] = str(message['_id'])
        
        return jsonify({"message": message}), 200
        
    except Exception as e:
        print(f"Error fetching support message: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@support_message_bp.route('/api/support_message/<message_id>/status', methods=['PUT'])
def update_support_message_status(message_id):
    """Update support message status (for admin use)"""
    try:
        from bson import ObjectId
        
        # Validate ObjectId format
        if not ObjectId.is_valid(message_id):
            return jsonify({"error": "Invalid message ID"}), 400
            
        data = request.get_json()
        new_status = data.get('status', '').strip()
        
        # Validate status
        valid_statuses = ['open', 'in_progress', 'resolved', 'closed']
        if new_status not in valid_statuses:
            return jsonify({"error": "Invalid status"}), 400
            
        # Update the message
        result = mongo.db.support_messages.update_one(
            {"_id": ObjectId(message_id)},
            {
                "$set": {
                    "status": new_status,
                    "updatedAt": datetime.utcnow()
                }
            }
        )
        
        if result.matched_count == 0:
            return jsonify({"error": "Support message not found"}), 404
            
        return jsonify({"message": "Status updated successfully"}), 200
        
    except Exception as e:
        print(f"Error updating support message status: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@support_message_bp.route('/api/support_stats', methods=['GET'])
def get_support_stats():
    """Get support message statistics (for admin dashboard)"""
    try:
        # Get counts by status
        status_counts = list(mongo.db.support_messages.aggregate([
            {"$group": {"_id": "$status", "count": {"$sum": 1}}},
            {"$sort": {"_id": 1}}
        ]))
        
        # Get counts by priority
        priority_counts = list(mongo.db.support_messages.aggregate([
            {"$group": {"_id": "$priority", "count": {"$sum": 1}}},
            {"$sort": {"_id": 1}}
        ]))
        
        # Get counts by inquiry type
        inquiry_counts = list(mongo.db.support_messages.aggregate([
            {"$group": {"_id": "$inquiryType", "count": {"$sum": 1}}},
            {"$sort": {"_id": 1}}
        ]))
        
        # Get total count
        total_messages = mongo.db.support_messages.count_documents({})
        
        # Get recent messages (last 5)
        recent_messages = list(mongo.db.support_messages.find(
            {}, 
            {"name": 1, "email": 1, "subject": 1, "status": 1, "priority": 1, "createdAt": 1}
        ).sort("createdAt", -1).limit(5))
        
        # Convert ObjectId to string for JSON serialization
        for message in recent_messages:
            message['_id'] = str(message['_id'])
        
        return jsonify({
            "total_messages": total_messages,
            "status_counts": {item["_id"]: item["count"] for item in status_counts},
            "priority_counts": {item["_id"]: item["count"] for item in priority_counts},
            "inquiry_counts": {item["_id"]: item["count"] for item in inquiry_counts},
            "recent_messages": recent_messages
        }), 200
        
    except Exception as e:
        print(f"Error fetching support stats: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500 