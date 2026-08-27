from app.agents.state import RecoveryState
from app.policy.enums import AuditEventType, ActorType

def load_context_node(state: RecoveryState) -> RecoveryState:
    """
    Node 1: Load Context
    Loads structured data from state/DB into structured context object.
    Does not give LLM direct DB access.
    """
    audit_events = list(state.get("audit_events", []))
    audit_events.append({
        "event_type": AuditEventType.CASE_CREATED.value,
        "actor_type": ActorType.SYSTEM.value,
        "actor_id": "SYSTEM",
        "reason": f"Recovery case {state.get('case_id')} loaded into execution workflow",
        "metadata": {"amount_at_risk": state.get("transaction", {}).get("amount", 0.0)}
    })
    
    state["audit_events"] = audit_events
    state["workflow_status"] = "CONTEXT_LOADED"
    return state
