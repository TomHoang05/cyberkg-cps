"""Reusable Cypher fragments — audience filter, plane filter, provenance projection."""

PROVENANCE_PROJ = """
  {source: n.source, confidence: n.confidence,
   evidence_class: n.evidence_class, ingested_at: n.ingested_at}
"""

def plane_filter(plane: str) -> str:
    if plane == "all": return ""
    return f"AND '{plane}' IN labels(n)"

def audience_depth(audience: str) -> int:
    return {"student": 2, "instructor": 3, "researcher": 4}.get(audience, 3)
