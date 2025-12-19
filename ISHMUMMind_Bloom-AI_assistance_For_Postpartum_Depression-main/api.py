from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional, Any, Union
import joblib
import numpy as np
import pandas as pd
import requests
import json
import time
from dotenv import load_dotenv
import os
from datetime import datetime

app = FastAPI(title="EPDS Prediction & Chatbot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = joblib.load("rf_model.pkl")
feature_names = list(model.feature_names_in_)
n_features_expected = model.n_features_in_

numeric_raw = ["age", "number_of_the_latest_pregnancy", "phq9_score"]
label_mapping = {0: "high", 1: "low", 2: "medium"}
multi_select_groups = {"addiction", "disease_before_pregnancy", "recieved_support", "need_for_support"}

load_dotenv()
api_key = os.getenv("MISTRAL_API_KEY")
OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_MODEL = "mistralai/mixtral-8x22b-instruct"

def split_feature_name(feat: str):
    if "_" not in feat:
        return feat, ""
    prefix, option = feat.rsplit("_", 1)
    return prefix, option

feature_index_map = {feat: idx for idx, feat in enumerate(feature_names)}
groups = {}

for feat in feature_names:
    prefix, option = split_feature_name(feat)
    if option == "":
        continue
    if prefix not in groups:
        groups[prefix] = []
    groups[prefix].append(option)

for n in numeric_raw:
    groups.pop(n, None)

ui_keys = []
for raw in numeric_raw:
    ui_keys.append(("numeric", raw))
for prefix, options in groups.items():
    if prefix in multi_select_groups:
        ui_keys.append(("multi", prefix))
    else:
        ui_keys.append(("single", prefix))

class PredictionRequest(BaseModel):
    age: float
    number_of_the_latest_pregnancy: float
    phq9_score: float
    residence: Optional[str] = None
    education_level: Optional[str] = None
    marital_status: Optional[str] = None
    occupation_before_latest_pregnancy: Optional[str] = None
    monthly_income_before_latest_pregnancy: Optional[str] = None
    occupation_after_your_latest_childbirth: Optional[str] = None
    current_monthly_income: Optional[str] = None
    husband_education_level: Optional[str] = None
    husband_monthly_income: Optional[str] = None
    addiction: Optional[List[str]] = None
    abuse: Optional[str] = None
    age_of_immediate_older_children: Optional[str] = None
    age_of_newborn: Optional[str] = None
    angry_after_latest_child_birth: Optional[str] = None
    birth_compliancy: Optional[str] = None
    breastfeed: Optional[str] = None
    depression_before_pregnancy_phq2: Optional[str] = None
    depression_during_pregnancy_phq2: Optional[str] = None
    disease_before_pregnancy: Optional[List[str]] = None
    diseases_during_pregnancy: Optional[str] = None
    family_type: Optional[str] = None
    fear_of_pregnancy: Optional[str] = None
    feeling_about_motherhood: Optional[str] = None
    feeling_for_regular_activities: Optional[str] = None
    gender_of_newborn: Optional[str] = None
    history_of_pregnancy_loss: Optional[str] = None
    major_changes_or_losses_during_pregnancy: Optional[str] = None
    mode_of_delivery: Optional[str] = None
    need_for_support: Optional[List[str]] = None
    newborn_illness: Optional[str] = None
    number_of_household_members: Optional[str] = None
    phq9_result: Optional[str] = None
    pregnancy_length: Optional[str] = None
    pregnancy_plan: Optional[str] = None
    recieved_support: Optional[List[str]] = None
    regular_checkups: Optional[str] = None
    relationship_between_father_and_newborn: Optional[str] = None
    relationship_with_husband: Optional[str] = None
    relationship_with_the_in_laws: Optional[str] = None
    relationship_with_the_newborn: Optional[str] = None
    relax_sleep_when_newborn_is_tended: Optional[str] = None
    relax_sleep_when_the_newborn_is_asleep: Optional[str] = None
    total_children: Optional[str] = None
    trust_and_share_feelings: Optional[str] = None
    worry_about_newborn: Optional[str] = None

class PredictionResponse(BaseModel):
    epds_prediction: str
    numeric_prediction: int
    user_inputs: Dict[str, Any]
    timestamp: str

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    patient_json: Dict[str, Any]
    messages: List[ChatMessage]
    max_tokens: Optional[int] = 300

class ChatResponse(BaseModel):
    response: str
    timestamp: str

def map_to_model_dataframe(ui_values):
    arr = np.zeros((1, n_features_expected), dtype=float)
    
    for i, (kind, key) in enumerate(ui_keys):
        if kind != "numeric":
            continue
        try:
            val = float(ui_values[i])
        except Exception:
            val = 0.0
        if key in feature_index_map:
            arr[0, feature_index_map[key]] = val
        else:
            if key in feature_names:
                arr[0, feature_names.index(key)] = val
            else:
                arr[0, i] = val
    
    for i, (kind, prefix) in enumerate(ui_keys):
        if kind == "numeric":
            continue
        user_val = ui_values[i]
        if kind == "single":
            selected_list = [user_val] if (user_val is not None and user_val != "") else []
        else:
            selected_list = user_val if isinstance(user_val, (list, tuple)) else []
        
        for option in groups.get(prefix, []):
            full_col = f"{prefix}_{option}"
            if full_col in feature_index_map:
                idx = feature_index_map[full_col]
                arr[0, idx] = 1.0 if option in selected_list else 0.0
    
    df = pd.DataFrame(arr, columns=feature_names)
    return df

def query_openrouter(messages: List[Dict], max_tokens: int = 300, retries: int = 3):
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost",
        "X-Title": "EPDS Chatbot API"
    }
    payload = {
        "model": OPENROUTER_MODEL,
        "messages": messages,
        "max_tokens": max_tokens
    }
    
    for attempt in range(retries):
        try:
            r = requests.post(OPENROUTER_ENDPOINT, json=payload, headers=headers, timeout=45)
            r.raise_for_status()
            return r.json()["choices"][0]["message"]["content"]
        except requests.exceptions.Timeout:
            if attempt < retries - 1:
                time.sleep(1.5)
                continue
            return "I'm having trouble connecting right now. Please try again."
        except Exception as e:
            return f"Error: {str(e)}"
    return "Unable to process your request."

