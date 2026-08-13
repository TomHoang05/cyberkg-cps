"""Attack endpoints -- D-19 S5.3 list/detail + S6 Q1-Q6 query types + Sprint 4 narrative."""
import io

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from neo4j import Driver
from src.api.config import LLMConfig
from src.api.dependencies import get_driver, get_llm_config
from src.api.models.responses import AudienceType
from src.api.services.dossier_builder import build_dossier_docx
from src.api.services.narrative_service import generate_and_persist, get_narrative
from src.kg import queries

router = APIRouter(prefix="/attacks", tags=["attacks"])


@router.get("")
def list_attacks(
    audience: AudienceType = AudienceType.INSTRUCTOR,
    driver: Driver = Depends(get_driver),
):
    """GET /api/v1/attacks -- D-19 S5.3"""
    with driver.session() as s:
        result = s.run(queries.q1_surface.LIST_ATTACKS, audience=audience.value)
        return {"success": True, "data": [dict(r) for r in result]}


@router.get("/{attack_id}/surface")
def attack_surface(
    attack_id: str,
    depth: int = Query(default=3, ge=1, le=5),
    plane: str = "all",
    audience: AudienceType = AudienceType.INSTRUCTOR,
    include_provenance: bool = False,
    driver: Driver = Depends(get_driver),
):
    """GET /api/v1/attacks/{id}/surface -- D-19 S6.1 Query Type 1"""
    with driver.session() as s:
        result = s.run(queries.q1_surface.Q1_ATTACK_SURFACE,
                       attack_id=attack_id, depth=depth)
        return {"success": True, "data": [dict(r) for r in result]}


@router.get("/{attack_id}/chain")
def attack_chain(
    attack_id: str,
    audience: AudienceType = AudienceType.INSTRUCTOR,
    driver: Driver = Depends(get_driver),
):
    """GET /api/v1/attacks/{id}/chain -- D-19 S6.2 Query Type 2"""
    with driver.session() as s:
        result = s.run(queries.q2_chain.Q2_ATTACK_CHAIN, attack_id=attack_id)
        return {"success": True, "data": [dict(r) for r in result]}


@router.get("/{attack_id}/consequence")
def attack_consequence(
    attack_id: str,
    driver: Driver = Depends(get_driver),
):
    """GET /api/v1/attacks/{id}/consequence -- D-19 S6.3 Query Type 3
    Fix 0.2: returns a single object with four_linked_layers (layer_1_cyber,
    layer_2_bridge, layer_3_physical, layer_4_consequence).
    """
    with driver.session() as s:
        row = s.run(queries.q3_consequence.Q3_CONSEQUENCE, attack_id=attack_id).single()
        return {"success": True, "data": dict(row) if row else {}}


@router.get("/{attack_id}/roles")
def attack_roles(
    attack_id: str,
    driver: Driver = Depends(get_driver),
):
    """GET /api/v1/attacks/{id}/roles -- D-19 S6.4 Query Type 4
    Fix 0.1: returns a single object with human_roles, ai_components,
    ai_attack_surfaces (via AI_ATTACK_VIA), and decision_points.
    """
    with driver.session() as s:
        row = s.run(queries.q4_roles.Q4_ROLES, attack_id=attack_id).single()
        return {"success": True, "data": dict(row) if row else {}}


@router.get("/{attack_id}/purdue")
def attack_purdue(
    attack_id: str,
    driver: Driver = Depends(get_driver),
):
    """GET /api/v1/attacks/{id}/purdue -- D-19 S6.6 Query Type 6 / T053b Sprint 3"""
    with driver.session() as s:
        result = s.run(queries.purdue.Q6_PURDUE, attack_id=attack_id)
        return {"success": True, "data": [dict(r) for r in result]}


@router.get("/{attack_id}/full")
def attack_full(
    attack_id: str,
    audience: AudienceType = AudienceType.INSTRUCTOR,
    driver: Driver = Depends(get_driver),
):
    """GET /api/v1/attacks/{id}/full -- D-19 S6.5 Query Type 5"""
    with driver.session() as s:
        result = s.run(queries.q5_full.Q5_FULL, attack_id=attack_id)
        return {"success": True, "data": [dict(r) for r in result]}


@router.get("/{attack_id}/dossier")
def download_dossier(
    attack_id: str,
    audience: str = "instructor",
    deployment_size: str = "standard",
    driver: Driver = Depends(get_driver),
    llm_cfg: LLMConfig = Depends(get_llm_config),
):
    """GET /api/v1/attacks/{id}/dossier — Sprint 4 / T062

    Stream the attack dossier as a .docx file.

    If the narrative has been pre-generated (via POST /attacks/{id}/narrative),
    it is served instantly from Neo4j.  If it has not yet been generated, this
    endpoint auto-generates it via LLM on first call (may take 20–60 seconds).
    Subsequent calls always serve instantly.
    """
    # Try to get stored narrative first (fast path)
    narrative = get_narrative(attack_id=attack_id, driver=driver)

    # Auto-generate if not yet stored (slow path — LLM call)
    if narrative is None:
        try:
            narrative = generate_and_persist(
                attack_id=attack_id,
                driver=driver,
                llm_cfg=llm_cfg,
            )
        except Exception as exc:
            raise HTTPException(
                status_code=503,
                detail=(
                    f"Dossier narrative not yet generated and auto-generation failed: {exc}. "
                    "Ensure Neo4j is running with attack data loaded, and that LLM API keys are set."
                ),
            ) from exc

    # Build .docx binary
    try:
        docx_bytes = build_dossier_docx(narrative)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to build dossier document: {exc}",
        ) from exc

    filename = f"{attack_id}_dossier.docx"
    return StreamingResponse(
        io.BytesIO(docx_bytes),
        media_type=(
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ),
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/{attack_id}/narrative", status_code=201)
def trigger_narrative(
    attack_id: str,
    driver: Driver = Depends(get_driver),
    llm_cfg: LLMConfig = Depends(get_llm_config),
):
    """POST /api/v1/attacks/{id}/narrative -- Sprint 4 / T062

    Run Q1-Q4 -> transform -> LLM -> persist narrative to Neo4j Attack node.
    Call this once after loading a new attack into the KG.
    Subsequent calls overwrite the stored narrative (explicit re-generation).

    After this returns, GET /attacks/{id}/dossier serves the pre-computed
    narrative as a .docx file -- no LLM call at serve time.
    """
    try:
        result = generate_and_persist(
            attack_id=attack_id,
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
            "attack_id": result.attack_id,
            "narrative_generated_at": result.narrative_generated_at.isoformat(),
            "narrative_model_used": result.narrative_model_used,
            "narrative_kg_confidence": result.narrative_kg_confidence,
        },
    }
