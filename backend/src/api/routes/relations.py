"""Relation analysis endpoints — researcher r-vulnchain / Relation Analysis screen.

AUDIT-FIXED (infra gap, round 1): no route/query existed for the real vulnerability
chain (Technique -EXPLOITS-> Vulnerability -ROOT_CAUSE-> Weakness -MAPS_TO_PATTERN->
Attack_Pattern). GET /entities/{id} can't reconstruct it (single-hop, outgoing
edges only, and EXPLOITS points INTO Vulnerability rather than out of it).

AUDIT-FIXED (feature gap, round 2 -- CYB-19 parity pass): the screen this backs
only ever supported that ONE hardcoded chain. CYB-19's mockup defines a full
17-row Relation Type Summary table and a Relation Instance Explorer that can
browse ANY of the 17 relationship types. /summary and /instances below back
those two mockup features with real Neo4j data (not the 17 relations were
individually pre-scripted -- one generic parameterized-by-whitelist query
handles all of them, see q_relation_type_summary/q_relation_instances).
"""
from collections import Counter

from fastapi import APIRouter, Depends, HTTPException
from neo4j import Driver

from src.api.dependencies import get_driver
from src.kg.queries.relations import (
    Q_VULN_CHAIN, RELATIONSHIP_TYPES, q_relation_type_summary, q_relation_instances,
)

router = APIRouter(prefix="/relations", tags=["relations"])


@router.get("/vuln-chain")
def vuln_chain(driver: Driver = Depends(get_driver)):
    """GET /api/v1/relations/vuln-chain — Technique->Vulnerability->Weakness->Attack_Pattern."""
    with driver.session() as s:
        result = s.run(Q_VULN_CHAIN)
        return {"success": True, "data": [dict(r) for r in result]}


@router.get("/types")
def relation_types():
    """GET /api/v1/relations/types — the 17-type whitelist (for building
    Relation Type / Instance Explorer dropdowns client-side)."""
    return {"success": True, "data": RELATIONSHIP_TYPES}


@router.get("/summary")
def relation_summary(driver: Driver = Depends(get_driver)):
    """GET /api/v1/relations/summary — CYB-19 r-vulnchain "Relation Type Summary"
    tab: count + evidence_class breakdown + avg endpoint confidence for all 17
    relationship types in one call."""
    with driver.session() as s:
        rows = []
        for rel_type in RELATIONSHIP_TYPES:
            rec = s.run(q_relation_type_summary(rel_type), rel_type=rel_type).single()
            count = rec["count"] if rec else 0
            if not count:
                rows.append({
                    "relation_type": rel_type, "from_label": None, "to_label": None,
                    "count": 0, "avg_confidence": None, "evidence_class_counts": {},
                })
                continue
            ec_counts = dict(Counter(ec for ec in rec["evidence_classes"] if ec))
            rows.append({
                "relation_type": rel_type,
                "from_label": rec["from_label"],
                "to_label": rec["to_label"],
                "count": count,
                "avg_confidence": round(rec["avg_confidence"], 2) if rec["avg_confidence"] is not None else None,
                "evidence_class_counts": ec_counts,
            })
        return {"success": True, "data": rows}


@router.get("/instances")
def relation_instances(
    relation_type: str,
    attack_id: str | None = None,
    driver: Driver = Depends(get_driver),
):
    """GET /api/v1/relations/instances?relation_type=X&attack_id=Y — CYB-19
    r-vulnchain "Relation Instance Explorer" tab: real instances of ANY of the
    17 relationship types, optionally scoped to one attack case."""
    if relation_type not in RELATIONSHIP_TYPES:
        raise HTTPException(400, detail={"code": "UNKNOWN_RELATION_TYPE", "allowed": RELATIONSHIP_TYPES})
    with driver.session() as s:
        result = s.run(q_relation_instances(relation_type), relation_type=relation_type, attack_id=attack_id)
        data = [
            {
                "from": {"labels": r["from_labels"], "properties": dict(r["from_props"] or {})},
                "relation": {"type": r["rel_type"], "properties": dict(r["rel_props"] or {})},
                "to": {"labels": r["to_labels"], "properties": dict(r["to_props"] or {})},
            }
            for r in result
        ]
        return {"success": True, "data": data}
