import logging
from langgraph.graph import StateGraph, END
from app.agents.state import RecoveryState
from app.agents.nodes.load_context import load_context_node
from app.agents.nodes.diagnose import diagnose_node
from app.agents.nodes.score import calculate_score_node
from app.agents.nodes.recommend import recommend_action_node
from app.agents.nodes.policy import policy_check_node
from app.agents.nodes.human_approval import human_approval_node
from app.agents.nodes.schedule import schedule_node
from app.agents.nodes.recheck import recheck_node
from app.agents.nodes.execute import execute_node
from app.agents.nodes.verify import verify_node
from app.agents.nodes.stop import stop_node
from app.agents.nodes.reevaluate import reevaluate_node
from app.policy.enums import PolicyDecision

logger = logging.getLogger(__name__)

def route_policy_decision(state: RecoveryState) -> str:
    decision = state.get("policy_decision", "HUMAN")
    if decision == PolicyDecision.AUTO.value:
        return "schedule"
    elif decision == PolicyDecision.HUMAN.value:
        return "human_approval"
    else:
        return "stop"

def route_verification_outcome(state: RecoveryState) -> str:
    result = state.get("verification_result")
    if result == "VERIFIED_SUCCESS":
        return END
    else:
        return "reevaluate"

def route_reevaluation(state: RecoveryState) -> str:
    status = state.get("workflow_status")
    if status == "STOPPED":
        return "stop"
    else:
        return END

def build_recovery_graph():
    builder = StateGraph(RecoveryState)
    
    # Add Nodes
    builder.add_node("load_context", load_context_node)
    builder.add_node("diagnose", diagnose_node)
    builder.add_node("calculate_score", calculate_score_node)
    builder.add_node("recommend_action", recommend_action_node)
    builder.add_node("policy_check", policy_check_node)
    builder.add_node("human_approval", human_approval_node)
    builder.add_node("schedule", schedule_node)
    builder.add_node("recheck", recheck_node)
    builder.add_node("execute", execute_node)
    builder.add_node("verify", verify_node)
    builder.add_node("stop", stop_node)
    builder.add_node("reevaluate", reevaluate_node)
    
    # Set Entry Point
    builder.set_entry_point("load_context")
    
    # Linear Flow to Policy Check
    builder.add_edge("load_context", "diagnose")
    builder.add_edge("diagnose", "calculate_score")
    builder.add_edge("calculate_score", "recommend_action")
    builder.add_edge("recommend_action", "policy_check")
    
    # Conditional Branch based on Policy Decision
    builder.add_conditional_edges(
        "policy_check",
        route_policy_decision,
        {
            "schedule": "schedule",
            "human_approval": "human_approval",
            "stop": "stop"
        }
    )
    
    # HITL Interrupt Node End
    builder.add_edge("human_approval", END)
    
    # Execution & Verification Path
    builder.add_edge("schedule", "recheck")
    builder.add_edge("recheck", "execute")
    builder.add_edge("execute", "verify")
    
    # Verify Conditional Branching
    builder.add_conditional_edges(
        "verify",
        route_verification_outcome,
        {
            END: END,
            "reevaluate": "reevaluate"
        }
    )
    
    builder.add_conditional_edges(
        "reevaluate",
        route_reevaluation,
        {
            "stop": "stop",
            END: END
        }
    )
    
    builder.add_edge("stop", END)
    
    return builder.compile()

recovery_graph = build_recovery_graph()
