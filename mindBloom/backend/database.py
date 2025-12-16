"""
SQLite Database Layer for Mind_Bloom Online Learning
====================================================
Stores predictions, feedback, and learning metrics for model retraining. 

Tables:
- predictions: All ML model predictions made for users
- feedback: User feedback on prediction accuracy
- follow_up_schedules: Automated 6-week follow-up reminders
- model_versions: Track model retraining history

Usage:
    from database import init_db
    init_db()
"""

import sqlite3
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, Dict, List, Any
import json

DB_PATH = Path(__file__).parent / "mindbloom.db"


def get_connection():
    """Get SQLite connection."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initialize database schema."""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Table 1: Predictions (all predictions made by users)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS predictions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT UNIQUE NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        user_email TEXT,
        user_phone TEXT,
        
        -- Input features (all 33 model features)
        age INTEGER,
        number_of_pregnancies INTEGER,
        education_level TEXT,
        husbands_education TEXT,
        total_children TEXT,
        family_type TEXT,
        disease_before_pregnancy TEXT,
        pregnancy_length TEXT,
        pregnancy_plan TEXT,
        regular_checkups TEXT,
        fear_of_pregnancy TEXT,
        diseases_during_pregnancy TEXT,
        feeling_about_motherhood TEXT,
        received_support TEXT,
        need_for_support TEXT,
        major_changes_losses TEXT,
        abuse TEXT,
        trust_share_feelings TEXT,
        feeling_regular_activities TEXT,
        angry_after_birth TEXT,
        relationship_inlaws TEXT,
        relationship_husband TEXT,
        relationship_newborn TEXT,
        relationship_father_newborn TEXT,
        age_older_children TEXT,
        birth_compliancy TEXT,
        breastfeed TEXT,
        worry_newborn TEXT,
        relax_sleep_tended TEXT,
        relax_sleep_asleep TEXT,
        depression_before_pregnancy INTEGER DEFAULT 0,
        depression_during_pregnancy INTEGER DEFAULT 0,
        newborn_illness TEXT,
        
        -- Prediction output
        predicted_label TEXT,
        predicted_probabilities JSON,
        confidence REAL,
        
        -- Status tracking
        follow_up_status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Table 2: Feedback (actual outcomes collected from users)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT UNIQUE NOT NULL,
        actual_outcome TEXT,
        feedback_date DATETIME,
        feedback_notes TEXT,
        clinician_validated INTEGER DEFAULT 0,
        confidence_score REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES predictions(session_id)
    )
    """)
    
    # Table 3: Follow-up Schedule
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS follow_up_schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        scheduled_date DATETIME,
        reminder_sent INTEGER DEFAULT 0,
        follow_up_completed INTEGER DEFAULT 0,
        follow_up_method TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES predictions(session_id)
    )
    """)
    
    # Table 4: Model Versions
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS model_versions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version_number INTEGER,
        model_path TEXT,
        training_samples INTEGER,
        accuracy REAL,
        training_date DATETIME,
        data_sources TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    conn.commit()
    conn.close()
    print("✅ Database initialized successfully!")


def save_prediction(
    session_id: str,
    user_email: Optional[str],
    user_phone: Optional[str],
    input_features: Dict[str, Any],
    predicted_label: str,
    probabilities: Dict[str, float],
    confidence: float
) -> bool:
    """Save a prediction to database."""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
        INSERT INTO predictions (
            session_id, user_email, user_phone,
            age, number_of_pregnancies, education_level, husbands_education,
            total_children, family_type, disease_before_pregnancy, pregnancy_length,
            pregnancy_plan, regular_checkups, fear_of_pregnancy, diseases_during_pregnancy,
            feeling_about_motherhood, received_support, need_for_support,
            major_changes_losses, abuse, trust_share_feelings, feeling_regular_activities,
            angry_after_birth, relationship_inlaws, relationship_husband,
            relationship_newborn, relationship_father_newborn, age_older_children,
            birth_compliancy, breastfeed, worry_newborn, relax_sleep_tended,
            relax_sleep_asleep, depression_before_pregnancy, depression_during_pregnancy,
            newborn_illness, predicted_label, predicted_probabilities, confidence
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            session_id, user_email, user_phone,
            input_features.get("Age"),
            input_features.get("Number of the latest pregnancy"),
            input_features. get("Education Level"),
            input_features.get("Husband's education level"),
            input_features.get("Total children"),
            input_features.get("Family type"),
            input_features.get("Disease before pregnancy"),
            input_features.get("Pregnancy length"),
            input_features.get("Pregnancy plan"),
            input_features.get("Regular checkups"),
            input_features.get("Fear of pregnancy"),
            input_features.get("Diseases during pregnancy"),
            input_features. get("Feeling about motherhood"),
            input_features.get("Recieved Support"),
            input_features.get("Need for Support"),
            input_features.get("Major changes or losses during pregnancy"),
            input_features. get("Abuse"),
            input_features.get("Trust and share feelings"),
            input_features.get("Feeling for regular activities"),
            input_features.get("Angry after latest child birth"),
            input_features.get("Relationship with the in-laws"),
            input_features.get("Relationship with husband"),
            input_features.get("Relationship with the newborn"),
            input_features.get("Relationship between father and newborn"),
            input_features.get("Age of immediate older children"),
            input_features. get("Birth compliancy"),
            input_features.get("Breastfeed"),
            input_features.get("Worry about newborn"),
            input_features.get("Relax/sleep when newborn is tended"),
            input_features. get("Relax/sleep when the newborn is asleep"),
            input_features.get("Depression before pregnancy (PHQ2)"),
            input_features. get("Depression during pregnancy (PHQ2)"),
            input_features.get("Newborn illness"),
            predicted_label,
            json.dumps(probabilities),
            confidence
        ))
        
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Error saving prediction:  {e}")
        return False


