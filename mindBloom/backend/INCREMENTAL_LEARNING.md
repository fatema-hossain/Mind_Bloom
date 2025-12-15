# Incremental Learning Pipeline for PPD Risk Assessment

## 🏥 Part 1: Validating the Model for Real-Life Use

### Is This Model Ready for Real Clinical Use?

**Current Status: SCREENING TOOL ONLY** ⚠️

This model should be used as a **preliminary screening tool**, not a diagnostic instrument.

### What Makes a Healthcare ML Model Trustworthy?

| Criterion | Your Model | Status |
|-----------|------------|--------|
| **Internal Validation** | 83.33% accuracy on test set | ✅ Good |
| **High-Risk Recall** | 90% (catches most true positives) | ✅ Good |
| **Calibration** | Probabilities match actual frequencies | ✅ Done in notebook |
| **Explainability** | SHAP values show feature importance | ✅ Done in notebook |
| **External Validation** | Tested on different population | ❌ Needed |
| **Clinical Expert Review** | Psychiatrist validated predictions | ❌ Needed |
| **Prospective Study** | Real-world deployment monitoring | ❌ Needed |

### Required Steps Before Clinical Deployment

1. **Get IRB Approval** (Institutional Review Board)
2. **Clinical Expert Validation**
   - Have psychiatrists review 50-100 predictions
   - Calculate inter-rater reliability
3. **External Validation Dataset**
   - Test on data from different hospital/region
   - Check for demographic bias
4. **Prospective Study**
   - Deploy in controlled setting
   - Compare predictions to clinical outcomes
5. **Add Appropriate Disclaimers**
   - "This is a screening tool, not a diagnosis"
   - "Consult a healthcare professional"

### Key Metrics to Monitor

```python
# These should be tracked post-deployment:
- Sensitivity (True Positive Rate): Currently 90% for high-risk
- Specificity (True Negative Rate): Currently ~85%
- PPV (Positive Predictive Value): What % of "high risk" are truly high risk?
- NPV (Negative Predictive Value): What % of "low risk" are truly low risk?
- Calibration: Do 70% probability predictions happen 70% of the time?
```

---

## 🔄 Part 2: Incremental Learning Pipeline

### Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                     DATA SOURCES                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │ Frontend    │    │ Google Form │    │ Clinical Partners   │  │
│  │ (Live Use)  │    │ (Surveys)   │    │ (Validated Data)    │  │
│  └──────┬──────┘    └──────┬──────┘    └──────────┬──────────┘  │
│         │                  │                      │              │
│         ▼                  ▼                      ▼              │
│  predictions_log.csv    form_export.csv     clinical_data.csv   │
│         │                  │                      │              │
│         └──────────────────┼──────────────────────┘              │
│                            │                                     │
│                            ▼                                     │
│                   ┌────────────────┐                            │
│                   │ user_feedback  │  ← CRITICAL: Need labels!  │
│                   │    .csv        │                            │
│                   └────────┬───────┘                            │
│                            │                                     │
└────────────────────────────┼─────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ retrain_model  │
                    │    .py         │
                    └────────┬───────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ model.joblib   │
                    │  (Updated)     │
                    └────────────────┘
```

### ⚠️ Critical: You Need LABELED Data

**Incremental learning requires GROUND TRUTH (actual outcomes)!**

Your predictions are NOT labels. You need:
- Clinical follow-up (EPDS score after 6 weeks)
- Psychiatrist diagnosis
- User self-report of outcome

Without labels, you're just collecting data, not learning.

---

## 📊 How to Use the Pipeline

### 1. Automatic Data Collection (Already Enabled)

Every prediction is logged to:
```
mindBloom/backend/collected_data/predictions_log.csv
```

### 2. Collecting Feedback (Labels)

**Option A: API Endpoint**
```bash
curl -X POST http://localhost:8000/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "user_session_123",
    "actual_outcome": "high",
    "feedback_notes": "Clinically diagnosed with PPD"
  }'
```

**Option B: Manual CSV Import**
Create `collected_data/user_feedback.csv`:
```csv
session_id,actual_outcome,feedback_notes
user_123,high,Diagnosed by psychiatrist
user_456,low,6-week follow-up normal
```

### 3. Google Form Integration

1. Create Google Form matching your input fields
2. Export responses as CSV
3. Run retraining:

```bash
cd mindBloom/backend
python retrain_model.py --google-form "path/to/google_form_export.csv"
```

### 4. Retrain the Model

```bash
# With all available data
python retrain_model.py

# With Google Form data
python retrain_model.py --google-form "path/to/form.csv"

# Without feedback (only new raw data)
python retrain_model.py --no-feedback
```

### 5. Restart Backend

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

## 📈 Monitoring Data Collection

**Check stats via API:**
```bash
curl http://localhost:8000/data-stats
```

**Response:**
```json
{
  "predictions_logged": 150,
  "feedback_received": 45,
  "new_training_samples": 45
}
```

---

## 🔐 Privacy Considerations

1. **No PII Collected** - Only answers and predictions, no names
2. **Session IDs** - Randomized, not linked to identity
3. **Data Retention** - Define policy for how long to keep
4. **Consent** - Inform users data is used for improvement

---

## 📁 File Structure

```
mindBloom/backend/
├── main.py                    # FastAPI app
├── model.joblib               # Current model
├── create_ensemble_model.py   # Initial model creation
├── retrain_model.py           # Incremental learning script
├── data_collector.py          # Data collection module
├── collected_data/            # Data storage
│   ├── predictions_log.csv    # All predictions
│   ├── user_feedback.csv      # Labels for retraining
│   └── new_training_data.csv  # Merged external data
└── model_backups/             # Previous model versions
```

---

## ⏰ Recommended Retraining Schedule

| Data Volume | Frequency |
|-------------|-----------|
| < 100 new labeled samples | Don't retrain yet |
| 100-500 samples | Monthly |
| 500-1000 samples | Bi-weekly |
| > 1000 samples | Weekly |

**Always validate after retraining:**
- Compare new model accuracy to old
- Check for performance regression on specific subgroups
- Review prediction distribution changes

---

## 🚨 When NOT to Retrain

- When you don't have enough labeled data (< 50 samples)
- When labels are unreliable or inconsistent
- During active clinical study (maintain consistency)
- Without validation set performance check

