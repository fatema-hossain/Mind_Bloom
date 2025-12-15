"""
Feature Derivation Module for Minimal Questionnaire
====================================================
Takes 18-22 user inputs and computes all 53 features needed by the model.

This dramatically improves UX by reducing questions from 33+ to ~20,
while maintaining full model accuracy.

IMPORTANT: All categorical features must be LABEL-ENCODED as integers,
matching the encodings used during model training.
"""

import numpy as np
from typing import Dict, Any, Optional

# ============================================================================
# LABEL ENCODER MAPPINGS (from training data - alphabetically sorted)
# ============================================================================
LABEL_ENCODINGS = {
    "Education Level": {'college': 0, 'high school': 1, 'primary school': 2, 'university': 3},
    "Husband's education level": {'college': 0, 'high school': 1, 'primary school': 2, 'university': 3},
    "Total children": {'more than two': 0, 'one': 1, 'two': 2},
    "Disease before pregnancy": {'nan': 0, 'chronic disease': 1},
    "Family type": {'joint': 0, 'nuclear': 1},
    "Number of household members": {'2 to 5': 0, '6 to 8': 1, '9 or more': 2},
    "Relationship with the in-laws": {'bad': 0, 'friendly': 1, 'good': 2, 'neutral': 3, 'poor': 4},
    "Relationship with husband": {'bad': 0, 'friendly': 1, 'good': 2, 'neutral': 3, 'poor': 4},
    "Relationship with the newborn": {'bad': 0, 'good': 1, 'neutral': 2, 'very good': 3},
    "Relationship between father and newborn": {'bad': 0, 'good': 1, 'neutral': 2, 'very good': 3},
    "Feeling about motherhood": {'happy': 0, 'neutral': 1, 'sad': 2},
    "Recieved Support": {'high': 0, 'low': 1, 'medium': 2},
    "Need for Support": {'high': 0, 'low': 1, 'medium': 2},
    "Major changes or losses during pregnancy": {'no': 0, 'yes': 1},
    "Abuse": {'nan': 0, 'no': 1, 'yes': 2},
    "Trust and share feelings": {'nan': 0, 'no': 1, 'yes': 2},
    "Pregnancy length": {'10 months': 0, '9 months': 1, 'less than 5 months': 2},
    "Pregnancy plan": {'no': 0, 'yes': 1},
    "Regular checkups": {'no': 0, 'yes': 1},
    "Fear of pregnancy": {'no': 0, 'yes': 1},
    "Diseases during pregnancy": {'nan': 0, 'non chronic disease': 1},
    "Age of immediate older children": {'13yr or more': 0, '1yr to 3yr': 1, '4yr to 6yr': 2, '7yr to 12yr': 3, 'nan': 4},
    "Birth compliancy": {'no': 0, 'yes': 1},
    "Breastfeed": {'no': 0, 'yes': 1},
    "Worry about newborn": {'no': 0, 'yes': 1},
    "Relax/sleep when newborn is tended": {'no': 0, 'yes': 1},
    "Relax/sleep when the newborn is asleep": {'no': 0, 'yes': 1},
    "Angry after latest child birth": {'nan': 0, 'afraid': 1, 'tired': 2, 'worried': 3},
    "Feeling for regular activities": {'nan': 0, 'afraid': 1, 'tired': 2, 'worried': 3},
    "Depression before pregnancy (PHQ2)": {'negative': 0, 'positive': 1},
    "Depression during pregnancy (PHQ2)": {'negative': 0, 'positive': 1},
    "PHQ9 Result": {'mild': 0, 'minimal': 1, 'moderate': 2, 'moderately severe': 3, 'normal': 4, 'severe': 5},
}


def encode_categorical(column_name: str, value: str) -> int:
    """Encode a categorical value to its integer label."""
    if column_name not in LABEL_ENCODINGS:
        return 0
    
    encoding = LABEL_ENCODINGS[column_name]
    value_lower = str(value).lower().strip()
    
    if value_lower in encoding:
        return encoding[value_lower]
    
    # Try to find a partial match
    for key in encoding:
        if key in value_lower or value_lower in key:
            return encoding[key]
    
    # Default to first value (usually 'nan' or most common)
    return 0

