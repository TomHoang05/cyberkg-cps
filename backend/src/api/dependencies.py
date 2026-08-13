"""FastAPI dependency injection — Neo4j driver + LLMConfig."""
from neo4j import GraphDatabase, Driver
from functools import lru_cache
from src.api.config import settings, llm_config, LLMConfig


@lru_cache(maxsize=1)
def get_driver() -> Driver:
    return GraphDatabase.driver(
        settings.NEO4J_URI,
        auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD)
    )


def get_llm_config() -> LLMConfig:
    return llm_config
