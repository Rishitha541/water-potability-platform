"""Loads the trained .pkl once and runs predictions."""
from pathlib import Path

import joblib
import pandas as pd

MODEL_PATH = Path(__file__).parent.parent / "model" / "potability_classifier.pkl"

# Model must be at least this sure of "potable" before the verdict can be
# "no_issues_found". We'll tune this from your evaluation numbers.
POTABLE_THRESHOLD = 0.40

FEATURES = [
    "ph", "Hardness", "Solids", "Chloramines", "Sulfate",
    "Conductivity", "Organic_carbon", "Trihalomethanes", "Turbidity",
]

_bundle = None


def _load():
    global _bundle
    if _bundle is None:
        _bundle = joblib.load(MODEL_PATH)
    return _bundle


def predict(readings: dict) -> dict:
    """readings: {feature: value or None}. Blanks are filled with training medians."""
    bundle = _load()
    features, medians = bundle["features"], bundle["medians"]

    missing = [f for f in features if readings.get(f) is None]
    row = {f: (readings[f] if readings.get(f) is not None else medians[f]) for f in features}
    X = pd.DataFrame([row], columns=features)

    proba = float(bundle["model"].predict_proba(X)[0][1])  # P(potable)
    return {
        "probability_potable": round(proba, 3),
        "confident_potable": proba >= POTABLE_THRESHOLD,
        "provided_count": len(features) - len(missing),
        "missing": missing,
    }