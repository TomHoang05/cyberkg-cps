"""Test fixtures — T012 Sprint 0."""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock
from src.main import app
from src.api.dependencies import get_driver

@pytest.fixture
def client():
    def mock_driver():
        return MagicMock()
    app.dependency_overrides[get_driver] = mock_driver
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
