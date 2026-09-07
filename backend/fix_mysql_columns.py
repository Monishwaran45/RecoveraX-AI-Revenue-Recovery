from app.database.session import sync_engine
from sqlalchemy import text

def check_and_fix():
    with sync_engine.connect() as conn:
        print("Checking and modifying MySQL column types to VARCHAR(64)...")
        try:
            conn.execute(text("ALTER TABLE recommendations MODIFY COLUMN recommended_action VARCHAR(64) NOT NULL"))
            print("Fixed recommendations.recommended_action -> VARCHAR(64)")
        except Exception as e:
            print("Note on recommendations.recommended_action:", e)

        try:
            conn.execute(text("ALTER TABLE recovery_cases MODIFY COLUMN recommended_action VARCHAR(64) NOT NULL"))
            print("Fixed recovery_cases.recommended_action -> VARCHAR(64)")
        except Exception as e:
            print("Note on recovery_cases.recommended_action:", e)

        try:
            conn.execute(text("ALTER TABLE recovery_cases MODIFY COLUMN policy_decision VARCHAR(64) NOT NULL"))
            print("Fixed recovery_cases.policy_decision -> VARCHAR(64)")
        except Exception as e:
            print("Note on recovery_cases.policy_decision:", e)

        try:
            conn.execute(text("ALTER TABLE recovery_cases MODIFY COLUMN status VARCHAR(64) NOT NULL"))
            print("Fixed recovery_cases.status -> VARCHAR(64)")
        except Exception as e:
            print("Note on recovery_cases.status:", e)

        try:
            conn.execute(text("ALTER TABLE actions MODIFY COLUMN action_type VARCHAR(64) NOT NULL"))
            print("Fixed actions.action_type -> VARCHAR(64)")
        except Exception as e:
            print("Note on actions.action_type:", e)

        try:
            conn.execute(text("ALTER TABLE actions MODIFY COLUMN status VARCHAR(64) NOT NULL"))
            print("Fixed actions.status -> VARCHAR(64)")
        except Exception as e:
            print("Note on actions.status:", e)

        conn.commit()
        print("All column schema adjustments successfully committed!")

if __name__ == "__main__":
    check_and_fix()