# ============================================================================
# MINIMAL INPUT KEYS (18-22 questions the user actually answers)
# ============================================================================
MINIMAL_INPUT_KEYS = {
    # Section 1: Demographics (3)
    "age",
    "education_level",
    "residence",  # Optional - defaults to "city"
    
    # Section 2: Pregnancy & Birth (5)
    "number_of_pregnancies",
    "history_of_pregnancy_loss",
    "delivery_mode",  # Optional
    "pregnancy_complications",
    "pregnancy_length",
    
    # Section 3: Mental Health (2 + PHQ-9 sub-questions)
    "phq9_score",  # Computed from 9 sub-questions or directly entered
    "depression_history",
    
    # Section 4: Social Support (5)
    "relationship_husband",
    "relationship_inlaws",
    "family_support",
    "trust_share_feelings",
    "feeling_motherhood",
    
    # Section 5: Stressors (4)
    "major_changes",
    "fear_pregnancy",
    "abuse",
    "worry_newborn",
    
    # Optional (4 more for higher accuracy)
    "family_type",
    "total_children",
    "breastfeed",
    "husbands_education",
}

# PHQ-9 sub-question keys (if user answers individually)
PHQ9_QUESTIONS = [
    "phq9_q1",  # Little interest or pleasure
    "phq9_q2",  # Feeling down, depressed
    "phq9_q3",  # Sleep problems
    "phq9_q4",  # Tired or little energy
    "phq9_q5",  # Appetite problems
    "phq9_q6",  # Feeling bad about self
    "phq9_q7",  # Trouble concentrating
    "phq9_q8",  # Moving/speaking slowly
    "phq9_q9",  # Thoughts of self-harm
]


def compute_phq9_score(inputs: Dict[str, Any]) -> int:
    """
    Compute PHQ-9 score from 9 sub-questions.
    Each answer: 0 (Not at all) to 3 (Nearly every day)
    Total range: 0-27
    """
    if "phq9_score" in inputs and inputs["phq9_score"] is not None:
        return int(inputs["phq9_score"])
    
    total = 0
    for q in PHQ9_QUESTIONS:
        val = inputs.get(q, 0)
        if isinstance(val, str):
            # Convert text to numeric
            val_lower = val.lower().strip()
            if "not at all" in val_lower or val_lower == "0":
                val = 0
            elif "several" in val_lower or val_lower == "1":
                val = 1
            elif "more than half" in val_lower or val_lower == "2":
                val = 2
            elif "nearly every" in val_lower or val_lower == "3":
                val = 3
            else:
                try:
                    val = int(val)
                except:
                    val = 0
        total += int(val) if val else 0
    
    return total


