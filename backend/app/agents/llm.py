import os
import logging
from typing import Optional
from langchain_groq import ChatGroq
from app.config import settings

logger = logging.getLogger(__name__)

def get_groq_llm() -> Optional[ChatGroq]:
    api_key = settings.GROQ_API_KEY or os.environ.get("GROQ_API_KEY", "")
    if not api_key:
        logger.warning("GROQ_API_KEY is not set. LLM nodes will fall back to fail-closed HUMAN routing.")
        return None
    try:
        return ChatGroq(
            groq_api_key=api_key,
            model_name=settings.GROQ_MODEL,
            temperature=0.0,
            max_tokens=150,
            max_retries=1
        )
    except Exception as e:
        logger.error(f"Failed to initialize ChatGroq: {str(e)}")
        return None
