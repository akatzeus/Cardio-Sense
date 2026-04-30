"""
evaluate_models_v2.py
=====================
Generates 4 separate, beautifully styled figures:
  1. plot_1_xgboost.png         — XGBoost confusion matrix + ROC + feature importance
  2. plot_2_random_forest.png   — Random Forest confusion matrix + ROC + feature importance
  3. plot_3_isolation_forest.png — Isolation Forest confusion matrix + ROC + score distribution
  4. plot_4_comparison.png      — Side-by-side model comparison (accuracy, AUC, sens, spec)

Run from project root:
    python evaluate_models_v2.py
"""

import os, sys
import numpy as np
import joblib
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import matplotlib.ticker as mticker
import seaborn as sns
from matplotlib import font_manager
from sklearn.metrics import (
    confusion_matrix, roc_auc_score, accuracy_score,
    roc_curve, classification_report
)

# ── Paths — adjust if needed ──────────────────────────────────────────────────
MODELS_DIR = "ml/models"
sys.path.insert(0, "ml")
sys.path.insert(0, "ml/data")

from ml.data.preprocess import preprocess_pipeline

# ─────────────────────────────────────────────────────────────────────────────
# Load data & models
# ─────────────────────────────────────────────────────────────────────────────
print("⏳ Loading data...")
data        = preprocess_pipeline(source="ucimlrepo")
X_test_s    = data["X_test_scaled"]
y_test      = data["y_test"]
feat_names  = data["feature_names"]

anomaly_model = joblib.load(f"{MODELS_DIR}/anomaly_detector.pkl")
risk_model    = joblib.load(f"{MODELS_DIR}/risk_scorer.pkl")
disease_model = joblib.load(f"{MODELS_DIR}/disease_predictor.pkl")
bounds        = joblib.load(f"{MODELS_DIR}/anomaly_bounds.pkl")

# ── Predictions ───────────────────────────────────────────────────────────────
risk_proba  = risk_model.predict_proba(X_test_s)[:, 1]
risk_pred   = (risk_proba > 0.5).astype(int)

dis_proba   = disease_model.predict_proba(X_test_s)[:, 1]
dis_pred    = disease_model.predict(X_test_s)

raw_scores  = anomaly_model.score_samples(X_test_s)
lo, hi      = bounds["min"], bounds["max"]
anom_scores = np.clip(1.0 - (raw_scores - lo) / max(hi - lo, 1e-6), 0, 1)
anom_pred   = (anom_scores > 0.55).astype(int)

# ─────────────────────────────────────────────────────────────────────────────
# Design tokens
# ─────────────────────────────────────────────────────────────────────────────
BG      = "#080b14"
PANEL   = "#0e1320"
BORDER  = "#1e2740"
TEXT    = "#cdd6f4"
SUBTEXT = "#7c86a2"

# Per-model accent palettes
XGB_C   = {"hi": "#f38ba8", "lo": "#45475a", "line": "#f38ba8", "bar": "#f38ba8", "bar2": "#fab387"}
RF_C    = {"hi": "#a6e3a1", "lo": "#45475a", "line": "#a6e3a1", "bar": "#a6e3a1", "bar2": "#94e2d5"}
ISO_C   = {"hi": "#89b4fa", "lo": "#45475a", "line": "#89b4fa", "bar": "#89b4fa", "bar2": "#cba6f7"}

plt.rcParams.update({
    "text.color":        TEXT,
    "axes.labelcolor":   TEXT,
    "xtick.color":       SUBTEXT,
    "ytick.color":       SUBTEXT,
    "axes.facecolor":    PANEL,
    "figure.facecolor":  BG,
    "axes.edgecolor":    BORDER,
    "axes.titlecolor":   TEXT,
    "axes.grid":         True,
    "grid.color":        BORDER,
    "grid.linewidth":    0.5,
    "axes.spines.top":   False,
    "axes.spines.right": False,
    "font.family":       "monospace",
    "axes.titlesize":    12,
    "axes.labelsize":    9,
    "xtick.labelsize":   8,
    "ytick.labelsize":   8,
})

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────
def metrics_from(y_true, y_pred, y_prob):
    cm = confusion_matrix(y_true, y_pred)
    tn, fp, fn, tp = cm.ravel()
    return {
        "cm":   cm,
        "acc":  accuracy_score(y_true, y_pred),
        "auc":  roc_auc_score(y_true, y_prob),
        "sens": tp / max(tp + fn, 1),
        "spec": tn / max(tn + fp, 1),
        "fpr":  roc_curve(y_true, y_prob)[0],
        "tpr":  roc_curve(y_true, y_prob)[1],
    }

