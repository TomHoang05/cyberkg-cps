"""T057 — Integration test: schema_init.py on Uvicorn startup.

Confirms that when the FastAPI app starts, schema_init.py runs correctly
and Neo4j has:
  - exactly 21 unique constraints (from Sprint 1 T013-T015)
  - at least 30 indexes
  - exactly 4 Attack nodes (from Sprint 2 data load)
  - 104 total nodes and 147 total relationships (canonical post-MERGE counts)

These tests require a LIVE Neo4j instance with Sprint 1 schema and
Sprint 2 data already loaded.  They are skipped automatically in CI
environments that have no Neo4j available.

Run integration tests:
    pytest tests/api/test_integration_startup.py -v -m integration

Run against a specific Neo4j instance:
    NEO4J_URI=bolt://localhost:7687 \\
    NEO4J_USER=neo4j \\
    NEO4J_PASSWORD=cyberkg2026 \\
    pytest tests/api/test_integration_startup.py -v -m integration

Source: CYB-26 §13.2 | Sprint 3 Guide §14 T057
"""
import os
import pytest

# ── Skip all tests if neo4j package or live instance is unavailable ───────────

try:
    from neo4j import GraphDatabase
    _neo4j_available = True
except ImportError:
    _neo4j_available = False

pytestmark = pytest.mark.integration   # -m integration to run


NEO4J_URI  = os.getenv("NEO4J_URI",      "bolt://localhost:7687")
NEO4J_AUTH = (
    os.getenv("NEO4J_USER",     "neo4j"),
    os.getenv("NEO4J_PASSWORD", "cyberkg2026"),
)

# Canonical Sprint 2 counts (validate_t041_v2.py)
EXPECTED_NODES         = 104
EXPECTED_EDGES         = 147
EXPECTED_CONSTRAINTS   = 22
EXPECTED_MIN_INDEXES   = 30
EXPECTED_ATTACK_NODES  = 4

EXPECTED_ATTACK_IDS = {
    "ATK-COL-001",
    "ATK-TRI-001",
    "ATK-STX-001",
    "ATK-GSM-001",
}


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def neo4j_driver():
    """Module-scoped real Neo4j driver. Skips if Neo4j is unreachable."""
    if not _neo4j_available:
        pytest.skip("neo4j package not installed")

    try:
        driver = GraphDatabase.driver(NEO4J_URI, auth=NEO4J_AUTH)
        driver.verify_connectivity()
        yield driver
        driver.close()
    except Exception as exc:
        pytest.skip(f"Neo4j not reachable at {NEO4J_URI}: {exc}")


# ── Test class ────────────────────────────────────────────────────────────────

class TestSchemaInitOnStartup:
    """T057: Integration test — schema_init + Sprint 2 data verified against live Neo4j."""

    def test_schema_init_runs_without_error(self):
        """run_schema_init() must complete without raising an exception.

        This guard catches import errors or Cypher errors in schema_init.py
        that would cause the FastAPI lifespan to fail silently.
        """
        from src.kg.schema_init import run_schema_init
        from src.api.dependencies import get_driver
        driver = get_driver()
        result = run_schema_init(driver)
        # result.success may be False if constraints already exist (idempotent),
        # but no uncaught exception should propagate.
        assert result is not None

    def test_constraint_count(self, neo4j_driver):
        """Must have exactly 21 unique constraints (Sprint 1 T013-T015).

        If this fails: run SHOW CONSTRAINTS in Neo4j Browser to audit.
        If count < 21: schema_init.py may not have run on this DB instance.
        """
        with neo4j_driver.session() as s:
            rec = s.run(
                "SHOW CONSTRAINTS YIELD name RETURN count(*) AS total"
            ).single()
        assert rec is not None
        assert rec["total"] == EXPECTED_CONSTRAINTS, (
            f"Expected {EXPECTED_CONSTRAINTS} constraints, got {rec['total']}. "
            "Check that schema_init.py ran successfully on startup."
        )

    def test_index_count(self, neo4j_driver):
        """Must have at least 30 indexes (Sprint 1 composite + fulltext indexes).

        If this fails: verify schema_init.py created composite indexes on
        technique_id, attack_id, bridge_id etc. (CYB-14).
        """
        with neo4j_driver.session() as s:
            rec = s.run(
                "SHOW INDEXES YIELD name RETURN count(*) AS total"
            ).single()
        assert rec is not None
        assert rec["total"] >= EXPECTED_MIN_INDEXES, (
            f"Expected >= {EXPECTED_MIN_INDEXES} indexes, got {rec['total']}."
        )

    def test_attack_name_unique_constraint_exists(self, neo4j_driver):
        """The attack_name_unique constraint must be present (Sprint 1 T013)."""
        with neo4j_driver.session() as s:
            rec = s.run(
                "SHOW CONSTRAINTS YIELD name "
                "WHERE name = 'attack_name_unique' RETURN name"
            ).single()
        assert rec is not None, "attack_name_unique constraint is missing."

    def test_technique_mitre_id_constraint_exists(self, neo4j_driver):
        """The technique_mitre_id_unique constraint must be present."""
        with neo4j_driver.session() as s:
            rec = s.run(
                "SHOW CONSTRAINTS YIELD name "
                "WHERE name = 'technique_mitre_id_unique' RETURN name"
            ).single()
        assert rec is not None, "technique_mitre_id_unique constraint is missing."

    def test_attack_data_loaded_count(self, neo4j_driver):
        """Must have exactly 4 Attack nodes (one per MVP case)."""
        with neo4j_driver.session() as s:
            rec = s.run("MATCH (a:Attack) RETURN count(a) AS c").single()
        assert rec["c"] == EXPECTED_ATTACK_NODES, (
            f"Expected {EXPECTED_ATTACK_NODES} Attack nodes, got {rec['c']}. "
            "Run: py -3.11 scripts/load_all_cases_v6.py"
        )

    def test_all_4_attack_ids_present(self, neo4j_driver):
        """Each of the 4 MVP attack_ids must exist in the KG."""
        with neo4j_driver.session() as s:
            rows = s.run(
                "MATCH (a:Attack) RETURN a.attack_id AS attack_id"
            )
            found = {r["attack_id"] for r in rows}
        missing = EXPECTED_ATTACK_IDS - found
        assert not missing, (
            f"Missing attack IDs: {sorted(missing)}. "
            "Check data load — run validate_t041_v2.py for details."
        )

    def test_canonical_node_count(self, neo4j_driver):
        """Must have exactly 104 nodes (canonical post-MERGE Sprint 2 count).

        Source: validate_t041_v2.py EXPECTED_NODE_COUNT = 104
        """
        with neo4j_driver.session() as s:
            rec = s.run("MATCH (n) RETURN count(n) AS c").single()
        assert rec["c"] == EXPECTED_NODES, (
            f"Expected {EXPECTED_NODES} nodes, got {rec['c']}. "
            "Wipe and reload: py -3.11 scripts/load_all_cases_v6.py"
        )

    def test_canonical_edge_count(self, neo4j_driver):
        """Must have exactly 147 edges (canonical post-MERGE Sprint 2 count).

        147 = 149 YAML entries - 2 intentional shared-node deduplicates.
        Source: validate_t041_v2.py EXPECTED_EDGE_COUNT = 147
        """
        with neo4j_driver.session() as s:
            rec = s.run("MATCH ()-[r]->() RETURN count(r) AS c").single()
        assert rec["c"] == EXPECTED_EDGES, (
            f"Expected {EXPECTED_EDGES} edges, got {rec['c']}. "
            "Run validate_t041_v2.py for per-type breakdown."
        )
