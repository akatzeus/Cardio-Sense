from database import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # USER | DOCTOR

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
class HealthDetails(db.Model):
    __tablename__ = "health_details"

    id              = db.Column(db.Integer, primary_key=True)
    user_id         = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, unique=True)

    # ── Personal ──────────────────────────────────────────
    age             = db.Column(db.Integer,  nullable=False)
    gender          = db.Column(db.String(10), nullable=False)   # male | female | other
    height_cm       = db.Column(db.Float,    nullable=False)
    weight_kg       = db.Column(db.Float,    nullable=False)
    bmi             = db.Column(db.Float,    nullable=True)      # calculated on save

    # ── Vitals ────────────────────────────────────────────
    resting_heart_rate = db.Column(db.Integer, nullable=True)   # bpm
    systolic_bp        = db.Column(db.Integer, nullable=True)   # mmHg
    diastolic_bp       = db.Column(db.Integer, nullable=True)   # mmHg
    cholesterol_level  = db.Column(db.Float,   nullable=True)   # mg/dL
    blood_glucose      = db.Column(db.Float,   nullable=True)   # mg/dL

    # ── Lifestyle ─────────────────────────────────────────
    smoker             = db.Column(db.Boolean, nullable=False, default=False)
    cigarettes_per_day = db.Column(db.Integer, nullable=True)   # if smoker
    alcohol_drinker    = db.Column(db.Boolean, nullable=False, default=False)
    drinks_per_week    = db.Column(db.Float,   nullable=True)   # if drinker
    fitness_level      = db.Column(db.String(20), nullable=True)
    # sedentary | light | moderate | active | very_active
    hours_sleep        = db.Column(db.Float,   nullable=True)   # avg hours/night
    stress_level       = db.Column(db.Integer, nullable=True)   # 1 (low) – 5 (high)

    # ── Medical History ───────────────────────────────────
    diabetes               = db.Column(db.Boolean, nullable=False, default=False)
    hypertension           = db.Column(db.Boolean, nullable=False, default=False)
    family_heart_disease   = db.Column(db.Boolean, nullable=False, default=False)
    previous_heart_attack  = db.Column(db.Boolean, nullable=False, default=False)
    chest_pain_type        = db.Column(db.String(30), nullable=True)
    # none | typical_angina | atypical_angina | non_anginal | asymptomatic

    created_at  = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at  = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

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