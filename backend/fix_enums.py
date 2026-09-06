import re

def fix_reset_case(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    content = content.replace('case.policy_decision = policy', 'case.policy_decision = policy.value if hasattr(policy, "value") else policy')
    content = content.replace('case.status = status', 'case.status = status.value if hasattr(status, "value") else status')
    content = content.replace('case.risk_level = risk', 'case.risk_level = risk.value if hasattr(risk, "value") else risk')
    content = content.replace('case.recommended_action = action', 'case.recommended_action = action.value if hasattr(action, "value") else action')
    content = content.replace('if case.status != CaseStatus.RECOVERED:', 'if case.status != CaseStatus.RECOVERED.value and case.status != CaseStatus.RECOVERED:')

    with open(filepath, 'w') as f:
        f.write(content)
    print(f'Fixed reset_case in {filepath}')

fix_reset_case('c:/Users/Asus-2025/Downloads/Razorpay AI Buildathon/backend/app/services/action_service.py')
fix_reset_case('c:/Users/Asus-2025/Downloads/Razorpay AI Buildathon/backend/app/services/case_service.py')
