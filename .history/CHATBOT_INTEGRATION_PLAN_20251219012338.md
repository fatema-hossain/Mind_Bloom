# 🤖 Chatbot Integration Plan - Mind Bloom

## Executive Summary

This document outlines a **safe, non-destructive integration** of the AI chatbot from the ISHMUM folder into the existing Mind Bloom project.

**Source:** `ISHMUMMind_Bloom-AI_assistance_For_Postpartum_Depression-main/`  
**Target:** `mindBloom/` (existing project)

---

## 📊 Pre-Integration Analysis

### Files Identified for Integration

| Category | Source File | Purpose | Action |
|----------|-------------|---------|--------|
| **Backend (Chat)** | `api.py` (lines 326-352) | `/chat` endpoint for AI conversations | Extract & add to `main.py` |
| **Frontend (Chat UI)** | `frontend/app/chatbot/page.tsx` | Chat interface component | Copy to `frontend/app/chatbot/` |
| **Model** | `rf_model.pkl` | Random Forest model | **SKIP** - use existing `model.joblib` |
| **Gradio App** | `merged_chatbot.py` | Standalone Gradio UI | **SKIP** - not needed |

### Dependencies Comparison

| Dependency | ISHMUM Project | Mind Bloom | Action |
|------------|----------------|------------|--------|
| fastapi | ✅ | ✅ | Already present |
| uvicorn | ✅ | ✅ | Already present |
| pandas | ✅ | ✅ | Already present |
| numpy | ✅ | ✅ | Already present |
| joblib | ✅ | ✅ | Already present |
| scikit-learn | ✅ | ✅ | Already present |
| **requests** | ✅ | ❌ | **ADD** |
| **python-dotenv** | ✅ | ❌ | **ADD** |
| shap | ❌ | ✅ | Already present |
| apscheduler | ❌ | ✅ | Already present |

---

## 🗂️ File Mapping Table

### What Gets Added (New Files)

| Source | Destination | Notes |
|--------|-------------|-------|
| `frontend/app/chatbot/page.tsx` | `mindBloom/frontend/app/chatbot/page.tsx` | New chatbot page |

### What Gets Modified (Additive Only)

| File | Modification Type | What's Added |
|------|-------------------|--------------|
| `mindBloom/backend/main.py` | Add endpoint | `/chat` endpoint (~30 lines) |
| `mindBloom/backend/requirements.txt` | Add dependencies | `requests`, `python-dotenv` |
| `mindBloom/frontend/app/components/NavBar.tsx` | Add nav link | Chatbot navigation link |

### What Stays Untouched ✅

| File/Folder | Status |
|-------------|--------|
| `mindBloom/backend/database.py` | ✅ No changes |
| `mindBloom/backend/shap_explainer.py` | ✅ No changes |
| `mindBloom/backend/feature_derivation.py` | ✅ No changes |
| `mindBloom/backend/scheduler.py` | ✅ No changes |
| `mindBloom/backend/model.joblib` | ✅ No changes |
| `mindBloom/backend/mindbloom.db` | ✅ No changes |
| `mindBloom/frontend/app/assessment/page.tsx` | ✅ No changes |
| `mindBloom/frontend/app/report/page.tsx` | ✅ No changes |
| `mindBloom/frontend/app/login/page.tsx` | ✅ No changes |
| All existing routes and logic | ✅ No changes |

---

## 🔧 Step-by-Step Integration

### Step 1: Backup Current Project

```bash
# Create a backup before any changes
cd D:\CSE445\Mind_Bloom
xcopy mindBloom mindBloom_backup /E /I /H
```

### Step 2: Add Backend Dependencies

**File:** `mindBloom/backend/requirements.txt`

Add these lines at the end (DO NOT replace):

```txt
# Chatbot dependencies (added for AI assistant)
requests
python-dotenv
```

### Step 3: Create Environment Variables

**File:** `mindBloom/backend/.env` (create new file)

```env
# OpenRouter API for chatbot
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

> ⚠️ **Important:** Get an API key from [OpenRouter.ai](https://openrouter.ai)

### Step 4: Add Chat Endpoint to Backend

**File:** `mindBloom/backend/main.py`

Add this code block at the end of the file, BEFORE the closing `if __name__ == "__main__":` block (if it exists):

```python
# ============================================================================
# CHATBOT INTEGRATION - AI Mental Health Assistant
# ============================================================================

import requests
from dotenv import load_dotenv

# Load environment variables for chatbot
load_dotenv()
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_MODEL = "mistralai/mixtral-8x22b-instruct"


class ChatMessage(BaseModel):
    """Single chat message."""
    role: str
    content: str


class ChatRequest(BaseModel):
    """Chat request with patient context."""
    patient_json: Dict[str, Any]
    messages: List[ChatMessage]
    max_tokens: Optional[int] = 300


