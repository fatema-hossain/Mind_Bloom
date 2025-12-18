import os
import uuid
import io
from typing import Any, Dict, Optional, List

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from fastapi.responses import HTMLResponse
from admin_dashboard import get_admin_dashboard

# Import new online learning modules
from database import init_db, save_prediction, save_feedback, schedule_follow_up, get_statistics, create_user, verify_user, change_password
from scheduler import start_scheduler
from shap_explainer import initialize_shap_explainer, get_shap_values, get_risk_factors_summary

# Import chat router for conversational endpoint
from chat import router as chat_router

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
    """Get data collection statistics from CSV predictions log."""
    from data_collector import get_statistics_from_csv
    
    # Get statistics from CSV (the actual data source)
    csv_stats = get_statistics_from_csv()
    
    return {
        "data_collection_stats": csv_stats,
        "message": "Online learning data accumulating...",
        "next_retraining": "Weekly on Sundays at 2:00 AM"
    }


# ============================================================================
# BATCH CSV UPLOAD AND ASSESSMENT
# ============================================================================

@app.post("/batch-assess")
async def batch_assess(file: UploadFile = File(...), save_to_log: bool = True):
    """
    Batch process a CSV file with multiple survey responses.
    Returns predictions for each row along with SHAP explanations.
    
    Args:
        file: CSV file with survey data (columns should match expected features)
        save_to_log: Whether to save predictions to the predictions log
    
    Returns:
        JSON with individual predictions and aggregate summary
    """
    from feature_derivation import derive_all_features
    from data_collector import log_prediction
    
    # Read uploaded CSV
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read CSV file: {e}")
    
    if len(df) == 0:
        raise HTTPException(status_code=400, detail="CSV file is empty")
    
    results = []
    aggregate_risk = {"high": 0, "medium": 0, "low": 0}
    all_shap_features = []
    
    for idx, row in df.iterrows():
        try:
            # Convert row to dict and clean values
            incoming = row.to_dict()
            incoming = {k: (None if pd.isna(v) else v) for k, v in incoming.items()}
            
            # Normalize common column names
            if "Age" in incoming and "age" not in incoming:
                incoming["age"] = incoming["Age"]
            if "age" not in incoming and "Age" not in incoming:
                # Skip rows without age
                results.append({
                    "row": idx,
                    "status": "error",
                    "error": "Missing required field: age"
                })
                continue
            
            # Derive all features
            try:
                derived_features = derive_all_features(incoming)
            except Exception as e:
                results.append({
                    "row": idx,
                    "status": "error", 
                    "error": f"Feature derivation failed: {str(e)}"
                })
                continue
            
            # Build DataFrame for model
            expected_cols = getattr(model, "feature_names_in_", None)
            if expected_cols is not None:
                model_df = pd.DataFrame([{col: derived_features.get(col) for col in expected_cols}])
            else:
                model_df = pd.DataFrame([derived_features])
            
            # Clean string columns
            for c in model_df.columns:
                if model_df[c].dtype == object:
                    model_df[c] = model_df[c].astype(str).str.strip().str.lower()
                    model_df[c] = model_df[c].replace({"nan": None, "none": None, "": None})
            
            # Make prediction
            pred_idx = model.predict(model_df)[0]
            classes = list(getattr(model, "classes_", ["high", "low", "medium"]))
            risk_label = str(classes[pred_idx]) if pred_idx < len(classes) else str(pred_idx)
            
            # Get probabilities
            probabilities = None
            if hasattr(model, "predict_proba"):
                try:
                    probs = model.predict_proba(model_df)[0]
                    if classes and len(classes) == len(probs):
                        probabilities = {str(classes[i]): float(probs[i]) for i in range(len(classes))}
                except Exception:
                    pass
            
            # Get SHAP values
            shap_explanation = None
            try:
                shap_result = get_shap_values(model_df, top_k=5)
                if shap_result.get("success"):
                    risk_factors = get_risk_factors_summary(shap_result)
                    shap_explanation = {
                        "top_features": shap_result.get("top_features", []),
                        "risk_factors": risk_factors,
                    }
                    # Collect for aggregate
                    all_shap_features.extend(shap_result.get("top_features", []))
            except Exception:
                pass
            
            # Update aggregate counts
            aggregate_risk[risk_label.lower()] = aggregate_risk.get(risk_label.lower(), 0) + 1
            
            # Save to log if requested
            if save_to_log:
                try:
                    log_prediction(derived_features, risk_label, probabilities)
                except Exception:
                    pass
            
            results.append({
                "row": idx,
                "status": "success",
                "risk_level": risk_label,
                "probabilities": probabilities,
                "shap_explanation": shap_explanation,
            })
            
        except Exception as e:
            results.append({
                "row": idx,
                "status": "error",
                "error": str(e)
            })
    
    # Calculate aggregate SHAP summary
    aggregate_shap = _aggregate_shap_features(all_shap_features)
    
    return {
        "total_rows": len(df),
        "successful": len([r for r in results if r.get("status") == "success"]),
        "failed": len([r for r in results if r.get("status") == "error"]),
        "risk_distribution": aggregate_risk,
        "aggregate_shap": aggregate_shap,
        "results": results,
    }


