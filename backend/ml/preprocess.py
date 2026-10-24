"""
Loads the Kaggle Water Potability CSV, splits it into train/test,
and fills missing values with the median.

The medians come from the TRAINING split only, so no information from the
test set leaks into training. They are returned so train_model.py can save
them alongside the model.
"""
from pathlib import Path

import pandas as pd
from sklearn.model_selection import train_test_split

DATA_PATH = Path(__file__).parent / "data" / "water_potability.csv"

FEATURES = [
    "ph", "Hardness", "Solids", "Chloramines", "Sulfate",
    "Conductivity", "Organic_carbon", "Trihalomethanes", "Turbidity",
]
TARGET = "Potability"


def load_data() -> pd.DataFrame:
    """Read the raw CSV."""
    return pd.read_csv(DATA_PATH)


def get_splits(test_size: float = 0.2, random_state: int = 42):
    """
    Returns X_train, X_test, y_train, y_test, medians.
    - Stratified split keeps the 39/61 class ratio the same in both sets.
    - medians is a dict {feature: median} learned from the training set.
    """
    df = load_data()
    X = df[FEATURES]
    y = df[TARGET]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=test_size,
        random_state=random_state,
        stratify=y,
    )

    medians = X_train.median().to_dict()
    X_train = X_train.fillna(medians)
    X_test = X_test.fillna(medians)

    return X_train, X_test, y_train, y_test, medians


if __name__ == "__main__":
    raw = load_data()
    print("Shape:", raw.shape)
    print("\nMissing values per column:")
    print(raw.isnull().sum())
    print("\nClass balance (Potability):")
    print(raw[TARGET].value_counts(normalize=True).round(3))

    X_train, X_test, y_train, y_test, medians = get_splits()
    print("\nTrain size:", X_train.shape, "| Test size:", X_test.shape)
    print("Missing after cleaning:", int(X_train.isnull().sum().sum() + X_test.isnull().sum().sum()))