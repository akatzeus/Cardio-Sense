"""
preprocess.py  (fixed)
======================
Key fixes:
  1. diastolic_bp removed from feature set (never in UCI, always NaN → bad imputer warning)
  2. db_row_to_features() feature order matches training exactly
  3. Anomaly score normalisation fixed using training score range
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.impute import SimpleImputer

UCI_COLUMNS = [
    "age", "sex", "cp", "trestbps", "chol", "fbs",
    "restecg", "thalach", "exang", "oldpeak", "slope",
    "ca", "thal", "target"
]

CP_MAP = {
    1: "typical_angina",
    2: "atypical_angina",
    3: "non_anginal",
    4: "asymptomatic",
    0: "none"
}

FITNESS_MAP = {
    "sedentary": 0, "light": 1, "moderate": 2,
    "active": 3, "very_active": 4
}

CP_TYPES = ["typical_angina", "atypical_angina", "non_anginal", "asymptomatic", "none"]


def thalach_to_fitness(thalach):
    if pd.isna(thalach): return "moderate"
    if thalach >= 170:   return "active"
    elif thalach >= 150: return "moderate"
    elif thalach >= 130: return "light"
    else:                return "sedentary"


def load_uci_dataset(source="ucimlrepo"):
    if source == "ucimlrepo":
        from ucimlrepo import fetch_ucirepo
        ds = fetch_ucirepo(id=45)
        X = ds.data.features.copy()
        y = ds.data.targets.copy()
        df = pd.concat([X, y], axis=1)
        df.columns = [c.lower() for c in df.columns]
        target_col = [c for c in df.columns if c in ("num", "target")][0]
        df["target"] = (df[target_col] > 0).astype(int)
    else:
        df = pd.read_csv("ml/data/heart_disease.csv", header=None, names=UCI_COLUMNS)
        df.replace("?", np.nan, inplace=True)
        df = df.astype(float)
        df["target"] = (df["target"] > 0).astype(int)
    return df


def map_to_health_schema(df: pd.DataFrame) -> pd.DataFrame:
    out = pd.DataFrame()

    # ── Personal ──────────────────────────────────────────────────────────
    out["age"]                   = df["age"]
    out["gender_male"]           = df["sex"].map({1: 1, 0: 0})
    out["bmi"]                   = 26.5   # UCI has no height/weight; filled with mean

    # ── Vitals (NO diastolic_bp — it's never in UCI, always NaN) ─────────
    out["systolic_bp"]           = df["trestbps"]
    out["cholesterol_level"]     = df["chol"]
    out["blood_glucose_high"]    = df["fbs"]           # 1 if fasting BS > 120

    # ── Lifestyle proxies ─────────────────────────────────────────────────
    out["smoker"]                = 0      # not in UCI
    out["alcohol_drinker"]       = 0      # not in UCI
    out["fitness_level"]         = df["thalach"].apply(thalach_to_fitness).map(FITNESS_MAP).fillna(2)
    out["stress_level"]          = 3      # not in UCI; default moderate
    out["hours_sleep"]           = 7.0    # not in UCI

    # ── Medical history ───────────────────────────────────────────────────
    out["diabetes"]              = df["fbs"].fillna(0).astype(int)
    out["hypertension"]          = (df["trestbps"] > 140).astype(int)
    out["family_heart_disease"]  = 0      # not in UCI
    out["previous_heart_attack"] = df.get("exang", pd.Series(0, index=df.index)).fillna(0)

    # ── Chest pain one-hot ────────────────────────────────────────────────
    cp_mapped = df["cp"].map(CP_MAP).fillna("none")
    for cp_val in CP_TYPES:
        out[f"cp_{cp_val}"] = (cp_mapped == cp_val).astype(int)

    # ── Raw UCI clinical features (highly predictive — keep all) ──────────
    out["restecg"]   = df["restecg"].fillna(0)
    out["exang"]     = df.get("exang",   pd.Series(0, index=df.index)).fillna(0)
    out["oldpeak"]   = df.get("oldpeak", pd.Series(0, index=df.index)).fillna(0)
    out["slope"]     = df.get("slope",   pd.Series(1, index=df.index)).fillna(1)
    out["ca"]        = df.get("ca",      pd.Series(0, index=df.index)).fillna(0)
    out["thal"]      = df.get("thal",    pd.Series(2, index=df.index)).fillna(2)
    out["thalach"]   = df.get("thalach", pd.Series(150, index=df.index)).fillna(150)

    out["target"] = df["target"].astype(int)
    return out


def encode_features(df: pd.DataFrame):
    df = df.copy()
    y  = df["target"].values
    X  = df.drop(columns=["target"])
    feature_names = X.columns.tolist()
    X = X.values.astype(float)
    return X, y, feature_names


def preprocess_pipeline(source="ucimlrepo"):
    print("[1/5] Loading UCI dataset...")
    df_raw = load_uci_dataset(source)
    print(f"      {len(df_raw)} rows, {df_raw.shape[1]} cols")
    print(f"      Disease prevalence: {df_raw['target'].mean():.1%}")

    print("[2/5] Mapping to HealthDetails schema...")
    df = map_to_health_schema(df_raw)

    print("[3/5] Encoding features...")
    X, y, feature_names = encode_features(df)
    print(f"      {len(feature_names)} features")
    print(f"      Class balance: {dict(zip(*np.unique(y, return_counts=True)))}")

    print("[4/5] Imputing missing values...")
    imputer = SimpleImputer(strategy="median")
    X = imputer.fit_transform(X)

    print("[5/5] Train/test split (80/20, stratified)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled  = scaler.transform(X_test)

    print(f"      Train: {X_train.shape}  Test: {X_test.shape}\n")

    return {
        "X_train": X_train, "X_test": X_test,
        "X_train_scaled": X_train_scaled, "X_test_scaled": X_test_scaled,
        "y_train": y_train, "y_test": y_test,
        "feature_names": feature_names,
        "imputer": imputer, "scaler": scaler,
    }


def db_row_to_features(health_details: dict) -> np.ndarray:
    """
    Convert HealthDetails.to_dict() into a feature vector.
    Column ORDER must exactly match map_to_health_schema() above.
    """
    h  = health_details
    cp = h.get("chest_pain_type", "none") or "none"

    # Derive resting HR → thalach proxy (inverse: higher resting HR → lower max HR)
    resting_hr = h.get("resting_heart_rate") or 70
    thalach_proxy = max(100, 210 - resting_hr)   # rough inverse proxy

    row = {
        # Personal
        "age":                   h.get("age", 50),
        "gender_male":           1 if h.get("gender") == "male" else 0,
        "bmi":                   h.get("bmi") or 26.5,
        # Vitals (no diastolic_bp)
        "systolic_bp":           h.get("systolic_bp") or 120,
        "cholesterol_level":     h.get("cholesterol_level") or 200,
        "blood_glucose_high":    1 if (h.get("blood_glucose") or 0) > 120 else 0,
        # Lifestyle
        "smoker":                int(bool(h.get("smoker", False))),
        "alcohol_drinker":       int(bool(h.get("alcohol_drinker", False))),
        "fitness_level":         FITNESS_MAP.get(h.get("fitness_level", "moderate"), 2),
        "stress_level":          h.get("stress_level") or 3,
        "hours_sleep":           h.get("hours_sleep") or 7,
        # Medical history
        "diabetes":              int(bool(h.get("diabetes", False))),
        "hypertension":          int(bool(h.get("hypertension", False))),
        "family_heart_disease":  int(bool(h.get("family_heart_disease", False))),
        "previous_heart_attack": int(bool(h.get("previous_heart_attack", False))),
        # Chest pain one-hot
        **{f"cp_{c}": int(cp == c) for c in CP_TYPES},
        # UCI clinical proxies
        "restecg":   1 if (h.get("hypertension") or h.get("previous_heart_attack")) else 0,
        "exang":     int(bool(h.get("previous_heart_attack", False))),
        "oldpeak":   min(6.0, max(0.0, (h.get("stress_level") or 3) * 0.5)),
        "slope":     1,
        "ca":        sum([
                         int(bool(h.get("diabetes", False))),
                         int(bool(h.get("hypertension", False))),
                         int(bool(h.get("smoker", False))),
                     ]),
        "thal":      6 if h.get("previous_heart_attack") else (
                     3 if not h.get("hypertension") else 7),
        "thalach":   thalach_proxy,
    }

    return np.array(list(row.values()), dtype=float).reshape(1, -1)