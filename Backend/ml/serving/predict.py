"""
predict.py  (fixed)
===================
Fixes:
  1. Anomaly score normalised using training score distribution (min/max saved)
  2. Risk level thresholds tightened
  3. Alert logic uses more signals
"""

import os
import sys
import numpy as np
import joblib

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from data.preprocess import db_row_to_features

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")


class CardioPredictor:
    def __init__(self):
        print("[CardioPredictor] Loading models...")
        self.anomaly_model  = joblib.load(os.path.join(MODELS_DIR, "anomaly_detector.pkl"))
        self.risk_model     = joblib.load(os.path.join(MODELS_DIR, "risk_scorer.pkl"))
        self.disease_model  = joblib.load(os.path.join(MODELS_DIR, "disease_predictor.pkl"))
        self.imputer        = joblib.load(os.path.join(MODELS_DIR, "imputer.pkl"))
        self.scaler         = joblib.load(os.path.join(MODELS_DIR, "scaler.pkl"))
        # Anomaly score calibration bounds (saved during training)
        bounds_path = os.path.join(MODELS_DIR, "anomaly_bounds.pkl")
        if os.path.exists(bounds_path):
            self.anomaly_bounds = joblib.load(bounds_path)
        else:
            self.anomaly_bounds = {"min": -0.5, "max": 0.1}  # fallback
        print("[CardioPredictor] ✅ All models loaded.")

    def _prepare(self, health_details: dict) -> np.ndarray:
        X = db_row_to_features(health_details)
        X = self.imputer.transform(X)
        X = self.scaler.transform(X)
        return X

    def _anomaly_score(self, X: np.ndarray) -> float:
        """Normalise isolation forest score to 0-1 using training distribution."""
        raw = self.anomaly_model.score_samples(X)[0]
        lo  = self.anomaly_bounds["min"]
        hi  = self.anomaly_bounds["max"]
        # Lower raw score = more anomalous → invert to get 0=normal, 1=anomaly
        normalised = 1.0 - (raw - lo) / max(hi - lo, 1e-6)
        return float(np.clip(normalised, 0.0, 1.0))

    def predict(self, health_details: dict) -> dict:
        X = self._prepare(health_details)

        # ── Risk score ────────────────────────────────────────────────────
        risk_proba  = float(self.risk_model.predict_proba(X)[0][1])
        risk_score  = int(round(risk_proba * 100))
        risk_level  = ("Low" if risk_score < 35 else
                       "Moderate" if risk_score < 60 else "High")

        # ── Anomaly ───────────────────────────────────────────────────────
        anomaly_score = self._anomaly_score(X)
        is_anomaly    = anomaly_score > 0.55

        # ── Disease probability ───────────────────────────────────────────
        disease_proba = float(self.disease_model.predict_proba(X)[0][1])
        confidence    = ("Low"      if disease_proba < 0.35 else
                         "Moderate" if disease_proba < 0.65 else "High")

        # ── Alerts ────────────────────────────────────────────────────────
        alerts  = self._check_alerts(health_details, risk_score, anomaly_score, disease_proba)
        summary = self._build_summary(risk_level, risk_score, disease_proba, alerts)

        return {
            "risk_score":    risk_score,
            "risk_level":    risk_level,
            "anomaly_score": round(anomaly_score, 3),
            "is_anomaly":    is_anomaly,
            "disease": {
                "heart_disease_probability": round(disease_proba, 3),
                "confidence": confidence,
            },
            "alerts":  alerts,
            "summary": summary,
        }

    def predict_from_hr_stream(self, hr_values: list, health_details: dict) -> dict:
        if not hr_values:
            return {"alerts": [], "hr_stats": {}}

        arr    = np.array(hr_values, dtype=float)
        alerts = []

        if arr.max() > 150:
            alerts.append(f"⚠️  High heart rate: {arr.max():.0f} bpm")
        if arr.min() < 45:
            alerts.append(f"⚠️  Low heart rate: {arr.min():.0f} bpm")
        if arr.std() > 25:
            alerts.append(f"⚠️  Irregular HR variability (std={arr.std():.1f})")

        static = self.predict(health_details)
        if static["risk_level"] == "High" and arr.mean() > 100:
            alerts.append("🚨  Elevated resting HR + high risk profile")

        return {
            "alerts": alerts,
            "hr_stats": {
                "mean": round(float(arr.mean()), 1),
                "std":  round(float(arr.std()), 1),
                "max":  round(float(arr.max()), 1),
                "min":  round(float(arr.min()), 1),
            },
            "static_prediction": static,
        }

    def _check_alerts(self, h, risk_score, anomaly_score, disease_proba):
        alerts = []
        if risk_score >= 60:
            alerts.append(f"High cardiovascular risk score: {risk_score}/100")
        if disease_proba >= 0.65:
            alerts.append(f"High heart disease probability: {disease_proba:.0%}")
        if anomaly_score > 0.55:
            alerts.append("Unusual health pattern — consult your doctor")
        if h.get("systolic_bp") and h["systolic_bp"] > 140:
            alerts.append(f"Elevated blood pressure: {h['systolic_bp']} mmHg")
        if h.get("cholesterol_level") and h["cholesterol_level"] > 240:
            alerts.append(f"High cholesterol: {h['cholesterol_level']} mg/dL")
        if h.get("smoker") and h.get("diabetes"):
            alerts.append("Smoking + diabetes — significantly elevated risk")
        if h.get("bmi") and h["bmi"] > 30:
            alerts.append(f"BMI {h['bmi']:.1f} — obesity is a cardiac risk factor")
        if h.get("family_heart_disease") and h.get("previous_heart_attack"):
            alerts.append("Family history + previous heart attack — high priority review")
        rhr = h.get("resting_heart_rate")
        if rhr and rhr > 100:
            alerts.append(f"Resting HR {rhr} bpm — tachycardia range")
        return alerts

    def _build_summary(self, risk_level, risk_score, disease_proba, alerts):
        base = (f"Your cardiovascular risk score is {risk_score}/100 ({risk_level}). "
                f"Heart disease probability: {disease_proba:.0%}. ")
        if not alerts:
            return base + "No immediate concerns detected."
        return base + f"{len(alerts)} alert(s) flagged — please review."