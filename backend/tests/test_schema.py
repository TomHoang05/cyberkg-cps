"""T020-T021: Entity + relationship DDL tests."""
import pytest

def test_health_endpoint(client):
    resp = client.get("/api/v1/health")
    assert resp.status_code == 200
    assert resp.json()["success"] is True

def test_schema_endpoint(client):
    resp = client.get("/api/v1/schema")
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert len(data["entity_types"]) == 17
    assert len(data["relationship_types"]) == 17