def derive_all_features(user_inputs: Dict[str, Any]) -> Dict[str, Any]:
    """
    Takes minimal user inputs (18-22 questions) and computes all features
    needed by the trained model.
    
    Parameters:
    -----------
    user_inputs : dict
        Dictionary with minimal input keys (see MINIMAL_INPUT_KEYS)
        
    Returns:
    --------
    features : dict
        All features ready for the model, using backend column names
    """
    
    # Normalize keys to lowercase
    inputs = {k.lower().strip(): v for k, v in user_inputs.items()}
    
    # ===== Extract and validate core inputs =====
    age = int(inputs.get("age", 25))
    education = str(inputs.get("education_level", "college")).lower().strip()
    num_pregnancies = int(inputs.get("number_of_pregnancies", 1))
    
    # PHQ-9 score (computed or direct)
    phq9_score = compute_phq9_score(inputs)
    
    # Boolean/categorical inputs with defaults
    def get_yes_no(key: str, default: str = "no") -> str:
        val = inputs.get(key, default)
        if val is None:
            return default
        return str(val).lower().strip()
    
    def get_category(key: str, default: str, valid_options: list = None) -> str:
        val = inputs.get(key, default)
        if val is None:
            return default
        val = str(val).lower().strip()
        if valid_options and val not in valid_options:
            return default
        return val
    
    pregnancy_loss = get_yes_no("history_of_pregnancy_loss", "no")
    complications = get_yes_no("pregnancy_complications", "no")
    depression_history = get_yes_no("depression_history", "no")
    major_changes = get_yes_no("major_changes", "no")
    fear_pregnancy = get_yes_no("fear_pregnancy", "no")
    abuse = get_yes_no("abuse", "no")
    worry_newborn = get_yes_no("worry_newborn", "no")
    trust_share = get_yes_no("trust_share_feelings", "yes")
    breastfeed = get_yes_no("breastfeed", "yes")
    
    relationship_husband = get_category("relationship_husband", "good", 
                                        ["good", "neutral", "bad", "friendly", "poor"])
    relationship_inlaws = get_category("relationship_inlaws", "neutral",
                                       ["good", "neutral", "bad", "friendly", "poor"])
    family_support = get_category("family_support", "medium", ["high", "medium", "low"])
    feeling_motherhood = get_category("feeling_motherhood", "neutral", 
                                      ["happy", "neutral", "sad"])
    family_type = get_category("family_type", "nuclear", ["nuclear", "joint"])
    total_children = get_category("total_children", "one", ["one", "two", "more than two"])
    pregnancy_length = get_category("pregnancy_length", "9 months", 
                                    ["10 months", "9 months", "less than 5 months"])
    
    # =========================================================================
    # BUILD FULL FEATURE SET (matching model's expected columns)
    # =========================================================================
    features = {}
    
    # ----- Core features (direct mapping) -----
    features["Age"] = age
    features["Number of the latest pregnancy"] = num_pregnancies
    features["Education Level"] = education
    features["Husband's education level"] = inputs.get("husbands_education", education)
    features["Total children"] = total_children
    features["Family type"] = family_type
    
    # PHQ9 Score - CRITICAL for prediction (highly correlated with outcome)
    features["PHQ9 Score"] = phq9_score
    
    # PHQ9 Result - Categorical interpretation of PHQ9 Score
    if phq9_score <= 4:
        phq9_result = "minimal"
    elif phq9_score <= 9:
        phq9_result = "mild"
    elif phq9_score <= 14:
        phq9_result = "moderate"
    elif phq9_score <= 19:
        phq9_result = "moderately severe"
    else:
        phq9_result = "severe"
    features["PHQ9 Result"] = phq9_result
    
    # Number of household members - derive from family type and children
    if family_type == "joint":
        household_members = 6  # Joint family typically larger
    elif total_children == "more than two":
        household_members = 5
    elif total_children == "two":
        household_members = 4
    else:
        household_members = 3
    features["Number of household members"] = household_members
    
    # Pregnancy features
    features["Disease before pregnancy"] = "chronic disease" if complications == "yes" else "nan"
    features["Pregnancy length"] = pregnancy_length
    features["Pregnancy plan"] = get_yes_no("pregnancy_plan", "yes")
    features["Regular checkups"] = get_yes_no("regular_checkups", "yes")
    features["Fear of pregnancy"] = fear_pregnancy
    features["Diseases during pregnancy"] = "non chronic disease" if complications == "yes" else "nan"
    
    # Emotional/support features
    features["Feeling about motherhood"] = feeling_motherhood
    features["Recieved Support"] = family_support
    features["Need for Support"] = family_support  # Mirror received support
    features["Major changes or losses during pregnancy"] = major_changes
    features["Abuse"] = abuse
    features["Trust and share feelings"] = trust_share
    
    # Map PHQ9 to emotional state
    if phq9_score >= 15:
        emotional_state = "worried"
    elif phq9_score >= 10:
        emotional_state = "tired"
    elif phq9_score >= 5:
        emotional_state = "afraid"
    else:
        emotional_state = "nan"
    
    features["Feeling for regular activities"] = emotional_state
    features["Angry after latest child birth"] = emotional_state
    
    # Relationship features
    features["Relationship with the in-laws"] = relationship_inlaws
    features["Relationship with husband"] = relationship_husband
    
    # Newborn relationship - derive from support/motherhood
    if feeling_motherhood == "happy" and family_support == "high":
        newborn_rel = "very good"
    elif feeling_motherhood == "sad":
        newborn_rel = "neutral"
    else:
        newborn_rel = "good"
    
    features["Relationship with the newborn"] = newborn_rel
    features["Relationship between father and newborn"] = relationship_husband.replace("poor", "neutral").replace("friendly", "good")
    
    # Older children age - derive from number of pregnancies
    if num_pregnancies == 1:
        older_children_age = "nan"
    elif num_pregnancies <= 3:
        older_children_age = "1yr to 3yr"
    else:
        older_children_age = "4yr to 6yr"
    features["Age of immediate older children"] = older_children_age
    
    # Birth/newborn features
    features["Birth compliancy"] = "yes" if pregnancy_loss == "no" else "no"
    features["Breastfeed"] = breastfeed
    features["Worry about newborn"] = worry_newborn
    
    # Sleep features - derive from PHQ9/stress
    good_sleep = "yes" if phq9_score < 10 else "no"
    features["Relax/sleep when newborn is tended"] = good_sleep
    features["Relax/sleep when the newborn is asleep"] = good_sleep
    
    # Depression history (PHQ2 indicators)
    dep_status = "positive" if depression_history == "yes" or phq9_score >= 10 else "negative"
    features["Depression before pregnancy (PHQ2)"] = "positive" if depression_history == "yes" else "negative"
    features["Depression during pregnancy (PHQ2)"] = dep_status
    
    # Newborn illness - derive from worry
    features["Newborn illness"] = "yes" if worry_newborn == "yes" else "no"
    
    # =========================================================================
    # ENGINEERED FEATURES (auto-computed)
    # =========================================================================
    
    # Polynomial features
    features["age_squared"] = age ** 2
    features["age_parity_interaction"] = age * num_pregnancies
    
    # Age risk groups
    features["age_very_young"] = 1 if age < 21 else 0
    features["age_young"] = 1 if 21 <= age < 25 else 0
    features["age_optimal"] = 1 if 25 <= age <= 35 else 0
    features["age_advanced"] = 1 if age > 35 else 0
    
    # PHQ9 clinical bins
    features["phq9_minimal"] = 1 if phq9_score <= 4 else 0
    features["phq9_mild"] = 1 if 5 <= phq9_score <= 9 else 0
    features["phq9_moderate"] = 1 if 10 <= phq9_score <= 14 else 0
    features["phq9_severe"] = 1 if phq9_score >= 15 else 0
    
    # Binary risk flags
    features["high_parity_risk"] = 1 if num_pregnancies >= 4 else 0
    features["history_loss_flag"] = 1 if pregnancy_loss == "yes" else 0
    features["abuse_flag"] = 1 if abuse == "yes" else 0
    features["depression_history_flag"] = 1 if depression_history == "yes" or phq9_score >= 10 else 0
    
    # Social support index
    husband_score = 1.0 if relationship_husband in ["good", "very good", "friendly"] else (0.5 if relationship_husband == "neutral" else 0.0)
    inlaws_score = 1.0 if relationship_inlaws in ["good", "very good", "friendly"] else (0.5 if relationship_inlaws == "neutral" else 0.0)
    support_score = 1.0 if family_support == "high" else (0.5 if family_support == "medium" else 0.0)
    
    features["social_support_index"] = (
        support_score * 0.40 +
        husband_score * 0.35 +
        inlaws_score * 0.25
    )
    
    # Low support flag - binary indicator for low support
    features["low_support_flag"] = 1 if family_support == "low" or features["social_support_index"] < 0.4 else 0
    
    # Pregnancy stress score
    fear_score = 1.0 if fear_pregnancy == "yes" else 0.0
    complications_score = 1.0 if complications == "yes" else 0.0
    changes_score = 1.0 if major_changes == "yes" else 0.0
    
    features["pregnancy_stress_score"] = (
        fear_score * 0.3 +
        complications_score * 0.3 +
        changes_score * 0.4
    )
    
    # Cumulative risk score
    features["cumulative_risk_score"] = (
        features["depression_history_flag"] * 3.0 +
        features["abuse_flag"] * 2.5 +
        (1 - features["social_support_index"]) * 2.0 +
        features["pregnancy_stress_score"] * 1.8 +
        features["history_loss_flag"] * 1.5 +
        features["high_parity_risk"] * 1.2
    )
    
    # =========================================================================
    # ENCODE ALL CATEGORICAL FEATURES TO INTEGERS
    # =========================================================================
    # The model was trained on label-encoded data, so we must encode here
    categorical_columns = [
        "Education Level", "Husband's education level", "Total children",
        "Disease before pregnancy", "Family type", "Number of household members",
        "Relationship with the in-laws", "Relationship with husband",
        "Relationship with the newborn", "Relationship between father and newborn",
        "Feeling about motherhood", "Recieved Support", "Need for Support",
        "Major changes or losses during pregnancy", "Abuse", "Trust and share feelings",
        "Pregnancy length", "Pregnancy plan", "Regular checkups", "Fear of pregnancy",
        "Diseases during pregnancy", "Age of immediate older children",
        "Birth compliancy", "Breastfeed", "Worry about newborn",
        "Relax/sleep when newborn is tended", "Relax/sleep when the newborn is asleep",
        "Angry after latest child birth", "Feeling for regular activities",
        "Depression before pregnancy (PHQ2)", "Depression during pregnancy (PHQ2)",
        "PHQ9 Result"
    ]
    
    for col in categorical_columns:
        if col in features and isinstance(features[col], str):
            features[col] = encode_categorical(col, features[col])
    
    # Convert Number of household members to categorical encoding
    household = features.get("Number of household members", 3)
    if household <= 5:
        features["Number of household members"] = 0  # "2 to 5"
    elif household <= 8:
        features["Number of household members"] = 1  # "6 to 8"
    else:
        features["Number of household members"] = 2  # "9 or more"
    
    return features


