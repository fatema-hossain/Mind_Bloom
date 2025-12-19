# Mind Bloom - System Architecture Documentation

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [File-to-Stack Mapping](#file-to-stack-mapping)
4. [Model Training Pipeline](#model-training-pipeline)
5. [Architecture Diagram](#architecture-diagram)
6. [Data Flow](#data-flow)
7. [Component Details](#component-details)
8. [File Structure](#file-structure)
9. [Stack Justification](#stack-justification)
10. [Viva/Presentation Guide](#vivapresentation-guide)

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

## 📂 File-to-Stack Mapping

### Backend Files - Technology Usage

| File | Primary Stack | Libraries Used | Purpose |
|------|---------------|----------------|---------|
| `main.py` | **FastAPI + Python** | `fastapi`, `pydantic`, `joblib`, `pandas` | REST API server, endpoint routing, model loading |
| `llm_adapter.py` | **Python + Strategy Pattern** | `requests`, `abc`, `dataclasses` | Model-agnostic LLM provider adapter system |
| `fallback_chatbot.py` | **scikit-learn + Python** | `sklearn.TfidfVectorizer`, `cosine_similarity` | Rule-based fallback chatbot (TF-IDF + FAQ) |
| `database.py` | **SQLite + Python** | `sqlite3`, `json`, `datetime` | Database ORM, user auth, prediction storage |
| `feature_derivation.py` | **NumPy + Python** | `numpy`, `typing` | Label encoding, feature computation (20→53) |
| `shap_explainer.py` | **SHAP + scikit-learn** | `shap`, `numpy`, `pandas` | TreeExplainer, feature importance calculation |
| `data_collector.py` | **CSV + Python** | `csv`, `json`, `pathlib` | Prediction logging to CSV files |
| `scheduler.py` | **APScheduler** | `apscheduler`, `subprocess`, `logging` | Background job scheduling (retraining, follow-ups) |
| `create_ensemble_model.py` | **scikit-learn** | `sklearn`, `joblib`, `pandas`, `xgboost` | Offline model creation from notebook |
| `retrain_model.py` | **scikit-learn** | `sklearn`, `joblib`, `pandas`, `argparse` | Incremental model retraining script |
| `admin_dashboard.py` | **HTML + Python** | `string.Template` | HTML dashboard generator |
| `model.joblib` | **joblib (Binary)** | Serialized `VotingClassifier` | Runtime ML model artifact |
| `mindbloom.db` | **SQLite (Binary)** | Database file | User, prediction, feedback tables |
| `PPD_dataset_v2.csv` | **CSV (Data)** | Raw training data | 500+ samples, 53 features |
| `predictions_log.csv` | **CSV (Data)** | Runtime logs | All predictions for retraining |

### Frontend Files - Technology Usage

| File | Primary Stack | Libraries/Features Used | Purpose |
|------|---------------|------------------------|---------|
| `layout.tsx` | **Next.js + React** | `next/font`, React components | Root layout, NavBar wrapper |
| `page.tsx` (Home) | **React + TypeScript** | `useState`, `useEffect`, CSS animations | Landing page with fireflies effect |
| `assessment/page.tsx` | **React + TypeScript** | `useState`, `useRef`, `fetch` API | Multi-step form, API calls, SHAP caching |
| `report/page.tsx` | **React + TypeScript** | `useState`, `useEffect`, `localStorage` | SHAP visualization, statistics display |
| `login/page.tsx` | **React + TypeScript** | `useState`, `fetch`, `useRouter` | Auth forms, localStorage session |
| `chatbot/page.tsx` | **React + TypeScript** | `useState`, `useRef`, `fetch`, `useSearchParams` | AI chatbot interface, conversation history |
| `admin/llm-settings/page.tsx` | **React + TypeScript** | `useState`, `useEffect`, `fetch` | Admin LLM provider configuration UI |
| `about/page.tsx` | **React + TypeScript** | Static content, CSS animations | PPD information page |
| `admin/page.tsx` | **React + TypeScript** | `useState`, `fetch` | Admin dashboard, retraining controls |
| `components/NavBar.tsx` | **React + TypeScript** | `useState`, `useEffect`, `usePathname` | Navigation, auth state, responsive menu |
| `components/SakuraLogo.tsx` | **React + SVG** | Inline SVG animation | Animated sakura logo |
| `globals.css` | **Tailwind CSS** | `@tailwind`, custom animations | Global styles, keyframes |
| `tailwind.config.js` | **Tailwind Config** | Theme configuration | Color palette, extensions |
| `package.json` | **npm** | Dependencies manifest | Next.js 16, React 19, Tailwind 4 |
| `tsconfig.json` | **TypeScript** | Compiler configuration | Strict mode, path aliases |

### Configuration Files

| File | Format | Purpose |
|------|--------|---------|
| `requirements.txt` | pip | Python backend dependencies |
| `package.json` | npm | Node.js frontend dependencies |
| `next.config.ts` | TypeScript | Next.js build configuration |
| `postcss.config.mjs` | ESM JavaScript | PostCSS/Tailwind processing |
| `eslint.config.mjs` | ESM JavaScript | Code linting rules |

---

## 🧪 Model Training Pipeline

### Source Notebooks (Model Development)

The ML model deployed in this application was developed through Jupyter notebooks. Here is the notebook lineage:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        MODEL TRAINING NOTEBOOK PIPELINE                          │
└─────────────────────────────────────────────────────────────────────────────────┘

AUTHORITATIVE NOTEBOOK (Final Model):
─────────────────────────────────────
📓 mindBloom/version-abrar-grp-assign (Update with ensemble model) - ABRARCopy.ipynb

This notebook contains:
├── Data Loading & Exploration (PPD_dataset_v2.csv)
├── Feature Engineering & Label Encoding  
├── Train/Test Split (80/20 stratified)
├── Individual Model Training:
│   ├── Logistic Regression (C=1.5, balanced)
│   ├── Random Forest (n_estimators=350, max_depth=12)
│   ├── XGBoost/GradientBoosting (n_estimators=350, lr=0.05)
│   └── SVM RBF (C=2.0, balanced)
├── Ensemble VotingClassifier Creation
│   └── Weights: LR=0.25, RF=0.25, XGB=0.35, SVM=0.15
├── Model Evaluation (Accuracy, Classification Report)
└── Model Export Preparation

OTHER NOTEBOOK VERSIONS:
────────────────────────
📓 mindBloom/VERSION_Abrar_Grp_Assign.ipynb
   └── Earlier version, data exploration focus

📓 mindBloom/version-abrar-grp-assign (Update with ensemble model)(1).ipynb
   └── Intermediate version with ensemble experiments
```

### Model Creation Script

The notebook outputs are converted to a deployable model using:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│   📄 backend/create_ensemble_model.py                                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   INPUTS:                                                                        │
│   ├── PPD_dataset_v2.csv (local dataset)                                        │
│   └── OR notebook output files (if available):                                  │
│       ├── X_train_processed.csv                                                 │
│       ├── X_test_processed.csv                                                  │
│       ├── y_train_processed.csv                                                 │
│       ├── y_test_processed.csv                                                  │
│       └── le.pkl (LabelEncoder)                                                 │
│                                                                                  │
│   PROCESS:                                                                       │
│   1. Load training data                                                          │
│   2. Create 4 base classifiers with notebook hyperparameters                    │
│   3. Create VotingClassifier(voting='soft', weights=[0.25,0.25,0.35,0.15])     │
│   4. Fit ensemble on training data                                              │
│   5. Validate on test set                                                        │
│   6. Save to model.joblib                                                        │
│                                                                                  │
│   OUTPUT:                                                                        │
│   └── 📦 model.joblib (~15-50 MB serialized VotingClassifier)                  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Runtime Model Loading

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         DEPLOYMENT FLOW                                          │
└─────────────────────────────────────────────────────────────────────────────────┘

OFFLINE (Development):
──────────────────────
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Jupyter         │     │ create_ensemble  │     │   model.joblib   │
│  Notebook        │────►│   _model.py      │────►│   (Serialized)   │
│  (.ipynb)        │     │                  │     │                  │
└──────────────────┘     └──────────────────┘     └────────┬─────────┘
                                                           │
                                                           │ Committed to repo
                                                           ▼
RUNTIME (Production):
─────────────────────
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   main.py        │     │   model.joblib   │     │   FastAPI        │
│   (on startup)   │────►│  joblib.load()   │────►│   Endpoints      │
│                  │     │                  │     │  /predict-*      │
└──────────────────┘     └──────────────────┘     └──────────────────┘

                         Code in main.py (lines 59-65):
                         ┌─────────────────────────────────────────────┐
                         │ MODEL_PATH = os.getenv("MODEL_PATH",        │
                         │                        "model.joblib")      │
                         │ model = joblib.load(MODEL_PATH)             │
                         │ print(f"[STARTUP] Model loaded: {MODEL_PATH}")│
                         └─────────────────────────────────────────────┘
```

### Model Specifications

| Attribute | Value |
|-----------|-------|
| **Model Type** | `sklearn.ensemble.VotingClassifier` |
| **Voting Strategy** | Soft (probability-weighted) |
| **Number of Base Models** | 4 |
| **Base Model 1** | Logistic Regression (weight: 0.25) |
| **Base Model 2** | Random Forest (weight: 0.25) |
| **Base Model 3** | XGBoost/GradientBoosting (weight: 0.35) |
| **Base Model 4** | SVM RBF Kernel (weight: 0.15) |
| **Input Features** | 53 (derived from ~20 user inputs) |
| **Output Classes** | 3 (High, Medium, Low risk) |
| **Training Data** | PPD_dataset_v2.csv (~500 samples) |
| **Serialization** | joblib (compressed pickle) |
| **File Size** | ~15-50 MB |

### Retraining Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      INCREMENTAL LEARNING PIPELINE                               │
└─────────────────────────────────────────────────────────────────────────────────┘

DATA SOURCES:
─────────────
┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐
│ Original Training │  │ predictions_log   │  │ Google Form       │
│ PPD_dataset_v2    │  │     .csv          │  │   Exports         │
│    .csv           │  │ (runtime logs)    │  │   (optional)      │
└─────────┬─────────┘  └─────────┬─────────┘  └─────────┬─────────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                                 ▼
                    ┌───────────────────────┐
                    │  retrain_model.py     │
                    │  OR                   │
                    │  retrain_model_v2.py  │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │ model_backups/        │  (old model saved)
                    │   model_YYYYMMDD.joblib│
                    └───────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │ model.joblib          │  (new model deployed)
                    │   (updated)           │
                    └───────────────────────┘

TRIGGER OPTIONS:
────────────────
• Manual: python retrain_model.py
• Scheduled: APScheduler (weekly via scheduler.py)
• API: POST /admin/retrain-now
```

---

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                    CLIENT LAYER                                  │
│                              (Browser - Client-Side)                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐│
│   │   Home      │  │ Assessment  │  │   Report    │  │   Login     │  │ Chatbot ││
│   │   Page      │  │    Page     │  │    Page     │  │    Page     │  │  Page   ││
│   │  page.tsx   │  │  page.tsx   │  │  page.tsx   │  │  page.tsx   │  │page.tsx ││
│   └─────────────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └────┬────┘│
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
| `/chat` | POST | AI chatbot (model-agnostic: LLM or fallback) |
| `/chat/status` | GET | Get current chatbot provider status |
| `/admin/llm/configure` | POST | Configure LLM provider (admin only) |
| `/admin/llm/test` | POST | Test LLM connection |

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

