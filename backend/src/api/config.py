"""Application configuration — D-18 §III.4 LLM config + D-19 §10 CORS settings."""
from pydantic_settings import BaseSettings
from pydantic import Field


class LLMConfig(BaseSettings):
    """LLM provider settings (D-18 §III.4)."""
    LLM_PRIMARY: str = "openai"
    LLM_MODEL_OPENAI: str = "gpt-4o"
    LLM_MODEL_ANTHROPIC: str = "claude-sonnet-4-6"
    LLM_MAX_TOKENS: int = 2000
    LLM_TEMPERATURE: float = 0.2
    LLM_CACHE_ENABLED: bool = True
    LLM_CACHE_TTL: int = 86400           # 24h
    OPENAI_API_KEY: str = Field(default="", env="OPENAI_API_KEY")
    ANTHROPIC_API_KEY: str = Field(default="", env="ANTHROPIC_API_KEY")

    class Config:
        # Try project-root .env (when uvicorn is run from backend/) then
        # fall back to a local .env (when tests run from the project root).
        env_file = ["../.env", ".env"]
        extra = "ignore"


class AppSettings(BaseSettings):
    """App-level settings — Neo4j, Redis, CORS."""
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str = "password"
    REDIS_URL: str = "redis://localhost:6379/0"
    ALLOWED_ORIGINS: list[str] = ["http://localhost:5173"]
    APP_ENV: str = "development"

    class Config:
        # Try project-root .env (when uvicorn is run from backend/) then
        # fall back to a local .env (when tests run from the project root).
        env_file = ["../.env", ".env"]
        extra = "ignore"


settings = AppSettings()
llm_config = LLMConfig()
