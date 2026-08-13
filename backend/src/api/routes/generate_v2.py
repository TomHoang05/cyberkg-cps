"""Generate endpoint v2 — CYB-23 §12 POST /api/v1/generate.

Changes vs generate.py:
  - Resolves attack_id URL slug -> Neo4j KG ID via resolve_attack_id()
    before running Q1-Q4 queries.
  - Validates output_type: returns 422 OUTPUT_TYPE_DEFERRED for types
    not yet implemented in Sprint 3 (ai_human_role, attack_dossier).
  - response field is 'text' (CYB-26 §8.3), not 'content' (InstructionalOutput.content).

Source: CYB-26 §8.3 | CYB-23 §12.1
"""
from fastapi import APIRouter, Depends, HTTPException
from neo4j import Driver

from src.api.attack_id_map import resolve_attack_id
from src.api.config import LLMConfig
from src.api.dependencies import get_driver, get_llm_config
from src.api.models.requests import GenerateRequest
from src.api.services.transform_service import transform_kg_to_llm_dict
from src.kg.queries import q1_surface, q2_chain, q3_consequence, q4_roles
from src.llm.generator import generate_instructional_output

router = APIRouter(tags=["generate"])

# Sprint 3: only 3 output types are implemented.
SPRINT3_VALID_TYPES = {"attack_surface", "it_ot_movement", "physical_consequences"}
DEFERRED_TYPES      = {"ai_human_role", "attack_dossier"}


@router.post("/generate", response_model=dict)
def generate(
    req: GenerateRequest,
    driver: Driver = Depends(get_driver),
    llm_cfg: LLMConfig = Depends(get_llm_config),
):
    """POST /api/v1/generate — CYB-23 §12.1 / CYB-22 §III.4

    Pipeline:
      resolve slug → KG ID
      Q1 (surface) + Q2_LLM (chain) + Q3_LLM (consequence) + Q4 (roles)
        -> transform_kg_to_llm_dict()   [CYB-26 §9.2 canonical dict]
        -> generate_instructional_output()  [CYB-22 §III.4 LLM call]
    """
    output_type = req.output_type.value

    # Validate output_type scope for Sprint 3
    if output_type in DEFERRED_TYPES:
        raise HTTPException(
            status_code=422,
            detail={
                "code":            "OUTPUT_TYPE_DEFERRED",
                "message":         f"'{output_type}' is available in Sprint 4.",
                "available_types": sorted(SPRINT3_VALID_TYPES),
            },
        )

    if output_type not in SPRINT3_VALID_TYPES:
        raise HTTPException(
            status_code=422,
            detail={
                "code":            "INVALID_PARAMETER",
                "message":         f"Unknown output_type: {output_type!r}",
                "available_types": sorted(SPRINT3_VALID_TYPES),
            },
        )

    # Resolve slug → KG attack_id
    try:
        kg_id = resolve_attack_id(req.attack_id)
    except ValueError:
        raise HTTPException(
            status_code=404,
            detail={
                "code":    "ATTACK_NOT_FOUND",
                "message": f"Attack {req.attack_id!r} not found in KG",
            },
        )

    # Run Q1+Q2_LLM+Q3_LLM+Q4 using the resolved KG ID
    with driver.session() as s:
        surface_rec = s.run(q1_surface.Q1_ATTACK_SURFACE, attack_id=kg_id).single()
        chain_rec   = s.run(q2_chain.Q2_ATTACK_CHAIN_LLM, attack_id=kg_id).single()
        cons_rec    = s.run(q3_consequence.Q3_CONSEQUENCE_LLM, attack_id=kg_id).single()
        roles_rec   = s.run(q4_roles.Q4_ROLES, attack_id=kg_id).single()

    surface     = dict(surface_rec) if surface_rec else {}
    chain       = dict(chain_rec)   if chain_rec   else {}
    consequence = dict(cons_rec)    if cons_rec    else {}
    roles       = dict(roles_rec)   if roles_rec   else {}

    if not surface:
        raise HTTPException(
            status_code=404,
            detail={
                "code":    "ATTACK_NOT_FOUND",
                "message": f"Attack {req.attack_id!r} not found in KG (kg_id={kg_id!r})",
            },
        )

    intermediate = transform_kg_to_llm_dict(
        surface=surface,
        chain=chain,
        consequence=consequence,
        roles=roles,
    )

    output = generate_instructional_output(
        attack_name=req.attack_id,          # use slug as display name key
        output_type=output_type,
        kg_data=intermediate,
        llm_config=llm_cfg,
    )

    prov = intermediate.get("provenance_summary", {})
    ec   = prov.get("evidence_class_distribution", {}) if isinstance(prov, dict) else {}

    return {
        "success": True,
        "data": {
            "attack_id":                req.attack_id,
            "output_type":              output_type,
            "audience":                 req.audience.value,
            # CYB-26 §8.3: response field is 'text', not 'content'
            "text":                     output.content,
            "model_used":               output.model_used,
            "cached":                   False,
            "evidence_class_distribution": {
                "documented_fact":         ec.get("documented_fact", 0),
                "supported_inference":     ec.get("supported_inference", 0),
                "instructional_extension": ec.get("instructional_extension", 0),
            },
            "llm_latency_ms": output.generation_latency_ms,
        },
    }