def save_feedback(
    session_id: str,
    actual_outcome: str,
    feedback_notes: Optional[str] = None,
    clinician_validated: bool = False,
    confidence_score: Optional[float] = None
) -> bool:
    """Save user feedback (actual outcome) for retraining."""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
        INSERT INTO feedback (session_id, actual_outcome, feedback_date, feedback_notes, clinician_validated, confidence_score)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (
            session_id,
            actual_outcome,
            datetime.now().isoformat(),
            feedback_notes,
            1 if clinician_validated else 0,
            confidence_score
        ))
        
        conn. commit()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Error saving feedback:  {e}")
        return False


def schedule_follow_up(
    session_id: str,
    days_from_now: int = 42,
    method: str = "email"
) -> bool:
    """Schedule follow-up reminder for collecting feedback."""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        scheduled_date = datetime.now() + timedelta(days=days_from_now)
        
        cursor.execute("""
        INSERT INTO follow_up_schedules (session_id, scheduled_date, follow_up_method)
        VALUES (?, ?, ?)
        """, (session_id, scheduled_date.isoformat(), method))
        
        conn.commit()
        conn.close()
        return True
    except Exception as e: 
        print(f"❌ Error scheduling follow-up: {e}")
        return False


def get_predictions_with_feedback() -> List[Dict]:
    """Get all predictions that have feedback (for retraining)."""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
    SELECT p.*, f.actual_outcome, f.feedback_notes, f.clinician_validated
    FROM predictions p
    INNER JOIN feedback f ON p.session_id = f.session_id
    WHERE f.actual_outcome IS NOT NULL
    """)
    
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def get_pending_follow_ups() -> List[Dict]:
    """Get follow-ups that are due."""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
    SELECT * FROM follow_up_schedules
    WHERE scheduled_date <= datetime('now')
    AND follow_up_completed = 0
    """)
    
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def export_for_retraining(output_path: str = "retraining_data.csv") -> bool:
    """Export labeled data as CSV for model retraining."""
    try:
        import pandas as pd
        
        data = get_predictions_with_feedback()
        if not data:
            print("⚠️  No labeled data available for retraining")
            return False
        
        df = pd.DataFrame(data)
        df.to_csv(output_path, index=False)
        print(f"✅ Exported {len(df)} labeled samples to {output_path}")
        return True
    except Exception as e:
        print(f"❌ Error exporting data: {e}")
        return False


def get_statistics() -> Dict:
    """Get data collection statistics."""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) as total FROM predictions")
    total_predictions = cursor.fetchone()['total']
    
    cursor. execute("SELECT COUNT(*) as total FROM feedback")
    total_feedback = cursor.fetchone()['total']
    
    cursor.execute("SELECT AVG(confidence) as avg_conf FROM predictions")
    avg_confidence = cursor.fetchone()['avg_conf'] or 0
    
    conn. close()
    
    feedback_rate = (total_feedback / total_predictions * 100) if total_predictions > 0 else 0
    
    return {
        "total_predictions": total_predictions,
        "total_feedback": total_feedback,
        "feedback_rate": round(feedback_rate, 2),
        "average_confidence": round(avg_confidence, 4)
    }



if __name__ == "__main__": 
    init_db()