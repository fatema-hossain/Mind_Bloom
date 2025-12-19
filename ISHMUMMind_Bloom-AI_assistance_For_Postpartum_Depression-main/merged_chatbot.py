import joblib
import numpy as np
import pandas as pd
import gradio as gr
import requests
import traceback
import json
from dotenv import load_dotenv
import os
import time

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

gr_inputs = []
ui_keys = []

for raw in numeric_raw:
    label = raw.replace("_", " ").title()
    gr_inputs.append(gr.Number(label=label, value=0))
    ui_keys.append(("numeric", raw))

for prefix, options in groups.items():
    display_label = prefix.replace("_", " ").title()
    if prefix in multi_select_groups:
        gr_inputs.append(gr.CheckboxGroup(options, label=display_label))
        ui_keys.append(("multi", prefix))
    else:
        gr_inputs.append(gr.Dropdown(options, label=display_label, value=options[0]))
        ui_keys.append(("single", prefix))

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

def generate_prediction(*ui_inputs):
    try:
        X_df = map_to_model_dataframe(ui_inputs)
        pred_numeric = model.predict(X_df)[0]
        pred_label = label_mapping.get(int(pred_numeric), str(pred_numeric))
        json_payload = {
            "user_inputs": {key[1]: ui_inputs[i] for i, key in enumerate(ui_keys)},
            "epds_prediction": pred_label,
            "numeric_prediction": int(pred_numeric)
        }
        json_text = json.dumps(json_payload, indent=2)
        os.makedirs("json_logs", exist_ok=True)
        log_path = f"json_logs/record_{pd.Timestamp.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(log_path, "w") as f:
            f.write(json_text)
        return json_payload, f"✅ EPDS Prediction: **{pred_label.upper()}**\n\nYou can now chat with the assistant below.", gr.update(interactive=True), gr.update(interactive=True)
    except Exception as e:
        tb = traceback.format_exc()
        return None, f"❌ Error: {e}\n\n{tb}", gr.update(interactive=False), gr.update(interactive=False)

def query_openrouter(messages, max_tokens=300, retries=3):
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost",
        "X-Title": "EPDS Chatbot"
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
            return f"Error: {e}"
    return "Unable to process your request."

def user_send(message, history, patient_json):
    if patient_json is None:
        return history + [[message, "⚠️ Please generate a prediction first before chatting."]], ""
    if not message.strip():
        return history, ""
    history = history + [[message, None]]
    return history, ""

def bot_respond(history, patient_json):
    if patient_json is None:
        return history
    if not history or history[-1][1] is not None:
        return history
    user_message = history[-1][0]
    system_msg = (
        "You are a mental-health assistant. Use ONLY the provided patient JSON data:\n\n"
        f"{json.dumps(patient_json, indent=2)}\n\n"
        "Do NOT invent information. Be empathetic, supportive, and safe."
    )
    messages = [{"role": "system", "content": system_msg}]
    for user_msg, bot_msg in history[:-1]:
        if user_msg:
            messages.append({"role": "user", "content": user_msg})
        if bot_msg:
            messages.append({"role": "assistant", "content": bot_msg})
    messages.append({"role": "user", "content": user_message})
    bot_reply = query_openrouter(messages)
    history[-1][1] = bot_reply
    return history

with gr.Blocks(title="EPDS Prediction & Chatbot") as app:
    gr.Markdown("# 🧠 EPDS Prediction & Mental Health Chatbot")
    gr.Markdown("**Step 1:** Fill the form and generate prediction | **Step 2:** Chat with the assistant")
    patient_json_state = gr.State(None)
    chat_history_state = gr.State([])
    with gr.Row():
        with gr.Column(scale=1):
            gr.Markdown("### 📋 EPDS Form")
            form_inputs = []
            for inp in gr_inputs:
                form_inputs.append(inp.render())
            predict_btn = gr.Button("🔮 Generate Prediction", variant="primary")
            prediction_output = gr.Markdown("", label="Prediction Result")
        with gr.Column(scale=1):
            gr.Markdown("### 💬 Chat with Assistant")
            chatbox = gr.Chatbot(label="Conversation", height=400)
            user_msg = gr.Textbox(label="Your Message", placeholder="Ask about the patient...", interactive=False)
            send_btn = gr.Button("Send", interactive=False)
    predict_btn.click(
        generate_prediction,
        inputs=form_inputs,
        outputs=[patient_json_state, prediction_output, user_msg, send_btn]
    )
    user_msg.submit(
        user_send,
        inputs=[user_msg, chatbox, patient_json_state],
        outputs=[chatbox, user_msg]
    ).then(
        bot_respond,
        inputs=[chatbox, patient_json_state],
        outputs=chatbox
    )
    send_btn.click(
        user_send,
        inputs=[user_msg, chatbox, patient_json_state],
        outputs=[chatbox, user_msg]
    ).then(
        bot_respond,
        inputs=[chatbox, patient_json_state],
        outputs=chatbox
    )

if __name__ == "__main__":
    app.launch()
