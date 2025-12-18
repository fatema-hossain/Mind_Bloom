import os
import uuid
from typing import Any, Dict, Optional

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from fastapi.responses import HTMLResponse
from admin_dashboard import get_admin_dashboard

# Import new online learning modules
from database import init_db, save_prediction, save_feedback, schedule_follow_up, get_statistics
from scheduler import start_scheduler
from shap_explainer import initialize_shap_explainer, get_shap_values, get_risk_factors_summary

app = FastAPI(title="PPD Predictor API", version="1.0")
# Initialize database and scheduler on startup
@app.on_event("startup")
async def startup_event():
    """Initialize database and background scheduler on app startup."""
    init_db()
    start_scheduler()
    
    # Initialize SHAP explainer
    try:
        initialize_shap_explainer(model)
        print("[OK] SHAP explainer initialized")
    except Exception as e:
        print(f"[WARN] SHAP initialization failed (non-critical): {e}")
    
    print("[OK] Database initialized")
    print("[OK] Background scheduler started")

# CORS: allow your Next.js frontend (configure via FRONTEND_ORIGIN env, comma-separated)
ALLOWED_ORIGINS = os.getenv("FRONTEND_ORIGIN", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# NOTEBOOK ARTIFACT LOADING (once at startup)
# ============================================================================
# AUTHORITATIVE NOTEBOOK SOURCE:
# D:\CSE445\Mind_Bloom-main\mindBloom\version-abrar-grp-assign (Update with ensemble model) - ABRARCopy.ipynb
#
# Model is created via: python create_ensemble_model.py
# which loads training data from notebook outputs and creates an ensemble VotingClassifier
#
# Model path can be configured via MODEL_PATH env var
# Default: local model.joblib (created from notebook)
MODEL_PATH = os.getenv("MODEL_PATH", "model.joblib")

try:
    model = joblib.load(MODEL_PATH)
    print(f"[STARTUP] Model loaded successfully from: {MODEL_PATH}")
except Exception as e:
    raise RuntimeError(f"Failed to load model from {MODEL_PATH}: {e}")

# Frontend keys -> Dataset / model column names (with spaces)
KEY_MAP: Dict[str, str] = {
    "Age": "Age",
    "Number_of_the_latest_pregnancy": "Number of the latest pregnancy",

    "Education_Level": "Education Level",
    "Husbands_education_level": "Husband's education level",
    "Total_children": "Total children",
    "Family_type": "Family type",

    "Disease_before_pregnancy": "Disease before pregnancy",
    "Pregnancy_length": "Pregnancy length",
    "Pregnancy_plan": "Pregnancy plan",
    "Regular_checkups": "Regular checkups",
    "Fear_of_pregnancy": "Fear of pregnancy",
    "Diseases_during_pregnancy": "Diseases during pregnancy",

    "Feeling_about_motherhood": "Feeling about motherhood",
    "Recieved_Support": "Recieved Support",
    "Need_for_Support": "Need for Support",
    "Major_changes_or_losses": "Major changes or losses during pregnancy",
    "Abuse": "Abuse",
    "Trust_and_share_feelings": "Trust and share feelings",
    "Feeling_for_regular_activities": "Feeling for regular activities",
    "Angry_after_latest_child_birth": "Angry after latest child birth",

    "Relationship_with_inlaws": "Relationship with the in-laws",
    "Relationship_with_husband": "Relationship with husband",
    "Relationship_with_newborn": "Relationship with the newborn",
    "Relationship_between_father_and_newborn": "Relationship between father and newborn",

    "Age_of_immediate_older_children": "Age of immediate older children",
    "Birth_compliancy": "Birth compliancy",
    "Breastfeed": "Breastfeed",
    "Worry_about_newborn": "Worry about newborn",
    "Relax_sleep_when_tended": "Relax/sleep when newborn is tended",
    "Relax_sleep_when_asleep": "Relax/sleep when the newborn is asleep",

    "Depression_before_pregnancy": "Depression before pregnancy (PHQ2)",
    "Depression_during_pregnancy": "Depression during pregnancy (PHQ2)",
    "Newborn_illness": "Newborn illness",
}

EXPECTED_FRONTEND_KEYS = set(KEY_MAP.keys())


def _clean_value(v: Any) -> Any:
    """Convert 'nan'/'none'/'' to None. Keep everything else."""
    if v is None:
        return None
    if isinstance(v, str):
        s = v.strip()
        if s == "" or s.lower() in {"nan", "none", "null"}:
            return None
        return s
    return v


class PredictRequest(BaseModel):
    """
    Supports both payload styles:
      1) Flat JSON: { "Age": 23, ... }
      2) Nested:   { "answers": { "Age": 23, ... } }
    """
    answers: Optional[Dict[str, Any]] = None

    # allow extra fields for flat payload
    class Config:
        extra = "allow"


@app.get("/health")
def health():
    return {"ok": True}


# ============================================================================
# FEEDBACK ENDPOINTS FOR INCREMENTAL LEARNING
# ============================================================================
class FeedbackRequest(BaseModel):
    session_id: str
    actual_outcome: str  # "high", "medium", "low" or clinical notes
    feedback_notes: Optional[str] = None


@app.post("/feedback")
def submit_feedback(req: FeedbackRequest):
    """
    Collect user feedback on prediction accuracy.
    This is CRITICAL for supervised incremental learning.
    """
    if os.getenv("COLLECT_DATA", "true").lower() != "true":
        return {"status": "data_collection_disabled"}
    
    try:
        from data_collector import log_user_feedback
        log_user_feedback(req.session_id, req.actual_outcome, req.feedback_notes)
        return {"status": "success", "message": "Feedback recorded"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/data-stats")
def get_data_stats():
    """Get statistics about collected data (for admin dashboard)."""
    try:
        from data_collector import get_data_stats
        return get_data_stats()
    except Exception as e:
        return {"error": str(e)}


@app.get("/minimal-schema")
def get_minimal_schema():
    """
    Get the schema for minimal questionnaire.
    Frontend uses this to build the form dynamically.
    """
    try:
        from feature_derivation import get_minimal_input_schema
        return get_minimal_input_schema()
    except Exception as e:
        return {"error": str(e)}


# ============================================================================
# MINIMAL QUESTIONNAIRE PREDICTION (18-22 questions -> 53 features)
# ============================================================================
@app.post("/predict-minimal")
def predict_minimal(req: PredictRequest):
    """
    NEW: Accepts minimal user inputs (18-22 questions) and auto-computes
    all 53 features needed by the model.
    
    This dramatically improves UX while maintaining accuracy.
    """
    from feature_derivation import derive_all_features
    
    # Accept flat payload or {answers:{...}}
    if req.answers is not None:
        incoming = req.answers
    else:
        incoming = req.model_dump()
        incoming.pop("answers", None)
    
    # Clean values
    incoming = {k: _clean_value(v) for k, v in incoming.items()}
    
    # Basic validation
    if "age" not in incoming and "Age" not in incoming:
        raise HTTPException(status_code=422, detail="Missing required field: age")
    
    # Normalize age key
    if "Age" in incoming and "age" not in incoming:
        incoming["age"] = incoming["Age"]
    
    # Derive all 53 features from minimal inputs
    try:
        derived_features = derive_all_features(incoming)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Feature derivation failed: {e}")
    
    # Build DataFrame for model
    expected_cols = getattr(model, "feature_names_in_", None)
    
    if expected_cols is not None:
        df = pd.DataFrame([{col: derived_features.get(col) for col in expected_cols}])
    else:
        df = pd.DataFrame([derived_features])
    
    # Clean string columns
    for c in df.columns:
        if df[c].dtype == object:
            df[c] = df[c].astype(str).str.strip().str.lower()
            df[c] = df[c].replace({"nan": None, "none": None, "": None})
    
    try:
        pred_idx = model.predict(df)[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")
    
    # Convert prediction index to class label (e.g., 1 -> 'low')
    classes = list(getattr(model, "classes_", ["high", "low", "medium"]))
    risk_label = str(classes[pred_idx]) if pred_idx < len(classes) else str(pred_idx)
    
    probabilities = None
    if hasattr(model, "predict_proba"):
        try:
            probs = model.predict_proba(df)[0]
            if classes and len(classes) == len(probs):
                probabilities = {str(classes[i]): float(probs[i]) for i in range(len(classes))}
        except Exception:
            probabilities = None
    
    # Data collection
    if os.getenv("COLLECT_DATA", "true").lower() == "true":
        try:
            from data_collector import log_prediction
            log_prediction(derived_features, risk_label, probabilities)
        except Exception as e:
            print(f"[WARN] Data collection failed (non-critical): {e}")
    
    # Include derived risk scores in response for transparency
    risk_indicators = {
        "social_support_index": derived_features.get("social_support_index"),
        "pregnancy_stress_score": derived_features.get("pregnancy_stress_score"),
        "cumulative_risk_score": derived_features.get("cumulative_risk_score"),
    }
    
    # Generate SHAP values for model interpretability
    shap_explanation = None
    try:
        shap_result = get_shap_values(df, top_k=10)
        if shap_result.get("success"):
            risk_factors = get_risk_factors_summary(shap_result)
            shap_explanation = {
                "top_features": shap_result.get("top_features", []),
                "risk_factors": risk_factors,
                "base_value": shap_result.get("base_value"),
                "total_features_analyzed": shap_result.get("total_features_analyzed"),
            }
    except Exception as e:
        print(f"[WARN] SHAP explanation failed (non-critical): {e}")
    
    return {
        "risk_level": risk_label,
        "probabilities": probabilities,
        "risk_indicators": risk_indicators,
        "features_computed": len(derived_features),
        "shap_explanation": shap_explanation,
    }


@app.post("/predict")
def predict(req: PredictRequest):
    # Accept flat payload or {answers:{...}}
    if req.answers is not None:
        incoming = req.answers
    else:
        incoming = req.model_dump()
        incoming.pop("answers", None)

    # Keep only expected keys
    incoming = {k: _clean_value(v) for k, v in incoming.items() if k in EXPECTED_FRONTEND_KEYS}

    # Basic validation: must have at least Age + pregnancy number (you can loosen/tighten this)
    if "Age" not in incoming or "Number_of_the_latest_pregnancy" not in incoming:
        raise HTTPException(status_code=422, detail="Missing required fields: Age and Number_of_the_latest_pregnancy")

    # Remap keys to the dataset/model columns
    mapped = {KEY_MAP[k]: incoming.get(k) for k in EXPECTED_FRONTEND_KEYS}

    # Make DataFrame for model
    # Build df with exactly the columns the model was trained on (prevents missing-column crashes)
    expected_cols = getattr(model, "feature_names_in_", None)

    if expected_cols is not None:
        df = pd.DataFrame([{col: mapped.get(col) for col in expected_cols}])
    else:
        df = pd.DataFrame([mapped])

    

    for c in df.columns:
        if df[c].dtype == object:
            df[c] = df[c].astype(str).str.strip().str.lower()
            df[c] = df[c].replace({"nan": None, "none": None, "": None})


    try:
        pred_idx = model.predict(df)[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")

    # Convert prediction index to class label (e.g., 1 -> 'low')
    classes = list(getattr(model, "classes_", ["high", "low", "medium"]))
    risk_label = str(classes[pred_idx]) if pred_idx < len(classes) else str(pred_idx)

    probabilities = None
    if hasattr(model, "predict_proba"):
        try:
            probs = model.predict_proba(df)[0]
            if classes and len(classes) == len(probs):
                probabilities = {str(classes[i]): float(probs[i]) for i in range(len(classes))}
        except Exception:
            probabilities = None

    # ========================================================================
    # DATA COLLECTION FOR INCREMENTAL LEARNING (optional, non-blocking)
    # ========================================================================
    if os.getenv("COLLECT_DATA", "true").lower() == "true":
        try:
            from data_collector import log_prediction
            log_prediction(mapped, risk_label, probabilities)
        except Exception as e:
            # Don't fail prediction if logging fails
            print(f"[WARN] Data collection failed (non-critical): {e}")

    return {
        "risk_level": risk_label,
        "probabilities": probabilities,
    }


# ============================================================================
# NEW ENDPOINTS FOR ONLINE LEARNING
# ============================================================================

class PredictionWithContactRequest(BaseModel):
    """Extended prediction request with contact info for follow-ups."""
    answers: Dict[str, Any]
    user_email: Optional[str] = None
    user_phone: Optional[str] = None


class FeedbackRequest(BaseModel):
    """Feedback submission for model improvement."""
    session_id: str
    actual_outcome: str  # "high", "medium", "low"
    feedback_notes: Optional[str] = None
    clinician_validated: bool = False
    confidence_score: Optional[float] = None


@app.post("/predict-with-tracking")
def predict_with_tracking(req: PredictionWithContactRequest):
    """
    Make prediction AND save to database for online learning.
    Returns session_id for future follow-up.
    """
    session_id = str(uuid.uuid4())
    
    try:
        # YOUR EXISTING PREDICTION LOGIC HERE
        # (Copy from your existing /predict endpoint)
        # For now, placeholder:
        
        prediction = "high"  # Replace with your model prediction
        probabilities = {"high": 0.7, "medium": 0.2, "low": 0.1}
        confidence = 0.7
        
        # Save to database
        save_prediction(
            session_id=session_id,
            user_email=req.user_email,
            user_phone=req.user_phone,
            input_features=req.answers,
            predicted_label=prediction,
            probabilities=probabilities,
            confidence=confidence
        )
        
        # Schedule follow-up (6 weeks later)
        schedule_follow_up(
            session_id=session_id,
            days_from_now=42,
            method="email" if req.user_email else "sms"
        )
        
        return {
            "session_id": session_id,
            "prediction": prediction,
            "probabilities": probabilities,
            "confidence": confidence,
            "follow_up_scheduled": True,
            "follow_up_date": "6 weeks from now"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/feedback")
def submit_feedback(req: FeedbackRequest):
    """
    Submit actual outcome for a previous prediction.
    This is CRITICAL for online learning!
    """
    success = save_feedback(
        session_id=req.session_id,
        actual_outcome=req.actual_outcome,
        feedback_notes=req.feedback_notes,
        clinician_validated=req.clinician_validated,
        confidence_score=req.confidence_score
    )
    
    if success:
        return {
            "status": "success",
            "message": "Feedback recorded. Thank you! ",
            "session_id":  req.session_id
        }
    else:
        raise HTTPException(status_code=400, detail="Failed to save feedback")


@app.get("/statistics")
def get_collection_statistics():
    """Get data collection statistics."""
    stats = get_statistics()
    return {
        "data_collection_stats": stats,
        "message": "Online learning data accumulating...",
        "next_retraining": "Weekly on Sundays at 2:00 AM"
    }


@app.get("/health")
def health_check():
    """Health check endpoint with data stats."""
    stats = get_statistics()
    return {
        "status": "healthy",
        "predictions": stats["total_predictions"],
        "feedback":  stats["total_feedback"],
        "feedback_rate": f"{stats['feedback_rate']}%",
        "scheduler": "active"
    }
# ============================================================================
# ADMIN DASHBOARD
# ============================================================================

@app.get("/admin/dashboard", response_class=HTMLResponse)
def admin_dashboard():
    """Admin dashboard for monitoring online learning."""
    return get_admin_dashboard()