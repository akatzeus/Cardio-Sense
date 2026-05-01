# test_predict.py  — place in your backend root and run: python test_predict.py

import sys
sys.path.insert(0, ".")

from ml.serving.predict import CardioPredictor

predictor = CardioPredictor()

# ── Test 1: High risk patient ─────────────────────────────────────────────
high_risk = {
    "age": 62, "gender": "male", "bmi": 31.2,
    "resting_heart_rate": 95, "systolic_bp": 160, "diastolic_bp": 100,
    "cholesterol_level": 290, "blood_glucose": 140,
    "smoker": True, "cigarettes_per_day": 20,
    "alcohol_drinker": True, "drinks_per_week": 10,
    "fitness_level": "sedentary", "hours_sleep": 5, "stress_level": 5,
    "diabetes": True, "hypertension": True,
    "family_heart_disease": True, "previous_heart_attack": True,
    "chest_pain_type": "typical_angina",
}

# ── Test 2: Low risk patient ──────────────────────────────────────────────
low_risk = {
    "age": 28, "gender": "female", "bmi": 22.1,
    "resting_heart_rate": 62, "systolic_bp": 110, "diastolic_bp": 70,
    "cholesterol_level": 170, "blood_glucose": 85,
    "smoker": False, "cigarettes_per_day": 0,
    "alcohol_drinker": False, "drinks_per_week": 0,
    "fitness_level": "active", "hours_sleep": 8, "stress_level": 1,
    "diabetes": False, "hypertension": False,
    "family_heart_disease": False, "previous_heart_attack": False,
    "chest_pain_type": "none",
}

# ── Test 3: Live HR stream alert ──────────────────────────────────────────
hr_stream_normal    = [68, 70, 72, 69, 71, 73, 70, 68, 72, 71]
hr_stream_dangerous = [155, 160, 158, 162, 170, 165, 168, 172, 155, 163]

def print_result(label, result):
    print(f"\n{'─'*50}")
    print(f"  {label}")
    print(f"{'─'*50}")
    print(f"  Risk Score   : {result['risk_score']}/100  ({result['risk_level']})")
    print(f"  Disease Prob : {result['disease']['heart_disease_probability']:.1%}  ({result['disease']['confidence']} confidence)")
    print(f"  Anomaly Score: {result['anomaly_score']}  {'⚠️  ANOMALY' if result['is_anomaly'] else '✅ Normal'}")
    print(f"  Alerts       : {result['alerts'] or ['None']}")
    print(f"  Summary      : {result['summary']}")

print("\n🫀  CardioSense — Model Test Run")
print_result("🔴 High Risk Patient", predictor.predict(high_risk))
print_result("🟢 Low Risk Patient",  predictor.predict(low_risk))

print(f"\n{'─'*50}")
print("  📡 Real-time HR Stream — Normal")
print(f"{'─'*50}")
r = predictor.predict_from_hr_stream(hr_stream_normal, low_risk)
print(f"  HR Stats : {r['hr_stats']}")
print(f"  Alerts   : {r['alerts'] or ['None']}")

print(f"\n{'─'*50}")
print("  📡 Real-time HR Stream — Dangerous")
print(f"{'─'*50}")
r = predictor.predict_from_hr_stream(hr_stream_dangerous, high_risk)
print(f"  HR Stats : {r['hr_stats']}")
print(f"  Alerts   : {r['alerts'] or ['None']}")

print("\n✅  All tests complete.\n")