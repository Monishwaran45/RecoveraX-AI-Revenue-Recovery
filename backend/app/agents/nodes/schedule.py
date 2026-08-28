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
    Node 7: Schedule Retry.

    The synchronous LangGraph demo path does not enqueue Celery by default, so
    it cannot accidentally execute the same retry twice. A real background
    continuation can opt in with enqueue_celery=True.
    """
    audit_events = list(state.get("audit_events", []))
    delay = state.get("delay_minutes", 30)
    case_id = state.get("case_id")
    enqueue_celery = state.get("enqueue_celery", False)

    celery_enqueued = False
    sched_err = None

    if enqueue_celery:
        if not case_id:
            sched_err = "Cannot enqueue retry without case_id."
        elif not _is_redis_ready():
            sched_err = "Redis is unavailable; retry was not enqueued."
        else:
            try:
                from app.workers.tasks import execute_retry_task
                # Pass the intended delay to Celery instead of blocking a worker
                # with sleep(). The task itself remains idempotency/safety gated.
                execute_retry_task.apply_async(
                    args=[case_id],
                    countdown=max(0, int(delay) * 60),
                    retry=False,
                )
                celery_enqueued = True
            except Exception as e:
                sched_err = str(e)

    if sched_err:
        # Fail closed: a scheduling failure must never look like a successful
        # schedule. Route the case to human review rather than pretending work
        # was queued.
        state["workflow_status"] = CaseStatus.AWAITING_APPROVAL.value
        state["policy_reason"] = f"Scheduler dispatch error: {sched_err}"
        audit_events.append({
            "event_type": AuditEventType.ACTION_BLOCKED.value,
            "actor_type": ActorType.SYSTEM.value,
            "actor_id": "SCHEDULER",
            "reason": f"Retry was not scheduled: {sched_err}",
            "metadata": {
                "error": sched_err,
                "delay_minutes": delay,
                "case_id": case_id,
                "celery_enqueued": False,
            },
        })
    else:
        audit_events.append({
            "event_type": AuditEventType.RETRY_SCHEDULED.value,
            "actor_type": ActorType.SYSTEM.value,
            "actor_id": "SCHEDULER",
            "reason": (
                f"Retry scheduled with {delay} minutes delay"
                + (" and Celery task enqueued" if celery_enqueued else " for synchronous demo execution")
            ),
            "metadata": {
                "delay_minutes": delay,
                "case_id": case_id,
                "celery_enqueued": celery_enqueued,
            },
        })
        state["workflow_status"] = CaseStatus.SCHEDULED.value

    state["audit_events"] = audit_events
    state["celery_enqueued"] = celery_enqueued
    return state
