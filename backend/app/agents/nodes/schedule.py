from app.agents.state import RecoveryState
from app.policy.enums import AuditEventType, ActorType, CaseStatus

def schedule_node(state: RecoveryState) -> RecoveryState:
    """
    Node 7: Schedule Retry
    Schedules retry attempt with configured delay.
    """
    audit_events = list(state.get("audit_events", []))
    delay = state.get("delay_minutes", 30)
    
    audit_events.append({
        "event_type": AuditEventType.RETRY_SCHEDULED.value,
        "actor_type": ActorType.SYSTEM.value,
        "actor_id": "SCHEDULER",
        "reason": f"Retry scheduled for {delay} minutes delay",
        "metadata": {"delay_minutes": delay}
    })
    
    state["audit_events"] = audit_events
    state["workflow_status"] = CaseStatus.SCHEDULED.value
    return state
