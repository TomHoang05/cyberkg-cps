"""Attack endpoints v2 — D-19 §5.3 + §6 Q1–Q6 query types.

Changes vs attacks.py:
  - All /{attack_id}/* handlers call resolve_attack_id() to map the URL slug
    (e.g. 'colonial_pipeline_2021') to the Neo4j attack_id (e.g. 'ATK-COL-001')
    before executing any Cypher query.
  - GET /attacks list response includes 'slug' field alongside the KG attack_id.
  - 404 ATTACK_NOT_FOUND returned as a proper JSON error envelope on invalid slug.
  - narrative POST endpoint unchanged (Sprint 4).
  - GET /{slug}/provenance — AUDIT-FIXED (feature gap): per-fact provenance.

Source: CYB-26 §8.2 + §8.3
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from neo4j import Driver

from src.api.attack_id_map import SLUG_TO_ATTACK_ID, SLUG_TO_NAME, resolve_attack_id
from src.api.config import LLMConfig
from src.api.dependencies import get_driver, get_llm_config
from src.api.models.responses import AudienceType
from src.api.services.narrative_service import generate_and_persist
from src.kg.queries.provenance_records import Q_ATTACK_PROVENANCE
from src.kg import queries

router = APIRouter(prefix="/attacks", tags=["attacks"])

# ── Helpers ───────────────────────────────────────────────────────────────────

def _not_found(slug: str) -> HTTPException:
    """Standard 404 response for an unrecognised attack slug."""
    return HTTPException(
        status_code=404,
        detail={
            "code":    "ATTACK_NOT_FOUND",
            "message": f"Attack {slug!r} not found in KG",
            "detail":  f"Available attacks: {list(SLUG_TO_ATTACK_ID.keys())}",
            "status_http": 404,
        },
    )


# ── GET /attacks — list all 4 MVP cases ──────────────────────────────────────

@router.get("")
def list_attacks(
    audience: AudienceType = AudienceType.INSTRUCTOR,
    driver: Driver = Depends(get_driver),
):
    """GET /api/v1/attacks — D-19 §5.3.

    Returns all 4 MVP attack cases with KG metadata.
    audience param filters detail level (student strips entity/rel counts).
    """
    with driver.session() as s:
        result = s.run(queries.q1_surface.LIST_ATTACKS)
        rows = [dict(r) for r in result]

    # Add slug field so the SPA can build the correct /attacks/{slug}/surface URL
    for row in rows:
        kg_id = row.get("attack_id", "")
        from src.api.attack_id_map import ATTACK_ID_TO_SLUG
        row["slug"] = ATTACK_ID_TO_SLUG.get(kg_id, kg_id)

    if audience == AudienceType.STUDENT:
        for row in rows:
            row.pop("entity_count", None)
            row.pop("relationship_count", None)

    return {"success": True, "data": rows}


# ── GET /attacks/{slug} — single case detail ─────────────────────────────────

@router.get("/{slug}")
def get_attack(
    slug: str,
    driver: Driver = Depends(get_driver),
):
    """GET /api/v1/attacks/{slug} — D-19 §5.3 single attack detail."""
    try:
        kg_id = resolve_attack_id(slug)
    except ValueError:
        raise _not_found(slug)

    with driver.session() as s:
        rec = s.run(
            "MATCH (a:Attack {attack_id: $kg_id}) RETURN properties(a) AS props",
            kg_id=kg_id,
        ).single()

    if not rec:
        raise _not_found(slug)

    props = dict(rec["props"])
    props["slug"] = slug
    return {"success": True, "data": props}


# ── GET /attacks/{slug}/surface — Q1 Attack Surface ──────────────────────────

@router.get("/{slug}/surface")
def attack_surface(
    slug: str,
    depth: int = Query(default=3, ge=1, le=5),
    plane: str = "all",
    audience: AudienceType = AudienceType.INSTRUCTOR,
    include_provenance: bool = False,
    driver: Driver = Depends(get_driver),
):
    """GET /api/v1/attacks/{slug}/surface — D-19 §6.1 Query Type 1."""
    try:
        kg_id = resolve_attack_id(slug)
    except ValueError:
        raise _not_found(slug)

    with driver.session() as s:
        rec = s.run(
            queries.q1_surface.Q1_ATTACK_SURFACE,
            attack_id=kg_id,
            depth=depth,
        ).single()

    if not rec:
        raise _not_found(slug)

    data = dict(rec)
    data["slug"] = slug
    data["query_type"] = "attack_surface"

    # Strip provenance for student audience
    if audience == AudienceType.STUDENT and not include_provenance:
        for t in data.get("techniques", []):
            t.pop("confidence", None)
        for sys in data.get("systems", []):
            sys.pop("confidence", None)

    return {"success": True, "data": data}


# ── GET /attacks/{slug}/chain — Q2 IT-OT Movement ────────────────────────────

@router.get("/{slug}/chain")
def attack_chain(
    slug: str,
    audience: AudienceType = AudienceType.INSTRUCTOR,
    driver: Driver = Depends(get_driver),
):
    """GET /api/v1/attacks/{slug}/chain — D-19 §6.2 Query Type 2."""
    try:
        kg_id = resolve_attack_id(slug)
    except ValueError:
        raise _not_found(slug)

    with driver.session() as s:
        rows = list(s.run(queries.q2_chain.Q2_ATTACK_CHAIN, attack_id=kg_id))

    if not rows:
        raise _not_found(slug)

    chain = [dict(r) for r in rows]

    # Student audience: strip confidence scores
    if audience == AudienceType.STUDENT:
        for step in chain:
            step.pop("confidence", None)

    return {
        "success": True,
        "data": {
            "slug":       slug,
            "query_type": "it_ot_movement",
            "chain":      chain,
            "total_steps": len(chain),
        },
    }


# ── GET /attacks/{slug}/consequence — Q3 Physical Consequences ───────────────

@router.get("/{slug}/consequence")
def attack_consequence(
    slug: str,
    audience: AudienceType = AudienceType.INSTRUCTOR,
    driver: Driver = Depends(get_driver),
):
    """GET /api/v1/attacks/{slug}/consequence — D-19 §6.3 Query Type 3."""
    try:
        kg_id = resolve_attack_id(slug)
    except ValueError:
        raise _not_found(slug)

    with driver.session() as s:
        rows = list(s.run(queries.q3_consequence.Q3_CONSEQUENCE, attack_id=kg_id))

    if not rows:
        raise _not_found(slug)

    consequences = [dict(r) for r in rows]

    if audience == AudienceType.STUDENT:
        for c in consequences:
            c.pop("confidence", None)
            c.pop("severity", None)

    return {
        "success": True,
        "data": {
            "slug":         slug,
            "query_type":   "physical_consequences",
            "consequences": consequences,
        },
    }


# ── GET /attacks/{slug}/roles — Q4 AI/Human Roles ────────────────────────────

@router.get("/{slug}/roles")
def attack_roles(
    slug: str,
    audience: AudienceType = AudienceType.INSTRUCTOR,
    driver: Driver = Depends(get_driver),
):
    """GET /api/v1/attacks/{slug}/roles — D-19 §6.4 Query Type 4."""
    try:
        kg_id = resolve_attack_id(slug)
    except ValueError:
        raise _not_found(slug)

    with driver.session() as s:
        rec = s.run(queries.q4_roles.Q4_ROLES, attack_id=kg_id).single()

    if not rec:
        raise _not_found(slug)

    data = dict(rec)

    if audience == AudienceType.STUDENT:
        # Student: role types only, no attribution detail
        data["human_roles"] = [
            {"role": h.get("role")} for h in data.get("human_roles", [])
        ]

    return {
        "success": True,
        "data": {
            "slug":             slug,
            "query_type":       "ai_human_role",
            "human_roles":      data.get("human_roles", []),
            "ai_components":    data.get("ai_components", []),
            "has_hypothetical_ai": any(
                ai.get("is_hypothetical") for ai in data.get("ai_components", [])
            ),
        },
    }


# ── GET /attacks/{slug}/full — Q5 Composite ──────────────────────────────────

@router.get("/{slug}/full")
def attack_full(
    slug: str,
    audience: AudienceType = AudienceType.INSTRUCTOR,
    driver: Driver = Depends(get_driver),
):
    """GET /api/v1/attacks/{slug}/full — D-19 §6.5 Query Type 5 (Q1+Q2+Q3+Q4)."""
    try:
        kg_id = resolve_attack_id(slug)
    except ValueError:
        raise _not_found(slug)

    with driver.session() as s:
        rec = s.run(queries.q5_full.Q5_FULL, attack_id=kg_id).single()

    if not rec:
        raise _not_found(slug)

    data = dict(rec)
    data["slug"]       = slug
    data["query_type"] = "full_chain"

    # Compute evidence class distribution from technique confidence fields
    chain = data.get("chain", [])
    ec = {"documented_fact": 0, "supported_inference": 0, "instructional_extension": 0}
    for step in chain:
        cls = step.get("evidence_class") or step.get("evidence")
        if cls in ec:
            ec[cls] += 1
    data["evidence_class_distribution"] = ec

    return {"success": True, "data": data}


# ── GET /attacks/{slug}/purdue — Q6 Purdue Diagram ───────────────────────────

@router.get("/{slug}/purdue")
def attack_purdue(
    slug: str,
    audience: AudienceType = AudienceType.INSTRUCTOR,
    driver: Driver = Depends(get_driver),
):
    """GET /api/v1/attacks/{slug}/purdue — D-19 §6.6 Query Type 6 / T053b."""
    try:
        kg_id = resolve_attack_id(slug)
    except ValueError:
        raise _not_found(slug)

    with driver.session() as s:
        rows = list(s.run(queries.purdue.Q6_PURDUE, attack_id=kg_id))

    if not rows:
        raise _not_found(slug)

    return {
        "success": True,
        "data": {
            "slug":       slug,
            "query_type": "purdue_diagram",
            "levels":     [dict(r) for r in rows],
        },
    }


# ── GET /attacks/{slug}/provenance — CYB-19 SCR-RES-05 ──────────────────────

@router.get("/{slug}/provenance")
def attack_provenance(
    slug: str,
    driver: Driver = Depends(get_driver),
):
    """GET /api/v1/attacks/{slug}/provenance — r-provenance "Data Provenance" tab
    (CYB-19 SCR-RES-05). AUDIT-FIXED (feature gap): previously no route surfaced
    per-fact provenance (source citation + confidence) grouped by attack case.
    """
    try:
        kg_id = resolve_attack_id(slug)
    except ValueError:
        raise _not_found(slug)

    with driver.session() as s:
        rec = s.run(Q_ATTACK_PROVENANCE, attack_id=kg_id).single()
        records = [r for r in (rec["records"] if rec else []) if r is not None]
    return {"success": True, "data": records}


# ── POST /attacks/{slug}/narrative — Sprint 4 / T062 ─────────────────────────

@router.post("/{slug}/narrative", status_code=201)
def trigger_narrative(
    slug: str,
    driver: Driver = Depends(get_driver),
    llm_cfg: LLMConfig = Depends(get_llm_config),
):
    """POST /api/v1/attacks/{slug}/narrative — Sprint 4 / T062.

    Runs Q1-Q4 -> transform -> LLM -> persists narrative to the Neo4j
    Attack node.  Subsequent calls overwrite the stored narrative.
    After this returns, GET /attacks/{slug}/dossier serves the pre-computed
    narrative as a .docx file with no further LLM call.
    """
    try:
        kg_id = resolve_attack_id(slug)
    except ValueError:
        raise _not_found(slug)

    try:
        result = generate_and_persist(
            attack_id=kg_id,
            driver=driver,
            llm_cfg=llm_cfg,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Narrative generation failed: " + str(exc),
        ) from exc

    return {
        "success": True,
        "data": {
            "slug":                    slug,
            "attack_id":               kg_id,
            "narrative_generated_at":  result.narrative_generated_at.isoformat(),
            "narrative_model_used":    result.narrative_model_used,
            "narrative_kg_confidence": result.narrative_kg_confidence,
        },
    }