def _aggregate_shap_features(all_features: List[Dict]) -> Dict:
    """Aggregate SHAP features across multiple predictions."""
    if not all_features:
        return {"increasing_risk": [], "decreasing_risk": []}
    
    # Group by feature name and impact
    increasing = {}
    decreasing = {}
    
    for f in all_features:
        fname = f.get("feature", "")
        impact = f.get("impact", "")
        abs_val = abs(f.get("shap_value", 0))
        
        if impact == "increases_risk":
            if fname not in increasing:
                increasing[fname] = {"count": 0, "total_impact": 0}
            increasing[fname]["count"] += 1
            increasing[fname]["total_impact"] += abs_val
        elif impact == "decreases_risk":
            if fname not in decreasing:
                decreasing[fname] = {"count": 0, "total_impact": 0}
            decreasing[fname]["count"] += 1
            decreasing[fname]["total_impact"] += abs_val
    
    # Sort by frequency and impact
    top_increasing = sorted(
        [{"feature": k, "frequency": v["count"], "avg_impact": v["total_impact"]/v["count"]} 
         for k, v in increasing.items()],
        key=lambda x: (x["frequency"], x["avg_impact"]),
        reverse=True
    )[:5]
    
    top_decreasing = sorted(
        [{"feature": k, "frequency": v["count"], "avg_impact": v["total_impact"]/v["count"]} 
         for k, v in decreasing.items()],
        key=lambda x: (x["frequency"], x["avg_impact"]),
        reverse=True
    )[:5]
    
    return {
        "increasing_risk": top_increasing,
        "decreasing_risk": top_decreasing
    }


@app.get("/aggregate-shap")
def get_aggregate_shap(limit: int = 20):
    """
    Get aggregated SHAP feature importance across recent predictions.
    
    This analyzes the most common risk-increasing and risk-decreasing factors
    across the most recent predictions stored in the CSV log.
    
    Args:
        limit: Number of recent predictions to analyze (default: 20)
    
    Returns:
        Aggregated risk factors with frequency and average impact
    """
    from data_collector import get_recent_predictions
    from feature_derivation import derive_all_features
    
    # Get recent predictions from CSV
    recent = get_recent_predictions(limit=limit)
    
    if not recent:
        return {
            "success": True,
            "predictions_analyzed": 0,
            "message": "No predictions found to analyze",
            "aggregate_shap": {
                "increasing_risk": [],
                "decreasing_risk": []
            }
        }
    
    all_shap_features = []
    analyzed_count = 0
    
    for pred in recent:
        try:
            # Derive features from the stored prediction data
            derived_features = derive_all_features(pred)
            
            # Build DataFrame for model
            expected_cols = getattr(model, "feature_names_in_", None)
            if expected_cols is not None:
                model_df = pd.DataFrame([{col: derived_features.get(col) for col in expected_cols}])
            else:
                model_df = pd.DataFrame([derived_features])
            
            # Clean string columns
            for c in model_df.columns:
                if model_df[c].dtype == object:
                    model_df[c] = model_df[c].astype(str).str.strip().str.lower()
                    model_df[c] = model_df[c].replace({"nan": None, "none": None, "": None})
            
            # Get SHAP values
            shap_result = get_shap_values(model_df, top_k=10)
            if shap_result.get("success"):
                all_shap_features.extend(shap_result.get("top_features", []))
                analyzed_count += 1
                
        except Exception as e:
            # Skip predictions that fail to process
            continue
    
    # Aggregate the SHAP features
    aggregate_shap = _aggregate_shap_features(all_shap_features)
    
    return {
        "success": True,
        "predictions_analyzed": analyzed_count,
        "total_predictions": len(recent),
        "aggregate_shap": aggregate_shap,
        "message": f"Analyzed SHAP values from {analyzed_count} recent predictions"
    }


