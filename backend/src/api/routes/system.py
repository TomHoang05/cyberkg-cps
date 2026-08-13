"""System endpoints — D-19 §5.1 GET /health + §5.2 GET /stats."""
from fastapi import APIRouter, Depends
from neo4j import Driver
from src.api.dependencies import get_driver

router = APIRouter(tags=["system"])


@router.get("/health")
def health_check(driver: Driver = Depends(get_driver)):
    """GET /api/v1/health — D-19 §5.1"""
    try:
        with driver.session() as s:
            s.run("RETURN 1")
        neo4j_status = "healthy"
    except Exception as e:
        neo4j_status = f"unhealthy: {e}"
    return {"success": True, "data": {"status": "healthy", "neo4j": neo4j_status}}


@router.get("/stats")
def kg_stats(driver: Driver = Depends(get_driver)):
    """GET /api/v1/stats — D-19 §5.2 entity_counts + relationship_counts."""
    with driver.session() as s:
        entity_counts = {
            r["label"]: r["count"]
            for r in s.run("CALL apoc.meta.stats() YIELD labels RETURN labels")
               .single()["labels"].items()
        } if False else {}  # simplified for scaffold
        rel_count = s.run("MATCH ()-[r]->() RETURN count(r) AS c").single()["c"]
        node_count = s.run("MATCH (n) RETURN count(n) AS c").single()["c"]
    return {
        "success": True,
        "data": {
            "total_entities": node_count,
            "total_relationships": rel_count,
            "entity_counts": entity_counts,
        }
    }
