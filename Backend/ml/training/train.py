"""
train.py  (fixed)
=================
Run:  python ml/training/train.py
      python ml/training/train.py --source csv
"""

import os, sys, argparse
import numpy as np
import joblib

from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.metrics import classification_report, roc_auc_score, accuracy_score
import xgboost as xgb

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from data.preprocess import preprocess_pipeline

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
os.makedirs(MODELS_DIR, exist_ok=True)


def train_anomaly_detector(data):
    print("\n" + "="*60)
    print("MODEL 1: Anomaly Detector (Isolation Forest)")
    print("="*60)

    X_train_s = data["X_train_scaled"]
    y_train   = data["y_train"]

    # Train ONLY on healthy samples
    X_normal  = X_train_s[y_train == 0]
    print(f"  Training on {len(X_normal)} healthy samples (out of {len(y_train)} total)...")

    model = IsolationForest(
        n_estimators=300,
        contamination=0.15,
        max_features=0.8,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_normal)

    # ── Save score bounds from full training set for normalisation ────────
    all_scores = model.score_samples(X_train_s)
    bounds = {"min": float(all_scores.min()), "max": float(all_scores.max())}
    joblib.dump(bounds, os.path.join(MODELS_DIR, "anomaly_bounds.pkl"))
    print(f"  Score range on training data: [{bounds['min']:.3f}, {bounds['max']:.3f}]")

    # Quick sanity check: diseased patients should have lower (more anomalous) scores
    score_healthy  = all_scores[y_train == 0].mean()
    score_diseased = all_scores[y_train == 1].mean()
    print(f"  Avg score — Healthy: {score_healthy:.3f}  Diseased: {score_diseased:.3f}")
    print(f"  {'✅ Correct direction' if score_healthy > score_diseased else '⚠️  Check data'}")

    joblib.dump(model, os.path.join(MODELS_DIR, "anomaly_detector.pkl"))
    print(f"  ✅ Saved → anomaly_detector.pkl")
    return model


def train_risk_scorer(data):
    print("\n" + "="*60)
    print("MODEL 2: Risk Scorer (XGBoost)")
    print("="*60)

    X_tr, X_te = data["X_train_scaled"], data["X_test_scaled"]
    y_tr, y_te = data["y_train"], data["y_test"]

    scale_pos = (y_tr == 0).sum() / max((y_tr == 1).sum(), 1)
    print(f"  scale_pos_weight: {scale_pos:.2f}")

    model = xgb.XGBClassifier(
        n_estimators=400,
        max_depth=5,
        learning_rate=0.03,
        subsample=0.8,
        colsample_bytree=0.8,
        min_child_weight=3,
        gamma=0.1,
        scale_pos_weight=scale_pos,
        eval_metric="logloss",
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_tr, y_tr, eval_set=[(X_te, y_te)], verbose=False)

    y_proba = model.predict_proba(X_te)[:, 1]
    y_pred  = (y_proba > 0.5).astype(int)
    print(f"\n  Accuracy : {accuracy_score(y_te, y_pred):.4f}")
    print(f"  ROC-AUC  : {roc_auc_score(y_te, y_proba):.4f}")
    print(classification_report(y_te, y_pred, target_names=["Healthy", "At Risk"]))

    joblib.dump(model, os.path.join(MODELS_DIR, "risk_scorer.pkl"))
    print(f"  ✅ Saved → risk_scorer.pkl")
    return model


def train_disease_predictor(data):
    print("\n" + "="*60)
    print("MODEL 3: Disease Predictor (Random Forest)")
    print("="*60)

    X_tr, X_te = data["X_train_scaled"], data["X_test_scaled"]
    y_tr, y_te = data["y_train"], data["y_test"]

    model = RandomForestClassifier(
        n_estimators=600,
        max_depth=14,
        min_samples_split=3,
        min_samples_leaf=1,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_tr, y_tr)

    y_proba = model.predict_proba(X_te)[:, 1]
    y_pred  = model.predict(X_te)
    print(f"\n  Accuracy : {accuracy_score(y_te, y_pred):.4f}")
    print(f"  ROC-AUC  : {roc_auc_score(y_te, y_proba):.4f}")
    print(classification_report(y_te, y_pred, target_names=["Healthy", "Heart Disease"]))

    # Feature importance top 10
    fi = sorted(zip(data["feature_names"], model.feature_importances_),
                key=lambda x: x[1], reverse=True)[:10]
    print("  Top 10 features:")
    for name, imp in fi:
        bar = "█" * int(imp * 100)
        print(f"    {name:<30} {imp:.3f}  {bar}")

    joblib.dump(model, os.path.join(MODELS_DIR, "disease_predictor.pkl"))
    print(f"  ✅ Saved → disease_predictor.pkl")
    return model


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", default="ucimlrepo", choices=["ucimlrepo", "csv"])
    args = parser.parse_args()

    print("\n🫀  CardioSense ML Training Pipeline")
    print("━" * 60)

    data = preprocess_pipeline(source=args.source)

    train_anomaly_detector(data)
    train_risk_scorer(data)
    train_disease_predictor(data)

    # Save preprocessors
    joblib.dump(data["imputer"],       os.path.join(MODELS_DIR, "imputer.pkl"))
    joblib.dump(data["scaler"],        os.path.join(MODELS_DIR, "scaler.pkl"))
    joblib.dump(data["feature_names"], os.path.join(MODELS_DIR, "feature_names.pkl"))

    print("\n" + "="*60)
    print("✅  All 6 files saved to ml/models/")
    print("    Now run: python test_predict.py")
    print("="*60)


if __name__ == "__main__":
    main()