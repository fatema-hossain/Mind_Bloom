"""
Model Retraining Script for Incremental Learning
=================================================
This script retrains the ensemble model with new data.

Data Sources:
1. Original training data (from notebook outputs)
2. Collected predictions with feedback (supervised learning)
3. Google Form exports

Usage:
    python retrain_model.py
    python retrain_model.py --google-form path/to/form_export.csv
    python retrain_model.py --merge-feedback

IMPORTANT: For effective retraining, you need LABELED data 
(user feedback with actual outcomes, not just predictions).
"""

import argparse
import joblib
import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime

from sklearn.ensemble import VotingClassifier, RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

# Try XGBoost
try:
    from xgboost import XGBClassifier
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False

# Paths
BACKEND_DIR = Path(__file__).parent
DATA_DIR = BACKEND_DIR / "collected_data"
NOTEBOOK_OUTPUT_DIR = Path(r"D:\CSE445\Mind-Bloom_cse445_PPD_DetectionInBangladeshiMothers\PPD_dataset_v2_outputs")

# Backup directory for old models
BACKUP_DIR = BACKEND_DIR / "model_backups"
BACKUP_DIR.mkdir(exist_ok=True)


def load_original_data():
    """Load the original training data from notebook outputs."""
    print("[1] Loading original training data...")
    
    X_train = pd.read_csv(NOTEBOOK_OUTPUT_DIR / "X_train_processed.csv")
    y_train = pd.read_csv(NOTEBOOK_OUTPUT_DIR / "y_train_processed.csv").iloc[:, 0]
    X_test = pd.read_csv(NOTEBOOK_OUTPUT_DIR / "X_test_processed.csv")
    y_test = pd.read_csv(NOTEBOOK_OUTPUT_DIR / "y_test_processed.csv").iloc[:, 0]
    
    # Load label encoder
    le = joblib.load(NOTEBOOK_OUTPUT_DIR / "le.pkl")
    
    print(f"    Original data: {len(X_train)} train, {len(X_test)} test")
    return X_train, y_train, X_test, y_test, le


def load_feedback_data():
    """Load predictions that have user feedback (actual outcomes)."""
    print("[2] Loading feedback data...")
    
    predictions_log = DATA_DIR / "predictions_log.csv"
    feedback_log = DATA_DIR / "user_feedback.csv"
    
    if not predictions_log.exists() or not feedback_log.exists():
        print("    No feedback data available yet.")
        return None, None
    
    # Load and merge
    predictions = pd.read_csv(predictions_log)
    feedback = pd.read_csv(feedback_log)
    
    # Join on session_id
    merged = predictions.merge(feedback, on="session_id", how="inner")
    
    if len(merged) == 0:
        print("    No matched feedback found.")
        return None, None
    
    print(f"    Found {len(merged)} predictions with feedback")
    
    # Extract features and labels
    feature_cols = [c for c in merged.columns if c not in 
                   ["timestamp_x", "timestamp_y", "session_id", "prediction", 
                    "prob_high", "prob_medium", "prob_low", "actual_outcome", "feedback_notes"]]
    
    X_new = merged[feature_cols]
    y_new = merged["actual_outcome"]
    
    return X_new, y_new


def load_google_form_data(csv_path: str, label_column: str = "EPDS Result"):
    """Load data exported from Google Forms."""
    print(f"[3] Loading Google Form data from: {csv_path}")
    
    df = pd.read_csv(csv_path)
    
    if label_column not in df.columns:
        print(f"    Warning: Label column '{label_column}' not found. Available: {list(df.columns)}")
        return None, None
    
    X = df.drop(columns=[label_column])
    y = df[label_column]
    
    print(f"    Loaded {len(df)} samples from Google Form")
    return X, y