@app.get("/recent-predictions")
def get_recent_predictions_api(limit: int = 10):
    """
    Get the most recent predictions for display.
    """
    from data_collector import get_recent_predictions
    
    predictions = get_recent_predictions(limit=limit)
    
    return {
        "predictions": predictions,
        "count": len(predictions)
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
# USER AUTHENTICATION ENDPOINTS
# ============================================================================

class UserRegisterRequest(BaseModel):
    """User registration request."""
    username: str
    password: str
    email: Optional[str] = None


class UserLoginRequest(BaseModel):
    """User login request."""
    username: str
    password: str


@app.post("/auth/register")
def register_user(req: UserRegisterRequest):
    """
    Register a new user account.
    Stores username and hashed password in database.
    """
    # Basic validation
    if len(req.username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    result = create_user(req.username, req.password, req.email)
    
    if result["success"]:
        return {
            "status": "success",
            "user_id": result["user_id"],
            "username": result["username"],
            "message": result["message"]
        }
    else:
        raise HTTPException(status_code=400, detail=result["error"])


@app.post("/auth/login")
def login_user(req: UserLoginRequest):
    """
    Authenticate user credentials and return user info.
    """
    result = verify_user(req.username, req.password)
    
    if result["success"]:
        user_role = result.get("role", "user")
        print(f"[LOGIN] User {result['username']} logged in with role: {user_role}")
        return {
            "status": "success",
            "user_id": result["user_id"],
            "username": result["username"],
            "email": result.get("email"),
            "role": user_role,
            "message": result["message"]
        }
    else:
        raise HTTPException(status_code=401, detail=result["error"])


class ChangePasswordRequest(BaseModel):
    """Change password request model."""
    username: str
    current_password: str
    new_password: str


# Hardcoded admin credentials (for dev-only display)
ADMIN_CREDENTIALS = {
    "admin1": "abrar6677",
    "admin2": "fatema123",
    "admin3": "salma123",
    "admin4": "ismum123",
}


@app.get("/auth/admin-info/{username}")
def get_admin_info(username: str):
    """
    Get admin credentials for display (DEV ONLY).
    In production, this should return limited info.
    """
    # Check if running in development mode
    is_dev = os.getenv("ENVIRONMENT", "development").lower() in ["development", "dev", "local"]
    
    if username in ADMIN_CREDENTIALS:
        if is_dev:
            return {
                "status": "success",
                "username": username,
                "password": ADMIN_CREDENTIALS[username],
                "role": "admin",
                "is_dev": True
            }
        else:
            # Production: don't expose password
            return {
                "status": "success",
                "username": username,
                "role": "admin",
                "is_dev": False
            }
    else:
        raise HTTPException(status_code=404, detail="Admin not found")


@app.get("/auth/fix-admin-roles")
def fix_admin_roles():
    """
    Manually trigger admin role seeding (for fixing existing databases).
    """
    from database import seed_admin_users
    try:
        seed_admin_users()
        return {"status": "success", "message": "Admin roles have been fixed. Please log out and log back in."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fix admin roles: {e}")


@app.post("/auth/change-password")
def change_user_password(req: ChangePasswordRequest):
    """
    Change user password after verifying current password.
    """
    # Validate new password
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    
    if req.current_password == req.new_password:
        raise HTTPException(status_code=400, detail="New password must be different from current password")
    
    result = change_password(req.username, req.current_password, req.new_password)
    
    if result["success"]:
        return {
            "status": "success",
            "message": result["message"]
        }
    else:
        raise HTTPException(status_code=400, detail=result["error"])


# ============================================================================
# ADMIN RETRAIN SCHEDULE CONFIGURATION
# ============================================================================

class RetrainScheduleRequest(BaseModel):
    """Retrain schedule configuration request."""
    schedule: str  # "daily", "weekly", "manual"


@app.get("/admin/retrain-schedule")
def get_retrain_schedule():
    """Get current retrain schedule configuration."""
    from scheduler import get_current_schedule
    return get_current_schedule()


@app.post("/admin/retrain-schedule")
def set_retrain_schedule(req: RetrainScheduleRequest):
    """Update the model retraining schedule."""
    from scheduler import update_retrain_schedule
    
    result = update_retrain_schedule(req.schedule)
    
    if result.get("success"):
        return result
    else:
        raise HTTPException(status_code=400, detail=result.get("error", "Failed to update schedule"))


@app.post("/admin/retrain-now")
def trigger_retrain_now():
    """Manually trigger model retraining."""
    from scheduler import trigger_manual_retrain
    
    result = trigger_manual_retrain()
    
    if result.get("success"):
        return result
    else:
        raise HTTPException(status_code=500, detail=result.get("error", "Retraining failed"))


# ============================================================================
# ADMIN DASHBOARD
# ============================================================================

@app.get("/admin/dashboard", response_class=HTMLResponse)
def admin_dashboard():
    """Admin dashboard for monitoring online learning."""

    return get_admin_dashboard()
