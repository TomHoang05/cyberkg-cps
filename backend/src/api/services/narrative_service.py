"""Narrative Service — Sprint 4 / T062.

Pre-materialisation pattern:
  LLM is called ONCE per attack (via POST /attacks/{id}/narrative).
  The generated prose is persisted to Neo4j on the Attack node.
  GET /attacks/{id}/dossier reads the stored text — no LLM at serve time.

Public API
----------
generate_and_persist(attack_id, driver, llm_cfg) -> NarrativeResult
    Run Q1-Q4 -> transform -> LLM -> SET props on Attack node.

get_narrative(attack_id, driver) -> NarrativeResult | None
    Read stored narrative from Neo4j.  Returns None if not yet generated.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional

from neo4j import Driver

from src.api.config import LLMConfig
from src.api.services.transform_service import transform_kg_to_llm_dict
from src.kg.queries import q1_surface, q2_chain, q3_consequence, q4_roles
from src.kg.queries.narrative import READ_NARRATIVE, WRITE_NARRATIVE
from src.llm.generator import generate_instructional_output


# ---------------------------------------------------------------------------
# Result dataclass
# ---------------------------------------------------------------------------

@dataclass
class NarrativeResult:
    attack_id:               str
    narrative_text:          str
    narrative_generated_at:  datetime
    narrative_model_used:    str
    narrative_kg_confidence: float


# ---------------------------------------------------------------------------
# Generate + persist
# ---------------------------------------------------------------------------

def generate_and_persist(
    attack_id: str,
    driver: Driver,
    llm_cfg: LLMConfig,
) -> NarrativeResult:
    """Run Q1-Q4 -> transform -> LLM -> write narrative to Neo4j Attack node."""
    with driver.session() as s:
        surface_rec = s.run(q1_surface.Q1_ATTACK_SURFACE,       attack_id=attack_id).single()
        chain_rec   = s.run(q2_chain.Q2_ATTACK_CHAIN_LLM,       attack_id=attack_id).single()
        cons_rec    = s.run(q3_consequence.Q3_CONSEQUENCE_LLM,   attack_id=attack_id).single()
        roles_rec   = s.run(q4_roles.Q4_ROLES,                  attack_id=attack_id).single()

    surface     = dict(surface_rec) if surface_rec else {}
    chain       = dict(chain_rec)   if chain_rec   else {}
    consequence = dict(cons_rec)    if cons_rec    else {}
    roles       = dict(roles_rec)   if roles_rec   else {}

    intermediate = transform_kg_to_llm_dict(
        surface=surface,
        chain=chain,
        consequence=consequence,
        roles=roles,
    )

    output = generate_instructional_output(
        attack_name=attack_id,
        output_type="attack_dossier",
        kg_data=intermediate,
        llm_config=llm_cfg,
    )

    model_used     = output.model_used
    kg_confidence  = output.kg_confidence
    narrative_text = output.content

    with driver.session() as s:
        s.run(
            WRITE_NARRATIVE,
            attack_id=attack_id,
            narrative_text=narrative_text,
            model_used=model_used,
            kg_confidence=kg_confidence,
        )

    return NarrativeResult(
        attack_id=attack_id,
        narrative_text=narrative_text,
        narrative_generated_at=datetime.now(timezone.utc),
        narrative_model_used=model_used,
        narrative_kg_confidence=kg_confidence,
    )


# ---------------------------------------------------------------------------
# Retrieve
# ---------------------------------------------------------------------------

def get_narrative(
    attack_id: str,
    driver: Driver,
) -> Optional[NarrativeResult]:
    """Read stored narrative from Neo4j. Returns None if not yet generated."""
    with driver.session() as s:
        rec = s.run(READ_NARRATIVE, attack_id=attack_id).single()

    if rec is None or rec["narrative_text"] is None:
        return None

    generated_at = rec["narrative_generated_at"]
    if hasattr(generated_at, "to_native"):
        generated_at = generated_at.to_native()
    if not isinstance(generated_at, datetime):
        generated_at = datetime.now(timezone.utc)

    return NarrativeResult(
        attack_id=attack_id,
        narrative_text=rec["narrative_text"],
        narrative_generated_at=generated_at,
        narrative_model_used=rec["narrative_model_used"] or "",
        narrative_kg_confidence=float(rec["narrative_kg_confidence"] or 0.0),
    )
