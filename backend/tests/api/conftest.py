"""T055 pytest fixtures - TestClient with mocked Neo4j driver.

Strategy: replace the FastAPI lifespan with a no-op before constructing
TestClient, and override the DI-injected driver with a MagicMock.  This
avoids any real Neo4j connection attempts.

Source: CYB-26 section 13.1 | Sprint 3 Guide section 12 T055
"""
import pytest
from contextlib import asynccontextmanager
from unittest.mock import MagicMock
from fastapi import FastAPI
from fastapi.testclient import TestClient


# ── Build a lean test app (no lifespan) ──────────────────────────────────────

def _make_test_app(mock_driver: MagicMock) -> FastAPI:
    """Return a FastAPI app with v2 routers and a no-op lifespan."""

    @asynccontextmanager
    async def noop_lifespan(app: FastAPI):
        yield  # no-op: avoids real Neo4j calls at startup

    from fastapi.middleware.cors import CORSMiddleware
    from src.api.routes import dossier, entities, schema_route
    from src.api.routes import attacks_v2, generate_v2, system_v2

    app = FastAPI(
        title="CyberKG-CPS API (test)",
        version="1.0.0",
        lifespan=noop_lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173"],
        allow_credentials=False,
        allow_methods=["GET", "OPTIONS", "POST"],
        allow_headers=["Content-Type", "Accept"],
    )
    app.include_router(system_v2.router,    prefix="/api/v1")
    app.include_router(attacks_v2.router,   prefix="/api/v1")
    app.include_router(generate_v2.router,  prefix="/api/v1")
    app.include_router(dossier.router,      prefix="/api/v1")
    app.include_router(entities.router,     prefix="/api/v1")
    app.include_router(schema_route.router, prefix="/api/v1")

    from src.api.dependencies import get_driver
    app.dependency_overrides[get_driver] = lambda: mock_driver

    return app


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture
def mock_session():
    """A MagicMock Neo4j session.  Tests configure .run() as needed."""
    session = MagicMock()
    session.run.return_value = MagicMock()
    session.run.return_value.single.return_value = None
    return session


@pytest.fixture
def client(mock_session):
    """TestClient backed by a no-lifespan test app with mocked Neo4j."""
    mock_driver = MagicMock()
    mock_driver.session.return_value.__enter__ = lambda s: mock_session
    mock_driver.session.return_value.__exit__ = MagicMock(return_value=False)

    app = _make_test_app(mock_driver)
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c


# ── Canonical mock data (TC-SPR3 test case data) ──────────────────────────────

MOCK_ATTACK_SURFACE_ROW = {
    "attack_id":       "ATK-COL-001",
    "name":            "Colonial Pipeline",
    "year":            2021,
    "industry_sector": "energy",
    "attributed_to":   "DarkSide",
    "evidence_class":  "documented_fact",
    "techniques": [
        {
            "technique_id": "T1078",
            "name":         "Valid Accounts",
            "tactic":       "initial-access",
            "plane":        "cyber",
            "evidence_class": "documented_fact",
        },
        {
            "technique_id": "T1021",
            "name":         "Remote Services",
            "tactic":       "lateral-movement",
            "plane":        "cyber",
            "evidence_class": "documented_fact",
        },
        {
            "technique_id": "T1486",
            "name":         "Data Encrypted for Impact",
            "tactic":       "impact",
            "plane":        "cyber",
            "evidence_class": "documented_fact",
        },
    ],
    "systems": [
        {"name": "ITS-VPN", "plane": "cyber",    "purdue_level": 4},
        {"name": "ITS-AD",  "plane": "cyber",    "purdue_level": 3},
    ],
    "zones": [
        {"name": "NZ-CORP", "zone_type": "corporate", "purdue_level": 4},
    ],
}

MOCK_CHAIN_ROWS = [
    {
        "technique_id":   "T1078",
        "technique_name": "Valid Accounts",
        "tactic":         "initial-access",
        "plane":          "cyber",
        "step":           1,
        "purdue_level":   4,
        "bridge_type":    "authorized",
        "bridge_name":    "BRG-VPN",
        "evidence_class": "documented_fact",
        "confidence":     0.95,
    },
    {
        "technique_id":   "T1021",
        "technique_name": "Remote Services",
        "tactic":         "lateral-movement",
        "plane":          "cyber",
        "step":           2,
        "purdue_level":   3,
        "bridge_type":    "authorized",
        "bridge_name":    "BRG-VPN",
        "evidence_class": "documented_fact",
        "confidence":     0.90,
    },
    {
        "technique_id":   "T1486",
        "technique_name": "Data Encrypted for Impact",
        "tactic":         "impact",
        "plane":          "cyber",
        "step":           3,
        "purdue_level":   3,
        "bridge_type":    "authorized",
        "bridge_name":    "BRG-VPN",
        "evidence_class": "documented_fact",
        "confidence":     0.95,
    },
]

MOCK_CONSEQUENCE_ROWS = [
    {
        "consequence":      "Pipeline shutdown",
        "severity":         "high",
        "was_realized":     True,
        "table1_category":  "indirect_disruption",
        "physical_process": "fuel_distribution",
        "evidence_class":   "documented_fact",
        "confidence":       0.95,
    }
]

MOCK_ROLES_ROW = {
    "human_roles": [
        {"actor": "DarkSide group", "role": "attacker", "action": "deployed malware"}
    ],
    "ai_components": [
        {"component": "AIS-DT", "type": "digital_twin", "is_hypothetical": True}
    ],
}

MOCK_FULL_ROW = {
    "a": {"attack_id": "ATK-COL-001", "name": "Colonial Pipeline"},
    "chain": [
        {"id": "T1078", "name": "Valid Accounts", "step": 1},
        {"id": "T1021", "name": "Remote Services", "step": 2},
        {"id": "T1486", "name": "Data Encrypted for Impact", "step": 3},
    ],
    "bridges":       [{"bridge_type": "authorized", "name": "BRG-VPN"}],
    "consequences":  [{"cons": "Pipeline shutdown", "category": "indirect_disruption"}],
    "human_actors":  ["DarkSide group"],
    "ai_components": ["AIS-DT"],
}

MOCK_PURDUE_ROWS = [
    {
        "technique_id":   "T1078",
        "technique_name": "Valid Accounts",
        "system_name":    "ITS-VPN",
        "plane":          "cyber",
        "purdue_level":   4,
        "zone_type":      "enterprise",
    },
    {
        "technique_id":   "T1486",
        "technique_name": "Data Encrypted for Impact",
        "system_name":    "ITS-AD",
        "plane":          "cyber",
        "purdue_level":   3,
        "zone_type":      "corporate",
    },
]
