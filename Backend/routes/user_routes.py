from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from auth.role_required import role_required

user_bp = Blueprint("user", __name__, url_prefix="/user")

@user_bp.route("/dashboard", methods=["GET"])
@jwt_required()
@role_required("USER")
def user_dashboard():
    return jsonify({"message": "Welcome User Dashboard"})