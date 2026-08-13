"""LLM pipeline unit tests."""
import pytest
from unittest.mock import patch, MagicMock
from src.llm.cache import get_cache, set_cache

def test_cache_roundtrip():
    set_cache("test_key", {"content": "hello"}, ttl=60)
    val = get_cache("test_key")
    assert val == {"content": "hello"}

def test_cache_miss():
    assert get_cache("nonexistent_key_xyz") is None
