# EPDS Prediction & Chatbot Integration Guide

## Overview
This project integrates a FastAPI backend with a Next.js frontend for EPDS (Edinburgh Postnatal Depression Scale) risk assessment and an AI-powered mental health chatbot.

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│                 │         │                  │         │                 │
│  Next.js        │────────▶│  FastAPI         │────────▶│  OpenRouter     │
│  Frontend       │         │  Backend         │         │  (Mixtral AI)   │
│                 │◀────────│                  │◀────────│                 │
└─────────────────┘         └──────────────────┘         └─────────────────┘
     │                             │
     │                             │
     ▼                             ▼
┌─────────────────┐         ┌──────────────────┐
│  User fills     │         │  ML Model        │
│  EPDS form      │         │  (rf_model.pkl)  │
└─────────────────┘         └──────────────────┘
```

## Setup Instructions

### 1. Backend Setup (FastAPI)

```bash
# Install dependencies
pip install fastapi uvicorn joblib numpy pandas requests pydantic

# Run the API server
python api.py
```

The API will be available at `http://localhost:8000`

**API Endpoints:**
- `GET /` - API information
- `GET /features` - Get all available form features
- `POST /predict` - Full prediction with all 159 features
- `POST /predict-minimal` - Minimal prediction (used by frontend)
- `POST /chat` - Chat with AI assistant

### 2. Frontend Setup (Next.js)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

### 3. Environment Configuration

Create a `.env.local` file in the `frontend` directory:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

## Features

### 1. EPDS Risk Assessment
- **Multi-step form** with 4 main sections:
  - Demographics
  - Pregnancy History
  - Mental Health (PHQ-9)
  - Support & Relationships
- **Real-time validation** and progress tracking
- **AI-powered prediction** using Random Forest model
- **Risk level classification**: Low, Medium, High
- **Probability distribution** for all risk levels

### 2. AI Chatbot
- **Context-aware conversations** based on patient assessment
- **Empathetic responses** using Mixtral-8x22b model
- **Real-time chat interface** with message history
- **Secure data handling** - patient data never leaves the session

### 3. Design Features
- **Responsive design** - works on mobile, tablet, and desktop
- **Animated UI** with firefly and star background effects
- **Accessibility compliant** with ARIA labels and keyboard navigation
- **Gradient color scheme** matching the Mind Bloom brand

## User Flow

1. **Assessment Phase**
   - User fills out the EPDS form (4 steps)
   - Form validates inputs in real-time
   - User reviews all inputs before submission

2. **Prediction Phase**
   - Backend processes form data
   - ML model generates risk prediction
   - Results displayed with probabilities

3. **Chatbot Phase**
   - User clicks "Chat with Assistant"
   - Redirected to chatbot page with patient data
   - Can ask questions about the assessment
   - AI provides context-aware responses

## API Request/Response Examples

### Prediction Request
```json
POST /predict-minimal
{
  "age": 28,
  "number_of_pregnancies": 1,
  "phq9_score": 12,
  "education_level": "university",
  "family_type": "nuclear",
  "pregnancy_length": "10 months",
  "relationship_husband": "good",
  "family_support": "high",
  ...
}
```

### Prediction Response
```json
{
  "prediction": "medium",
  "risk_level": "Medium Risk",
  "probabilities": {
    "high": 0.15,
    "low": 0.35,
    "medium": 0.50
  },
  "accuracy": "94.2%",
  "patient_data": { ... }
}
```

### Chat Request
```json
POST /chat
{
  "patient_json": {
    "epds_prediction": "medium",
    "user_inputs": { ... }
  },
  "messages": [
    {"role": "user", "content": "What should I do about this assessment?"}
  ],
  "max_tokens": 300
}
```

### Chat Response
```json
{
  "response": "Based on the moderate risk assessment...",
  "timestamp": "2024-12-16T10:30:45.123456"
}
```

## File Structure

```
.
├── api.py                          # FastAPI backend
├── rf_model.pkl                    # Trained ML model
├── merged_chatbot.py               # Gradio version (reference)
├── frontend/
│   ├── app/
│   │   ├── page.tsx               # Main assessment page
│   │   ├── chatbot/
│   │   │   └── page.tsx           # Chatbot interface
│   │   ├── layout.tsx             # App layout
│   │   └── globals.css            # Global styles
│   ├── package.json
│   └── next.config.ts
└── json_logs/                      # Prediction logs (auto-created)
```

## Key Integration Points

### 1. Prediction Flow
```typescript
// Frontend sends minimal data
const response = await fetch(`${API_BASE_URL}/predict-minimal`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(formData)
});

// Backend processes and returns prediction
const data = await response.json();
// { prediction, risk_level, probabilities, patient_data }
```

### 2. Chatbot Flow
```typescript
// Frontend navigates with patient data
window.location.href = `/chatbot?data=${encodeURIComponent(JSON.stringify(patientData))}`;

// Chatbot page sends messages
const response = await fetch(`${API_BASE_URL}/chat`, {
  method: "POST",
  body: JSON.stringify({
    patient_json: patientData,
    messages: conversationHistory
  })
});
```

## Security Considerations

1. **API Keys**: OpenRouter API key is in the backend (not exposed to frontend)
2. **CORS**: Configured to allow frontend origin
3. **Data Privacy**: Patient data stored only in session, logged locally
4. **Input Validation**: Both frontend and backend validate inputs

## Troubleshooting

### Backend Issues
- **Port already in use**: Change port in `api.py` (default: 8000)
- **Model not found**: Ensure `rf_model.pkl` is in the root directory
- **API timeout**: Increase timeout in OpenRouter request (default: 45s)

### Frontend Issues
- **API connection failed**: Check `NEXT_PUBLIC_API_BASE_URL` in `.env.local`
- **Chatbot not loading**: Ensure patient data is passed in URL params
- **Build errors**: Run `npm install` to ensure all dependencies are installed

### Common Errors
```bash
# Backend: Module not found
pip install -r requirements.txt

# Frontend: Cannot find module
cd frontend && npm install

# CORS errors
# Ensure API is running and CORS is configured correctly in api.py
```

## Production Deployment

### Backend
```bash
# Use production ASGI server
uvicorn api:app --host 0.0.0.0 --port 8000 --workers 4
```

### Frontend
```bash
cd frontend
npm run build
npm start
```

### Environment Variables
```env
# Production
NEXT_PUBLIC_API_BASE_URL=https://your-api-domain.com
```

## Testing

### Test Prediction Endpoint
```bash
curl -X POST http://localhost:8000/predict-minimal \
  -H "Content-Type: application/json" \
  -d '{"age": 28, "number_of_pregnancies": 1, "phq9_score": 12}'
```

### Test Chat Endpoint
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "patient_json": {"epds_prediction": "medium"},
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

## Support

For issues or questions:
1. Check the logs in `json_logs/` directory
2. Review browser console for frontend errors
3. Check terminal output for backend errors
4. Ensure all dependencies are installed

## License

This project is for educational and research purposes.
