# Mind Bloom - System Architecture Documentation

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Diagram](#architecture-diagram)
4. [Data Flow](#data-flow)
5. [Component Details](#component-details)
6. [File Structure](#file-structure)
7. [Stack Justification](#stack-justification)
8. [Viva/Presentation Guide](#vivapresentation-guide)

---

## 🎯 System Overview

**Mind Bloom** is a web-based Postpartum Depression (PPD) Risk Assessment Platform designed specifically for Bangladeshi mothers. It uses machine learning to predict PPD risk levels (Low, Medium, High) based on survey responses, providing explainable AI insights through SHAP (SHapley Additive exPlanations).

### Core Capabilities:
- **Risk Assessment**: ML-powered PPD risk prediction from ~20 questionnaire items
- **Explainable AI**: SHAP-based feature importance visualization
- **User Authentication**: Role-based access (Admin/User)
- **Data Collection**: Logging predictions for incremental learning
- **Automated Retraining**: Scheduled model updates with new data

---

## 🛠️ Technology Stack

### Stack Summary Table

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Frontend** | Next.js | 16.0.8 | React-based SSR framework |
| | React | 19.2.1 | UI component library |
| | TypeScript | 5.x | Type-safe JavaScript |
| | Tailwind CSS | 4.1.17 | Utility-first styling |
| **Backend** | FastAPI | Latest | Python async REST API |
| | Uvicorn | Latest | ASGI server |
| | Pydantic | Latest | Data validation |
| **ML/AI** | scikit-learn | 1.8.0 | ML model training/inference |
| | SHAP | Latest | Model explainability |
| | pandas/numpy | Latest | Data processing |
| | joblib | Latest | Model serialization |
| **Database** | SQLite | 3.x | Relational data storage |
| | CSV Files | - | Prediction logging |
| **Scheduler** | APScheduler | 3.10.4 | Background task scheduling |

---

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                    CLIENT LAYER                                  │
│                              (Browser - Client-Side)                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│   │   Home      │  │ Assessment  │  │   Report    │  │   Login     │            │
│   │   Page      │  │    Page     │  │    Page     │  │    Page     │            │
│   │  page.tsx   │  │  page.tsx   │  │  page.tsx   │  │  page.tsx   │            │
│   └─────────────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘            │
│                           │                │                │                    │
│                           │   localStorage │                │                    │
│                           │  (SHAP cache)  │                │                    │
│                           └────────┬───────┘                │                    │
│                                    │                        │                    │
└────────────────────────────────────┼────────────────────────┼────────────────────┘
                                     │ HTTP/REST              │
                                     │ (JSON)                 │
┌────────────────────────────────────┼────────────────────────┼────────────────────┐
│                                    ▼                        ▼                    │
│                               API LAYER (FastAPI - Server-Side)                  │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌──────────────────────────────────────────────────────────────────────────┐  │
│   │                           main.py (FastAPI App)                          │  │
│   ├──────────────────────────────────────────────────────────────────────────┤  │
│   │                                                                          │  │
│   │  ENDPOINTS:                                                              │  │
│   │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐       │  │
│   │  │ /predict-minimal │  │ /auth/login      │  │ /statistics      │       │  │
│   │  │ /batch-assess    │  │ /auth/register   │  │ /aggregate-shap  │       │  │
│   │  │ /feedback        │  │ /auth/change-pwd │  │ /recent-preds    │       │  │
│   │  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘       │  │
│   │           │                     │                     │                  │  │
│   └───────────┼─────────────────────┼─────────────────────┼──────────────────┘  │
│               │                     │                     │                      │
│               ▼                     ▼                     ▼                      │
│   ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐           │
│   │ feature_derivation│  │    database.py    │  │  data_collector   │           │
│   │      .py          │  │   (SQLite ORM)    │  │      .py          │           │
│   └─────────┬─────────┘  └─────────┬─────────┘  └─────────┬─────────┘           │
│             │                      │                      │                      │
└─────────────┼──────────────────────┼──────────────────────┼──────────────────────┘
              │                      │                      │
              ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            ML & DATA LAYER (Server-Side)                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐ │
│   │   model.joblib      │    │   shap_explainer    │    │   scheduler.py      │ │
│   │   (VotingClassifier)│    │       .py           │    │   (APScheduler)     │ │
│   │                     │    │                     │    │                     │ │
│   │  • Logistic Reg     │    │  • TreeExplainer    │    │  • Daily follow-ups │ │
│   │  • Random Forest    │◄───┤  • Feature ranking  │    │  • Weekly retrain   │ │
│   │  • XGB/GradBoost    │    │  • Risk factors     │    │  • Data quality     │ │
│   │  • SVM (RBF)        │    │                     │    │                     │ │
│   └─────────────────────┘    └─────────────────────┘    └──────────┬──────────┘ │
│                                                                    │             │
│   ┌────────────────────────────────────────────────────────────────┼───────────┐│
│   │                      STORAGE LAYER                             │           ││
│   │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │           ││
│   │  │ mindbloom.db    │  │predictions_log  │  │ PPD_dataset_v2  │ │           ││
│   │  │    (SQLite)     │  │    .csv         │  │     .csv        │ │           ││
│   │  │                 │  │                 │  │                 │ │           ││
│   │  │ • users         │  │ • All predictions│  │ • Training data │◄┘           ││
│   │  │ • predictions   │  │ • Timestamps    │  │ • 500+ samples  │             ││
│   │  │ • feedback      │  │ • For retraining│  │ • 53 features   │             ││
│   │  │ • follow_ups    │  │                 │  │                 │             ││
│   │  └─────────────────┘  └─────────────────┘  └─────────────────┘             ││
│   └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow

### User Assessment Flow (UI → Model → Result → Storage)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         COMPLETE DATA FLOW                                    │
└──────────────────────────────────────────────────────────────────────────────┘

STEP 1: User Input (Client-Side)
─────────────────────────────────
┌─────────────┐
│ Assessment  │  User fills ~20 questions:
│   Form      │  • Demographics (age, education)
│  (React)    │  • Pregnancy history
│             │  • PHQ-9 mental health scores
└──────┬──────┘  • Support & relationships
       │
       │ onClick: submitPrediction()
       ▼
STEP 2: API Request (Client → Server)
──────────────────────────────────────
┌─────────────┐
│   fetch()   │  POST /predict-minimal
│   to API    │  Content-Type: application/json
│             │  Body: { age: 25, phq9_score: 5, ... }
└──────┬──────┘
       │
       │ HTTP Request
       ▼
STEP 3: Feature Derivation (Server-Side)
────────────────────────────────────────
┌─────────────────────┐
│ feature_derivation  │  18-22 inputs → 53 features
│       .py           │  
│                     │  • Label encoding
│                     │  • PHQ-9 categorization
│                     │  • Computed features
└──────────┬──────────┘
           │
           │ pd.DataFrame (53 columns)
           ▼
STEP 4: ML Prediction (Server-Side)
───────────────────────────────────
┌─────────────────────┐
│   model.joblib      │  VotingClassifier.predict_proba()
│   (Ensemble)        │  
│                     │  Returns: {
│                     │    prob_high: 0.15,
│                     │    prob_medium: 0.25,
│                     │    prob_low: 0.60
│                     │  }
└──────────┬──────────┘
           │
           ▼
STEP 5: SHAP Explanation (Server-Side)
──────────────────────────────────────
┌─────────────────────┐
│  shap_explainer.py  │  TreeExplainer.shap_values()
│                     │  
│                     │  Returns: {
│                     │    top_features: [...],
│                     │    risk_factors: {...},
│                     │    base_value: 0.33
│                     │  }
└──────────┬──────────┘
           │
           ▼
STEP 6: Data Logging (Server-Side)
──────────────────────────────────
┌─────────────────────┐
│  data_collector.py  │  Appends to predictions_log.csv
│                     │  
│  database.py        │  Saves to SQLite (predictions table)
└──────────┬──────────┘
           │
           ▼
STEP 7: API Response (Server → Client)
──────────────────────────────────────
┌─────────────────────┐
│   JSON Response     │  {
│                     │    risk_level: "Low",
│                     │    probabilities: {...},
│                     │    shap_explanation: {...},
│                     │    features_computed: 53
│                     │  }
└──────────┬──────────┘
           │
           │ HTTP Response
           ▼
STEP 8: Display & Cache (Client-Side)
─────────────────────────────────────
┌─────────────────────┐
│  Assessment Page    │  • Display risk level badge
│  (React State)      │  • Show probabilities
│                     │  • Cache SHAP to localStorage
│                     │
│  localStorage       │  latestShapExplanation = {...}
└─────────────────────┘
           │
           │ User navigates
           ▼
STEP 9: Report Page (Client-Side)
─────────────────────────────────
┌─────────────────────┐
│   Report Page       │  • Reads localStorage SHAP
│                     │  • Fetches /aggregate-shap
│                     │  • Displays XAI insights
└─────────────────────┘
```

---

## 📁 File Structure

### Backend (`mindBloom/backend/`)

| File | Purpose | Layer |
|------|---------|-------|
| `main.py` | FastAPI application, all REST endpoints | API |
| `database.py` | SQLite ORM, user/prediction/feedback tables | Database |
| `feature_derivation.py` | Converts 20 inputs → 53 model features | ML |
| `shap_explainer.py` | SHAP TreeExplainer for model interpretability | ML |
| `data_collector.py` | Logs predictions to CSV for retraining | Data |
| `scheduler.py` | APScheduler for background tasks | Infrastructure |
| `create_ensemble_model.py` | Creates VotingClassifier from training data | ML (Offline) |
| `retrain_model.py` | Incremental model retraining script | ML (Offline) |
| `admin_dashboard.py` | HTML admin dashboard generator | UI |
| `model.joblib` | Serialized ensemble model (runtime) | ML |
| `mindbloom.db` | SQLite database file | Database |
| `PPD_dataset_v2.csv` | Original training dataset | Data |
| `collected_data/predictions_log.csv` | Runtime prediction logs | Data |

### Frontend (`mindBloom/frontend/app/`)

| File/Folder | Purpose | Type |
|-------------|---------|------|
| `page.tsx` | Home page (landing) | Page |
| `layout.tsx` | Root layout with NavBar | Layout |
| `globals.css` | Global styles + animations | Styles |
| `assessment/page.tsx` | Multi-step assessment form | Page |
| `report/page.tsx` | SHAP visualization & statistics | Page |
| `login/page.tsx` | Authentication (login/signup) | Page |
| `about/page.tsx` | Information about PPD | Page |
| `admin/page.tsx` | Admin dashboard | Page |
| `components/NavBar.tsx` | Navigation bar component | Component |
| `components/SakuraLogo.tsx` | Animated logo component | Component |

---

## 🔐 Client-Side vs Server-Side

| Aspect | Client-Side (Browser) | Server-Side (Backend) |
|--------|----------------------|----------------------|
| **Rendering** | React components | FastAPI responses |
| **State** | React useState, localStorage | SQLite, CSV files |
| **Computation** | Form validation, UI logic | ML inference, SHAP |
| **Security** | Auth tokens in localStorage | Password hashing, role checks |
| **Data** | Cached SHAP explanation | All predictions, user data |

---

## 💡 Stack Justification

### Why This Architecture Makes Sense

**1. Next.js + React Frontend**
- **Server-Side Rendering (SSR)**: Better SEO and initial load performance
- **TypeScript**: Type safety reduces runtime errors
- **Tailwind CSS**: Rapid UI development with utility classes
- **Modern React 19**: Latest features like concurrent rendering

**2. FastAPI Backend**
- **Async by default**: High-performance API for ML inference
- **Automatic OpenAPI docs**: Self-documenting API at `/docs`
- **Pydantic validation**: Strong request/response typing
- **Python ecosystem**: Native scikit-learn/SHAP integration

**3. Ensemble ML Model**
- **VotingClassifier**: Combines multiple algorithms for robustness
- **Soft voting**: Probability-weighted predictions
- **4 base models**: Logistic Regression, Random Forest, XGBoost/GradientBoosting, SVM
- **Balanced class weights**: Handles imbalanced PPD data

**4. SHAP for Explainability**
- **Clinical requirement**: Healthcare AI must be interpretable
- **TreeExplainer**: Fast computation for tree-based models
- **Feature ranking**: Shows which factors drive predictions

**5. SQLite + CSV Hybrid Storage**
- **SQLite**: Structured data (users, predictions, feedback)
- **CSV**: Simple logging for retraining pipeline
- **No external DB needed**: Self-contained deployment

**6. APScheduler**
- **Background tasks**: Non-blocking follow-ups and retraining
- **Configurable**: Daily, weekly, or manual schedules
- **Persistent**: Survives server restarts

---

## 🎤 Viva/Presentation Guide

### Key Points to Explain

#### 1. "What is Mind Bloom?"
> "Mind Bloom is a web-based Postpartum Depression risk assessment platform. It uses machine learning to predict PPD risk levels from a questionnaire, specifically designed for Bangladeshi mothers. The system provides explainable AI insights so users understand why they received a particular risk assessment."

#### 2. "Explain the tech stack"
> "The frontend uses Next.js 16 with React 19 and TypeScript for type-safe, server-rendered pages. Tailwind CSS handles styling. The backend is Python FastAPI, which is ideal for ML serving due to its async performance. The ML model is a scikit-learn VotingClassifier ensemble. We use SQLite for user data and CSV files for prediction logging."

#### 3. "How does the ML model work?"
> "The model is a weighted soft-voting ensemble of four classifiers: Logistic Regression (25%), Random Forest (25%), XGBoost/GradientBoosting (35%), and SVM with RBF kernel (15%). It was trained on the PPD dataset with 53 features and predicts three risk levels: Low, Medium, and High with associated probabilities."

#### 4. "What is SHAP and why use it?"
> "SHAP stands for SHapley Additive exPlanations. In healthcare AI, model interpretability is crucial - doctors and patients need to understand WHY a prediction was made. SHAP provides feature importance scores showing which questionnaire responses most influenced the risk assessment, like 'PHQ-9 score contributed 21% to risk increase'."

#### 5. "Explain the data flow"
> "User fills a 20-question form on the frontend. The data is sent via REST API to FastAPI. The backend derives 53 features from the 20 inputs using label encoding and computed fields. The model predicts probabilities, SHAP generates explanations, and everything is logged to SQLite and CSV. The response returns to the frontend where it's displayed and cached in localStorage."

#### 6. "How do you handle authentication?"
> "Users register with username/password stored as SHA-256 hashes in SQLite. Admins are pre-seeded with hardcoded credentials. The frontend stores auth state in localStorage and includes role information. Admin-only features like the test prefill button check the role before rendering."

#### 7. "What about incremental learning?"
> "Every prediction is logged to predictions_log.csv with all features and outcomes. APScheduler can trigger weekly model retraining using retrain_model.py, which merges new data with the original training set. This allows the model to improve over time with real-world data."

### Architecture Diagram for Slides

```
┌────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                           │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │      Next.js 16 + React 19 + TypeScript + Tailwind       │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐ │ │
│  │  │  Home   │ │ Assess  │ │ Report  │ │ Login/Admin     │ │ │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────────────┘ │ │
│  └──────────────────────────────────────────────────────────┘ │
└───────────────────────────┬────────────────────────────────────┘
                            │ REST API (JSON)
                            ▼
┌────────────────────────────────────────────────────────────────┐
│                     FASTAPI SERVER                              │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  /predict-minimal  │  /auth/*  │  /aggregate-shap         │ │
│  └───────────────────────────────────────────────────────────┘ │
│                            │                                    │
│            ┌───────────────┼───────────────┐                   │
│            ▼               ▼               ▼                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Ensemble  │  │    SHAP     │  │  SQLite DB  │            │
│  │   Model     │  │  Explainer  │  │  + CSV Log  │            │
│  │  (.joblib)  │  │  (Tree)     │  │             │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└────────────────────────────────────────────────────────────────┘
```

---

## 📊 Quick Reference

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/predict-minimal` | POST | Single prediction with SHAP |
| `/batch-assess` | POST | CSV batch predictions |
| `/statistics` | GET | Dashboard statistics |
| `/aggregate-shap` | GET | Aggregate SHAP analysis |
| `/auth/login` | POST | User authentication |
| `/auth/register` | POST | User registration |
| `/auth/change-password` | POST | Password update |
| `/feedback` | POST | User feedback on prediction |

### Model Features (53 total)

- **Input Features**: Age, Education, Family Type, PHQ-9 scores, etc.
- **Derived Features**: PHQ-9 categories (Minimal, Mild, Moderate, Severe)
- **Encoded Categoricals**: Label-encoded strings to integers

### Risk Levels

| Level | Probability Threshold | Clinical Action |
|-------|----------------------|-----------------|
| **High** | prob_high > 0.5 | Immediate professional consultation |
| **Medium** | prob_medium > 0.5 | Monitoring recommended |
| **Low** | prob_low > 0.5 | General wellness advice |

---

*Document generated for Mind Bloom PPD Risk Assessment Platform*
*Last updated: December 2024*

