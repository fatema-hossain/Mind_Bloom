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
from typing import Dict, List, Any, Optional
import os

# Global variables to cache explainer (created once at startup)
_shap_explainer = None
_model = None
_explainer_type = None  # "tree", "kernel", or "permutation"
_feature_names = None


def initialize_shap_explainer(model, background_sample_size: int = 100) -> None:
    """
    Initialize SHAP explainer on application startup.
    
    Args:
        model: Trained sklearn model (ensemble or classifier)
        background_sample_size: Number of samples to use for SHAP background
    """
    global _shap_explainer, _model, _explainer_type, _feature_names
    
    try:
        import shap
    except ImportError:
        print("[WARN] SHAP library not installed. Install with: pip install shap")
        _shap_explainer = None
        return
    
    _model = model
    
    # Get feature names from model
    _feature_names = getattr(model, "feature_names_in_", None)
    if _feature_names is not None:
        _feature_names = list(_feature_names)
        print(f"[SHAP] Model has {len(_feature_names)} features")
    
    # Try different explainer types in order of preference
    
    # 1. Try TreeExplainer (fastest, works for tree-based models)
    try:
        # Check if model or underlying estimators are tree-based
        if hasattr(model, "estimators_"):
            # VotingClassifier or ensemble - try to use first tree-based estimator
            for name, est in (model.named_estimators_.items() if hasattr(model, "named_estimators_") else enumerate(model.estimators_)):
                if hasattr(est, "tree_") or hasattr(est, "estimators_"):
                    _shap_explainer = shap.TreeExplainer(est)
                    _explainer_type = "tree"
                    print(f"[SHAP] TreeExplainer initialized using {name if isinstance(name, str) else 'estimator'}")
                    return
        elif hasattr(model, "tree_") or hasattr(model, "feature_importances_"):
            _shap_explainer = shap.TreeExplainer(model)
            _explainer_type = "tree"
            print("[SHAP] TreeExplainer initialized successfully")
            return
    except Exception as e:
        print(f"[SHAP] TreeExplainer failed: {e}")
    
    # 2. Try Permutation explainer (model-agnostic, slower but more reliable)
    try:
        # Create synthetic background data based on feature statistics
        if _feature_names:
            # Create simple background with zeros (baseline)
            background = pd.DataFrame(
                np.zeros((10, len(_feature_names))),
                columns=_feature_names
            )
            _shap_explainer = shap.Explainer(
                model.predict_proba if hasattr(model, "predict_proba") else model.predict,
                background,
                feature_names=_feature_names
            )
            _explainer_type = "permutation"
            print("[SHAP] Permutation Explainer initialized successfully")
            return
    except Exception as e:
        print(f"[SHAP] Permutation Explainer failed: {e}")
    
    # 3. If all else fails, use a simple feature importance fallback
    print("[SHAP] Using fallback feature importance method")
    _shap_explainer = None
    _explainer_type = "fallback"


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
    global _model, _feature_names, _explainer_type
    
    if len(instance_df) == 0:
        return {"success": False, "error": "Empty instance dataframe"}
    
    # Use fallback if no SHAP explainer
    if _shap_explainer is None or _explainer_type == "fallback":
        return _get_fallback_importance(instance_df, top_k)
    
    try:
        import shap
        
        # Ensure instance has the right columns
        if _feature_names:
            # Add missing columns with zeros
            for col in _feature_names:
                if col not in instance_df.columns:
                    instance_df[col] = 0
            # Reorder columns to match model
            instance_df = instance_df[_feature_names]
        
        # Compute SHAP values
        if _explainer_type == "tree":
            shap_values = _shap_explainer.shap_values(instance_df)
        else:
            explanation = _shap_explainer(instance_df)
            shap_values = explanation.values
        
        # Handle different output formats
        if isinstance(shap_values, list):
            # Multi-class - take class 1 (high risk) or class 0
            shap_vals = shap_values[1][0] if len(shap_values) > 1 else shap_values[0][0]
        elif len(shap_values.shape) == 3:
            # Shape: (samples, features, classes)
            shap_vals = shap_values[0, :, 1] if shap_values.shape[2] > 1 else shap_values[0, :, 0]
        elif len(shap_values.shape) == 2:
            shap_vals = shap_values[0]
        else:
            shap_vals = shap_values
        
        # Ensure 1D
        shap_vals = np.array(shap_vals).flatten()
        
        # Get base value
        base_value = 0.0
        if hasattr(_shap_explainer, "expected_value"):
            ev = _shap_explainer.expected_value
            if isinstance(ev, (list, np.ndarray)):
                base_value = float(ev[1]) if len(ev) > 1 else float(ev[0])
            else:
                base_value = float(ev)
        
        # Build importance list
        feature_names = instance_df.columns.tolist()
        feature_values = instance_df.iloc[0].tolist()
        
        importance_list = []
        for fname, fval, sval in zip(feature_names, feature_values, shap_vals):
            importance_list.append({
                "feature": str(fname),
                "shap_value": float(sval),
                "feature_value": float(fval) if isinstance(fval, (int, float, np.number)) else str(fval),
                "abs_shap_value": float(abs(sval)),
                "impact": "increases_risk" if sval > 0 else ("decreases_risk" if sval < 0 else "neutral")
            })
        
        # Sort by absolute value and get top_k
        importance_list.sort(key=lambda x: x["abs_shap_value"], reverse=True)
        top_features = importance_list[:top_k]
        
        return {
            "success": True,
            "base_value": base_value,
            "top_features": top_features,
            "total_features_analyzed": len(feature_names),
            "shap_values_available": True,
            "explainer_type": _explainer_type
        }
    
    except Exception as e:
        print(f"[ERROR] SHAP computation failed: {e}")
        # Fall back to simple importance
        return _get_fallback_importance(instance_df, top_k)


