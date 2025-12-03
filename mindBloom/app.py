import streamlit as st
import pandas as pd
import numpy as np
import joblib

# -----------------------------
# LOAD TRAINED OBJECTS
# -----------------------------
best_model = joblib.load("best_model.pkl")
ohe_final = joblib.load("ohe_final.pkl")
scaler = joblib.load("scaler.pkl")
final_numeric = joblib.load("final_numeric.pkl")
final_cat_cols = joblib.load("final_cat_cols.pkl")
label_encoder = joblib.load("label_encoder.pkl")

# optional: use your original dataset to get dropdown options
try:
    df_template = pd.read_csv("PPD_dataset_v2.csv")
except Exception:
    df_template = None

# -----------------------------
# HELPER: COMMON PREDICTION LOGIC
# -----------------------------
def predict_with_model(df_input: pd.DataFrame) -> pd.DataFrame:
    """Takes a dataframe with the right columns and returns a copy with Predicted_EPDS_Result."""
    # Numeric features
    X_num = df_input[final_numeric]

    # Categorical features (if any)
    X_cat = df_input[final_cat_cols] if final_cat_cols else None

    # Scale numeric
    if len(final_numeric) > 0:
        X_num_scaled = scaler.transform(X_num)
    else:
        X_num_scaled = np.empty((len(df_input), 0))

    # One-hot encode categoricals
    if X_cat is not None and len(final_cat_cols) > 0:
        X_cat_enc = ohe_final.transform(X_cat)
    else:
        X_cat_enc = np.empty((len(df_input), 0))

    # Combine
    X_full = np.hstack([X_num_scaled, X_cat_enc])

    # Predict
    y_pred = best_model.predict(X_full)

    # Try to decode numeric labels; if already text, just use them
    try:
        y_pred_labels = label_encoder.inverse_transform(y_pred)
    except Exception:
        y_pred_labels = y_pred

    df_out = df_input.copy()
    df_out["Predicted_EPDS_Result"] = y_pred_labels
    return df_out

# -----------------------------
# STREAMLIT PAGE CONFIG
# -----------------------------
st.set_page_config(page_title="PPD ML Classifier", page_icon="🧠")

st.title(" Postpartum Depression (EPDS Result) Classifier")
st.write(
    "This app uses your trained Random Forest model to predict **EPDS Result**."
)

# 🔽 MODE SELECTOR
mode = st.radio(
    "Choose input mode:",
    ["📁 CSV upload (many patients)", "✍️ Manual form (single patient)"],
)

st.markdown("---")

# =========================================================
# MODE 1: CSV UPLOAD
# =========================================================
if mode == "📁 CSV upload (many patients)":
    st.subheader("📂 1. Upload your CSV file")

    uploaded_file = st.file_uploader("Choose a CSV file", type=["csv"])

    if uploaded_file is not None:
        try:
            df = pd.read_csv(uploaded_file)
        except Exception as e:
            st.error(f"Could not read the file. Error: {e}")
            st.stop()

        st.write("✅ File loaded. Here are the first few rows:")
        st.dataframe(df.head())

        st.markdown("### 🔍 Checking required columns...")

        required_columns = set(final_numeric) | set(final_cat_cols)
        missing_columns = [col for col in required_columns if col not in df.columns]

        if missing_columns:
            st.error(
                "❌ Your CSV is missing these required columns used by the model:\n\n"
                + "\n".join(f"- {col}" for col in missing_columns)
            )
            st.stop()
        else:
            st.success("✅ All required columns are present!")

        st.markdown("### ⚙️ Preparing data for prediction...")
        st.markdown("### 🔮 Making predictions...")

        df_result = predict_with_model(df)

        st.success("✅ Prediction completed!")

        st.markdown("### 📊 Preview of results")
        st.dataframe(df_result.head())

        csv_out = df_result.to_csv(index=False).encode("utf-8")

        st.download_button(
            label="⬇️ Download full results as CSV",
            data=csv_out,
            file_name="ppd_predictions.csv",
            mime="text/csv",
        )
    else:
        st.info("👆 Please upload a CSV file to start.")

# =========================================================
# MODE 2: MANUAL FORM
# =========================================================
else:
    st.subheader("✍️ Enter patient information (single prediction)")

    input_data = {}

    st.markdown("#### 🔢 Numeric features")
    if not final_numeric:
        st.info("No numeric features were used in this model.")
    else:
        for col in final_numeric:
            # Use template to guess a reasonable range, if available
            min_val, max_val, default_val = 0.0, 100.0, 0.0
            if df_template is not None and col in df_template.columns:
                try:
                    col_series = pd.to_numeric(df_template[col], errors="coerce")
                    col_series = col_series.dropna()
                    if not col_series.empty:
                        min_val = float(col_series.min())
                        max_val = float(col_series.max())
                        default_val = float(col_series.median())
                except Exception:
                    pass

            value = st.number_input(
                col,
                value=default_val,
                min_value=min_val,
                max_value=max_val,
            )
            input_data[col] = value

    st.markdown("#### 🔤 Categorical features")
    if not final_cat_cols:
        st.info("No categorical features were used in this model.")
    else:
        for col in final_cat_cols:
            options = None
            if df_template is not None and col in df_template.columns:
                options = sorted(df_template[col].dropna().unique().tolist())

            if options and len(options) <= 30:
                # Use dropdown with existing categories
                choice = st.selectbox(col, options)
            else:
                # Fallback: free text input
                choice = st.text_input(col, value="")
            input_data[col] = choice

    if st.button("Predict EPDS Result"):
        # Build a one-row dataframe
        df_single = pd.DataFrame([input_data])

        try:
            df_result_single = predict_with_model(df_single)
            pred_value = df_result_single["Predicted_EPDS_Result"].iloc[0]

            st.success("✅ Prediction completed!")
            st.markdown(f"### 🔮 Predicted EPDS Result: **{pred_value}**")

            st.markdown("#### Full input with prediction")
            st.dataframe(df_result_single)
        except Exception as e:
            st.error(f"Something went wrong during prediction: {e}")
