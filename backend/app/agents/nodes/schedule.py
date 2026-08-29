from app.agents.state import RecoveryState
from app.policy.enums import AuditEventType, ActorType, CaseStatus
from app.config import settings

def schedule_node(state: RecoveryState) -> RecoveryState:
    """
    Node 7: Schedule Retry.
    Schedules retry attempt with configured delay.
    Only enqueues Celery background task when explicit enqueue_celery flag is True,
    preventing duplicate execution paths during synchronous graph execution.
    """
    audit_events = list(state.get("audit_events", []))
    delay = state.get("delay_minutes", 30)
    case_id = state.get("case_id")
    enqueue_celery = state.get("enqueue_celery", False)
    delay_seconds = settings.DEMO_RETRY_DELAY_SECONDS if settings.DEMO_MODE else delay * 60
    
    celery_enqueued = False
    sched_err = None

    try:
        if enqueue_celery and case_id:
            from app.workers.tasks import execute_retry_task
            execute_retry_task.apply_async(args=[case_id], countdown=delay_seconds, retry=False)
            celery_enqueued = True
        else:
            celery_enqueued = False
    except Exception as e:
        celery_enqueued = False
        sched_err = str(e)

    if sched_err:
        state["workflow_status"] = CaseStatus.BLOCKED.value
        state["policy_decision"] = "BLOCK"
        state["policy_reason"] = f"Scheduler dispatch error: {sched_err}"
        audit_events.append({
            "event_type": AuditEventType.ACTION_BLOCKED.value,
            "actor_type": ActorType.SYSTEM.value,
            "actor_id": "SCHEDULER",
            "reason": f"Scheduler dispatch failed ({sched_err}). Retry hard-blocked.",
            "metadata": {"error": sched_err}
        })
    else:
        audit_events.append({
            "event_type": AuditEventType.RETRY_SCHEDULED.value,
            "actor_type": ActorType.SYSTEM.value,
            "actor_id": "SCHEDULER",
            "reason": f"Retry scheduled with {delay_seconds} seconds delay"
                      + ("; Celery task enqueued" if celery_enqueued else "; awaiting external scheduler dispatch"),
            "metadata": {"delay_minutes": delay, "delay_seconds": delay_seconds, "case_id": case_id, "celery_enqueued": celery_enqueued}
        })
        state["workflow_status"] = CaseStatus.SCHEDULED.value

    state["audit_events"] = audit_events
    state["celery_enqueued"] = celery_enqueued
    return state

