1. database.py 📁
What it does: Saves user predictions to a file on your computer
Example:
User fills PPD form → Prediction made → Saved to database
6 weeks later → User tells us if they actually had PPD → Saved to database
2. scheduler.py ⏰
What it does: Runs automatic tasks on a schedule
Tasks:
Every day at 8 AM: Send reminders to users
Every day at 9 AM: Check data quality
Every Sunday at 2 AM: Retrain the model
3. admin_dashboard.py 📊
What it does: Shows you a pretty webpage with statistics
Example: When you visit http://localhost:8000/admin/dashboard, you see:
How many predictions made?
How many feedback responses?
Is model ready to retrain?
4. retrain_model_v2.py 🤖
What it does: Updates your ML model with new data
Example:
Collects all user feedback from database
Trains model with old + new data
Saves improved model

The Data Flow - Step by Step
┌─────────────────────────────────────────┐
│ USER VISITS YOUR WEBSITE                │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ USER FILLS PPD QUESTIONNAIRE            │
│ (Age, symptoms, family history, etc)    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ YOUR ML MODEL PREDICTS:                  │
│ "This person has HIGH risk of PPD"      │
│ (Confidence: 87%)                       │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ database.py SAVES THIS:                  │
│ - User answers                          │
│ - Prediction (high/medium/low)          │
│ - Session ID (unique ID for this user)  │
│ - Timestamp                             │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ SYSTEM GENERATES:                       │
│ Follow-up reminder in 6 weeks           │
│ (When baby is ~6 weeks old)             │
└──────────────┬──────────────────────────┘
               │
               ▼
        ⏰ 6 WEEKS PASS ⏰
               │
               ▼
┌─────────────────────────────────────────┐
│ scheduler.py SENDS REMINDER:            │
│ "Hi, please tell us if you got PPD"     │
│ (Email or SMS)                          │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ USER RESPONDS WITH ACTUAL OUTCOME:      │
│ "Yes, I was diagnosed with PPD"         │
│ OR "No, I did not have PPD"             │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ database.py SAVES FEEDBACK:             │
│ Session ID → Actual outcome             │
│ (Now we know: prediction was correct!)  │
└──────────────┬──────────────────────────┘
               │
               ▼
      📊 EVERY SUNDAY AT 2 AM 📊
               │
               ▼
┌─────────────────────────────────────────┐
│ retrain_model_v2.py RUNS AUTOMATICALLY: │
│ "We have 20+ new feedback samples"      │
│ "Let me retrain the model..."           │
│ "Old model accuracy: 83%"               │
│ "New model accuracy: 85%"  ← Better!    │
│ "Saving new model..."                   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ admin_dashboard.py SHOWS:               │
│ - 150 predictions made                  │
│ - 45 users gave feedback                │
│ - 30% feedback rate                     │
│ - Ready to retrain! ✅                  │
│ - Model improved by 2% ✅               │
└──────────────┬──────────────────────────┘
               │
               ▼
        🎉 MODEL IMPROVED! 🎉

        What Happens in Your Computer
When the server is running, here's what's happening:
mindBloom/backend/
├── main.py (running)
│   ├── Receives prediction requests from frontend
│   ├── Uses model.joblib to make predictions
│   └── Calls database.py to save data
│
├── database.py (listening)
│   ├── Stores predictions in mindbloom. db file
│   └── Stores feedback in mindbloom.db file
│
├── scheduler.py (running in background)
│   ├── Every day 8 AM: Checks for follow-ups
│   ├── Every day 9 AM: Monitors data quality
│   └── Every Sunday 2 AM: Runs retrain_model_v2.py
│
└── mindbloom.db (database file)
    ├── predictions table (stores user inputs + predictions)
    └── feedback table (stores actual outcomes)


    Real Example - What Happens
Day 1 - Monday
User: "I'm a 28-year-old mother, worried about PPD"
System: "Based on your answers, you have HIGH risk"
Database: ✅ Saved prediction #1

User: "I'm 32 years old, feeling good"
System: "You have LOW risk"
Database: ✅ Saved prediction #2

... (repeat for many users)

Dashboard shows: 50 predictions made, 0 feedback yet

Day 42 - Saturday (6 weeks later)
Scheduler: "Time to follow up with prediction #1 user"
Sends: "Hi, did you get PPD diagnosis?"
User replies: "Yes, I was diagnosed"
Database: ✅ Saved feedback for prediction #1

User replies: "No, I'm fine"
Database: ✅ Saved feedback for prediction #2

Dashboard shows: 50 predictions, 20 feedback responses, 40% feedback rate

Day 49 - Sunday at 2 AM
retrain_model_v2.py automatically starts:
- Loads 50 original training samples
- Adds 20 new feedback samples = 70 total
- Trains new model with all 70 samples
- Tests new model: 86% accuracy (was 83%)
- Saves new model as model.joblib
- Backs up old model

Next prediction uses NEW improved model! ✅
Day 50 - Monday
Dashboard shows: 
- ✅ Model retrained successfully
- ✅ Accuracy improved: 83% → 86%
- ✅ 20+ new users now use better model

------------------------------------------------------------------------------------------------------------------
Q: What is happening? A: You built an intelligent system that:

Makes predictions
Saves them
Asks for feedback later
Learns from feedback
Gets better over time
Q: Why do I need all 4 files? A:

database.py = Memory (stores data)
scheduler.py = Assistant (runs tasks automatically)
admin_dashboard.py = Report card (shows progress)
retrain_model_v2.py = Teacher (makes model smarter)
Q: What happens when I run the backend? A:

FastAPI starts on port 8000
Database opens and is ready
Scheduler wakes up and waits for scheduled times
Dashboard is ready to view
Model is loaded and ready to predict
Q: When does retraining happen? A: Only when:

20+ users gave feedback
Sunday at 2 AM comes around
retrain_model_v2.py runs automatically

