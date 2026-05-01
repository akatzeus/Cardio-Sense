"""
routes/message_routes.py
========================
Register in app.py:
    from routes.message_routes import message_bp
    app.register_blueprint(message_bp)

Endpoints:
    GET  /messages/<rel_id>        — fetch all messages in a conversation
    POST /messages/<rel_id>        — send a message
    PUT  /messages/<rel_id>/read   — mark all messages as read
    GET  /messages/unread-count    — total unread count across all conversations
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from database import db
from models import DoctorPatient, User
from models import Message

message_bp = Blueprint("messages", __name__, url_prefix="/messages")


def _verify_access(rel_id: int, user_id: int):
    """Returns (rel, error_response). User must be the doctor or patient in this rel."""
    rel = DoctorPatient.query.get(rel_id)
    if not rel:
        return None, (jsonify({"message": "Conversation not found"}), 404)
    if rel.status != "accepted":
        return None, (jsonify({"message": "Messaging is only available for accepted relationships"}), 403)
    if user_id not in (rel.doctor_id, rel.patient_id):
        return None, (jsonify({"message": "Access denied"}), 403)
    return rel, None


@message_bp.route("/<int:rel_id>", methods=["GET"])
@jwt_required()
def get_messages(rel_id):
    """Fetch all messages for a conversation. Supports ?before=<id> for pagination."""
    user_id = int(get_jwt_identity())
    rel, err = _verify_access(rel_id, user_id)
    if err: return err

    before = request.args.get("before", type=int)
    limit  = request.args.get("limit", 50, type=int)

    query = Message.query.filter_by(rel_id=rel_id)
    if before:
        query = query.filter(Message.id < before)
    messages = query.order_by(Message.created_at.asc()).limit(limit).all()

    # Auto mark received messages as read
    Message.query.filter_by(rel_id=rel_id, is_read=False).filter(
        Message.sender_id != user_id
    ).update({"is_read": True})
    db.session.commit()

    # Build conversation metadata
    other_id   = rel.patient_id if user_id == rel.doctor_id else rel.doctor_id
    from models import User
    other_user = User.query.get(other_id)

    return jsonify({
        "rel_id":   rel_id,
        "other_user": {"id": other_user.id, "name": other_user.name, "role": other_user.role},
        "messages": [m.to_dict() for m in messages],
    }), 200


@message_bp.route("/<int:rel_id>", methods=["POST"])
@jwt_required()
def send_message(rel_id):
    """Send a message in a conversation."""
    user_id = int(get_jwt_identity())
    rel, err = _verify_access(rel_id, user_id)
    if err: return err

    data    = request.get_json()
    content = (data.get("content") or "").strip()
    if not content:
        return jsonify({"message": "Message content cannot be empty"}), 400
    if len(content) > 2000:
        return jsonify({"message": "Message too long (max 2000 characters)"}), 400

    msg = Message(rel_id=rel_id, sender_id=user_id, content=content)
    db.session.add(msg)
    db.session.commit()

    return jsonify({"message": msg.to_dict()}), 201


@message_bp.route("/<int:rel_id>/read", methods=["PUT"])
@jwt_required()
def mark_read(rel_id):
    """Mark all messages in a conversation as read for the caller."""
    user_id = int(get_jwt_identity())
    rel, err = _verify_access(rel_id, user_id)
    if err: return err

    updated = Message.query.filter_by(rel_id=rel_id, is_read=False).filter(
        Message.sender_id != user_id
    ).update({"is_read": True})
    db.session.commit()

    return jsonify({"marked_read": updated}), 200


@message_bp.route("/unread-count", methods=["GET"])
@jwt_required()
def unread_count():
    """Total unread messages across all of the caller's conversations."""
    user_id = int(get_jwt_identity())

    # Find all rel_ids where this user is involved and status=accepted
    rels = DoctorPatient.query.filter(
        db.or_(
            DoctorPatient.doctor_id  == user_id,
            DoctorPatient.patient_id == user_id,
        ),
        DoctorPatient.status == "accepted"
    ).all()

    rel_ids = [r.id for r in rels]
    if not rel_ids:
        return jsonify({"unread_count": 0, "conversations": []}), 200

    total = Message.query.filter(
        Message.rel_id.in_(rel_ids),
        Message.sender_id != user_id,
        Message.is_read == False
    ).count()

    # Per-conversation unread
    convos = []
    for rel in rels:
        unread = Message.query.filter_by(rel_id=rel.id, is_read=False).filter(
            Message.sender_id != user_id
        ).count()
        if unread > 0:
            other_id = rel.patient_id if user_id == rel.doctor_id else rel.doctor_id
            from models import User
            other   = User.query.get(other_id)
            convos.append({
                "rel_id":     rel.id,
                "other_name": other.name,
                "unread":     unread,
            })

    return jsonify({"unread_count": total, "conversations": convos}), 200

@message_bp.route("/conversations", methods=["GET"])
@jwt_required()
def get_conversations():
    user_id = int(get_jwt_identity())
    
    # All accepted relationships where user is doctor or patient
    rels = DoctorPatient.query.filter(
        db.or_(
            DoctorPatient.doctor_id == user_id,
            DoctorPatient.patient_id == user_id
        ),
        DoctorPatient.status == "accepted"
    ).all()
    
    result = []
    for rel in rels:
        other_id = rel.patient_id if user_id == rel.doctor_id else rel.doctor_id
        other = User.query.get(other_id)
        
        # Get unread count for this conversation
        unread = Message.query.filter_by(rel_id=rel.id, is_read=False).filter(
            Message.sender_id != user_id
        ).count()
        
        # Get latest message
        latest = Message.query.filter_by(rel_id=rel.id).order_by(Message.created_at.desc()).first()
        
        result.append({
            "rel_id": rel.id,
            "other_id": other.id,
            "other_name": other.name,
            "other_role": other.role,
            "unread": unread,
            "last_message": latest.content if latest else None,
            "last_message_time": latest.created_at.isoformat() if latest else None
        })
    
    return jsonify(result), 200