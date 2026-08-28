import asyncio
import logging
from app.database.session import AsyncSessionLocal
from app.services.case_service import case_service

logging.basicConfig(level=logging.INFO)

async def main():
    async with AsyncSessionLocal() as db:
        demo_cases = ["CASE-1001", "CASE-1002", "CASE-1003", "CASE-1004", "CASE-1005", "CASE-1006"]
        print("\n=== EXECUTING 6 DEMO CASES WITH LANGSMITH OBSERVABILITY ===")
        for c_id in demo_cases:
            c = await case_service.analyze_case(db, c_id)
            if c:
                cust_name = c.customer.name if c.customer else "Customer"
                print(f"[OK] {c.id} ({cust_name}): INR {c.amount_at_risk:,.2f} | Problem: {c.problem_type.value} | Score: {c.recovery_score}/100 | Policy: {c.policy_decision.value} | Status: {c.status.value}")

if __name__ == "__main__":
    asyncio.run(main())
