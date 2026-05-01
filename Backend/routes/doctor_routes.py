"""
routes/doctor_routes.py
=======================
All doctor ↔ patient relationship endpoints.

Flow:
  1. Patient calls  GET  /doctors/list          → sees all registered doctors
  2. Patient calls  POST /doctors/request        → sends request to a doctor
  3. Doctor  calls  GET  /doctors/requests       → sees pending requests
  4. Doctor  calls  PUT  /doctors/requests/<id>  → accepts or rejects
  5. Doctor  calls  GET  /doctors/patients       → sees all accepted patients
  6. Doctor  calls  GET  /doctors/patients/<id>  → views one patient's full data
  7. Doctor  calls  PUT  /doctors/patients/<id>/notes → adds private notes
  8. Patient calls  GET  /doctors/my-doctor      → sees their current doctor
  9. Patient calls  DELETE /doctors/request/<id> → cancels/removes a request
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt

from database import db
from models import User, DoctorPatient, HealthDetails

doctor_bp = Blueprint("doctor", __name__, url_prefix="/doctors")


# ── Helpers ───────────────────────────────────────────────────────────────

def get_role() -> str:
    """Extract role from JWT claims."""
    return get_jwt().get("role", "").upper()

def require_role(*roles):
    """Return 403 response if caller's role is not in allowed roles."""
    role = get_role()
    if role not in [r.upper() for r in roles]:
        return jsonify({"message": f"Access denied. Required role: {', '.join(roles)}"}), 403
    return None


# ══════════════════════════════════════════════════════════════════════════════
# PATIENT ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@doctor_bp.route("/list", methods=["GET"])
@jwt_required()
def list_doctors():
    """
    GET /doctors/list
    Any logged-in user can browse all registered doctors.
    Optional query param: ?search=name_or_email
    """
    search = request.args.get("search", "").strip()

    query = User.query.filter(User.role.ilike("DOCTOR"))
    if search:
        query = query.filter(
            db.or_(
                User.name.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%"),
            )
        )

    doctors = query.order_by(User.name).all()

    # For each doctor, attach how many accepted patients they have (social proof)
    result = []
    for doc in doctors:
        patient_count = DoctorPatient.query.filter_by(
            doctor_id=doc.id, status="accepted"
        ).count()
        result.append({
            "id":            doc.id,
            "name":          doc.name,
            "email":         doc.email,
            "patient_count": patient_count,
        })

    return jsonify({"doctors": result, "total": len(result)}), 200


@doctor_bp.route("/request", methods=["POST"])
@jwt_required()
def send_request():
    """
    POST /doctors/request
    Patient chooses a doctor and sends a request.
    Body: { "doctor_id": 5 }

    Rules:
    - Caller must be USER role
    - Cannot request themselves
    - Cannot send duplicate requests (any status)
    - Doctor must actually have DOCTOR role
    """
    denied = require_role("USER")
    if denied: return denied

    patient_id = int(get_jwt_identity())
    data       = request.get_json()
    doctor_id  = data.get("doctor_id")

    if not doctor_id:
        return jsonify({"message": "doctor_id is required"}), 400

    if int(doctor_id) == patient_id:
        return jsonify({"message": "You cannot request yourself as a doctor"}), 400

    # Verify the target is actually a doctor
    doctor = User.query.filter_by(id=doctor_id, role="DOCTOR").first()
    if not doctor:
        return jsonify({"message": "Doctor not found"}), 404

    # Check for existing relationship (any status)
    existing = DoctorPatient.query.filter_by(
        doctor_id=doctor_id, patient_id=patient_id
    ).first()

    if existing:
        if existing.status == "accepted":
            return jsonify({"message": "You already have this doctor assigned"}), 409
        if existing.status == "pending":
            return jsonify({"message": "Request already sent — waiting for doctor approval"}), 409
        if existing.status == "rejected":
            # Allow re-request after rejection
            existing.status    = "pending"
            existing.updated_at = db.func.now()
            db.session.commit()
            return jsonify({
                "message":       "Request re-sent successfully",
                "relationship":  existing.to_dict()
            }), 200

    # Create new request
    rel = DoctorPatient(doctor_id=doctor_id, patient_id=patient_id, status="pending")
    db.session.add(rel)
    db.session.commit()

    return jsonify({
        "message":      "Request sent successfully. Waiting for doctor approval.",
        "relationship": rel.to_dict()
    }), 201


@doctor_bp.route("/my-doctor", methods=["GET"])
@jwt_required()
def my_doctor():
    """
    GET /doctors/my-doctor
    Patient views their current accepted doctor (or all their requests).
    """
    denied = require_role("USER")
    if denied: return denied

    patient_id = int(get_jwt_identity())

    relationships = DoctorPatient.query.filter_by(patient_id=patient_id).all()
    if not relationships:
        return jsonify({"message": "You have not requested any doctor yet.", "relationships": []}), 200

    return jsonify({
        "relationships": [r.to_dict() for r in relationships]
    }), 200


