"""
Enhanced Model Retraining with Database Integration
Automatically loads labeled data from database and retrains model.

Usage:
    python retrain_model_v2.py
"""

import joblib
import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime
from sklearn.ensemble import VotingClassifier, RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score, classification_report
import logging

from database import get_predictions_with_feedback

logging.basicConfig(level=logging. INFO)
logger = logging.getLogger(__name__)

BACKEND_DIR = Path(__file__).parent
MODEL_BACKUP_DIR = BACKEND_DIR / "model_backups"
MODEL_BACKUP_DIR.mkdir(exist_ok=True)


def get_training_data():
    """Load original training data."""
    logger.info("[1/5] Loading training data...")
    
    # Try multiple paths
    possible_paths = [
        Path(r"D:\CSE445\Mind-Bloom_cse445_PPD_DetectionInBangladeshiMothers\PPD_dataset_v2_outputs"),
        BACKEND_DIR / "training_data",
        BACKEND_DIR / "data",
    ]
    
    notebook_dir = None
    for path in possible_paths:
        if (path / "X_train_processed.csv").exists():
            notebook_dir = path
            break
    
    if notebook_dir is None: 
        logger.warning("⚠️ Training data files not found. Script is ready to retrain once data is available.")
        logger.info("Expected files:")
        logger.info("  - X_train_processed.csv")
        logger.info("  - y_train_processed.csv")
        logger.info("  - X_test_processed.csv")
        logger.info("  - y_test_processed.csv")
        logger.info("  - le.pkl")
        return None, None, None, None, None
    
    X_train = pd.read_csv(notebook_dir / "X_train_processed.csv")
    y_train = pd.read_csv(notebook_dir / "y_train_processed.csv").iloc[:, 0]
    X_test = pd.read_csv(notebook_dir / "X_test_processed.csv")
    y_test = pd.read_csv(notebook_dir / "y_test_processed.csv").iloc[:, 0]
    le = joblib.load(notebook_dir / "le.pkl")
    logger.info(f"  ✅ Loaded original data from:  {notebook_dir}")
    logger.info(f"     X_train shape: {X_train.shape}, X_test shape: {X_test.shape}")
    
    return X_train, y_train, X_test, y_test, le

def get_new_feedback_data(le):
    """Get new labeled data from database."""
    logger. info("[2/5] Loading new feedback data from database...")
    
    data = get_predictions_with_feedback()
    
    if not data:
        logger.warning("  No new feedback data available yet")
        return None, None
    
    df = pd.DataFrame(data)
    
    feature_cols = [c for c in df.columns if c not in 
                   ['id', 'timestamp', 'session_id', 'user_email', 'user_phone',
                    'predicted_label', 'predicted_probabilities', 'confidence',
                    'follow_up_status', 'created_at', 'actual_outcome', 
                    'feedback_notes', 'clinician_validated']]
    
    X_new = df[feature_cols]
    y_new = df['actual_outcome']
    
    y_new_enc = le.transform(y_new)
    
    logger.info(f"  ✅ Loaded {len(X_new)} new feedback samples")
    return X_new, y_new_enc


def create_ensemble():
    """Create ensemble model."""
    base_models = [
        ("LogisticRegression", LogisticRegression(
            solver="lbfgs", C=1.5, max_iter=2000,
            class_weight="balanced", random_state=42
        )),
        ("RandomForest", RandomForestClassifier(
            n_estimators=350, max_depth=12, min_samples_split=4,
            min_samples_leaf=2, max_features="sqrt",
            class_weight="balanced", n_jobs=-1, random_state=42
        )),
        ("GradientBoosting", GradientBoostingClassifier(
            n_estimators=350, max_depth=5, learning_rate=0.05,
            subsample=0.9, random_state=42
        )),
        ("SVM", SVC(
            kernel="rbf", C=2.0, gamma="scale",
            class_weight="balanced", probability=True, random_state=42
        ))
    ]
    
    return VotingClassifier(
        estimators=base_models,
        voting='soft',
        weights=[0.25, 0.25, 0.35, 0.15],
        n_jobs=-1
    )


def retrain():
    """Main retraining function."""
    logger.info("=" * 80)
    logger.info("STARTING MODEL RETRAINING")
    logger.info("=" * 80)
    
    try:
        result = get_training_data()
        if result[0] is None: 
            logger.info("Skipping retraining - training data not available yet")
            return
        
        X_train, y_train, X_test, y_test, le = result
        X_new, y_new = get_new_feedback_data(le)
        
        if X_new is not None and len(X_new) > 0:
            X_combined = pd.concat([X_train, X_new], ignore_index=True)
            y_combined = np.concatenate([y_train, y_new])
            logger.info(f"[3/5] Combined data: {len(X_combined)} total samples")
        else:
            logger.warning("  No new data to add. Using original training data only.")
            X_combined = X_train.copy()
            y_combined = y_train.copy()
        
        old_model_path = BACKEND_DIR / "model.joblib"
        if old_model_path.exists():
            backup_name = f"model_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.joblib"
            import shutil
            shutil.copy(old_model_path, MODEL_BACKUP_DIR / backup_name)
            logger.info(f"[4/5] Backed up old model")
        
        logger.info("[5/5] Training new ensemble...")
        ensemble = create_ensemble()
        ensemble.fit(X_combined, y_combined)
        ensemble.classes_ = le.classes_
        
        y_pred = ensemble.predict(X_test)
        acc = accuracy_score(y_test, y_pred)
        
        logger.info(f"  Accuracy: {acc:.4f}")
        logger.info("\n  Classification Report:")
        logger.info(classification_report(y_test, y_pred, target_names=le.classes_))
        
        joblib.dump(ensemble, old_model_path)
        logger.info(f"\n✅ Model saved!")
        logger.info("🎉 Retraining complete!")
        
    except Exception as e: 
        logger.error(f"❌ Error during retraining: {e}")
        raise
        
    except Exception as e:
        logger.error(f"❌ Error during retraining: {e}")
        raise


if __name__ == "__main__":
    retrain()