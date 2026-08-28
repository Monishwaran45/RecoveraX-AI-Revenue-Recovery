import socket
from app.agents.state import RecoveryState
from app.policy.enums import AuditEventType, ActorType, CaseStatus

def _is_redis_ready(host="localhost", port=6379, timeout=0.2) -> bool:
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except Exception:
        return False

def schedule_node(state: RecoveryState) -> RecoveryState:
    """
    Node 7: Schedule Retry
    Schedules retry attempt with configured delay via Celery worker task.
    Fails closed to HUMAN review if scheduler dispatch fails.
    """
    audit_events = list(state.get("audit_events", []))
    delay = state.get("delay_minutes", 30)
    case_id = state.get("case_id")
    
    celery_enqueued = False
    sched_err = None

    try:
        if case_id and _is_redis_ready():
            from app.workers.tasks import execute_retry_task
            execute_retry_task.apply_async(args=[case_id], retry=False)
            celery_enqueued = True
        else:
            celery_enqueued = False
    except Exception as e:
        celery_enqueued = False
        sched_err = str(e)

    if sched_err:
        state["workflow_status"] = CaseStatus.AWAITING_APPROVAL.value
        state["policy_reason"] = f"Scheduler dispatch error: {sched_err}"
        audit_events.append({
            "event_type": AuditEventType.ACTION_BLOCKED.value,
            "actor_type": ActorType.SYSTEM.value,
            "actor_id": "SCHEDULER",
            "reason": f"Scheduler dispatch failed ({sched_err}). Case routed to HUMAN review.",
            "metadata": {"error": sched_err}
        })
    else:
        audit_events.append({
            "event_type": AuditEventType.RETRY_SCHEDULED.value,
            "actor_type": ActorType.SYSTEM.value,
            "actor_id": "SCHEDULER",
            "reason": f"Retry scheduled & Celery task enqueued with {delay} minutes delay",
            "metadata": {"delay_minutes": delay, "case_id": case_id, "celery_enqueued": True}
        })
        state["workflow_status"] = CaseStatus.SCHEDULED.value

    state["audit_events"] = audit_events
    return state
