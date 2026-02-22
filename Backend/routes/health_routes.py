from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models import HealthDetails

health_bp = Blueprint("health", __name__, url_prefix="/health")


def _str_to_bool(val):
    """Accept 'yes'/'no' strings or real booleans."""
    if isinstance(val, bool):
        return val
    return str(val).lower() in ("yes", "true", "1")


@health_bp.route("/details", methods=["POST"])
@jwt_required()
def save_health_details():
    user_id = get_jwt_identity()
    data = request.get_json()

    # ── Required fields ───────────────────────────────────
    required = ["age", "gender", "height_cm", "weight_kg"]
    missing = [f for f in required if data.get(f) in (None, "")]
    if missing:
        return jsonify({"message": f"Missing required fields: {', '.join(missing)}"}), 400

    # ── BMI (recalculate server-side to be safe) ──────────
    try:
        height_m = float(data["height_cm"]) / 100
        bmi = round(float(data["weight_kg"]) / (height_m ** 2), 2)
    except (ValueError, ZeroDivisionError):
        bmi = None

    # ── Upsert: update if a record already exists ─────────
    record = HealthDetails.query.filter_by(user_id=user_id).first()
    if record is None:
        record = HealthDetails(user_id=user_id)
        db.session.add(record)

    # Personal
    record.age        = int(data["age"])
    record.gender     = str(data["gender"]).lower()
    record.height_cm  = float(data["height_cm"])
    record.weight_kg  = float(data["weight_kg"])
    record.bmi        = bmi

    # Vitals (optional)
    record.resting_heart_rate = data.get("resting_heart_rate")
    record.systolic_bp        = data.get("systolic_bp")
    record.diastolic_bp       = data.get("diastolic_bp")
    record.cholesterol_level  = data.get("cholesterol_level")
    record.blood_glucose      = data.get("blood_glucose")

    # Lifestyle
    record.smoker             = _str_to_bool(data.get("smoker", False))
    record.cigarettes_per_day = data.get("cigarettes_per_day")
    record.alcohol_drinker    = _str_to_bool(data.get("alcohol_drinker", False))
    record.drinks_per_week    = data.get("drinks_per_week")
    record.fitness_level      = data.get("fitness_level")
    record.hours_sleep        = data.get("hours_sleep")
    record.stress_level       = data.get("stress_level")

    # Medical history
    record.diabetes               = _str_to_bool(data.get("diabetes", False))
    record.hypertension           = _str_to_bool(data.get("hypertension", False))
    record.family_heart_disease   = _str_to_bool(data.get("family_heart_disease", False))
    record.previous_heart_attack  = _str_to_bool(data.get("previous_heart_attack", False))
    record.chest_pain_type        = data.get("chest_pain_type", "none")

    db.session.commit()

    return jsonify({
        "message": "Health details saved successfully.",
        "health_details": record.to_dict()
    }), 201


@health_bp.route("/details", methods=["GET"])
@jwt_required()
def get_health_details():
    user_id = get_jwt_identity()
    record = HealthDetails.query.filter_by(user_id=user_id).first()

    if not record:
        return jsonify({"message": "No health details found."}), 404

    return jsonify({"health_details": record.to_dict()}), 200