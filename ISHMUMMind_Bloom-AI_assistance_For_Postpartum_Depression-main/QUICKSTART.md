# Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Start the Backend API
```bash
python api.py
```
✅ API running at `http://localhost:8000`

### Step 2: Start the Frontend
```bash
cd frontend
npm install    # First time only
npm run dev
```
✅ Frontend running at `http://localhost:3000`

### Step 3: Use the Application
1. Open browser to `http://localhost:3000`
2. Fill out the EPDS assessment form (4 steps)
3. Click "Predict Risk Level"
4. View your results
5. Click "Chat with Assistant" to ask questions

## 📋 Requirements

- Python 3.8+
- Node.js 16+
- Dependencies:
  ```bash
  # Backend
  pip install fastapi uvicorn joblib numpy pandas requests pydantic
  
  # Frontend (auto-installed with npm install)
  ```

## 🎯 What You Get

### 1. EPDS Risk Assessment
- Multi-step form with validation
- AI-powered risk prediction
- Probability distribution
- Professional results display

### 2. AI Mental Health Chatbot
- Context-aware conversations
- Empathetic responses
- Based on your assessment
- Powered by Mixtral-8x22b

## 🔧 Configuration

### Optional: Change API URL
Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

## 📱 Features

- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Real-time validation
- ✅ Animated UI with firefly effects
- ✅ Accessibility compliant
- ✅ Secure data handling
- ✅ Professional medical-grade interface

## 🆘 Quick Troubleshooting

**Backend won't start?**
```bash
pip install fastapi uvicorn joblib numpy pandas requests pydantic
python api.py
```

**Frontend won't start?**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

**Can't connect to API?**
- Check backend is running on port 8000
- Check `NEXT_PUBLIC_API_BASE_URL` in `.env.local`

## 📚 More Information

- Full documentation: `INTEGRATION_GUIDE.md`
- Changes made: `CHANGES_SUMMARY.md`
- API docs: `http://localhost:8000/docs` (when running)

## 🎨 Design

The application features:
- Mind Bloom branding
- Gradient color scheme (blue → purple → pink)
- Smooth animations
- Firefly and star background effects
- Professional medical interface

## 🔒 Security

- API keys stored in backend only
- Patient data never leaves your session
- Local logging only
- CORS configured for development

## ✨ That's It!

You're ready to use the EPDS Prediction & Chatbot system!

For detailed information, see `INTEGRATION_GUIDE.md`