@doctor_bp.route("/request/<int:rel_id>", methods=["DELETE"])
@jwt_required()
def cancel_request(rel_id):
    """
    DELETE /doctors/request/<rel_id>
    Patient cancels a pending request or removes an accepted/rejected relationship.
    """
    denied = require_role("USER")
    if denied: return denied

    patient_id = int(get_jwt_identity())
    rel = DoctorPatient.query.filter_by(id=rel_id, patient_id=patient_id).first()

    if not rel:
        return jsonify({"message": "Relationship not found"}), 404

    db.session.delete(rel)
    db.session.commit()
    return jsonify({"message": "Request cancelled successfully"}), 200


# ══════════════════════════════════════════════════════════════════════════════
# DOCTOR ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@doctor_bp.route("/requests", methods=["GET"])
@jwt_required()
def get_pending_requests():
    """
    GET /doctors/requests
    Doctor sees all incoming patient requests.
    Optional: ?status=pending|accepted|rejected (default: pending)
    """
    denied = require_role("DOCTOR")
    if denied: return denied

    doctor_id = int(get_jwt_identity())
    status    = request.args.get("status", "pending")

    rels = DoctorPatient.query.filter_by(
        doctor_id=doctor_id, status=status
    ).order_by(DoctorPatient.created_at.desc()).all()

    return jsonify({
        "status":        status,
        "requests":      [r.to_dict() for r in rels],
        "total":         len(rels),
    }), 200


@doctor_bp.route("/requests/<int:rel_id>", methods=["PUT"])
@jwt_required()
def respond_to_request(rel_id):
    """
    PUT /doctors/requests/<rel_id>
    Doctor accepts or rejects a patient request.
    Body: { "action": "accept" | "reject" }
    """
    denied = require_role("DOCTOR")
    if denied: return denied

    doctor_id = int(get_jwt_identity())
    data      = request.get_json()
    action    = data.get("action", "").lower()

    if action not in ("accept", "reject"):
        return jsonify({"message": "action must be 'accept' or 'reject'"}), 400

    rel = DoctorPatient.query.filter_by(id=rel_id, doctor_id=doctor_id).first()
    if not rel:
        return jsonify({"message": "Request not found"}), 404
    if rel.status != "pending":
        return jsonify({"message": f"Request already {rel.status}"}), 409

    rel.status     = "accepted" if action == "accept" else "rejected"
    rel.updated_at = db.func.now()
    db.session.commit()

    msg = ("Patient accepted. You can now view their health data."
           if rel.status == "accepted"
           else "Patient request rejected.")

    return jsonify({"message": msg, "relationship": rel.to_dict()}), 200


@doctor_bp.route("/patients", methods=["GET"])
@jwt_required()
def get_my_patients():
    """
    GET /doctors/patients
    Doctor gets a list of all accepted patients with basic info.
    Optional: ?search=name
    """
    denied = require_role("DOCTOR")
    if denied: return denied

    doctor_id = int(get_jwt_identity())
    search    = request.args.get("search", "").strip()

    query = DoctorPatient.query.filter_by(doctor_id=doctor_id, status="accepted")

    rels = query.order_by(DoctorPatient.created_at.desc()).all()

    result = []
    for rel in rels:
        patient = rel.patient
        if search and search.lower() not in patient.name.lower():
            continue

        health = HealthDetails.query.filter_by(user_id=patient.id).first()
        result.append({
            "relationship_id": rel.id,
            "patient": {
                "id":    patient.id,
                "name":  patient.name,
                "email": patient.email,
            },
            # Surface key vitals in the list view for quick scan
            "vitals_summary": {
                "age":                health.age              if health else None,
                "bmi":                health.bmi              if health else None,
                "systolic_bp":        health.systolic_bp      if health else None,
                "resting_heart_rate": health.resting_heart_rate if health else None,
                "risk_flags": _get_risk_flags(health),
            },
            "has_health_profile": health is not None,
            "assigned_since":     rel.created_at.isoformat(),
            "notes":              rel.notes,
        })

    return jsonify({"patients": result, "total": len(result)}), 200


