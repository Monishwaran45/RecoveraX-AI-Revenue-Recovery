from typing import TypedDict, Optional, List, Dict, Any

class RecoveryState(TypedDict, total=False):
    case_id: str
    
    # Context Objects
    transaction: Optional[Dict[str, Any]]
    customer: Optional[Dict[str, Any]]
    subscription: Optional[Dict[str, Any]]
    invoice: Optional[Dict[str, Any]]
    
    # LLM Diagnosis
    diagnosis: str
    diagnosis_confidence: float
    diagnosis_reason: str
    
    # Deterministic Score
    recovery_score: int
    
    # LLM Recommendation
    recommended_action: str
    delay_minutes: int
    expected_recovery_value: float
    reason: str
    
    # Risk Level & Deterministic Policy
    risk_level: str
    policy_decision: str
    policy_reason: str
    rules_evaluated: List[Dict[str, Any]]
    
    # HITL Human Decision
    human_decision: Optional[str]
    human_modified_action: Optional[str]
    human_modified_delay: Optional[int]
    human_reason: Optional[str]
    
    # Retry state
    retry_count: int
    max_retries: int
    
    # Execution & Verification
    execution_result: Optional[str]
    verification_result: Optional[str]
    amount_recovered: float
    
    # Audit Events
    audit_events: List[Dict[str, Any]]
    
    # Control flags
    workflow_status: str
