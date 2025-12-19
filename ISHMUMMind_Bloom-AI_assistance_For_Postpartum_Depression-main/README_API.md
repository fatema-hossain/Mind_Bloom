# EPDS Prediction & Chatbot API

FastAPI backend for EPDS prediction and mental health chatbot.

## Installation

```bash
pip install fastapi uvicorn joblib numpy pandas requests pydantic
```

## Run Server

```bash
python api.py
```

Or with uvicorn:

```bash
uvicorn api:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

### 1. Get Features
**GET** `/features`

Returns available feature groups and options.

**Response:**
```json
{
  "numeric_features": ["age", "number_of_the_latest_pregnancy", "phq9_score"],
  "categorical_groups": {
    "addiction": {
      "options": ["none", "alcohol", "drugs"],
      "multi_select": true
    }
  }
}
```

### 2. Generate Prediction
**POST** `/predict`

Generate EPDS risk prediction.

**Request Body:**
```json
{
  "age": 28,
  "number_of_the_latest_pregnancy": 1,
  "phq9_score": 12,
  "categorical_features": {
    "addiction": ["none"],
    "disease_before_pregnancy": ["diabetes"],
    "recieved_support": ["family", "friends"],
    "education_level": "bachelor"
  }
}
```

**Response:**
```json
{
  "epds_prediction": "medium",
  "numeric_prediction": 2,
  "user_inputs": {...},
  "timestamp": "20241214_153045"
}
```

### 3. Chat with Assistant
**POST** `/chat`

Chat with the mental health assistant about a patient.

**Request Body:**
```json
{
  "patient_json": {
    "user_inputs": {...},
    "epds_prediction": "medium",
    "numeric_prediction": 2
  },
  "messages": [
    {"role": "user", "content": "What should I do about this patient?"}
  ],
  "max_tokens": 300
}
```

**Response:**
```json
{
  "response": "Based on the moderate risk...",
  "timestamp": "2024-12-14T15:30:45.123456"
}
```

## Frontend Integration Example

### JavaScript/React

```javascript
// 1. Generate Prediction
async function generatePrediction(formData) {
  const response = await fetch('http://localhost:8000/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      age: formData.age,
      number_of_the_latest_pregnancy: formData.pregnancies,
      phq9_score: formData.phq9,
      categorical_features: {
        addiction: formData.addiction,
        disease_before_pregnancy: formData.diseases,
        // ... other categorical features
      }
    })
  });
  return await response.json();
}

// 2. Chat with Assistant
async function sendChatMessage(patientJson, messages) {
  const response = await fetch('http://localhost:8000/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patient_json: patientJson,
      messages: messages,
      max_tokens: 300
    })
  });
  return await response.json();
}

// Usage Example
const prediction = await generatePrediction({
  age: 28,
  pregnancies: 1,
  phq9: 12,
  addiction: ['none'],
  diseases: ['diabetes']
});

const chatResponse = await sendChatMessage(
  prediction,
  [{ role: 'user', content: 'What should I do?' }]
);
```

### Python Client

```python
import requests

# 1. Generate Prediction
response = requests.post('http://localhost:8000/predict', json={
    "age": 28,
    "number_of_the_latest_pregnancy": 1,
    "phq9_score": 12,
    "categorical_features": {
        "addiction": ["none"],
        "disease_before_pregnancy": ["diabetes"]
    }
})
prediction = response.json()

# 2. Chat
response = requests.post('http://localhost:8000/chat', json={
    "patient_json": prediction,
    "messages": [
        {"role": "user", "content": "What should I do?"}
    ]
})
chat_response = response.json()
print(chat_response['response'])
```

## CORS

CORS is enabled for all origins. For production, update:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend-domain.com"],
    ...
)
```

## Notes

- Predictions are logged to `json_logs/` directory
- OpenRouter API key is configured in the code
- Default port: 8000
- Interactive docs: http://localhost:8000/docs
