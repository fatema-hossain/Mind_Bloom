"""
Automated Scheduler for Follow-ups & Retraining
===============================================
Runs background tasks:
1. Check for due follow-ups daily
2. Auto-retrain model with configurable frequency
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
from typing import Optional

from database import get_pending_follow_ups, export_for_retraining, get_statistics

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BACKEND_DIR = Path(__file__).parent
CONFIG_FILE = BACKEND_DIR / "scheduler_config.json"

# Global scheduler instance
_scheduler: Optional[BackgroundScheduler] = None
_current_schedule = "weekly"  # Default schedule

def get_schedule_config():
    """Load schedule configuration from file."""
    global _current_schedule
    
    if CONFIG_FILE.exists():
        try:
            with open(CONFIG_FILE, "r") as f:
                config = json.load(f)
                _current_schedule = config.get("retrain_schedule", "weekly")
                return config
        except Exception as e:
            logger.error(f"Error loading config: {e}")
    
    return {
        "retrain_schedule": "weekly",
        "last_retrain": None,
        "last_updated": None
    }


def save_schedule_config(schedule: str):
    """Save schedule configuration to file."""
    global _current_schedule
    _current_schedule = schedule
    
    config = {
        "retrain_schedule": schedule,
        "last_retrain": None,
        "last_updated": datetime.now().isoformat()
    }
    
    try:
        with open(CONFIG_FILE, "w") as f:
            json.dump(config, f, indent=2)
        logger.info(f"[CONFIG] Schedule saved: {schedule}")
        return True
    except Exception as e:
        logger.error(f"Error saving config: {e}")
        return False


def update_retrain_schedule(schedule: str) -> dict:
    """
    Update the model retraining schedule.
    
    Args:
        schedule: One of "daily", "weekly", "manual"
    
    Returns:
        Dict with status and message
    """
    global _scheduler, _current_schedule
    
    if schedule not in ["daily", "weekly", "manual"]:
        return {"success": False, "error": "Invalid schedule. Use: daily, weekly, or manual"}
    
    try:
        # Save configuration
        save_schedule_config(schedule)
        
        # Update scheduler if it exists
        if _scheduler:
            # Remove existing retrain job
            try:
                _scheduler.remove_job('weekly_retrain')
            except:
                pass
            
            # Add new job based on schedule
            if schedule == "daily":
                _scheduler.add_job(
                    retrain_model_batch,
                    CronTrigger(hour=2, minute=0),
                    id='weekly_retrain',
                    name='Daily Model Retraining',
                    replace_existing=True
                )
                logger.info("[SCHEDULE] Retraining set to DAILY at 2:00 AM")
            elif schedule == "weekly":
                _scheduler.add_job(
                    retrain_model_batch,
                    CronTrigger(day_of_week=6, hour=2, minute=0),
                    id='weekly_retrain',
                    name='Weekly Model Retraining',
                    replace_existing=True
                )
                logger.info("[SCHEDULE] Retraining set to WEEKLY (Sundays at 2:00 AM)")
            elif schedule == "manual":
                logger.info("[SCHEDULE] Retraining set to MANUAL only")
        
        return {
            "success": True,
            "schedule": schedule,
            "message": f"Retrain schedule updated to: {schedule}"
        }
    
    except Exception as e:
        logger.error(f"Error updating schedule: {e}")
        return {"success": False, "error": str(e)}


def get_current_schedule() -> dict:
    """Get the current retrain schedule configuration."""
    config = get_schedule_config()
    return {
        "schedule": config.get("retrain_schedule", "weekly"),
        "last_retrain": config.get("last_retrain"),
        "last_updated": config.get("last_updated")
    }


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
            
            logger.info(f"[OK] Reminder sent for session {session_id}")
    except Exception as e:
        logger. error(f"Error in send_follow_up_reminders: {e}")


def send_email_reminder(session_id: str, followup: dict):
    """
    Send email reminder (using free services).
    For production: use Mailgun FREE tier (free for 1000 emails/month)
    Or use SMTP with Gmail (needs 2FA app password - still free)
    """
    logger.info(f"[EMAIL] Reminder scheduled for session {session_id}")
    # TODO: Integrate with free email service (Mailgun, SendGrid, etc.)


def send_sms_reminder(session_id: str, followup: dict):
    """
    Send SMS reminder (using free services).
    For production: use Twilio free trial or Vonage SMS free credits
    """
    logger.info(f"[SMS] Reminder scheduled for session {session_id}")
    # TODO: Integrate with free SMS service (Twilio, Vonage, etc.)


def retrain_model_batch():
    """
    Weekly batch retraining with new feedback data.
    Uses existing retrain_model.py
    """
    logger.info("[RETRAIN] Starting weekly model retraining...")
    
    try:
        # Export new labeled data
        csv_path = BACKEND_DIR / "retraining_data.csv"
        success = export_for_retraining(str(csv_path))
        
        if not success:
            logger.warning("[WARN] No new feedback data available for retraining")
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
                logger.info("[OK] Model retraining successful!")
                logger.info(result.stdout)
            else:
                logger.error("[ERROR] Model retraining failed!")
                logger.error(result.stderr)
        else:
            logger.warning(f"[WARN] retrain_model_v2.py not found at {retrain_script}")
    
    except Exception as e:
        logger.error(f"[ERROR] Retraining error: {e}")


def monitor_data_quality():
    """Monitor for data drift and quality issues."""
    logger.info("[QUALITY] Checking data quality...")
    
    try:
        stats = get_statistics()
        
        logger.info(f"[STATS] Predictions: {stats['total_predictions']}, "
                   f"Feedback: {stats['total_feedback']}, "
                   f"Rate: {stats['feedback_rate']}%")
        
        if stats['feedback_rate'] < 10 and stats['total_predictions'] > 5:
            logger.warning("[WARN] Low feedback rate! Consider more follow-up outreach.")
        
        if stats['total_feedback'] >= 20:
            logger.info("[OK] Enough labeled data for model retraining!")
    
    except Exception as e: 
        logger.error(f"Error in monitor_data_quality: {e}")


def start_scheduler():
    """Start the background scheduler."""
    global _scheduler
    
    _scheduler = BackgroundScheduler()
    
    # Load existing config
    config = get_schedule_config()
    schedule = config.get("retrain_schedule", "weekly")
    
    # Daily follow-up check (at 8 AM)
    _scheduler.add_job(
        send_follow_up_reminders,
        CronTrigger(hour=8, minute=0),
        id='daily_followups',
        name='Daily Follow-up Reminders',
        replace_existing=True
    )
    
    # Model retraining based on configured schedule
    if schedule == "daily":
        _scheduler.add_job(
            retrain_model_batch,
            CronTrigger(hour=2, minute=0),
            id='weekly_retrain',
            name='Daily Model Retraining',
            replace_existing=True
        )
        logger.info("   - Model retraining: DAILY at 2:00 AM")
    elif schedule == "weekly":
        _scheduler.add_job(
            retrain_model_batch,
            CronTrigger(day_of_week=6, hour=2, minute=0),
            id='weekly_retrain',
            name='Weekly Model Retraining',
            replace_existing=True
        )
        logger.info("   - Model retraining: WEEKLY (Sundays at 2:00 AM)")
    else:
        logger.info("   - Model retraining: MANUAL only")
    
    # Daily data quality check (at 9 AM)
    _scheduler.add_job(
        monitor_data_quality,
        CronTrigger(hour=9, minute=0),
        id='daily_quality_check',
        name='Data Quality Monitor',
        replace_existing=True
    )
    
    _scheduler.start()
    logger.info("[OK] Background scheduler started!")
    logger.info("   - Daily follow-ups: 8:00 AM")
    logger.info("   - Data quality check: 9:00 AM")
    
    return _scheduler


def trigger_manual_retrain() -> dict:
    """Manually trigger model retraining."""
    logger.info("[MANUAL] Manual retraining triggered...")
    
    try:
        retrain_model_batch()
        
        # Update config with last retrain time
        config = get_schedule_config()
        config["last_retrain"] = datetime.now().isoformat()
        with open(CONFIG_FILE, "w") as f:
            json.dump(config, f, indent=2)
        
        return {
            "success": True,
            "message": "Manual retraining completed",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Manual retraining failed: {e}")
        return {"success": False, "error": str(e)}


if __name__ == "__main__": 
    # For testing
    logger.info("Testing scheduler functions...")
    monitor_data_quality()
    logger.info("Test complete!")