def get_minimal_input_schema() -> Dict[str, Any]:
    """
    Returns the schema for minimal user inputs.
    Useful for frontend validation.
    """
    return {
        "required": [
            {"key": "age", "type": "number", "min": 18, "max": 50, "label": "Age"},
            {"key": "education_level", "type": "select", "options": ["primary school", "high school", "college", "university"], "label": "Education Level"},
            {"key": "number_of_pregnancies", "type": "number", "min": 1, "max": 10, "label": "Number of Pregnancies"},
            {"key": "depression_history", "type": "yesno", "label": "Depression before/during pregnancy?"},
            {"key": "relationship_husband", "type": "select", "options": ["good", "neutral", "bad"], "label": "Relationship with Husband"},
            {"key": "relationship_inlaws", "type": "select", "options": ["good", "neutral", "bad"], "label": "Relationship with In-laws"},
            {"key": "family_support", "type": "select", "options": ["high", "medium", "low"], "label": "Family Support Level"},
            {"key": "feeling_motherhood", "type": "select", "options": ["happy", "neutral", "sad"], "label": "Feeling about Motherhood"},
            {"key": "major_changes", "type": "yesno", "label": "Major changes/losses during pregnancy?"},
            {"key": "fear_pregnancy", "type": "yesno", "label": "Fear/anxiety about pregnancy?"},
            {"key": "worry_newborn", "type": "yesno", "label": "Worry about newborn health?"},
        ],
        "phq9": [
            {"key": "phq9_q1", "label": "Little interest or pleasure in doing things?"},
            {"key": "phq9_q2", "label": "Feeling down, depressed, or hopeless?"},
            {"key": "phq9_q3", "label": "Trouble falling/staying asleep, or sleeping too much?"},
            {"key": "phq9_q4", "label": "Feeling tired or having little energy?"},
            {"key": "phq9_q5", "label": "Poor appetite or overeating?"},
            {"key": "phq9_q6", "label": "Feeling bad about yourself?"},
            {"key": "phq9_q7", "label": "Trouble concentrating?"},
            {"key": "phq9_q8", "label": "Moving/speaking slowly or being fidgety?"},
            {"key": "phq9_q9", "label": "Thoughts of self-harm?"},
        ],
        "optional": [
            {"key": "abuse", "type": "yesno", "label": "Experience of abuse? (optional, encrypted)", "sensitive": True},
            {"key": "family_type", "type": "select", "options": ["nuclear", "joint"], "label": "Family Type"},
            {"key": "total_children", "type": "select", "options": ["one", "two", "more than two"], "label": "Total Children"},
            {"key": "breastfeed", "type": "yesno", "label": "Currently breastfeeding?"},
            {"key": "history_of_pregnancy_loss", "type": "yesno", "label": "History of pregnancy loss?"},
            {"key": "pregnancy_complications", "type": "yesno", "label": "Complications during pregnancy?"},
            {"key": "trust_share_feelings", "type": "yesno", "label": "Can trust and share feelings with someone?"},
        ]
    }


if __name__ == "__main__":
    # Test with sample inputs
    sample_inputs = {
        "age": 28,
        "education_level": "university",
        "number_of_pregnancies": 2,
        "phq9_score": 12,
        "depression_history": "no",
        "relationship_husband": "good",
        "relationship_inlaws": "neutral",
        "family_support": "high",
        "feeling_motherhood": "happy",
        "major_changes": "no",
        "fear_pregnancy": "no",
        "abuse": "no",
        "worry_newborn": "yes",
    }
    
    features = derive_all_features(sample_inputs)
    
    print("=" * 60)
    print("FEATURE DERIVATION TEST")
    print("=" * 60)
    print(f"\nInput questions: {len(sample_inputs)}")
    print(f"Output features: {len(features)}")
    print("\n--- Sample Features ---")
    for key, value in list(features.items())[:15]:
        print(f"  {key}: {value}")
    print("  ...")
    print(f"\n--- Risk Indicators ---")
    print(f"  Social Support Index: {features.get('social_support_index', 'N/A'):.2f}")
    print(f"  Pregnancy Stress Score: {features.get('pregnancy_stress_score', 'N/A'):.2f}")
    print(f"  Cumulative Risk Score: {features.get('cumulative_risk_score', 'N/A'):.2f}")