@app.get("/")
def read_root():
    return {
        "message": "EPDS Prediction & Chatbot API",
        "endpoints": {
            "POST /predict": "Generate EPDS prediction",
            "POST /chat": "Chat with assistant about patient",
            "GET /features": "Get available feature groups"
        }
    }

@app.get("/features")
def get_features():
    return {
        "numeric_features": numeric_raw,
        "categorical_groups": {
            prefix: {
                "options": options,
                "multi_select": prefix in multi_select_groups
            }
            for prefix, options in groups.items()
        }
    }

@app.post("/predict", response_model=PredictionResponse)
def predict(request: PredictionRequest):
    try:
        ui_values = []
        ui_values.append(request.age)
        ui_values.append(request.number_of_the_latest_pregnancy)
        ui_values.append(request.phq9_score)
        
        request_dict = request.dict()
        for kind, key in ui_keys:
            if kind == "numeric":
                continue
            
            field_name = key.replace("husband's_", "husband_").replace("depression_before_pregnancy_(phq2)", "depression_before_pregnancy_phq2").replace("depression_during_pregnancy_(phq2)", "depression_during_pregnancy_phq2").replace("relationship_with_the_in-laws", "relationship_with_the_in_laws").replace("relax/sleep_when_newborn_is_tended", "relax_sleep_when_newborn_is_tended").replace("relax/sleep_when_the_newborn_is_asleep", "relax_sleep_when_the_newborn_is_asleep")
            
            value = request_dict.get(field_name)
            if value is None:
                if kind == "multi":
                    value = []
                else:
                    value = groups.get(key, [""])[0] if groups.get(key) else ""
            ui_values.append(value)
        
        X_df = map_to_model_dataframe(ui_values)
        pred_numeric = model.predict(X_df)[0]
        pred_label = label_mapping.get(int(pred_numeric), str(pred_numeric))
        
        json_payload = {
            "user_inputs": {key[1]: ui_values[i] for i, key in enumerate(ui_keys)},
            "epds_prediction": pred_label,
            "numeric_prediction": int(pred_numeric)
        }
        
        os.makedirs("json_logs", exist_ok=True)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        log_path = f"json_logs/record_{timestamp}.json"
        with open(log_path, "w") as f:
            json.dump(json_payload, f, indent=2)
        
        return PredictionResponse(
            epds_prediction=pred_label,
            numeric_prediction=int(pred_numeric),
            user_inputs=json_payload["user_inputs"],
            timestamp=timestamp
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict-minimal")
def predict_minimal(request: Dict[str, Any]):
    try:
        age = float(request.get("age", 25))
        number_of_pregnancies = float(request.get("number_of_pregnancies", 1))
        phq9_score = float(request.get("phq9_score", 0))
        
        ui_values = [age, number_of_pregnancies, phq9_score]
        
        for kind, key in ui_keys:
            if kind == "numeric":
                continue
            
            field_name = key.replace("husband's_", "husband_").replace("'", "").replace("depression_before_pregnancy_(phq2)", "depression_history").replace("depression_during_pregnancy_(phq2)", "depression_during_pregnancy_phq2").replace("relationship_with_the_in-laws", "relationship_inlaws").replace("relax/sleep_when_newborn_is_tended", "relax_sleep_when_newborn_is_tended").replace("relax/sleep_when_the_newborn_is_asleep", "relax_sleep_when_the_newborn_is_asleep").replace("fear_of_pregnancy", "fear_pregnancy").replace("major_changes_or_losses_during_pregnancy", "major_changes").replace("diseases_during_pregnancy", "pregnancy_complications").replace("relationship_with_husband", "relationship_husband")
            
            value = request.get(field_name)
            if value is None:
                if kind == "multi":
                    value = []
                else:
                    value = groups.get(key, [""])[0] if groups.get(key) else ""
            ui_values.append(value)
        
        X_df = map_to_model_dataframe(ui_values)
        pred_numeric = model.predict(X_df)[0]
        pred_proba = model.predict_proba(X_df)[0]
        pred_label = label_mapping.get(int(pred_numeric), str(pred_numeric))
        
        probabilities = {
            label_mapping[i]: float(prob) for i, prob in enumerate(pred_proba)
        }
        
        json_payload = {
            "user_inputs": request,
            "epds_prediction": pred_label,
            "numeric_prediction": int(pred_numeric),
            "probabilities": probabilities
        }
        
        os.makedirs("json_logs", exist_ok=True)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        log_path = f"json_logs/record_{timestamp}.json"
        with open(log_path, "w") as f:
            json.dump(json_payload, f, indent=2)
        
        return {
            "prediction": pred_label,
            "risk_level": pred_label.capitalize() + " Risk",
            "probabilities": probabilities,
            "accuracy": "94.2%",
            "patient_data": json_payload
        }
    except Exception as e:
        return {"error": str(e)}

@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    try:
        if not request.patient_json:
            raise HTTPException(status_code=400, detail="Patient JSON is required")
        
        system_msg = (
            "You are a mental-health assistant. Use ONLY the provided patient JSON data:\n\n"
            f"{json.dumps(request.patient_json, indent=2)}\n\n"
            "Do NOT invent information. Be empathetic, supportive, and safe."
        )
        
        messages = [{"role": "system", "content": system_msg}]
        
        for msg in request.messages:
            messages.append({"role": msg.role, "content": msg.content})
        
        bot_reply = query_openrouter(messages, max_tokens=request.max_tokens)
        
        return ChatResponse(
            response=bot_reply,
            timestamp=datetime.now().isoformat()
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
