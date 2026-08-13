"""Entity endpoints — D-19 §7 GET /entities + /entities/{id}.

AUDIT-FIXED (SEVERE): previous version passed raw Neo4j Node objects to dict()
which is not JSON-serializable — every call raised an unhandled 500. Now uses
_shape_node() which extracts properties(n) + labels(n) from plain dict results.
GET /{entity_id} also returns bidirectional relationships with a `direction` field.
"""
from fastapi import APIRouter, Depends, Query
from neo4j import Driver
from src.api.dependencies import get_driver
from src.api.models.responses import EntityType, EvidenceClass
from src.kg.queries.entities import Q_LIST_ENTITIES, Q_GET_ENTITY

router = APIRouter(prefix="/entities", tags=["entities"])


def _shape_node(props, labels):
    """Convert Neo4j properties dict + labels list into a serializable dict."""
    if not props:
        return None
    return {"properties": dict(props), "labels": list(labels) if labels else []}


@router.get("")
def list_entities(
    type: EntityType,
    attack_id: str | None = None,
    plane: str = "all",
    evidence_class: EvidenceClass | None = None,
    page: int = 1,
    page_size: int = Query(default=20, le=100),
    driver: Driver = Depends(get_driver),
):
    """GET /api/v1/entities — D-19 §7.1"""
    skip = (page - 1) * page_size
    with driver.session() as s:
        result = s.run(
            Q_LIST_ENTITIES,
            entity_type=type.value,
            attack_id=attack_id,
            skip=skip,
            limit=page_size,
        )
        data = [
            _shape_node(r["props"], r["labels"])
            for r in result
            if r["props"] is not None
        ]
    return {"success": True, "data": data, "meta": {"page": page, "page_size": page_size}}


@router.get("/{entity_id}")
def get_entity(entity_id: str, driver: Driver = Depends(get_driver)):
    """GET /api/v1/entities/{entity_id} — D-19 §7.2"""
    with driver.session() as s:
        result = s.run(Q_GET_ENTITY, entity_id=entity_id).single()
        if not result or not result["props"]:
            from fastapi import HTTPException
            raise HTTPException(404, detail={"code": "ENTITY_NOT_FOUND"})

        # Build relationship list — filter out None entries (OPTIONAL MATCH rows)
        relationships = []
        for rel in (result.get("outgoing") or []):
            if rel.get("rel_type"):
                relationships.append({
                    "direction": "outgoing",
                    "rel_type": rel["rel_type"],
                    "node": _shape_node(rel.get("target"), rel.get("target_labels")),
                })
        for rel in (result.get("incoming") or []):
            if rel.get("rel_type"):
                relationships.append({
                    "direction": "incoming",
                    "rel_type": rel["rel_type"],
                    "node": _shape_node(rel.get("source"), rel.get("source_labels")),
                })

        return {
            "success": True,
            "data": {
                **_shape_node(result["props"], result["labels"]),
                "relationships": relationships,
            },
        }
