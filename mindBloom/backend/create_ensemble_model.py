"""
Create Ensemble VotingClassifier from Notebook Specification
============================================================
AUTHORITATIVE NOTEBOOK SOURCE:
D:\CSE445\Mind_Bloom-main\mindBloom\version-abrar-grp-assign (Update with ensemble model) - ABRARCopy.ipynb

This script creates the weighted soft voting ensemble model as specified
in the above notebook.

Base Models (with weights):
- Logistic Regression: 0.25
- Random Forest: 0.25  
- XGBoost: 0.35 (highest weight)
- SVM RBF: 0.15

Output: model.joblib (sklearn VotingClassifier)

Usage:
  cd mindBloom/backend
  python create_ensemble_model.py
  # Then restart backend to load new model
"""

import joblib
import pandas as pd
import numpy as np
from pathlib import Path

from sklearn.ensemble import VotingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split

# Try to import XGBoost
try:
    from xgboost import XGBClassifier
    HAS_XGBOOST = True
except ImportError:
    print("Warning: XGBoost not installed. Using GradientBoosting instead.")
    from sklearn.ensemble import GradientBoostingClassifier
    HAS_XGBOOST = False

print("=" * 80)
print("CREATING ENSEMBLE VOTING CLASSIFIER")
print("=" * 80)

# ============================================================================
# 1. Load Training Data
# ============================================================================
# Try to load from notebook outputs first, fallback to local dataset
NOTEBOOK_OUTPUT_DIR = Path(r"D:\CSE445\Mind-Bloom_cse445_PPD_DetectionInBangladeshiMothers\PPD_dataset_v2_outputs")
LOCAL_DATASET = Path("PPD_dataset_v2.csv")

if (NOTEBOOK_OUTPUT_DIR / "X_train_processed.csv").exists():
    print(f"\n[1/5] Loading processed data from notebook outputs...")
    X_train = pd.read_csv(NOTEBOOK_OUTPUT_DIR / "X_train_processed.csv")
    X_test = pd.read_csv(NOTEBOOK_OUTPUT_DIR / "X_test_processed.csv")
    y_train = pd.read_csv(NOTEBOOK_OUTPUT_DIR / "y_train_processed.csv").iloc[:, 0]
    y_test = pd.read_csv(NOTEBOOK_OUTPUT_DIR / "y_test_processed.csv").iloc[:, 0]
    
    # Load label encoder if available
    if (NOTEBOOK_OUTPUT_DIR / "le.pkl").exists():
        le = joblib.load(NOTEBOOK_OUTPUT_DIR / "le.pkl")
        print(f"  Loaded LabelEncoder with classes: {list(le.classes_)}")
    else:
        le = LabelEncoder()
        le.fit(y_train)
    
    # Encode labels
    y_train_enc = le.transform(y_train) if y_train.dtype == object else y_train.values
    y_test_enc = le.transform(y_test) if y_test.dtype == object else y_test.values
    
    print(f"  X_train shape: {X_train.shape}")
    print(f"  X_test shape: {X_test.shape}")
    print(f"  Classes: {list(le.classes_)}")

elif LOCAL_DATASET.exists():
    print(f"\n[1/5] Loading data from local dataset: {LOCAL_DATASET}")
    df = pd.read_csv(LOCAL_DATASET)
    
    # Basic preprocessing (matching notebook approach)
    target_col = "EPDS Result" if "EPDS Result" in df.columns else df.columns[-1]
    X = df.drop(columns=[target_col])
    y = df[target_col]
    
    # Encode categorical features
    X = pd.get_dummies(X, drop_first=True)
    
    # Encode labels
    le = LabelEncoder()
    y_enc = le.fit_transform(y)
    
    # Split
    X_train, X_test, y_train_enc, y_test_enc = train_test_split(
        X, y_enc, test_size=0.2, stratify=y_enc, random_state=42
    )
    
    print(f"  X_train shape: {X_train.shape}")
    print(f"  X_test shape: {X_test.shape}")
    print(f"  Classes: {list(le.classes_)}")

else:
    raise FileNotFoundError("No training data found. Please ensure PPD_dataset_v2.csv exists or notebook outputs are available.")

# ============================================================================
# 2. Define Base Models (matching notebook Cell 76 specifications)
# ============================================================================
print("\n[2/5] Defining base models...")

base_models = [
    ("Logistic Regression", LogisticRegression(
        multi_class="multinomial",
        solver="lbfgs",
        C=1.5,
        max_iter=2000,
        class_weight="balanced",
        random_state=42
    )),
    ("Random Forest", RandomForestClassifier(
        n_estimators=350,
        max_depth=12,
        min_samples_split=4,
        min_samples_leaf=2,
        max_features="sqrt",
        class_weight="balanced",
        n_jobs=-1,
        random_state=42
    )),
]

# Add XGBoost or fallback
if HAS_XGBOOST:
    base_models.append(("XGBoost", XGBClassifier(
        n_estimators=350,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.9,
        colsample_bytree=0.9,
        objective="multi:softprob",
        num_class=len(le.classes_),
        eval_metric="mlogloss",
        random_state=42
    )))
else:
    base_models.append(("GradientBoosting", GradientBoostingClassifier(
        n_estimators=350,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.9,
        random_state=42
    )))

base_models.append(("SVM (RBF)", SVC(
    kernel="rbf",
    C=2.0,
    gamma="scale",
    class_weight="balanced",
    probability=True,
    random_state=42
)))

for name, _ in base_models:
    print(f"  - {name}")

# ============================================================================
# 3. Create Weighted Soft Voting Ensemble
# ============================================================================
print("\n[3/5] Creating VotingClassifier with weighted soft voting...")

# Weights from notebook: LR=0.25, RF=0.25, XGB=0.35, SVM=0.15
weights = [0.25, 0.25, 0.35, 0.15]
print(f"  Weights: {dict(zip([n for n, _ in base_models], weights))}")

ensemble = VotingClassifier(
    estimators=base_models,
    voting='soft',
    weights=weights,
    n_jobs=-1
)

# ============================================================================
# 4. Train Ensemble
# ============================================================================
print("\n[4/5] Training ensemble model...")
print("  This may take a few minutes...")

ensemble.fit(X_train, y_train_enc)

# Store classes for prediction
ensemble.classes_ = le.classes_

print("  Training complete!")

# Quick validation
from sklearn.metrics import accuracy_score, classification_report
y_pred = ensemble.predict(X_test)
acc = accuracy_score(y_test_enc, y_pred)
print(f"\n  Validation Accuracy: {acc:.4f}")
print("\n  Classification Report:")
print(classification_report(y_test_enc, y_pred, target_names=le.classes_))

# ============================================================================
# 5. Save Model
# ============================================================================
print("\n[5/5] Saving ensemble model...")

output_path = Path("model.joblib")
joblib.dump(ensemble, output_path)

print(f"  Saved to: {output_path.absolute()}")
print(f"  File size: {output_path.stat().st_size / 1024 / 1024:.2f} MB")

print("\n" + "=" * 80)
print("ENSEMBLE MODEL CREATED SUCCESSFULLY!")
print("=" * 80)
print(f"\nModel ready for deployment: {output_path}")
print(f"Classes: {list(ensemble.classes_)}")
print(f"Supports: .predict() and .predict_proba()")

