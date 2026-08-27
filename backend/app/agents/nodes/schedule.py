from app.agents.state import RecoveryState
from app.policy.enums import AuditEventType, ActorType, CaseStatus

def schedule_node(state: RecoveryState) -> RecoveryState:
    """
    Node 7: Schedule Retry
    Schedules retry attempt with configured delay via Celery worker task.
    """
    audit_events = list(state.get("audit_events", []))
    delay = state.get("delay_minutes", 30)
    case_id = state.get("case_id")
    
    celery_enqueued = False
    try:
        from app.workers.tasks import execute_retry_task
        if case_id:
            execute_retry_task.delay(case_id)
            celery_enqueued = True
    except Exception:
        celery_enqueued = False

    reason_msg = f"Retry scheduled for {delay}m delay ({'Celery task enqueued' if celery_enqueued else 'System timer active'})"

    audit_events.append({
        "event_type": AuditEventType.RETRY_SCHEDULED.value,
        "actor_type": ActorType.SYSTEM.value,
        "actor_id": "SCHEDULER",
        "reason": reason_msg,
        "metadata": {"delay_minutes": delay, "case_id": case_id, "celery_enqueued": celery_enqueued}
    })
    
    state["audit_events"] = audit_events
    state["workflow_status"] = CaseStatus.SCHEDULED.value
    return state
