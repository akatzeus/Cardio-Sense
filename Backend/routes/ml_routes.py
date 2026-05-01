"""
ml_routes.py
============
Flask blueprint exposing ML predictions via REST API.
Add to your main app.py:

    from routes.ml_routes import ml_bp
    app.register_blueprint(ml_bp)

Endpoints:
    POST /ml/predict          — full static prediction from health profile
    GET  /ml/predict          — same but reads health profile from DB automatically
    POST /ml/realtime-alert   — check live HR stream for immediate alerts
    GET  /ml/history-analysis — analyse stored HR readings from Postgres
"""

from flask import Blueprint, request, jsonify
from models import HealthDetails
from flask_jwt_extended import jwt_required, get_jwt_identity

# Import your existing models
  # your DB model

# Import the ML predictor (loads models once at import time)
from ml.serving.predict import CardioPredictor

ml_bp = Blueprint("ml", __name__, url_prefix="/ml")

# ── Load models ONCE at startup (not per request) ─────────────────────────
predictor = CardioPredictor()


# ══════════════════════════════════════════════════════════════════════════════
# GET /ml/predict
# Automatically fetches this user's health profile from DB and predicts
# ══════════════════════════════════════════════════════════════════════════════
@ml_bp.route("/predict", methods=["GET"])
@jwt_required()
def predict_for_user():
    user_id = get_jwt_identity()

    health = HealthDetails.query.filter_by(user_id=user_id).first()
    if not health:
        return jsonify({
            "message": "No health profile found. Please complete your health setup first."
        }), 404

    result = predictor.predict(health.to_dict())
    return jsonify(result), 200


# ══════════════════════════════════════════════════════════════════════════════
# POST /ml/predict
# Accept a health details payload directly (useful for testing / doctors)
# ══════════════════════════════════════════════════════════════════════════════
@ml_bp.route("/predict", methods=["POST"])
@jwt_required()
def predict_custom():
    data = request.get_json()
    if not data:
        return jsonify({"message": "No data provided"}), 400

    try:
        result = predictor.predict(data)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"message": f"Prediction error: {str(e)}"}), 500


# ══════════════════════════════════════════════════════════════════════════════
# POST /ml/realtime-alert
# Frontend sends latest HR readings every 10s for live monitoring
# Body: { "hr_values": [72, 75, 74, 80, ...] }
# ══════════════════════════════════════════════════════════════════════════════
@ml_bp.route("/realtime-alert", methods=["POST"])
@jwt_required()
def realtime_alert():
    user_id  = get_jwt_identity()
    data     = request.get_json()
    hr_values = data.get("hr_values", [])

    if not hr_values:
        return jsonify({"message": "hr_values required"}), 400

    health = HealthDetails.query.filter_by(user_id=user_id).first()
    health_dict = health.to_dict() if health else {}

    result = predictor.predict_from_hr_stream(hr_values, health_dict)
    return jsonify(result), 200


# ══════════════════════════════════════════════════════════════════════════════
# GET /ml/history-analysis
# Analyse stored HR readings from Postgres over the past N days
# ══════════════════════════════════════════════════════════════════════════════
@ml_bp.route("/history-analysis", methods=["GET"])
@jwt_required()
def history_analysis():
    from datetime import datetime, timedelta
    import numpy as np

    user_id = get_jwt_identity()
    days    = int(request.args.get("days", 30))
    since   = datetime.utcnow() - timedelta(days=days)

    # ── Fetch HR readings ─────────────────────────────────────────────────
    # Uncomment when HeartRateReading model exists:
    #
    # readings = HeartRateReading.query.filter(
    #     HeartRateReading.user_id == user_id,
    #     HeartRateReading.timestamp >= since
    # ).order_by(HeartRateReading.timestamp).all()
    #
    # Group by date → { "2024-01-01": [72, 75, 80, ...], ... }
    # from collections import defaultdict
    # by_day = defaultdict(list)
    # for r in readings:
    #     by_day[r.timestamp.strftime("%b %d")].append(r.heart_rate)
    #
    # daily_chart = [
    #     {
    #         "date":   date,
    #         "avgBpm": round(float(np.mean(vals)), 1),
    #         "maxBpm": int(np.max(vals)),
    #         "minBpm": int(np.min(vals)),
    #     }
    #     for date, vals in sorted(by_day.items())
    # ]
    # hr_values = [r.heart_rate for r in readings]

    # ── Placeholder until watch sync is set up ────────────────────────────
    hr_values   = []
    daily_chart = []

    if not hr_values:
        return jsonify({
            "period_days":  days,
            "total_readings": 0,
            "daily_chart":  [],
            "hr_stats":     {"mean": 0, "std": 0, "min": 0, "max": 0, "median": 0},
            "prediction":   None,
            "anomaly_windows": {"anomalous_windows": 0, "total_windows": 0},
            "past_predictions": [],
            "message": "No HR readings yet. Make sure your watch is syncing."
        }), 200

    arr         = np.array(hr_values)
    health      = HealthDetails.query.filter_by(user_id=user_id).first()
    health_dict = health.to_dict() if health else {}
    static_pred = predictor.predict(health_dict)

    return jsonify({
        "period_days":    days,
        "total_readings": len(hr_values),
        "daily_chart":    daily_chart,
        "hr_stats": {
            "mean":   round(float(arr.mean()), 1),
            "std":    round(float(arr.std()), 1),
            "min":    round(float(arr.min()), 1),
            "max":    round(float(arr.max()), 1),
            "median": round(float(np.median(arr)), 1),
        },
        "prediction":      static_pred,
        "anomaly_windows": _count_anomaly_windows(arr, predictor),
        "past_predictions": [],   # populate from your prediction log table when ready
    }), 200


def _count_anomaly_windows(hr_array, predictor, window=60):
    """Slide a 60-second window and count how many are anomalous."""
    import numpy as np
    anomalous = 0
    total = 0
    for i in range(0, len(hr_array) - window, window):
        window_vals = hr_array[i:i+window]
        std = window_vals.std()
        mx  = window_vals.max()
        mn  = window_vals.min()
        if mx > 150 or mn < 45 or std > 25:
            anomalous += 1
        total += 1
    return {"anomalous_windows": anomalous, "total_windows": total}