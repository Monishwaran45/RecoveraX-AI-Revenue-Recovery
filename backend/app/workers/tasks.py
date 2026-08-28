import time
import asyncio
import logging
from app.workers.celery_app import celery_app
from app.config import settings
from app.database.session import AsyncSessionLocal
from app.services.action_service import action_service
from app.policy.enums import CaseStatus, PolicyDecision
from app.observability import configure_langsmith, sanitize_trace_data

logger = logging.getLogger(__name__)
configure_langsmith()

async def _run_async_retry(case_id: str):
    async with AsyncSessionLocal() as db:
        from app.models.recovery_case import RecoveryCase
        from sqlalchemy import select
        
        case = await db.scalar(select(RecoveryCase).where(RecoveryCase.id == case_id))
        if not case:
            return None
            
        # Idempotency Lock: If case is already RECOVERED, BLOCKED, or STOPPED, skip duplicate execution!
        if case.status in [CaseStatus.RECOVERED, CaseStatus.BLOCKED, CaseStatus.STOPPED] or case.policy_decision == PolicyDecision.BLOCK:
            logger.info(f"[CELERY WORKER] Case {case_id} is already in terminal state {case.status.value}. Skipping duplicate execution path.")
            return case

        # Step 1: Perform fresh gateway & payment state recheck
        rechecked_case = await action_service.recheck_case(db, case_id)
        if not rechecked_case or rechecked_case.status in [CaseStatus.RECOVERED, CaseStatus.BLOCKED, CaseStatus.STOPPED]:
            return rechecked_case
            
        # Step 2: Proceed to execute case action if safe
        return await action_service.execute_case_action(db, case_id)

@celery_app.task(name="tasks.execute_retry_task")
def execute_retry_task(case_id: str):
    """
    Celery background worker task for scheduled retries.
    Sequence: WAIT -> FRESH GATEWAY RE-CHECK -> SAFETY POLICY CHECK -> EXECUTE
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
