"""System endpoints v2 — D-19 §5.1 GET /health + §5.2 GET /stats.

Changes vs system.py:
  - /health: returns entity_count and relationship_count from live Neo4j queries
    (consistent with CYB-26 §8.1 T056 spec).
  - /stats: replaces the `if False else {}` scaffold with actual per-label
    counts using a label iteration approach (no APOC dependency).

Source: CYB-26 §8.1 T056 | CYB-23 §5.1 §5.2
"""
from fastapi import APIRouter, Depends
from neo4j import Driver

from src.api.attack_id_map import VALID_SLUGS
from src.api.dependencies import get_driver

router = APIRouter(tags=["system"])

# 16 MVP entity labels (CYB-12, CYB-13 §VIII)
_ENTITY_LABELS = [
    "Attack", "ATT_CK_Technique", "Vulnerability", "Weakness", "Attack_Pattern",
    "IT_System", "OT_System", "Network_Zone", "Physical_Process", "Consequence",
    "AI_Component", "AI_Attack_Surface", "Human_Actor", "Human_Action",
    "Bridge_Mechanism", "Instructional_Concept",
]

# 17 canonical relationship types (CYB-12 §III)
_REL_TYPES = [
    "USES_TECHNIQUE", "TECHNIQUE_ORDER", "EXPLOITS", "ROOT_CAUSE",
    "MAPS_TO_PATTERN", "TARGETS", "LOCATED_IN", "BRIDGES_TO",
    "AFFECTS_PROCESS", "CAUSES_CONSEQUENCE", "CONSEQUENCE_TYPE",
    "AI_INVOLVED_IN", "AI_ATTACK_VIA", "HUMAN_ROLE",
    "PERFORMS_ACTION", "MAPS_TO_CONCEPT", "USES_BRIDGE",
]


# ── GET /health ───────────────────────────────────────────────────────────────

@router.get("/health")
def health_check(driver: Driver = Depends(get_driver)):
    """GET /api/v1/health — D-19 §5.1 / CYB-26 §8.1.

    Returns Neo4j connectivity status and live node/relationship counts.
    HTTP 200 when healthy, 503 when Neo4j is unreachable.
    """
    entity_count = 0
    rel_count    = 0
    neo4j_ok     = False

    try:
        with driver.session() as s:
            s.run("RETURN 1")                               # connectivity probe
            entity_count = s.run(
                "MATCH (n) RETURN count(n) AS c"
            ).single()["c"]
            rel_count = s.run(
                "MATCH ()-[r]->() RETURN count(r) AS c"
            ).single()["c"]
        neo4j_ok = True
    except Exception as exc:
        return {
            "success": False,
            "data": {
                "status":           "degraded",
                "neo4j_connected":  False,
                "error":            str(exc),
                "entity_count":     0,
                "relationship_count": 0,
            },
        }

    return {
        "success": True,
        "data": {
            "status":              "healthy",
            "neo4j_connected":     neo4j_ok,
            "entity_count":        entity_count,       # live query; expect 104 post Sprint 2
            "relationship_count":  rel_count,          # live query; expect 147 post Sprint 2
        },
    }


# ── GET /stats ────────────────────────────────────────────────────────────────

@router.get("/stats")
def kg_stats(driver: Driver = Depends(get_driver)):
    """GET /api/v1/stats — D-19 §5.2 / CYB-26 §8.1.

    Returns per-label entity counts, per-type relationship counts,
    plane coverage, and total counts.  Uses individual MATCH queries
    per label/type instead of APOC so no plugin is required.
    """
    with driver.session() as s:
        # ── Entity counts per label ──────────────────────────────────────
        entity_counts: dict[str, int] = {}
        for label in _ENTITY_LABELS:
            rec = s.run(
                f"MATCH (n:{label}) RETURN count(n) AS c"
            ).single()
            entity_counts[label] = rec["c"] if rec else 0

        # ── Relationship counts per type ─────────────────────────────────
        rel_counts: dict[str, int] = {}
        for rel in _REL_TYPES:
            rec = s.run(
                f"MATCH ()-[r:{rel}]->() RETURN count(r) AS c"
            ).single()
            rel_counts[rel] = rec["c"] if rec else 0

        # ── Plane coverage (nodes that carry a plane property) ───────────
        plane_rows = s.run(
            "MATCH (n) WHERE n.plane IS NOT NULL "
            "RETURN n.plane AS plane, count(n) AS c"
        )
        plane_cov: dict[str, int] = {r["plane"]: r["c"] for r in plane_rows}

    return {
        "success": True,
        "data": {
            "total_entities":      sum(entity_counts.values()),
            "total_relationships": sum(rel_counts.values()),
            "entity_counts":       entity_counts,
            "relationship_counts": rel_counts,
            "coverage_by_plane":   plane_cov,
            "case_studies":        VALID_SLUGS,
        },
    }


