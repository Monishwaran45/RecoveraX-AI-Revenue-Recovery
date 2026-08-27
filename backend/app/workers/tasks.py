import time
import asyncio
import logging
from app.workers.celery_app import celery_app
from app.config import settings
from app.database.session import AsyncSessionLocal
from app.services.action_service import action_service

logger = logging.getLogger(__name__)

async def _run_async_retry(case_id: str):
    async with AsyncSessionLocal() as db:
        return await action_service.execute_case_action(db, case_id)

@celery_app.task(name="tasks.execute_retry_task")
def execute_retry_task(case_id: str):
    """
    Celery background worker task for scheduled retries.
    Uses DEMO_RETRY_DELAY_SECONDS (10s) when DEMO_MODE=true.
    Directly invokes action_service execution after delay.
    """
    delay = settings.DEMO_RETRY_DELAY_SECONDS if settings.DEMO_MODE else 1800
    logger.info(f"[SCHEDULER] Retry task queued for case {case_id}. Waiting {delay} seconds...")
    time.sleep(delay)
    logger.info(f"[SCHEDULER] Executing delayed retry task for case {case_id}...")
    
    try:
        updated_case = asyncio.run(_run_async_retry(case_id))
        status_val = updated_case.status.value if updated_case else "UNKNOWN"
        return {"status": "SUCCESS", "case_id": case_id, "result_status": status_val, "executed_after": delay}
    except Exception as e:
        logger.error(f"[SCHEDULER] Failed to execute retry task for case {case_id}: {str(e)}", exc_info=True)
        return {"status": "ERROR", "case_id": case_id, "error": str(e)}