@doctor_bp.route("/patients/<int:patient_id>", methods=["GET"])
@jwt_required()
def get_patient_detail(patient_id):
    """
    GET /doctors/patients/<patient_id>
    Doctor views full health profile of a specific accepted patient.
    """
    denied = require_role("DOCTOR")
    if denied: return denied

    doctor_id = int(get_jwt_identity())

    # Verify the doctor actually has an accepted relationship with this patient
    rel = DoctorPatient.query.filter_by(
        doctor_id=doctor_id,
        patient_id=patient_id,
        status="accepted"
    ).first()

    if not rel:
        return jsonify({
            "message": "Patient not found or you do not have access to this patient's data"
        }), 403

    patient = rel.patient
    health  = HealthDetails.query.filter_by(user_id=patient_id).first()

    return jsonify({
        "relationship_id": rel.id,
        "patient": patient.to_dict(),
        "health_details":  health.to_dict() if health else None,
        "notes":           rel.notes,
        "assigned_since":  rel.created_at.isoformat(),
    }), 200


@doctor_bp.route("/patients/<int:patient_id>/notes", methods=["PUT"])
@jwt_required()
def update_patient_notes(patient_id):
    """
    PUT /doctors/patients/<patient_id>/notes
    Doctor adds or updates private notes for a patient.
    Body: { "notes": "Patient shows elevated BP trend..." }
    Notes are private — only the doctor can see them, not the patient.
    """
    denied = require_role("DOCTOR")
    if denied: return denied

    doctor_id = int(get_jwt_identity())
    data      = request.get_json()
    notes     = data.get("notes", "")

    rel = DoctorPatient.query.filter_by(
        doctor_id=doctor_id,
        patient_id=patient_id,
        status="accepted"
    ).first()

    if not rel:
        return jsonify({"message": "Patient not found or access denied"}), 403

    rel.notes      = notes
    rel.updated_at = db.func.now()
    db.session.commit()

    return jsonify({"message": "Notes updated successfully", "notes": rel.notes}), 200


@doctor_bp.route("/patients/<int:patient_id>/remove", methods=["DELETE"])
@jwt_required()
def remove_patient(patient_id):
    """
    DELETE /doctors/patients/<patient_id>/remove
    Doctor removes a patient from their list.
    """
    denied = require_role("DOCTOR")
    if denied: return denied

    doctor_id = int(get_jwt_identity())

    rel = DoctorPatient.query.filter_by(
        doctor_id=doctor_id,
        patient_id=patient_id
    ).first()

    if not rel:
        return jsonify({"message": "Patient not found"}), 404

    db.session.delete(rel)
    db.session.commit()
    return jsonify({"message": "Patient removed from your list"}), 200


@doctor_bp.route("/dashboard/stats", methods=["GET"])
@jwt_required()
def doctor_dashboard_stats():
    """
    GET /doctors/dashboard/stats
    Summary stats for the doctor's dashboard header.
    Returns: total patients, pending requests, high-risk count.
    """
    denied = require_role("DOCTOR")
    if denied: return denied

    doctor_id = int(get_jwt_identity())

    total_patients  = DoctorPatient.query.filter_by(doctor_id=doctor_id, status="accepted").count()
    pending_count   = DoctorPatient.query.filter_by(doctor_id=doctor_id, status="pending").count()

    # Count high-risk patients (systolic_bp > 140 OR cholesterol > 240)
    accepted_rels = DoctorPatient.query.filter_by(doctor_id=doctor_id, status="accepted").all()
    high_risk_count = 0
    for rel in accepted_rels:
        health = HealthDetails.query.filter_by(user_id=rel.patient_id).first()
        if health and _is_high_risk(health):
            high_risk_count += 1

    return jsonify({
        "total_patients":   total_patients,
        "pending_requests": pending_count,
        "high_risk_count":  high_risk_count,
        "low_risk_count":   total_patients - high_risk_count,
    }), 200


# ── Private helpers ───────────────────────────────────────────────────────

def _is_high_risk(health: HealthDetails) -> bool:
    """Quick rule-based high risk check for dashboard listing."""
    if not health:
        return False
    return any([
        health.systolic_bp       and health.systolic_bp > 140,
        health.cholesterol_level and health.cholesterol_level > 240,
        health.diabetes,
        health.previous_heart_attack,
        health.bmi               and health.bmi > 35,
    ])


def _get_risk_flags(health: HealthDetails) -> list:
    """Return a list of human-readable risk flags for the patient card."""
    if not health:
        return []
    flags = []
    if health.systolic_bp       and health.systolic_bp > 140:
        flags.append("High BP")
    if health.cholesterol_level and health.cholesterol_level > 240:
        flags.append("High Cholesterol")
    if health.diabetes:
        flags.append("Diabetes")
    if health.hypertension:
        flags.append("Hypertension")
    if health.smoker:
        flags.append("Smoker")
    if health.previous_heart_attack:
        flags.append("Prior Heart Attack")
    if health.bmi and health.bmi > 30:
        flags.append("Obese")
    return flags