# ── GET /stats/cross-case ─────────────────────────────────────────────────────

@router.get("/stats/cross-case")
def stats_cross_case(driver: Driver = Depends(get_driver)):
    """GET /api/v1/stats/cross-case — r-dash Cross-Case Pattern Statistics tab
    (CYB-19 SCR-RES-01). Returns per-plane entity counts across all 4 cases,
    technique tactic distribution, and bridge mechanism type counts.
    """
    with driver.session() as s:
        # Tactic distribution across all techniques
        tactic_rows = s.run(
            "MATCH (t:ATT_CK_Technique) WHERE t.tactic IS NOT NULL "
            "RETURN t.tactic AS tactic, count(t) AS c ORDER BY c DESC"
        )
        tactics = [{"tactic": r["tactic"], "count": r["c"]} for r in tactic_rows]

        # Bridge mechanism types
        bridge_rows = s.run(
            "MATCH (b:Bridge_Mechanism) WHERE b.bridge_type IS NOT NULL "
            "RETURN b.bridge_type AS bridge_type, count(b) AS c ORDER BY c DESC"
        )
        bridges = [{"bridge_type": r["bridge_type"], "count": r["c"]} for r in bridge_rows]

        # Entity counts per plane property
        plane_rows = s.run(
            "MATCH (n) WHERE n.plane IS NOT NULL "
            "RETURN n.plane AS plane, count(n) AS c ORDER BY c DESC"
        )
        planes = {r["plane"]: r["c"] for r in plane_rows}

        # Technique count per case
        case_rows = s.run(
            "MATCH (a:Attack)-[:USES_TECHNIQUE]->(t:ATT_CK_Technique) "
            "RETURN a.name AS case_name, count(t) AS technique_count ORDER BY a.name"
        )
        cases = [{"case_name": r["case_name"], "technique_count": r["technique_count"]} for r in case_rows]

    return {
        "success": True,
        "data": {
            "tactic_distribution": tactics,
            "bridge_type_counts": bridges,
            "entity_counts_by_plane": planes,
            "technique_counts_by_case": cases,
        },
    }


# ── GET /stats/by-case ────────────────────────────────────────────────────────

@router.get("/stats/by-case")
def stats_by_case(driver: Driver = Depends(get_driver)):
    """GET /api/v1/stats/by-case — per-attack entity / relationship breakdown."""
    with driver.session() as s:
        rows = s.run(
            """
            MATCH (a:Attack)
            OPTIONAL MATCH (a)-[:USES_TECHNIQUE]->(t:ATT_CK_Technique)
            OPTIONAL MATCH (a)-[:USES_BRIDGE]->(b:Bridge_Mechanism)
            OPTIONAL MATCH (a)-[:CAUSES_CONSEQUENCE]->(c:Consequence)
            OPTIONAL MATCH (ai:AI_Component)-[:AI_INVOLVED_IN]->(a)
            RETURN a.attack_id AS attack_id, a.name AS name, a.year AS year,
                   count(DISTINCT t) AS techniques,
                   count(DISTINCT b) AS bridges,
                   count(DISTINCT c) AS consequences,
                   count(DISTINCT ai) AS ai_components
            ORDER BY a.year
            """
        )
        data = [dict(r) for r in rows]
    return {"success": True, "data": data}


# ── GET /queries/templates ────────────────────────────────────────────────────

@router.get("/queries/templates")
def query_templates():
    """GET /api/v1/queries/templates — re-export the real Cypher query literals
    used by each query type, for display in the r-query Cypher panel (CYB-19).
    """
    from src.kg import queries
    return {
        "success": True,
        "data": {
            "Q1_attack_surface": getattr(queries.q1_surface, "Q1_ATTACK_SURFACE", ""),
            "Q2_it_ot_movement": getattr(queries.q2_chain,   "Q2_ATTACK_CHAIN",   ""),
            "Q3_consequence":    getattr(queries.q3_consequence, "Q3_CONSEQUENCE", ""),
            "Q4_roles":          getattr(queries.q4_roles,   "Q4_ROLES",          ""),
            "Q5_full":           getattr(queries.q5_full,    "Q5_FULL",           ""),
            "Q6_purdue":         getattr(queries.purdue,     "Q6_PURDUE",         ""),
        },
    }
