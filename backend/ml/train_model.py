"""
Trains a Random Forest on the cleaned data and saves everything the API needs
into ONE file: app/model/potability_classifier.pkl

The saved bundle contains:
  - model:    the trained RandomForestClassifier
  - medians:  training medians, used to fill blank inputs at prediction time
  - features: the exact column order the model expects
  - sklearn_version: the version that created the file (for debugging load errors)

Run from the backend folder:  python ml/train_model.py
"""
from pathlib import Path

import joblib
import sklearn
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score

from preprocess import FEATURES, get_splits

MODEL_PATH = Path(__file__).parent.parent / "app" / "model" / "potability_classifier.pkl"


def main():
    X_train, X_test, y_train, y_test, medians = get_splits()

    model = RandomForestClassifier(
        n_estimators=300,
        max_depth=None,
        min_samples_leaf=2,
        class_weight="balanced",   # compensates for the 61/39 class imbalance
        random_state=42,
        n_jobs=-1,
    )

    # 5-fold cross-validation on the training set gives a more stable estimate
    cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring="accuracy")
    print(f"5-fold CV accuracy: {cv_scores.mean():.3f} (+/- {cv_scores.std():.3f})")

    model.fit(X_train, y_train)
    print(f"Test accuracy:      {model.score(X_test, y_test):.3f}")

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    bundle = {
        "model": model,
        "medians": medians,
        "features": FEATURES,
        "sklearn_version": sklearn.__version__,
    }
    joblib.dump(bundle, MODEL_PATH)
    print(f"\nModel saved to: {MODEL_PATH}")


if __name__ == "__main__":
    main()