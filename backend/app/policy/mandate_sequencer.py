# ==============================================================================
# RecoveraX — Autonomous AI Revenue Recovery Engine
# Author & Copyright (c) 2026 Monishwaran45 (https://github.com/Monishwaran45)
# Repository: https://github.com/Monishwaran45/RecoveraX-AI-Revenue-Recovery
# All Rights Reserved.
# ==============================================================================

from dataclasses import dataclass
from datetime import datetime, timedelta
import logging
from typing import Optional, Tuple

logger = logging.getLogger(__name__)

MANDATE_PAYMENT_METHODS = {
    "NACH",
    "E_MANDATE",
    "EMANDATE",
    "UPI_AUTOPAY",
    "AUTODEBIT",
    "DIRECT_DEBIT"
}

# Standard Indian salary & liquidity credit calendar dates (day of month)
SALARY_CREDIT_DAYS = [1, 5, 7, 10, 25, 28, 30, 31]

@dataclass
class MandateSequencePlan:
    is_mandate: bool
    payment_method: str
    recommended_delay_minutes: int
    target_batch_cycle: str
    salary_window_aligned: bool
    bounce_fee_protection_applied: bool
    mandate_retry_reason: str

class MandateSequencer:
    """
    Mandate / E-Mandate Presentation Window Sequencer.
    
    Optimizes auto-debit re-presentation timing for NACH, E-Mandate, and UPI Autopay
    by aligning retries with NPCI clearing batch windows (09:00 / 17:00 IST),
    salary liquidity credit cycles, and enforcing 48-hour dishonor fee cool-off guardrails.
    """
    
    @staticmethod
    def is_mandate_payment(payment_method: str) -> bool:
        if not payment_method:
            return False
        return payment_method.strip().upper() in MANDATE_PAYMENT_METHODS

    @classmethod
    def calculate_presentation_window(
        cls,
        payment_method: str,
        diagnosis: str,
        retry_count: int,
        ref_time: Optional[datetime] = None
    ) -> MandateSequencePlan:
        pm_upper = (payment_method or "").strip().upper()
        if not cls.is_mandate_payment(pm_upper):
            return MandateSequencePlan(
                is_mandate=False,
                payment_method=pm_upper,
                recommended_delay_minutes=30,
                target_batch_cycle="IMMEDIATE_GATEWAY_RETRY",
                salary_window_aligned=False,
                bounce_fee_protection_applied=False,
                mandate_retry_reason="Non-mandate payment method; standard short delay applied."
            )

        now = ref_time or datetime.utcnow()
        # Default minimum mandate cool-off: 48 hours (2880 minutes) for 1st retry, 72 hours for 2nd retry to avoid bounce fees
        base_cooloff_hours = 48 if retry_count == 0 else 72
        target_time = now + timedelta(hours=base_cooloff_hours)
        
        salary_aligned = False
        bounce_fee_protected = True
        
        # Check liquidity alignment for INSUFFICIENT_FUNDS
        if diagnosis == "INSUFFICIENT_FUNDS":
            # Search for the nearest salary credit day after cool-off
            target_day = target_time.day
            nearest_salary_day = None
            
            for s_day in SALARY_CREDIT_DAYS:
                if s_day >= target_day:
                    nearest_salary_day = s_day
                    break
            
            if nearest_salary_day is not None and (nearest_salary_day - target_day) <= 4:
                # Align presentation to the salary credit day
                days_ahead = nearest_salary_day - target_day
                target_time += timedelta(days=days_ahead)
                salary_aligned = True

        # NPCI NACH clearing batch window selection: Morning (09:00 IST) vs Evening (17:00 IST)
        # Note: UTC time = IST - 5:30. 09:00 IST = 03:30 UTC; 17:00 IST = 11:30 UTC.
        batch_cycle = "NPCI_MORNING_BATCH_0900_IST"
        
        # Set target time to 09:00 IST (03:30 UTC)
        target_time_batch = target_time.replace(hour=3, minute=30, second=0, microsecond=0)
        if target_time_batch < target_time:
            # Shift to Evening batch 17:00 IST (11:30 UTC) or next day 09:00 IST
            evening_batch = target_time.replace(hour=11, minute=30, second=0, microsecond=0)
            if evening_batch >= target_time:
                target_time_batch = evening_batch
                batch_cycle = "NPCI_EVENING_BATCH_1700_IST"
            else:
                target_time_batch += timedelta(days=1)
                batch_cycle = "NPCI_MORNING_BATCH_0900_IST"
        
        delay_minutes = int((target_time_batch - now).total_seconds() // 60)
        if delay_minutes < 2880: # Ensure minimum 48 hours (2880 mins)
            delay_minutes = 2880

        reason = (
            f"Mandate presentation window calculated for {pm_upper}: "
            f"aligned to {batch_cycle} after {delay_minutes // 60}h cool-off. "
            f"Bounce fee protection active."
        )
        if salary_aligned:
            reason += " Salary liquidity window matched."

        return MandateSequencePlan(
            is_mandate=True,
            payment_method=pm_upper,
            recommended_delay_minutes=delay_minutes,
            target_batch_cycle=batch_cycle,
            salary_window_aligned=salary_aligned,
            bounce_fee_protection_applied=bounce_fee_protected,
            mandate_retry_reason=reason
        )

mandate_sequencer = MandateSequencer()
