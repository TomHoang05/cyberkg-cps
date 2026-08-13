"""Cypher queries for Attack narrative persistence — Sprint 4 / T062.

Narrative fields are stored directly on the Attack node so that
GET /attacks/{id}/dossier never needs to call the LLM — it just reads
the pre-computed text.  The LLM is invoked exactly once, via
POST /attacks/{id}/narrative.

Attack node properties written here:
    narrative_text          : str  — audience-level prose (instructor default)
    narrative_generated_at  : datetime (Neo4j)
    narrative_model_used    : str
    narrative_kg_confidence : float
"""

# ---------------------------------------------------------------------------
# WRITE — called by narrative_service.generate_and_persist()
# ---------------------------------------------------------------------------
WRITE_NARRATIVE = """
MATCH (a:Attack {attack_id: $attack_id})
SET a.narrative_text          = $narrative_text,
    a.narrative_generated_at  = datetime(),
    a.narrative_model_used    = $model_used,
    a.narrative_kg_confidence = $kg_confidence
RETURN a.attack_id AS attack_id
"""

# ---------------------------------------------------------------------------
# READ — called by narrative_service.get_narrative()
# ---------------------------------------------------------------------------
READ_NARRATIVE = """
MATCH (a:Attack {attack_id: $attack_id})
RETURN a.narrative_text          AS narrative_text,
       a.narrative_generated_at  AS narrative_generated_at,
       a.narrative_model_used    AS narrative_model_used,
       a.narrative_kg_confidence AS narrative_kg_confidence
"""