def _get_fallback_importance(instance_df: pd.DataFrame, top_k: int = 10) -> Dict[str, Any]:
    """
    Fallback method using model's feature_importances_ if available,
    or simple value-based importance.
    """
    global _model, _feature_names
    
    try:
        # Try to use model's feature importances
        if hasattr(_model, "feature_importances_"):
            importances = _model.feature_importances_
            feature_names = _feature_names or instance_df.columns.tolist()
            
            # Match importances to features in instance
            importance_list = []
            for i, fname in enumerate(feature_names):
                if i < len(importances):
                    fval = instance_df[fname].iloc[0] if fname in instance_df.columns else 0
                    importance_list.append({
                        "feature": str(fname),
                        "shap_value": float(importances[i]),  # Not true SHAP, but feature importance
                        "feature_value": float(fval) if isinstance(fval, (int, float, np.number)) else str(fval),
                        "abs_shap_value": float(importances[i]),
                        "impact": "increases_risk" if fval > 0 else "decreases_risk"
                    })
            
            importance_list.sort(key=lambda x: x["abs_shap_value"], reverse=True)
            
            return {
                "success": True,
                "base_value": 0.0,
                "top_features": importance_list[:top_k],
                "total_features_analyzed": len(importance_list),
                "shap_values_available": False,
                "explainer_type": "feature_importance_fallback",
                "note": "Using model feature importances (not true SHAP values)"
            }
        
        # Last resort: use non-zero feature values as proxy
        feature_values = []
        for col in instance_df.columns:
            val = instance_df[col].iloc[0]
            if isinstance(val, (int, float, np.number)) and val != 0:
                feature_values.append({
                    "feature": str(col),
                    "shap_value": float(abs(val) * 0.01),  # Scaled proxy
                    "feature_value": float(val),
                    "abs_shap_value": float(abs(val) * 0.01),
                    "impact": "increases_risk" if val > 0 else "decreases_risk"
                })
        
        feature_values.sort(key=lambda x: x["abs_shap_value"], reverse=True)
        
        return {
            "success": True,
            "base_value": 0.0,
            "top_features": feature_values[:top_k],
            "total_features_analyzed": len(instance_df.columns),
            "shap_values_available": False,
            "explainer_type": "value_proxy_fallback",
            "note": "SHAP unavailable - showing non-zero feature values"
        }
    
    except Exception as e:
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
        shap_val = feature.get("abs_shap_value", abs(feature.get("shap_value", 0)))
        
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
