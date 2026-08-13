"""T055: Q1-Q5 query type tests."""
import pytest
from unittest.mock import patch, MagicMock

def test_list_attacks_endpoint(client):
    with patch("src.api.routes.attacks.get_driver") as mock:
        mock_session = MagicMock()
        mock_session.run.return_value = []
        mock.return_value.__enter__ = lambda s: mock_session
        mock.return_value.__exit__ = MagicMock(return_value=False)
        resp = client.get("/api/v1/attacks")
        assert resp.status_code == 200
