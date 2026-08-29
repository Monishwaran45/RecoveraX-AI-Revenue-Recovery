from app.agents.state import RecoveryState
from app.policy.enums import AuditEventType, ActorType, PolicyDecision, PaymentState, ActionType, CaseStatus
from app.simulator.payment import payment_simulator

def execute_node(state: RecoveryState) -> RecoveryState:
    """
    Node 9: Action Executor
    Executes payment retry payload via simulator or dispatches reminder.
    Re-runs policy check and rejects execution if policy decision is BLOCK.
    """
    tx = state.get("transaction", {})
    audit_events = list(state.get("audit_events", []))
    
    action_type = state.get("recommended_action", "RETRY")
    policy_dec = PolicyDecision(state.get("policy_decision", "HUMAN"))
    
    if policy_dec != PolicyDecision.AUTO:
        state["execution_result"] = "BLOCKED_BY_POLICY"
        state["workflow_status"] = (
            CaseStatus.STOPPED.value if policy_dec == PolicyDecision.STOP else CaseStatus.BLOCKED.value
        )
        audit_events.append({
            "event_type": AuditEventType.ACTION_BLOCKED.value,
            "actor_type": ActorType.EXECUTOR.value,
            "actor_id": "ACTION_EXECUTOR",
            "reason": f"Execution rejected: policy decision is {policy_dec.value}",
            "metadata": {"blocked": True, "policy_decision": policy_dec.value}
        })
        state["audit_events"] = audit_events
        return state

    if action_type == ActionType.RETRY.value:
        try:
            status, p_state, message = payment_simulator.simulate_retry(
                transaction_id=tx.get("id", "TX-000"),
                amount=tx.get("amount", 0.0),
                current_retry_count=tx.get("retry_count", 0),
                policy_decision=policy_dec,
                payment_state=PaymentState(tx.get("payment_state", "CLEAR")),
                failure_profile_id=tx.get("failure_profile_id", "TEMPORARY_BANK_ERROR")
            )
            state["execution_result"] = status.value
            state["transaction"]["status"] = status.value
            state["transaction"]["payment_state"] = p_state.value
            state["retry_count"] = state.get("retry_count", 0) + 1
            
            audit_events.append({
                "event_type": AuditEventType.ACTION_EXECUTED.value,
                "actor_type": ActorType.EXECUTOR.value,
                "actor_id": "ACTION_EXECUTOR",
                "reason": f"Dispatched retry payload to card network. Gateway response: {status.value} - {message}",
                "metadata": {"result_status": status.value, "payment_state": p_state.value}
            })
        except Exception as e:
            state["execution_result"] = "FAILED"
            audit_events.append({
                "event_type": AuditEventType.ACTION_EXECUTED.value,
                "actor_type": ActorType.EXECUTOR.value,
                "actor_id": "ACTION_EXECUTOR",
                "reason": f"Action execution exception: {str(e)}",
                "metadata": {"error": str(e)}
            })
    else:
        state["execution_result"] = "REMINDER_SENT"
        audit_events.append({
            "event_type": AuditEventType.ACTION_EXECUTED.value,
            "actor_type": ActorType.EXECUTOR.value,
            "actor_id": "REMINDER_DISPATCHER",
            "reason": f"Customer reminder payload sent for action {action_type}",
            "metadata": {"action": action_type}
        })

    state["audit_events"] = audit_events
    state["workflow_status"] = CaseStatus.EXECUTING.value
    return state
