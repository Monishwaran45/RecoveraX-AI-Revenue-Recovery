from app.agents.state import RecoveryState
from app.policy.enums import AuditEventType, ActorType, CaseStatus

def stop_node(state: RecoveryState) -> RecoveryState:
    """
    Node 11: Stop Case
    Stops workflow execution and records audit log.
    """
    audit_events = list(state.get("audit_events", []))
    reason = state.get("policy_reason") or state.get("reason") or "Recovery workflow stopped by policy/rules"
    
    audit_events.append({
        "event_type": AuditEventType.RECOVERY_STOPPED.value,
        "actor_type": ActorType.SYSTEM.value,
        "actor_id": "RECOVERY_ENGINE",
        "reason": f"Case processing stopped: {reason}",
        "metadata": {"status": CaseStatus.STOPPED.value}
    })
    
    state["audit_events"] = audit_events
    state["workflow_status"] = CaseStatus.STOPPED.value
    return state
