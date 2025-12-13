from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Any, Dict, Optional
import joblib
import pandas as pd

app = FastAPI(title="PPD Predictor API", version="1.0")

# CORS: allow your Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for deploy, replace with your Vercel domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model (your saved deployable pipeline)
MODEL_PATH = "model.joblib"
try:
    model = joblib.load(MODEL_PATH)
except Exception as e:
    raise RuntimeError(f"Failed to load {MODEL_PATH}: {e}")

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
        pred = model.predict(df)[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")

    probabilities = None
    if hasattr(model, "predict_proba"):
        try:
            probs = model.predict_proba(df)[0]
            classes = list(getattr(model, "classes_", []))
            if classes and len(classes) == len(probs):
                probabilities = {str(classes[i]): float(probs[i]) for i in range(len(classes))}
        except Exception:
            probabilities = None

    return {
        "risk_level": str(pred),
        "probabilities": probabilities,
    }
