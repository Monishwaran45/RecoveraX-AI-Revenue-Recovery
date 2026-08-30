# ==============================================================================
# RecoveraX — Autonomous AI Revenue Recovery Engine
# Author & Copyright (c) 2026 Monishwaran45 (https://github.com/Monishwaran45)
# Repository: https://github.com/Monishwaran45/RecoveraX-AI-Revenue-Recovery
# All Rights Reserved.
# ==============================================================================

import json
import logging
import base64
from typing import Dict, Any, Optional
import httpx
from app.config import settings

logger = logging.getLogger(__name__)

SARVAM_TTS_URL = "https://api.sarvam.ai/text-to-speech"

def generate_hinglish_voice_script(
    customer_name: str = "Customer",
    amount: float = 0.0,
    problem_type: str = "payment_decline",
    custom_intent: Optional[str] = None
) -> str:
    """
    Generates a natural, contextual Hinglish voice script for payment recovery.
    """
    clean_name = customer_name if customer_name and customer_name != "Customer" else "Ji"
    formatted_amount = f"₹{amount:,.2f}" if amount > 0 else "aapka pending amount"
    
    if custom_intent:
        return f"Namaste {clean_name}! Razorpay support se bol rahe hain. {custom_intent}. Kya aap abhi payment complete karna chahenge?"

    if "SUBSCRIPTION" in problem_type.upper():
        return (
            f"Namaste {clean_name}! Aapka recurring subscription payment {formatted_amount} complete nahi ho paya tha. "
            f"Kya hum abhi instant link bhej kar payment complete karne mein help kar sakte hain?"
        )
    elif "INVOICE" in problem_type.upper():
        return (
            f"Namaste {clean_name}! Aapka overdue invoice amount {formatted_amount} pending hai. "
            f"Kya aap aaj payment schedule kar sakte hain ya promise-to-pay commitment record karna chahenge?"
        )
    else:
        return (
            f"Namaste {clean_name}! Aapka transaction {formatted_amount} bank gateway decline ki wajah se complete nahi ho paya tha. "
            f"Agar aap chahein, main aapko safe payment link bhej kar help kar sakta hoon."
        )

def synthesize_hinglish_audio(script: str) -> Dict[str, Any]:
    """
    Synthesizes Hinglish audio using Sarvam AI Text-to-Speech API (bulbul:v1).
    Falls back gracefully to MOCK mode if SARVAM_API_KEY is not configured or if API is unreachable.
    """
    api_key = settings.SARVAM_API_KEY.strip() if settings.SARVAM_API_KEY else ""

    if not api_key:
        logger.info("SARVAM_API_KEY missing. Operating Sarvam Voice Integration in MOCK/DEMO mode.")
        return {
            "mode": "MOCK",
            "provider": "Sarvam AI (Simulated Mock Engine)",
            "script": script,
            "language_code": "hi-IN",
            "speaker": "anushka (hi-IN)",
            "audio_available": True,
            "audio_url": "mock://sarvam-voice-hinglish.mp3",
            "audio_b64": base64.b64encode(script.encode("utf-8")).decode("utf-8"),
            "status": "SYNTHESIZED",
            "message": "Sarvam AI Voice intervention script generated in MOCK mode. Configure SARVAM_API_KEY for live TTS audio."
        }

    # Live API call to Sarvam AI TTS
    headers = {
        "api-subscription-key": api_key,
        "Content-Type": "application/json"
    }
    payload = {
        "inputs": [script],
        "target_language_code": "hi-IN",
        "speaker": "priya",
        "pace": 1.0,
        "speech_sample_rate": 8000,
        "enable_preprocessing": True,
        "model": "bulbul:v3"
    }

    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.post(SARVAM_TTS_URL, headers=headers, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                audios = data.get("audios", [])
                audio_base64 = audios[0] if audios else None
                return {
                    "mode": "REAL",
                    "provider": "Sarvam AI (Live TTS Engine)",
                    "script": script,
                    "language_code": "hi-IN",
                    "speaker": "priya",
                    "audio_available": bool(audio_base64),
                    "audio_b64": audio_base64,
                    "audio_url": f"data:audio/wav;base64,{audio_base64}" if audio_base64 else None,
                    "status": "SYNTHESIZED",
                    "message": "Sarvam AI Hinglish voice intervention audio synthesized successfully."
                }
            else:
                logger.warning(f"Sarvam AI API returned HTTP {resp.status_code}: {resp.text}. Falling back to MOCK mode.")
                return {
                    "mode": "MOCK",
                    "provider": "Sarvam AI (Fallback Mock Engine)",
                    "script": script,
                    "language_code": "hi-IN",
                    "audio_available": True,
                    "audio_url": "mock://sarvam-voice-hinglish.mp3",
                    "status": "FALLBACK_MOCK",
                    "message": f"Sarvam API call returned status {resp.status_code}. Fallback to mock voice representation."
                }
    except Exception as e:
        logger.error(f"Sarvam AI TTS API request failed: {str(e)}. Operating in fallback mode.", exc_info=True)
        return {
            "mode": "MOCK",
            "provider": "Sarvam AI (Fallback Mock Engine)",
            "script": script,
            "language_code": "hi-IN",
            "audio_available": True,
            "audio_url": "mock://sarvam-voice-hinglish.mp3",
            "status": "FALLBACK_MOCK",
            "message": f"Sarvam API exception ({str(e)}). Fallback to mock script mode."
        }
