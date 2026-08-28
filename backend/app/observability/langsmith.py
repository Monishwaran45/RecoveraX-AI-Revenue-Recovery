import os
import logging
from typing import Dict, Any, List, Optional
from app.config import settings

logger = logging.getLogger(__name__)

SENSITIVE_KEYS = {
    "api_key", "groq_api_key", "langsmith_api_key", "card_number", "cvv",
    "password", "secret", "payment_secret", "bank_credentials", "token"
}

def configure_langsmith() -> bool:
    """
    Centralized LangSmith configuration initializer.
    Sets standard LangChain & LangSmith environment variables if enabled.
    Returns True if tracing is active, False otherwise.
    """
    tracing_enabled = (
        str(settings.LANGSMITH_TRACING).lower() in ("true", "1", "yes")
        or bool(settings.LANGSMITH_API_KEY)
        or str(os.environ.get("LANGSMITH_TRACING", "")).lower() in ("true", "1")
    )

    if not tracing_enabled:
        logger.info("LangSmith tracing is disabled or not configured. Systems running without external tracing.")
        return False

    api_key = settings.LANGSMITH_API_KEY or os.environ.get("LANGSMITH_API_KEY") or os.environ.get("LANGCHAIN_API_KEY", "")
    project = settings.LANGSMITH_PROJECT or os.environ.get("LANGSMITH_PROJECT", "RecoveraX")
    endpoint = settings.LANGSMITH_ENDPOINT or os.environ.get("LANGSMITH_ENDPOINT", "https://api.smith.langchain.com")

    # Set both LANGSMITH_* and legacy LANGCHAIN_* environment variables for total SDK compatibility
    os.environ["LANGCHAIN_TRACING_V2"] = "true"
    os.environ["LANGSMITH_TRACING"] = "true"
    os.environ["LANGCHAIN_PROJECT"] = project
    os.environ["LANGSMITH_PROJECT"] = project
    os.environ["LANGCHAIN_ENDPOINT"] = endpoint
    os.environ["LANGSMITH_ENDPOINT"] = endpoint

    if api_key:
        os.environ["LANGCHAIN_API_KEY"] = api_key
        os.environ["LANGSMITH_API_KEY"] = api_key

    logger.info(f"✓ LangSmith Tracing Active | Project: '{project}' | Endpoint: {endpoint}")
    return True

def sanitize_trace_data(data: Any) -> Any:
    """
    Recursively redacts sensitive security keys (API keys, card numbers, secrets)
    before logging or sending trace metadata.
    """
    if isinstance(data, dict):
        sanitized = {}
        for key, val in data.items():
            if any(s_key in key.lower() for s_key in SENSITIVE_KEYS):
                sanitized[key] = "[REDACTED_SENSITIVE_DATA]"
            else:
                sanitized[key] = sanitize_trace_data(val)
        return sanitized
    elif isinstance(data, list):
        return [sanitize_trace_data(item) for item in data]
    return data

def get_recovery_trace_tags(
    problem_type: Optional[str] = None,
    policy_decision: Optional[str] = None,
    status: Optional[str] = None
) -> List[str]:
    """
    Generates structured taxonomy tags for LangSmith trace filtering.
    """
    tags = ["recovery"]
    if problem_type:
        tags.append(problem_type.lower().replace("_", "-"))
    if policy_decision:
        tags.append(policy_decision.lower())
    if status:
        tags.append(status.lower().replace("_", "-"))
    return tags

def get_recovery_trace_metadata(
    case_id: str,
    transaction_id: Optional[str] = None,
    customer_id: Optional[str] = None,
    amount_at_risk: Optional[float] = None,
    problem_type: Optional[str] = None,
    risk_level: Optional[str] = None,
    recovery_score: Optional[int] = None,
    recommended_action: Optional[str] = None,
    policy_decision: Optional[str] = None,
    status: Optional[str] = None,
    retry_count: Optional[int] = 0,
    max_retries: Optional[int] = 2,
    amount_recovered: Optional[float] = 0.0,
) -> Dict[str, Any]:
    """
    Constructs clean, structured metadata attributes for the top-level case trace.
    """
    raw_meta = {
        "case_id": case_id,
        "transaction_id": transaction_id or "N/A",
        "customer_id": customer_id or "N/A",
        "amount_at_risk": amount_at_risk or 0.0,
        "problem_type": problem_type or "FAILED_PAYMENT",
        "risk_level": risk_level or "MEDIUM",
        "recovery_score": recovery_score or 50,
        "recommended_action": recommended_action or "RETRY",
        "policy_decision": policy_decision or "HUMAN",
        "status": status or "OPEN",
        "retry_count": retry_count or 0,
        "max_retries": max_retries or 2,
        "amount_recovered": amount_recovered or 0.0,
    }
    return sanitize_trace_data(raw_meta)

def get_trace_url(project_name: Optional[str] = None, run_id: Optional[str] = None) -> Optional[str]:
    """
    Constructs a safe, non-sensitive LangSmith run URL if project and run_id are present.
    """
    if not run_id:
        return None
    project = project_name or settings.LANGSMITH_PROJECT or "RecoveraX"
    return f"https://smith.langchain.com/o/default/projects/p/{project}/r/{run_id}"
