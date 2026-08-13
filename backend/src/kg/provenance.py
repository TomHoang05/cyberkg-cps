"""Provenance validation module — D-18 §III.2 / D-04 §II."""
from datetime import datetime, timezone
from src.api.models.responses import EvidenceClass

REQUIRED_FIELDS = ["source", "source_id_or_url", "ingested_at",
                   "confidence", "evidence_class", "license"]

def validate_provenance(prov: dict) -> dict:
    """Ensure all 6 provenance fields are present and valid."""
    missing = [f for f in REQUIRED_FIELDS if f not in prov]
    if missing:
        raise ValueError(f"Missing provenance fields: {missing}")
    if not 0.0 <= prov["confidence"] <= 1.0:
        raise ValueError(f"confidence must be 0.0-1.0, got {prov['confidence']}")
    if prov["evidence_class"] not in [e.value for e in EvidenceClass]:
        raise ValueError(f"Invalid evidence_class: {prov['evidence_class']}")
    if "ingested_at" not in prov:
        prov["ingested_at"] = datetime.now(timezone.utc).isoformat()
    return prov

def auto_fill_provenance(node: dict, source: str, url: str,
                          confidence: float, evidence_class: str,
                          license: str = "public") -> dict:
    """Auto-fill provenance block if not present (D-18 T026)."""
    if "source" not in node:
        node["source"] = source
        node["source_id_or_url"] = url
        node["ingested_at"] = datetime.now(timezone.utc).isoformat()
        node["confidence"] = confidence
        node["evidence_class"] = evidence_class
        node["license"] = license
    return validate_provenance(node)
