from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from auth.role_required import role_required

doctor_bp = Blueprint("doctor", __name__, url_prefix="/doctor")

@doctor_bp.route("/dashboard", methods=["GET"])
@jwt_required()
@role_required("DOCTOR")
def doctor_dashboard():
    return jsonify({"message": "Welcome Doctor Dashboard"})