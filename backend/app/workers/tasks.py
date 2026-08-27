import time
import logging
from app.workers.celery_app import celery_app
from app.config import settings

logger = logging.getLogger(__name__)

@celery_app.task(name="tasks.execute_retry_task")
def execute_retry_task(case_id: str):
    """
    Celery background worker task for scheduled retries.
    Uses DEMO_RETRY_DELAY_SECONDS (10s) when DEMO_MODE=true.
    """
    delay = settings.DEMO_RETRY_DELAY_SECONDS if settings.DEMO_MODE else 1800
    logger.info(f"[SCHEDULER] Retry task queued for case {case_id}. Waiting {delay} seconds...")
    time.sleep(delay)
    logger.info(f"[SCHEDULER] Executing delayed retry task for case {case_id}...")
    return {"status": "SUCCESS", "case_id": case_id, "executed_after": delay}