def draw_cm(ax, cm, palette, labels=("Healthy", "At Risk")):
    """Draws a styled confusion matrix with percentage annotations."""
    total  = cm.sum()
    normed = cm / total

    ax.set_facecolor(PANEL)
    for i in range(2):
        for j in range(2):
            val  = cm[i, j]
            pct  = normed[i, j] * 100
            is_diag = (i == j)
            color = palette["hi"] if is_diag else BORDER
            rect = mpatches.FancyBboxPatch(
                (j + 0.05, 1 - i + 0.05), 0.9, 0.9,
                boxstyle="round,pad=0.05",
                facecolor=color + "33" if is_diag else "#1a1d2e",
                edgecolor=color if is_diag else BORDER,
                linewidth=2 if is_diag else 1,
                transform=ax.transData, zorder=2,
            )
            ax.add_patch(rect)
            ax.text(j + 0.5, 1 - i + 0.52, str(val),
                    ha="center", va="center", fontsize=22, fontweight="bold",
                    color=color if is_diag else SUBTEXT, zorder=3)
            ax.text(j + 0.5, 1 - i + 0.24, f"{pct:.1f}%",
                    ha="center", va="center", fontsize=9,
                    color=color + "bb" if is_diag else SUBTEXT + "88", zorder=3)

    ax.set_xlim(0, 2); ax.set_ylim(0, 2)
    ax.set_xticks([0.5, 1.5]); ax.set_xticklabels(labels, color=SUBTEXT)
    ax.set_yticks([0.5, 1.5]); ax.set_yticklabels(labels[::-1], color=SUBTEXT)
    ax.set_xlabel("Predicted", labelpad=8)
    ax.set_ylabel("Actual", labelpad=8)
    ax.grid(False)
    for sp in ax.spines.values(): sp.set_visible(False)

def draw_roc(ax, fpr, tpr, auc, color):
    ax.plot(fpr, tpr, color=color, lw=2.5, label=f"AUC = {auc:.3f}")
    ax.fill_between(fpr, tpr, alpha=0.08, color=color)
    ax.plot([0, 1], [0, 1], "--", color=BORDER, lw=1.2)
    ax.set_xlabel("False Positive Rate")
    ax.set_ylabel("True Positive Rate")
    ax.legend(fontsize=9, facecolor=PANEL, edgecolor=BORDER, labelcolor=TEXT)
    ax.set_xlim(-0.02, 1.02); ax.set_ylim(-0.02, 1.05)

def draw_featimp(ax, names, importances, palette, top_n=15):
    idx = np.argsort(importances)[-top_n:]
    vals = importances[idx]
    lbls = [names[i] for i in idx]
    colors = [palette["bar"] if v > np.percentile(vals, 70) else palette["bar2"] for v in vals]
    bars = ax.barh(lbls, vals, color=colors, edgecolor=PANEL, height=0.65)
    ax.set_xlabel("Importance score")
    for bar, val in zip(bars, vals):
        ax.text(val + max(vals) * 0.01, bar.get_y() + bar.get_height() / 2,
                f"{val:.3f}", va="center", fontsize=7, color=SUBTEXT)
    ax.xaxis.set_major_formatter(mticker.FormatStrFormatter("%.3f"))
    ax.grid(axis="y", alpha=0)
    ax.grid(axis="x", alpha=0.4)

