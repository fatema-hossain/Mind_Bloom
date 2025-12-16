"""
Automated Scheduler for Follow-ups & Retraining
===============================================
Runs background tasks:
1. Check for due follow-ups daily
2. Auto-retrain model weekly with new feedback data
3. Monitor data quality

Usage in main.py:
    from scheduler import start_scheduler
    
    @app.on_event("startup")
    async def startup():
        start_scheduler()
"""

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime
import logging
import subprocess
from pathlib import Path
import json

from database import get_pending_follow_ups, export_for_retraining, get_statistics

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BACKEND_DIR = Path(__file__).parent


def send_follow_up_reminders():
    """Send follow-up reminders to users."""
    logger.info("🔔 Checking for due follow-ups...")
    
    try:
        pending = get_pending_follow_ups()
        logger.info(f"Found {len(pending)} pending follow-ups")
        
        for followup in pending:
            session_id = followup['session_id']
            method = followup['follow_up_method']
            
            if method == "email":
                send_email_reminder(session_id, followup)
            elif method == "sms":
                send_sms_reminder(session_id, followup)
            
            logger.info(f"✅ Reminder sent for session {session_id}")
    except Exception as e:
        logger. error(f"Error in send_follow_up_reminders: {e}")


def send_email_reminder(session_id: str, followup: dict):
    """
    Send email reminder (using free services).
    For production: use Mailgun FREE tier (free for 1000 emails/month)
    Or use SMTP with Gmail (needs 2FA app password - still free)
    """
    logger.info(f"📧 Email reminder scheduled for session {session_id}")
    # TODO: Integrate with free email service (Mailgun, SendGrid, etc.)


def send_sms_reminder(session_id: str, followup: dict):
    """
    Send SMS reminder (using free services).
    For production: use Twilio free trial or Vonage SMS free credits
    """
    logger.info(f"📱 SMS reminder scheduled for session {session_id}")
    # TODO: Integrate with free SMS service (Twilio, Vonage, etc.)


def retrain_model_batch():
    """
    Weekly batch retraining with new feedback data.
    Uses existing retrain_model.py
    """
    logger.info("🔄 Starting weekly model retraining...")
    
    try:
        # Export new labeled data
        csv_path = BACKEND_DIR / "retraining_data.csv"
        success = export_for_retraining(str(csv_path))
        
        if not success:
            logger.warning("⚠️  No new feedback data available for retraining")
            return
        
        # Run retraining script if it exists
        retrain_script = BACKEND_DIR / "retrain_model_v2.py"
        if retrain_script.exists():
            result = subprocess.run(
                ["python", str(retrain_script)],
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout
            )
            
            if result.returncode == 0:
                logger.info("✅ Model retraining successful!")
                logger.info(result.stdout)
            else:
                logger.error("❌ Model retraining failed!")
                logger.error(result.stderr)
        else:
            logger.warning(f"⚠️  retrain_model_v2.py not found at {retrain_script}")
    
    except Exception as e:
        logger.error(f"❌ Retraining error: {e}")


def monitor_data_quality():
    """Monitor for data drift and quality issues."""
    logger.info("📊 Checking data quality...")
    
    try:
        stats = get_statistics()
        
        logger.info(f"📈 Predictions: {stats['total_predictions']}, "
                   f"Feedback: {stats['total_feedback']}, "
                   f"Rate: {stats['feedback_rate']}%")
        
        if stats['feedback_rate'] < 10 and stats['total_predictions'] > 5:
            logger.warning("⚠️  Low feedback rate! Consider more follow-up outreach.")
        
        if stats['total_feedback'] >= 20:
            logger.info("✅ Enough labeled data for model retraining!")
    
    except Exception as e: 
        logger.error(f"Error in monitor_data_quality: {e}")


def start_scheduler():
    """Start the background scheduler."""
    scheduler = BackgroundScheduler()
    
    # Daily follow-up check (at 8 AM)
    scheduler.add_job(
        send_follow_up_reminders,
        CronTrigger(hour=8, minute=0),
        id='daily_followups',
        name='Daily Follow-up Reminders',
        replace_existing=True
    )
    
    # Weekly retraining (Sundays at 2 AM)
    scheduler.add_job(
        retrain_model_batch,
        CronTrigger(day_of_week=6, hour=2, minute=0),
        id='weekly_retrain',
        name='Weekly Model Retraining',
        replace_existing=True
    )
    
    # Daily data quality check (at 9 AM)
    scheduler.add_job(
        monitor_data_quality,
        CronTrigger(hour=9, minute=0),
        id='daily_quality_check',
        name='Data Quality Monitor',
        replace_existing=True
    )
    
    scheduler.start()
    logger.info("✅ Background scheduler started!")
    logger.info("   📅 Daily follow-ups: 8:00 AM")
    logger.info("   📊 Data quality check: 9:00 AM")
    logger.info("   🔄 Weekly retraining: Sundays at 2:00 AM")
    
    return scheduler


if __name__ == "__main__": 
    # For testing
    logger.info("Testing scheduler functions...")
    monitor_data_quality()
    logger.info("Test complete!")