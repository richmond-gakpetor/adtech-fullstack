import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime

from app.config import settings
from app.services.reminder_service import ReminderService

logger = logging.getLogger(__name__)

# Global scheduler instance
scheduler = AsyncIOScheduler()


def init_scheduler():
    """Initialize the scheduler with all scheduled tasks"""

    # Add the reminder check job (gated by REMINDER_ENABLED flag)
    if settings.REMINDER_ENABLED:
        hour, minute = settings.REMINDER_CHECK_TIME.split(":")
        scheduler.add_job(
            ReminderService.check_and_send_reminders,
            trigger=CronTrigger(hour=int(hour), minute=int(minute)),
            id="listing_expiration_reminders",
            name="Check and send listing expiration reminders",
            replace_existing=True,
            misfire_grace_time=3600  # Allow 1 hour grace if job misses scheduled time
        )
        logger.info(
            f"Scheduled listing expiration reminders to run daily at {settings.REMINDER_CHECK_TIME} GMT"
        )
    else:
        logger.info("Reminder system is disabled - reminder job not scheduled")

    # Start the scheduler
    scheduler.start()
    logger.info("Scheduler started successfully")


def shutdown_scheduler():
    """Gracefully shutdown the scheduler"""
    if scheduler.running:
        scheduler.shutdown(wait=True)
        logger.info("Scheduler shut down successfully")


def get_scheduler_status():
    """Get current scheduler status and jobs"""
    if not scheduler.running:
        return {
            "running": False,
            "jobs": []
        }
    
    jobs = []
    for job in scheduler.get_jobs():
        next_run = job.next_run_time.isoformat() if job.next_run_time else None
        jobs.append({
            "id": job.id,
            "name": job.name,
            "next_run": next_run,
            "trigger": str(job.trigger)
        })
    
    return {
        "running": True,
        "jobs": jobs
    }