def stat_box(ax, metrics, color):
    """Draws metric pills at top of figure."""
    ax.axis("off")
    items = [
        ("ACCURACY",    f"{metrics['acc']:.2%}"),
        ("ROC-AUC",     f"{metrics['auc']:.3f}"),
        ("SENSITIVITY", f"{metrics['sens']:.2%}"),
        ("SPECIFICITY", f"{metrics['spec']:.2%}"),
    ]
    for i, (label, val) in enumerate(items):
        x = 0.12 + i * 0.24
        ax.add_patch(mpatches.FancyBboxPatch(
            (x - 0.10, 0.1), 0.20, 0.80,
            boxstyle="round,pad=0.02",
            facecolor=color + "1a", edgecolor=color + "66",
            linewidth=1.5, transform=ax.transAxes,
        ))
        ax.text(x, 0.65, val, ha="center", va="center",
                fontsize=14, fontweight="bold", color=color, transform=ax.transAxes)
        ax.text(x, 0.28, label, ha="center", va="center",
                fontsize=7, color=SUBTEXT, transform=ax.transAxes)

def save_fig(fig, name):
    fig.savefig(name, dpi=160, bbox_inches="tight", facecolor=BG)
    print(f"  ✅ Saved → {name}")

# ─────────────────────────────────────────────────────────────────────────────
# FIGURE 1 — XGBoost
# ─────────────────────────────────────────────────────────────────────────────
print("\n📊 Plot 1: XGBoost Risk Scorer")
m = metrics_from(y_test, risk_pred, risk_proba)

fig = plt.figure(figsize=(18, 10), facecolor=BG)
fig.suptitle("XGBoost Risk Scorer", fontsize=18, fontweight="bold",
             color=XGB_C["hi"], y=0.98, fontfamily="monospace")

gs = fig.add_gridspec(2, 3, hspace=0.55, wspace=0.38,
                      top=0.88, bottom=0.08, left=0.07, right=0.97)

ax_stat = fig.add_subplot(gs[0, :])
stat_box(ax_stat, m, XGB_C["hi"])

ax_cm  = fig.add_subplot(gs[1, 0])
ax_roc = fig.add_subplot(gs[1, 1])
ax_fi  = fig.add_subplot(gs[1, 2])

draw_cm(ax_cm, m["cm"], XGB_C)
ax_cm.set_title("Confusion Matrix", pad=10)

draw_roc(ax_roc, m["fpr"], m["tpr"], m["auc"], XGB_C["line"])
ax_roc.set_title("ROC Curve", pad=10)

draw_featimp(ax_fi, feat_names, risk_model.feature_importances_, XGB_C)
ax_fi.set_title("Feature Importances (Gain)", pad=10)

save_fig(fig, "plot_1_xgboost.png")
plt.close()

# ─────────────────────────────────────────────────────────────────────────────
# FIGURE 2 — Random Forest
# ─────────────────────────────────────────────────────────────────────────────
print("\n📊 Plot 2: Random Forest Disease Predictor")
m = metrics_from(y_test, dis_pred, dis_proba)

fig = plt.figure(figsize=(18, 10), facecolor=BG)
fig.suptitle("Random Forest Disease Predictor", fontsize=18, fontweight="bold",
             color=RF_C["hi"], y=0.98)

gs = fig.add_gridspec(2, 3, hspace=0.55, wspace=0.38,
                      top=0.88, bottom=0.08, left=0.07, right=0.97)

ax_stat = fig.add_subplot(gs[0, :])
stat_box(ax_stat, m, RF_C["hi"])

ax_cm  = fig.add_subplot(gs[1, 0])
ax_roc = fig.add_subplot(gs[1, 1])
ax_fi  = fig.add_subplot(gs[1, 2])

draw_cm(ax_cm, m["cm"], RF_C)
ax_cm.set_title("Confusion Matrix", pad=10)

draw_roc(ax_roc, m["fpr"], m["tpr"], m["auc"], RF_C["line"])
ax_roc.set_title("ROC Curve", pad=10)

draw_featimp(ax_fi, feat_names, disease_model.feature_importances_, RF_C)
ax_fi.set_title("Feature Importances (Gini)", pad=10)

save_fig(fig, "plot_2_random_forest.png")
plt.close()

# ─────────────────────────────────────────────────────────────────────────────
# FIGURE 3 — Isolation Forest
# ─────────────────────────────────────────────────────────────────────────────
print("\n📊 Plot 3: Isolation Forest Anomaly Detector")
m = metrics_from(y_test, anom_pred, anom_scores)

fig = plt.figure(figsize=(18, 10), facecolor=BG)
fig.suptitle("Isolation Forest Anomaly Detector", fontsize=18, fontweight="bold",
             color=ISO_C["hi"], y=0.98)

