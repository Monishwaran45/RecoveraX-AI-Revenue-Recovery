from app.agents.state import RecoveryState
from app.policy.enums import AuditEventType, ActorType, CaseStatus

def human_approval_node(state: RecoveryState) -> RecoveryState:
    """
    Node 6: Human Approval / Interrupt Handler
    Prepares case state for human approval queue when policy returns HUMAN.
    """
    audit_events = list(state.get("audit_events", []))
    audit_events.append({
        "event_type": AuditEventType.HUMAN_APPROVAL_REQUIRED.value,
        "actor_type": ActorType.POLICY.value,
        "actor_id": "DETERMINISTIC_POLICY_ENGINE",
        "reason": f"Case escalated to Human Approval Queue: {state.get('policy_reason')}",
        "metadata": {"amount_at_risk": state.get("transaction", {}).get("amount", 0.0)}
    })
    
    state["audit_events"] = audit_events
    state["workflow_status"] = CaseStatus.AWAITING_APPROVAL.value
    return state
