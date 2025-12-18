"""
SHAP Explainer Module
=====================
Generates SHAP (SHapley Additive exPlanations) values to explain
individual predictions from the PPD risk assessment model.

SHAP provides feature importance for each prediction, helping users
understand which factors most influenced their risk assessment.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional, Tuple
import joblib
import os

# Global variables to cache explainer (created once at startup)
_shap_explainer = None
_model = None
_background_data = None


def initialize_shap_explainer(model, background_sample_size: int = 100) -> None:
    """
    Initialize SHAP explainer on application startup.
    
    Args:
        model: Trained sklearn model (ensemble or classifier)
        background_sample_size: Number of samples to use for SHAP background
    """
    global _shap_explainer, _model, _background_data
    
    try:
        import shap
    except ImportError:
        raise ImportError("SHAP library not installed. Install with: pip install shap")
    
    _model = model
    
    # Try to load background data from training set
    try:
        dataset_path = os.path.join(os.path.dirname(__file__), "PPD_dataset_v2.csv")
        if os.path.exists(dataset_path):
            df = pd.read_csv(dataset_path)
            
            # Get expected columns from model
            expected_cols = getattr(model, "feature_names_in_", None)
            if expected_cols is not None:
                # Filter to only expected columns and drop NaN values
                available_cols = [col for col in expected_cols if col in df.columns]
                df = df[available_cols].dropna()
            
            # Use random sample for background
            background_size = min(background_sample_size, len(df))
            _background_data = df.sample(n=background_size, random_state=42)
            
            print(f"[SHAP] Background data initialized with {len(_background_data)} samples")
        else:
            print(f"[WARN] Background dataset not found at {dataset_path}")
            _background_data = None
    except Exception as e:
        print(f"[WARN] Failed to load background data for SHAP: {e}")
        _background_data = None
    
    # Initialize SHAP explainer
    try:
        if _background_data is not None and len(_background_data) > 0:
            # Use SHAP KernelExplainer (works with any model)
            _shap_explainer = shap.KernelExplainer(
                model.predict_proba if hasattr(model, "predict_proba") else model.predict,
                _background_data
            )
            print("[SHAP] KernelExplainer initialized successfully")
        else:
            print("[WARN] SHAP explainer not initialized - background data unavailable")
            _shap_explainer = None
    except Exception as e:
        print(f"[WARN] Failed to initialize SHAP explainer: {e}")
        _shap_explainer = None


def get_shap_values(
    instance_df: pd.DataFrame,
    top_k: int = 10,
    background_data: Optional[pd.DataFrame] = None
) -> Dict[str, Any]:
    """
    Generate SHAP values and feature importance for a single prediction.
    
    Args:
        instance_df: DataFrame with single row (the instance to explain)
        top_k: Number of top features to return
        background_data: Optional background data for explaining
    
    Returns:
        Dictionary with SHAP values and feature importance
    """
    try:
        import shap
    except ImportError:
        return {"error": "SHAP not available"}
    
    if _shap_explainer is None:
        return {"error": "SHAP explainer not initialized"}
    
    if len(instance_df) == 0:
        return {"error": "Empty instance dataframe"}
    
    try:
        # Compute SHAP values for this instance
        shap_values = _shap_explainer.shap_values(instance_df)
        
        # Handle different output formats from SHAP
        if isinstance(shap_values, list):
            # Multi-class output - take the first class for high risk
            shap_vals = shap_values[0][0] if len(shap_values) > 0 else np.array([])
        else:
            # Binary or regression output
            shap_vals = shap_values[0] if len(shap_values.shape) > 1 else shap_values
        
        # Get base value (expected model output)
        if hasattr(_shap_explainer, "expected_value"):
            base_value = _shap_explainer.expected_value
            if isinstance(base_value, (list, np.ndarray)):
                base_value = float(base_value[0]) if len(base_value) > 0 else 0.0
            else:
                base_value = float(base_value)
        else:
            base_value = 0.0
        
        # Create feature importance list
        feature_names = instance_df.columns.tolist()
        feature_values = instance_df.iloc[0].tolist()
        
        importance_list = []
        for i, (fname, fval, shap_val) in enumerate(zip(feature_names, feature_values, shap_vals)):
            importance_list.append({
                "feature": str(fname),
                "shap_value": float(shap_val),
                "feature_value": float(fval) if isinstance(fval, (int, float, np.number)) else str(fval),
                "abs_shap_value": float(abs(shap_val))
            })
        
        # Sort by absolute SHAP value and get top_k
        importance_list.sort(key=lambda x: x["abs_shap_value"], reverse=True)
        top_features = importance_list[:top_k]
        
        # Categorize impact direction
        for item in top_features:
            if item["shap_value"] > 0:
                item["impact"] = "increases_risk"
            elif item["shap_value"] < 0:
                item["impact"] = "decreases_risk"
            else:
                item["impact"] = "neutral"
        
        return {
            "success": True,
            "base_value": base_value,
            "top_features": top_features,
            "total_features_analyzed": len(feature_names),
            "shap_values_available": True
        }
    
    except Exception as e:
        print(f"[ERROR] Failed to compute SHAP values: {e}")
        return {
            "success": False,
            "error": str(e),
            "shap_values_available": False
        }


def get_risk_factors_summary(shap_result: Dict[str, Any]) -> Dict[str, List[str]]:
    """
    Generate a human-readable summary of risk factors from SHAP values.
    
    Args:
        shap_result: Output from get_shap_values()
    
    Returns:
        Dictionary with risk-increasing and risk-decreasing factors
    """
    if not shap_result.get("success") or not shap_result.get("top_features"):
        return {"increasing_risk": [], "decreasing_risk": []}
    
    increasing = []
    decreasing = []
    
    for feature in shap_result["top_features"]:
        feature_name = feature["feature"].replace("_", " ").title()
        feature_value = feature["feature_value"]
        shap_val = abs(feature["shap_value"])
        
        # Format description
        desc = f"{feature_name} ({shap_val:.3f})"
        
        if feature["impact"] == "increases_risk":
            increasing.append(desc)
        elif feature["impact"] == "decreases_risk":
            decreasing.append(desc)
    
    return {
        "increasing_risk": increasing,
        "decreasing_risk": decreasing
    }