def create_ensemble(n_classes: int):
    """Create the ensemble model architecture."""
    base_models = [
        ("Logistic Regression", LogisticRegression(
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
    
    if HAS_XGBOOST:
        base_models.append(("XGBoost", XGBClassifier(
            n_estimators=350,
            max_depth=5,
            learning_rate=0.05,
            subsample=0.9,
            colsample_bytree=0.9,
            objective="multi:softprob",
            num_class=n_classes,
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
    
    weights = [0.25, 0.25, 0.35, 0.15]
    
    return VotingClassifier(
        estimators=base_models,
        voting='soft',
        weights=weights,
        n_jobs=-1
    )


def retrain(google_form_csv: str = None, merge_feedback: bool = True):
    """Main retraining function."""
    print("=" * 80)
    print("MODEL RETRAINING")
    print("=" * 80)
    
    # Load original data
    X_train, y_train, X_test, y_test, le = load_original_data()
    
    # Encode labels
    y_train_enc = le.transform(y_train) if y_train.dtype == object else y_train.values
    y_test_enc = le.transform(y_test) if y_test.dtype == object else y_test.values
    
    # Combine with new data
    X_combined = X_train.copy()
    y_combined = y_train_enc.copy() if isinstance(y_train_enc, np.ndarray) else y_train_enc
    
    # Add feedback data
    if merge_feedback:
        X_feedback, y_feedback = load_feedback_data()
        if X_feedback is not None:
            # Align columns
            X_feedback = X_feedback.reindex(columns=X_train.columns, fill_value=0)
            y_feedback_enc = le.transform(y_feedback)
            
            X_combined = pd.concat([X_combined, X_feedback], ignore_index=True)
            y_combined = np.concatenate([y_combined, y_feedback_enc])
            print(f"    Added {len(X_feedback)} feedback samples")
    
    # Add Google Form data
    if google_form_csv:
        X_gf, y_gf = load_google_form_data(google_form_csv)
        if X_gf is not None:
            X_gf = X_gf.reindex(columns=X_train.columns, fill_value=0)
            y_gf_enc = le.transform(y_gf)
            
            X_combined = pd.concat([X_combined, X_gf], ignore_index=True)
            y_combined = np.concatenate([y_combined, y_gf_enc])
            print(f"    Added {len(X_gf)} Google Form samples")
    
    print(f"\n[4] Total training data: {len(X_combined)} samples")
    
    # Backup old model
    old_model_path = BACKEND_DIR / "model.joblib"
    if old_model_path.exists():
        backup_name = f"model_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.joblib"
        backup_path = BACKUP_DIR / backup_name
        import shutil
        shutil.copy(old_model_path, backup_path)
        print(f"\n[5] Backed up old model to: {backup_path}")
    
    # Create and train new ensemble
    print("\n[6] Training new ensemble model...")
    ensemble = create_ensemble(len(le.classes_))
    ensemble.fit(X_combined, y_combined)
    ensemble.classes_ = le.classes_
    
    # Evaluate
    print("\n[7] Evaluating on test set...")
    y_pred = ensemble.predict(X_test)
    acc = accuracy_score(y_test_enc, y_pred)
    print(f"    Accuracy: {acc:.4f}")
    print("\n    Classification Report:")
    print(classification_report(y_test_enc, y_pred, target_names=le.classes_))
    
    # Save
    print("\n[8] Saving new model...")
    joblib.dump(ensemble, old_model_path)
    print(f"    Saved to: {old_model_path}")
    
    print("\n" + "=" * 80)
    print("RETRAINING COMPLETE!")
    print("=" * 80)
    print("\nNext steps:")
    print("1. Restart the backend server to load the new model")
    print("2. uvicorn main:app --reload --host 0.0.0.0 --port 8000")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Retrain the PPD prediction model")
    parser.add_argument("--google-form", type=str, help="Path to Google Form CSV export")
    parser.add_argument("--merge-feedback", action="store_true", default=True,
                       help="Include user feedback in training")
    parser.add_argument("--no-feedback", action="store_true",
                       help="Exclude user feedback from training")
    
    args = parser.parse_args()
    
    retrain(
        google_form_csv=args.google_form,
        merge_feedback=not args.no_feedback
    )

