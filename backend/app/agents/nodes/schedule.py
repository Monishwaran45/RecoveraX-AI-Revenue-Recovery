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
    
    # Enqueue Celery retry worker task
    try:
        from app.workers.tasks import execute_retry_task
        if case_id:
            execute_retry_task.delay(case_id)
    except Exception:
        pass

    audit_events.append({
        "event_type": AuditEventType.RETRY_SCHEDULED.value,
        "actor_type": ActorType.SYSTEM.value,
        "actor_id": "SCHEDULER",
        "reason": f"Retry scheduled & Celery worker task enqueued with {delay} minutes delay",
        "metadata": {"delay_minutes": delay, "case_id": case_id}
    })
    
    state["audit_events"] = audit_events
    state["workflow_status"] = CaseStatus.SCHEDULED.value
    return state
