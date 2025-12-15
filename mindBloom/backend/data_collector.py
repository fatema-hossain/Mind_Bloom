"""
Data Collection Module for Incremental Learning
================================================
Collects user predictions for future model retraining.

Usage:
1. Frontend submissions are logged to new_data.csv
2. Google Form exports can be merged
3. Run retrain_model.py to update the ensemble

IMPORTANT: This only collects INPUT data. 
For supervised learning, you need ACTUAL outcomes (ground truth)
which requires follow-up with users or clinical validation.
"""

import os
import csv
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional

# Data collection directory
DATA_DIR = Path(__file__).parent / "collected_data"
DATA_DIR.mkdir(exist_ok=True)

# Files
PREDICTIONS_LOG = DATA_DIR / "predictions_log.csv"
NEW_TRAINING_DATA = DATA_DIR / "new_training_data.csv"
FEEDBACK_LOG = DATA_DIR / "user_feedback.csv"

# Column order matching the model's expected features
FEATURE_COLUMNS = [
    "Age",
    "Number of the latest pregnancy",
    "Education Level",
    "Husband's education level",
    "Total children",
    "Family type",
    "Disease before pregnancy",
    "Pregnancy length",
    "Pregnancy plan",
    "Regular checkups",
    "Fear of pregnancy",
    "Diseases during pregnancy",
    "Feeling about motherhood",
    "Recieved Support",
    "Need for Support",
    "Major changes or losses during pregnancy",
    "Abuse",
    "Trust and share feelings",
    "Feeling for regular activities",
    "Angry after latest child birth",
    "Relationship with the in-laws",
    "Relationship with husband",
    "Relationship with the newborn",
    "Relationship between father and newborn",
    "Age of immediate older children",
    "Birth compliancy",
    "Breastfeed",
    "Worry about newborn",
    "Relax/sleep when newborn is tended",
    "Relax/sleep when the newborn is asleep",
    "Depression before pregnancy (PHQ2)",
    "Depression during pregnancy (PHQ2)",
    "Newborn illness",
]


def log_prediction(
    input_data: Dict[str, Any],
    prediction: str,
    probabilities: Optional[Dict[str, float]] = None,
    session_id: Optional[str] = None
) -> None:
    """
    Log a prediction for future analysis and potential retraining.
    
    Args:
        input_data: The user's input features (mapped to model columns)
        prediction: The predicted risk level (high/medium/low)
        probabilities: Probability distribution across classes
        session_id: Optional session identifier
    """
    timestamp = datetime.now().isoformat()
    
    # Prepare row
    row = {
        "timestamp": timestamp,
        "session_id": session_id or "anonymous",
        "prediction": prediction,
        "prob_high": probabilities.get("high", "") if probabilities else "",
        "prob_medium": probabilities.get("medium", "") if probabilities else "",
        "prob_low": probabilities.get("low", "") if probabilities else "",
    }
    
    # Add all feature columns
    for col in FEATURE_COLUMNS:
        row[col] = input_data.get(col, "")
    
    # Write to CSV
    file_exists = PREDICTIONS_LOG.exists()
    with open(PREDICTIONS_LOG, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(row.keys()))
        if not file_exists:
            writer.writeheader()
        writer.writerow(row)
    
    print(f"[DATA] Logged prediction: {prediction} at {timestamp}")


def log_user_feedback(
    session_id: str,
    actual_outcome: str,
    feedback_notes: Optional[str] = None
) -> None:
    """
    Log user feedback about prediction accuracy.
    This is CRITICAL for supervised learning - we need actual outcomes!
    
    Args:
        session_id: Links back to the prediction
        actual_outcome: The real outcome (high/medium/low or clinical diagnosis)
        feedback_notes: Any additional notes
    """
    timestamp = datetime.now().isoformat()
    
    row = {
        "timestamp": timestamp,
        "session_id": session_id,
        "actual_outcome": actual_outcome,
        "feedback_notes": feedback_notes or "",
    }
    
    file_exists = FEEDBACK_LOG.exists()
    with open(FEEDBACK_LOG, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(row.keys()))
        if not file_exists:
            writer.writeheader()
        writer.writerow(row)
    
    print(f"[DATA] Logged feedback for session {session_id}: {actual_outcome}")


def merge_google_form_data(google_form_csv: str) -> int:
    """
    Merge data from Google Form export into training data.
    
    Args:
        google_form_csv: Path to the exported Google Form CSV
        
    Returns:
        Number of rows added
    """
    import pandas as pd
    
    # Read Google Form data
    gf_data = pd.read_csv(google_form_csv)
    
    # Map Google Form columns to model columns (you may need to adjust this)
    # This assumes Google Form has similar column names
    
    # Append to new training data
    if NEW_TRAINING_DATA.exists():
        existing = pd.read_csv(NEW_TRAINING_DATA)
        combined = pd.concat([existing, gf_data], ignore_index=True)
    else:
        combined = gf_data
    
    combined.to_csv(NEW_TRAINING_DATA, index=False)
    
    print(f"[DATA] Merged {len(gf_data)} rows from Google Form")
    return len(gf_data)


def get_data_stats() -> Dict[str, Any]:
    """Get statistics about collected data."""
    stats = {
        "predictions_logged": 0,
        "feedback_received": 0,
        "new_training_samples": 0,
    }
    
    if PREDICTIONS_LOG.exists():
        with open(PREDICTIONS_LOG, "r") as f:
            stats["predictions_logged"] = sum(1 for _ in f) - 1  # Minus header
    
    if FEEDBACK_LOG.exists():
        with open(FEEDBACK_LOG, "r") as f:
            stats["feedback_received"] = sum(1 for _ in f) - 1
    
    if NEW_TRAINING_DATA.exists():
        with open(NEW_TRAINING_DATA, "r") as f:
            stats["new_training_samples"] = sum(1 for _ in f) - 1
    
    return stats


if __name__ == "__main__":
    # Test the data collector
    print("Data Collection Module")
    print("=" * 50)
    print(f"Data directory: {DATA_DIR}")
    print(f"\nCurrent stats:")
    stats = get_data_stats()
    for key, value in stats.items():
        print(f"  {key}: {value}")

