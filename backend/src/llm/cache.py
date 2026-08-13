"""LLM output cache — Redis (prod) / in-memory dict (dev). D-18 §VII."""
import json
from typing import Optional
try:
    import redis as redis_lib
    _redis_client = None

    def _get_redis():
        global _redis_client
        if _redis_client is None:
            from src.api.config import settings
            _redis_client = redis_lib.from_url(settings.REDIS_URL)
        return _redis_client

    _USE_REDIS = True
except ImportError:
    _USE_REDIS = False

_memory_cache: dict = {}  # fallback for development


def get_cache(key: str) -> Optional[dict]:
    if _USE_REDIS:
        try:
            val = _get_redis().get(key)
            return json.loads(val) if val else None
        except Exception:
            pass
    return _memory_cache.get(key)


def set_cache(key: str, value: dict, ttl: int = 86400) -> None:
    if _USE_REDIS:
        try:
            _get_redis().setex(key, ttl, json.dumps(value, default=str))
            return
        except Exception:
            pass
    _memory_cache[key] = value
