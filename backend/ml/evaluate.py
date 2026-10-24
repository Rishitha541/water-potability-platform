"""
Loads the saved model and reports metrics on the held-out test set.
Uses the same random_state as training, so the test set is identical.
Also writes ml/metrics.json, handy for your paper.

Run from the backend folder:  python ml/evaluate.py
"""
import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)

from preprocess import get_splits

MODEL_PATH = Path(__file__).parent.parent / "app" / "model" / "potability_classifier.pkl"
METRICS_PATH = Path(__file__).parent / "metrics.json"


def main():
    bundle = joblib.load(MODEL_PATH)
    model = bundle["model"]

    _, X_test, _, y_test, _ = get_splits()
    y_pred = model.predict(X_test)

    metrics = {
        "accuracy": accuracy_score(y_test, y_pred),
        # class 1 = potable, class 0 = NOT potable
        "precision_potable": precision_score(y_test, y_pred, pos_label=1),
        "recall_potable": recall_score(y_test, y_pred, pos_label=1),
        "f1_potable": f1_score(y_test, y_pred, pos_label=1),
        "precision_not_potable": precision_score(y_test, y_pred, pos_label=0),
        "recall_not_potable": recall_score(y_test, y_pred, pos_label=0),
        "f1_not_potable": f1_score(y_test, y_pred, pos_label=0),
    }

    print("=== Test set metrics ===")
    for name, value in metrics.items():
        print(f"{name:24s}: {value:.3f}")

    tn, fp, fn, tp = confusion_matrix(y_test, y_pred, labels=[0, 1]).ravel()
    print("\n=== Confusion matrix ===")
    print(f"Correctly said NOT potable : {tn}")
    print(f"Said potable, actually NOT : {fp}   <- the dangerous mistake")
    print(f"Said NOT potable, actually potable: {fn}")
    print(f"Correctly said potable     : {tp}")

    print("\n=== Full report ===")
    print(classification_report(
        y_test, y_pred, target_names=["Not potable (0)", "Potable (1)"]
    ))

    importances = pd.Series(model.feature_importances_, index=bundle["features"])
    print("=== Feature importance ===")
    print(importances.sort_values(ascending=False).round(3).to_string())

    metrics.update({
        "false_positives_said_potable_but_not": int(fp),
        "feature_importance": importances.round(4).to_dict(),
    })
    METRICS_PATH.write_text(json.dumps(metrics, indent=2))
    print(f"\nMetrics saved to: {METRICS_PATH}")


if __name__ == "__main__":
    main()