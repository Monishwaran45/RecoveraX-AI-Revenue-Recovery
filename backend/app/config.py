import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "RecoveraX Engine"
    API_V1_STR: str = ""
    ENVIRONMENT: str = Field(default="development", alias="ENVIRONMENT")
    API_AUTH_TOKEN: str = Field(default="", alias="API_AUTH_TOKEN")
    RATE_LIMIT_PER_MINUTE: int = Field(default=120, alias="RATE_LIMIT_PER_MINUTE")
    
    # Database
    DATABASE_URL: str = Field(
        default="sqlite+aiosqlite:///./recovery.db",
        alias="DATABASE_URL"
    )
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # LLM (Groq)
    GROQ_API_KEY: str = Field(default="", alias="GROQ_API_KEY")
    GROQ_MODEL: str = Field(default="qwen/qwen3.8-27b", alias="GROQ_MODEL")
    
    # Sarvam AI (Hinglish Voice Recovery)
    SARVAM_API_KEY: str = Field(default="", alias="SARVAM_API_KEY")
    
    # LangSmith Observability & Tracing
    LANGSMITH_TRACING: bool = Field(default=False, alias="LANGSMITH_TRACING")
    LANGSMITH_API_KEY: str = Field(default="", alias="LANGSMITH_API_KEY")
    LANGSMITH_PROJECT: str = Field(default="RecoveraX", alias="LANGSMITH_PROJECT")
    LANGSMITH_ENDPOINT: str = Field(default="https://api.smith.langchain.com", alias="LANGSMITH_ENDPOINT")
    
    # Demo & Retry Configurations
    DEMO_MODE: bool = Field(default=False, alias="DEMO_MODE")
    DEMO_RETRY_DELAY_SECONDS: int = Field(default=10, alias="DEMO_RETRY_DELAY_SECONDS")
    
    # Safety & Policy Engine Thresholds
    MAX_AUTO_RETRY_AMOUNT: float = Field(default=5000.0, alias="MAX_AUTO_RETRY_AMOUNT")
    MAX_RETRIES: int = Field(default=2, alias="MAX_RETRIES")
    MIN_AUTO_RECOVERY_SCORE: int = Field(default=80, alias="MIN_AUTO_RECOVERY_SCORE")
    HUMAN_APPROVAL_AMOUNT: float = Field(default=5000.0, alias="HUMAN_APPROVAL_AMOUNT")
    
    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000"]

    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
