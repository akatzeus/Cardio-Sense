from database import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime


class User(db.Model):
    __tablename__ = "users"

    id            = db.Column(db.Integer, primary_key=True)
    name          = db.Column(db.String(100), nullable=False)
    email         = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role          = db.Column(db.String(20),  nullable=False)  # USER | DOCTOR | ADMIN

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id":    self.id,
            "name":  self.name,
            "email": self.email,
            "role":  self.role,
        }


class HealthDetails(db.Model):
    __tablename__ = "health_details"

    id      = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, unique=True)

    # ── Personal ──────────────────────────────────────────
    age        = db.Column(db.Integer,     nullable=False)
    gender     = db.Column(db.String(10),  nullable=False)
    height_cm  = db.Column(db.Float,       nullable=False)
    weight_kg  = db.Column(db.Float,       nullable=False)
    bmi        = db.Column(db.Float,       nullable=True)

    # ── Vitals ────────────────────────────────────────────
    resting_heart_rate = db.Column(db.Integer, nullable=True)
    systolic_bp        = db.Column(db.Integer, nullable=True)
    diastolic_bp       = db.Column(db.Integer, nullable=True)
    cholesterol_level  = db.Column(db.Float,   nullable=True)
    blood_glucose      = db.Column(db.Float,   nullable=True)

    # ── Lifestyle ─────────────────────────────────────────
    smoker             = db.Column(db.Boolean,    nullable=False, default=False)
    cigarettes_per_day = db.Column(db.Integer,    nullable=True)
    alcohol_drinker    = db.Column(db.Boolean,    nullable=False, default=False)
    drinks_per_week    = db.Column(db.Float,      nullable=True)
    fitness_level      = db.Column(db.String(20), nullable=True)
    hours_sleep        = db.Column(db.Float,      nullable=True)
    stress_level       = db.Column(db.Integer,    nullable=True)

    # ── Medical History ───────────────────────────────────
    diabetes              = db.Column(db.Boolean,    nullable=False, default=False)
    hypertension          = db.Column(db.Boolean,    nullable=False, default=False)
    family_heart_disease  = db.Column(db.Boolean,    nullable=False, default=False)
    previous_heart_attack = db.Column(db.Boolean,    nullable=False, default=False)
    chest_pain_type       = db.Column(db.String(30), nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship("User", backref=db.backref("health_details", uselist=False))

    def to_dict(self):
        return {
            "id":                    self.id,
            "user_id":               self.user_id,
            "age":                   self.age,
            "gender":                self.gender,
            "height_cm":             self.height_cm,
            "weight_kg":             self.weight_kg,
            "bmi":                   self.bmi,
            "resting_heart_rate":    self.resting_heart_rate,
            "systolic_bp":           self.systolic_bp,
            "diastolic_bp":          self.diastolic_bp,
            "cholesterol_level":     self.cholesterol_level,
            "blood_glucose":         self.blood_glucose,
            "smoker":                self.smoker,
            "cigarettes_per_day":    self.cigarettes_per_day,
            "alcohol_drinker":       self.alcohol_drinker,
            "drinks_per_week":       self.drinks_per_week,
            "fitness_level":         self.fitness_level,
            "hours_sleep":           self.hours_sleep,
            "stress_level":          self.stress_level,
            "diabetes":              self.diabetes,
            "hypertension":          self.hypertension,
            "family_heart_disease":  self.family_heart_disease,
            "previous_heart_attack": self.previous_heart_attack,
            "chest_pain_type":       self.chest_pain_type,
            "created_at":            self.created_at.isoformat(),
            "updated_at":            self.updated_at.isoformat(),
        }


# ══════════════════════════════════════════════════════════════════════════════
# NEW: DoctorPatient — links a doctor (User) to their patients (Users)
# ══════════════════════════════════════════════════════════════════════════════

class DoctorPatient(db.Model):
    __tablename__ = "doctor_patients"

    id         = db.Column(db.Integer, primary_key=True)
    doctor_id  = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    patient_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    # Request lifecycle:  pending → accepted | rejected
    # pending  = patient sent request, doctor hasn't responded
    # accepted = doctor approved, can now view patient data
    # rejected = doctor declined
    status     = db.Column(db.String(20), nullable=False, default="pending")

    # Optional: doctor's private notes on this patient (only doctor can see)
    notes      = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Enforce: a patient can only have ONE relationship record per doctor
    __table_args__ = (
        db.UniqueConstraint("doctor_id", "patient_id", name="uq_doctor_patient"),
    )

    # Relationships
    doctor  = db.relationship("User", foreign_keys=[doctor_id],
                              backref=db.backref("patients", lazy="dynamic"))
    patient = db.relationship("User", foreign_keys=[patient_id],
                              backref=db.backref("doctors", lazy="dynamic"))

    def to_dict(self, include_health=False):
        data = {
            "id":         self.id,
            "doctor_id":  self.doctor_id,
            "patient_id": self.patient_id,
            "status":     self.status,
            "notes":      self.notes,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "doctor": {
                "id":    self.doctor.id,
                "name":  self.doctor.name,
                "email": self.doctor.email,
            },
            "patient": {
                "id":    self.patient.id,
                "name":  self.patient.name,
                "email": self.patient.email,
            },
        }
        # Include health profile only when doctor is viewing an accepted patient
        if include_health and self.status == "accepted":
            health = HealthDetails.query.filter_by(user_id=self.patient_id).first()
            data["health_details"] = health.to_dict() if health else None
        return data
    
class Message(db.Model):
    __tablename__ = "messages"
 
    id          = db.Column(db.Integer, primary_key=True)
    # The DoctorPatient relationship this message belongs to
    rel_id      = db.Column(db.Integer, db.ForeignKey("doctor_patients.id"), nullable=False)
    sender_id   = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    content     = db.Column(db.Text, nullable=False)
    is_read     = db.Column(db.Boolean, default=False, nullable=False)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)
 
    sender      = db.relationship("User", foreign_keys=[sender_id])
    rel         = db.relationship("DoctorPatient", backref=db.backref("messages", lazy="dynamic"))
 
    def to_dict(self):
        return {
            "id":         self.id,
            "rel_id":     self.rel_id,
            "sender_id":  self.sender_id,
            "sender_name": self.sender.name,
            "content":    self.content,
            "is_read":    self.is_read,
            "created_at": self.created_at.isoformat(),
        }