class ChatResponse(BaseModel):
    """Chat response from AI."""
    response: str
    timestamp: str


def query_openrouter(messages: List[Dict], max_tokens: int = 300, retries: int = 3) -> str:
    """
    Query OpenRouter API for AI responses.
    Uses Mixtral-8x22b model for empathetic mental health support.
    """
    if not OPENROUTER_API_KEY:
        return "Chatbot is not configured. Please set OPENROUTER_API_KEY in environment."
    
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost",
        "X-Title": "Mind Bloom Chatbot"
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
                import time
                time.sleep(1.5)
                continue
            return "I'm having trouble connecting right now. Please try again."
        except Exception as e:
            return f"Error connecting to AI service: {str(e)}"
    return "Unable to process your request."


@app.post("/chat", response_model=ChatResponse)
def chat_with_assistant(request: ChatRequest):
    """
    Chat with AI mental health assistant.
    
    Uses patient assessment data to provide context-aware,
    empathetic responses about PPD risk and support.
    """
    try:
        if not request.patient_json:
            raise HTTPException(status_code=400, detail="Patient data is required for chat context")
        
        # Build system prompt with patient context
        system_msg = (
            "You are a compassionate mental health assistant for Mind Bloom, "
            "a Postpartum Depression (PPD) risk assessment platform. "
            "Use ONLY the provided patient assessment data to inform your responses:\n\n"
            f"{json.dumps(request.patient_json, indent=2)}\n\n"
            "Guidelines:\n"
            "- Be empathetic, supportive, and non-judgmental\n"
            "- Do NOT invent or assume information not in the data\n"
            "- Encourage professional help for high-risk assessments\n"
            "- Provide practical coping suggestions when appropriate\n"
            "- Always prioritize the patient's safety and wellbeing"
        )
        
        messages = [{"role": "system", "content": system_msg}]
        
        # Add conversation history
        for msg in request.messages:
            messages.append({"role": msg.role, "content": msg.content})
        
        # Get AI response
        bot_reply = query_openrouter(messages, max_tokens=request.max_tokens)
        
        return ChatResponse(
            response=bot_reply,
            timestamp=datetime.now().isoformat()
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### Step 5: Create Chatbot Frontend Page

**Create folder:** `mindBloom/frontend/app/chatbot/`

**Create file:** `mindBloom/frontend/app/chatbot/page.tsx`

```tsx
"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatbotPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [patientData, setPatientData] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with patient data from URL params
  useEffect(() => {
    const dataParam = searchParams.get("data");
    if (dataParam) {
      try {
        const decoded = JSON.parse(decodeURIComponent(dataParam));
        setPatientData(decoded);
        setMessages([
          {
            role: "assistant",
            content: `Hello! I'm the Mind Bloom assistant. I've reviewed your assessment results showing a ${decoded.risk_level || decoded.prediction || "completed"} risk level. I'm here to help you understand the results and answer any questions you may have. How can I support you today?`
          }
        ]);
      } catch (e) {
        console.error("Failed to parse patient data:", e);
        setMessages([
          {
            role: "assistant",
            content: "Hello! I'm the Mind Bloom assistant. I couldn't load your assessment data. Please complete an assessment first, or feel free to ask general questions about postpartum depression."
          }
        ]);
      }
    } else {
      // No data provided - allow general chat
      setMessages([
        {
          role: "assistant",
          content: "Hello! I'm the Mind Bloom mental health assistant. I'm here to help answer questions about postpartum depression and provide support. For personalized insights, please complete an assessment first. How can I help you today?"
        }
      ]);
    }
  }, [searchParams]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_json: patientData || { note: "No assessment data available" },
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
          max_tokens: 400
        })
      });

      const data = await response.json();
      
      if (data.response) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
      } else if (data.detail) {
        setMessages((prev) => [...prev, { role: "assistant", content: `Sorry, there was an error: ${data.detail}` }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: "I'm sorry, I couldn't process that request. Please try again." }]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [...prev, { role: "assistant", content: "I'm having trouble connecting to the server. Please check if the backend is running and try again." }]);
    }

    setLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Background effects (matching Mind Bloom style)
  const [fireflies, setFireflies] = useState<Array<{id: number; left: string; top: string; delay: string; duration: string; size: string}>>([]);
  const [stars, setStars] = useState<Array<{id: number; left: string; top: string; delay: string; duration: string}>>([]);

  useEffect(() => {
    setFireflies(Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 8}s`,
      duration: `${6 + Math.random() * 4}s`,
      size: `${3 + Math.random() * 3}px`,
    })));

    setStars(Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 4}s`,
      duration: `${3 + Math.random() * 3}s`,
    })));
  }, []);

  return (
    <main className="min-h-screen flex flex-col text-slate-800 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #b8d8f0 0%, #c8c8f5 50%, #f0c8e8 100%)' }}>
      {/* Background Effects */}
      <div className="fireflies-container" aria-hidden="true">
        {fireflies.map((f) => (
          <div
            key={`firefly-${f.id}`}
            className="firefly"
            style={{
              left: f.left,
              top: f.top,
              animationDelay: f.delay,
              animationDuration: f.duration,
              width: f.size,
              height: f.size,
            }}
          />
        ))}
        {stars.map((s) => (
          <div
            key={`star-${s.id}`}
            className="star"
            style={{
              left: s.left,
              top: s.top,
              animationDelay: s.delay,
              animationDuration: s.duration,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col max-w-5xl mx-auto w-full p-4 sm:p-6">
        {/* Header */}
        <div className="mb-4 p-4 sm:p-6 bg-gradient-to-br from-blue-100/90 via-purple-50/80 to-pink-100/90 backdrop-blur-2xl border border-blue-200/60 shadow-2xl rounded-3xl">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-pink-100 flex items-center justify-center border-2 border-blue-300 text-2xl">
                💬
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black" style={{ 
                  fontFamily: 'sans-serif',
                  letterSpacing: '0.05em',
                  backgroundImage: 'linear-gradient(180deg, #d896e8 0%, #ff69d9 50%, #4d0048 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  MIND BLOOM ASSISTANT
                </h1>
                <p className="text-xs sm:text-sm text-slate-600">AI-Powered Mental Health Support</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                href="/assessment"
                className="px-3 py-2 bg-purple-100 hover:bg-purple-200 rounded-xl border-2 border-purple-300 hover:border-purple-400 transition-all duration-300 font-medium text-purple-700 text-sm"
              >
                ← Assessment
              </Link>
              <Link
                href="/"
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl border-2 border-slate-300 hover:border-slate-400 transition-all duration-300 font-medium text-slate-700 text-sm"
              >
                Home
              </Link>
            </div>
          </div>
          
          {/* Patient Context Badge */}
          {patientData && (
            <div className="mt-3 px-3 py-2 bg-green-50 border border-green-200 rounded-xl inline-flex items-center gap-2 text-green-700 text-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Assessment data loaded - {patientData.risk_level || patientData.prediction || "Personalized"} context active
            </div>
          )}
        </div>

        {/* Chat Container */}
        <div className="flex-1 flex flex-col bg-gradient-to-br from-blue-50/80 via-purple-50/70 to-pink-50/80 backdrop-blur-2xl border border-purple-200/60 shadow-2xl rounded-3xl p-4 sm:p-6 min-h-0">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-3 pr-2">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] p-3 sm:p-4 rounded-2xl shadow-md ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-white"
                      : "bg-gradient-to-br from-white/95 to-blue-50/95 text-slate-800 border border-blue-200"
                  }`}
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-100 to-pink-100 flex items-center justify-center flex-shrink-0 border border-blue-300 text-sm">
                        🌸
                      </div>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Loading indicator */}
            {loading && (
              <div className="flex justify-start animate-in fade-in duration-200">
                <div className="p-4 rounded-2xl shadow-md bg-gradient-to-br from-white/95 to-blue-50/95 border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-pink-100 flex items-center justify-center border border-blue-300">
                      🌸
                    </div>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                      <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="flex gap-2 sm:gap-3 items-end">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your assessment, PPD symptoms, coping strategies..."
              className="flex-1 min-h-[50px] max-h-28 px-3 sm:px-4 py-3 border-2 border-purple-300 rounded-2xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-200 transition-all duration-300 bg-white/90 text-slate-900 placeholder-slate-500 resize-none text-sm"
              rows={1}
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-white font-bold rounded-2xl hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 min-h-[50px] flex items-center gap-1 sm:gap-2 text-sm"
            >
              {loading ? (
                <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
              ) : (
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-3 text-center text-xs text-slate-600 px-4">
          <p>This AI assistant provides general support and information. For medical emergencies or crisis situations, please contact a healthcare professional or emergency services immediately.</p>
        </div>
      </div>
    </main>
  );
}
```

### Step 6: Update NavBar to Include Chatbot Link

**File:** `mindBloom/frontend/app/components/NavBar.tsx`

Find the navigation items array/section and add:

```tsx
// Add to your nav links array (around line 170-180 or where other links are defined)
{ name: "Chatbot", href: "/chatbot" },
```

Or add this link in the navigation menu JSX:

```tsx
<Link
  href="/chatbot"
  className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-300 ${
    isActive("/chatbot")
      ? "bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-2 border-purple-300 text-purple-900"
      : "text-slate-600 hover:text-purple-600 hover:bg-purple-50 border-2 border-transparent hover:border-purple-200"
  }`}
>
  Chatbot
</Link>
```

### Step 7: Add "Chat with Assistant" Button to Assessment Results

**File:** `mindBloom/frontend/app/assessment/page.tsx`

After a successful prediction is displayed, add a button to navigate to chatbot. Find where the prediction result is shown and add:

```tsx
{/* After showing prediction result */}
{prediction && (
  <button
    onClick={() => {
      const chatData = {
        risk_level: prediction.risk_level,
        probabilities: prediction.probabilities,
        shap_explanation: prediction.shap_explanation,
        timestamp: new Date().toISOString()
      };
      window.location.href = `/chatbot?data=${encodeURIComponent(JSON.stringify(chatData))}`;
    }}
    className="mt-4 w-full py-3 px-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-white font-bold rounded-2xl hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
  >
    <span>💬</span>
    Chat with Assistant
  </button>
)}
```

---

## 📦 Integration Summary

### New Files Created
```
mindBloom/
├── backend/
│   └── .env                          # NEW (API keys)
└── frontend/
    └── app/
        └── chatbot/
            └── page.tsx              # NEW (Chatbot UI)
```

### Files Modified (Additive Only)
```
mindBloom/
├── backend/
│   ├── main.py                       # +60 lines (chat endpoint)
│   └── requirements.txt              # +2 lines (dependencies)
└── frontend/
    └── app/
        ├── components/
        │   └── NavBar.tsx            # +1 nav link
        └── assessment/
            └── page.tsx              # +10 lines (chat button)
```

---

## ✅ Testing Instructions

### 1. Install New Dependencies

```bash
cd D:\CSE445\Mind_Bloom\mindBloom\backend
pip install requests python-dotenv
```

### 2. Set Up Environment Variables

Create `D:\CSE445\Mind_Bloom\mindBloom\backend\.env`:
```env
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxx
```

### 3. Restart Backend

```bash
cd D:\CSE445\Mind_Bloom\mindBloom\backend
uvicorn main:app --reload --port 8000
```

### 4. Test Chat Endpoint

```bash
curl -X POST http://localhost:8000/chat ^
  -H "Content-Type: application/json" ^
  -d "{\"patient_json\": {\"risk_level\": \"Medium\"}, \"messages\": [{\"role\": \"user\", \"content\": \"Hello\"}]}"
```

### 5. Test Frontend

1. Open `http://localhost:3000`
2. Complete an assessment
3. Click "Chat with Assistant" button
4. Verify chatbot responds

---

## 🔄 Rollback Plan

### If Integration Fails

1. **Restore Backend:**
```bash
cd D:\CSE445\Mind_Bloom\mindBloom\backend
# Remove added code from main.py (the CHATBOT INTEGRATION section)
# Restore original requirements.txt (remove requests, python-dotenv)
```

2. **Restore Frontend:**
```bash
cd D:\CSE445\Mind_Bloom\mindBloom\frontend
rm -r app/chatbot  # Remove chatbot folder
# Revert NavBar.tsx changes
# Revert assessment/page.tsx changes
```

3. **Use Full Backup:**
```bash
cd D:\CSE445\Mind_Bloom
rm -r mindBloom
mv mindBloom_backup mindBloom
```

---

## ⚠️ Important Notes

1. **API Key Required:** The chatbot requires an OpenRouter API key to function. Without it, the chat will return an error message.

2. **No Model Conflict:** The chatbot uses the existing Mind Bloom model for context - it does NOT replace or interfere with the existing `model.joblib`.

3. **Graceful Degradation:** If the chat service is unavailable, the rest of the app continues to work normally.

4. **Existing Features Preserved:** All current functionality (assessment, login, report, SHAP) remains unchanged.

---

## 📊 Integration Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          INTEGRATED MIND BLOOM ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   FRONTEND (Next.js)                                                            │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│   │   Home   │ │Assessment│ │  Report  │ │  Login   │ │ CHATBOT  │ ◄── NEW     │
│   └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘             │
│        │            │            │            │            │                     │
│        └────────────┴────────────┴────────────┴────────────┘                     │
│                                  │                                               │
│                                  ▼                                               │
│   BACKEND (FastAPI)                                                             │
│   ┌──────────────────────────────────────────────────────────────────────────┐  │
│   │  /predict-minimal  │  /auth/*  │  /aggregate-shap  │  /chat  ◄── NEW     │  │
│   └──────────────────────────────────────────────────────────────────────────┘  │
│              │                │                │                │                │
│              ▼                ▼                ▼                ▼                │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│   │   Ensemble  │  │   SQLite    │  │    SHAP     │  │ OpenRouter  │ ◄── NEW   │
│   │   Model     │  │   Database  │  │  Explainer  │  │  (Mixtral)  │           │
│   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘           │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

*Integration plan created for Mind Bloom PPD Risk Assessment Platform*
*Safe, additive integration - no existing functionality affected*