gs = fig.add_gridspec(2, 3, hspace=0.55, wspace=0.38,
                      top=0.88, bottom=0.08, left=0.07, right=0.97)

ax_stat = fig.add_subplot(gs[0, :])
stat_box(ax_stat, m, ISO_C["hi"])

ax_cm   = fig.add_subplot(gs[1, 0])
ax_roc  = fig.add_subplot(gs[1, 1])
ax_dist = fig.add_subplot(gs[1, 2])

draw_cm(ax_cm, m["cm"], ISO_C)
ax_cm.set_title("Confusion Matrix", pad=10)

draw_roc(ax_roc, m["fpr"], m["tpr"], m["auc"], ISO_C["line"])
ax_roc.set_title("ROC Curve", pad=10)

# Score distribution
ax_dist.hist(anom_scores[y_test == 0], bins=22, alpha=0.75,
             color=RF_C["hi"], label="Healthy", edgecolor=PANEL, linewidth=0.5)
ax_dist.hist(anom_scores[y_test == 1], bins=22, alpha=0.75,
             color=XGB_C["hi"], label="Diseased", edgecolor=PANEL, linewidth=0.5)
ax_dist.axvline(0.55, color="#f9e2af", lw=2, linestyle="--", label="Threshold = 0.55")
ax_dist.set_xlabel("Anomaly Score  (0 = normal, 1 = anomalous)")
ax_dist.set_ylabel("Count")
ax_dist.set_title("Score Distribution", pad=10)
ax_dist.legend(fontsize=8, facecolor=PANEL, edgecolor=BORDER, labelcolor=TEXT)

save_fig(fig, "plot_3_isolation_forest.png")
plt.close()

# ─────────────────────────────────────────────────────────────────────────────
# FIGURE 4 — Model Comparison
# ─────────────────────────────────────────────────────────────────────────────
print("\n📊 Plot 4: Model Comparison")

models_info = [
    ("XGBoost\nRisk Scorer",        y_test, risk_pred, risk_proba,  XGB_C["hi"]),
    ("Random Forest\nDisease Pred", y_test, dis_pred,  dis_proba,   RF_C["hi"]),
    ("Isolation Forest\nAnomaly",   y_test, anom_pred, anom_scores, ISO_C["hi"]),
]
labels   = [x[0] for x in models_info]
metrics  = [metrics_from(x[1], x[2], x[3]) for x in models_info]
colors   = [x[4] for x in models_info]

metric_keys   = ["acc", "auc", "sens", "spec"]
metric_labels = ["Accuracy", "ROC-AUC", "Sensitivity", "Specificity"]

fig, axes = plt.subplots(1, 4, figsize=(18, 6), facecolor=BG)
fig.suptitle("Model Comparison — All Metrics", fontsize=16, fontweight="bold",
             color=TEXT, y=1.01)

for ax, key, label in zip(axes, metric_keys, metric_labels):
    vals = [m[key] for m in metrics]
    bars = ax.bar(range(3), vals, color=colors, edgecolor=PANEL,
                  width=0.55, linewidth=1.5)
    ax.set_xticks(range(3))
    ax.set_xticklabels(labels, fontsize=8, color=SUBTEXT)
    ax.set_ylim(0, 1.12)
    ax.set_title(label, pad=12, fontweight="bold")
    ax.yaxis.set_major_formatter(mticker.PercentFormatter(xmax=1, decimals=0))
    ax.set_facecolor(PANEL)
    for spine in ax.spines.values(): spine.set_edgecolor(BORDER)
    for bar, val in zip(bars, vals):
        ax.text(bar.get_x() + bar.get_width() / 2, val + 0.015,
                f"{val:.1%}", ha="center", va="bottom", fontsize=10,
                fontweight="bold", color=bar.get_facecolor())
    # subtle background bars
    for i in range(3):
        ax.bar(i, 1.0, color=colors[i] + "0d", width=0.55, edgecolor="none", zorder=0)

fig.tight_layout(pad=2.5)
save_fig(fig, "plot_4_comparison.png")
plt.close()

print("\n🎉  All 4 plots saved!")
print("   plot_1_xgboost.png")
print("   plot_2_random_forest.png")
print("   plot_3_isolation_forest.png")
print("   plot_4_comparison.png")