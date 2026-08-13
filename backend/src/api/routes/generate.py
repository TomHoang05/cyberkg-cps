"""Generate endpoint — CYB-23 §12 POST /api/v1/generate.
Sprint 3 T054 implementation — uses transform_service.transform_kg_to_llm_dict().
"""
from fastapi import APIRouter, Depends
from neo4j import Driver

from src.api.dependencies import get_driver, get_llm_config
from src.api.models.requests import GenerateRequest
from src.api.config import LLMConfig
from src.api.services.transform_service import transform_kg_to_llm_dict
from src.kg.queries import q1_surface, q2_chain, q3_consequence, q4_roles
from src.llm.generator import generate_instructional_output

router = APIRouter(tags=["generate"])


@router.post("/generate", response_model=dict)
def generate(
    req: GenerateRequest,
    driver: Driver = Depends(get_driver),
    llm_cfg: LLMConfig = Depends(get_llm_config),
):
    """POST /api/v1/generate — CYB-23 §12 / CYB-22 §III.4

    Pipeline:
      Q1 (surface) + Q2 (chain) + Q3 (consequence) + Q4 (roles)
        -> transform_kg_to_llm_dict()  [CYB-26 §9.2 canonical]
        -> build_prompt()              [CYB-27 §6 templates]
        -> LLM call                    [temperature=0.2, max_tokens=2000]
        -> hallucination check         [CYB-27 §7]
    """
    attack_id = req.attack_id

    with driver.session() as s:
        surface_rec = s.run(q1_surface.Q1_ATTACK_SURFACE, attack_id=attack_id).single()
        surface = dict(surface_rec) if surface_rec else {}

        chain_rec = s.run(q2_chain.Q2_ATTACK_CHAIN_LLM, attack_id=attack_id).single()
        chain = dict(chain_rec) if chain_rec else {}

        cons_rec = s.run(q3_consequence.Q3_CONSEQUENCE_LLM, attack_id=attack_id).single()
        consequence = dict(cons_rec) if cons_rec else {}

        roles_rec = s.run(q4_roles.Q4_ROLES, attack_id=attack_id).single()
        roles = dict(roles_rec) if roles_rec else {}

    intermediate = transform_kg_to_llm_dict(
        surface=surface,
        chain=chain,
        consequence=consequence,
        roles=roles,
    )

    output = generate_instructional_output(
        attack_name=attack_id,
        output_type=req.output_type.value,
        kg_data=intermediate,
        llm_config=llm_cfg,
    )

    return {"success": True, "data": output.model_dump()}
