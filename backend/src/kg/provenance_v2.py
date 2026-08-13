"""provenance_v2.py — Fixed provenance module (D-18 §III.2 / D-04 §II).

Bug fixed vs provenance.py:
  auto_fill_provenance previously wrapped ALL field-filling inside a single
  `if "source" not in node:` guard.  YAML nodes that already supply `source`
  (all 104 case nodes) skipped the block entirely, leaving `ingested_at`
  unset.  validate_provenance then raised ValueError before it could reach
  its own (dead-code) ingested_at fill, causing every case node to fail.

Fix: each field is now filled independently with its own `if … not in node`
guard, matching the pattern already used in _fill_rel_provenance (loader_v5).
"""
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
    return prov


def auto_fill_provenance(node: dict, source: str, url: str,
                          confidence: float, evidence_class: str,
                          license: str = "public") -> dict:
    """Auto-fill provenance block fields that are absent (D-18 T026).

    v2: each field is filled independently so partial provenance from YAML
    (e.g. source + evidence_class already set, ingested_at absent) is handled
    correctly.  The original provenance.py filled all-or-nothing on `source`,
    causing ingested_at to go unset for all 104 case nodes whose YAML already
    supplies source.
    """
    if "source" not in node:
        node["source"] = source
    if "source_id_or_url" not in node:
        node["source_id_or_url"] = url
    if "ingested_at" not in node:
        node["ingested_at"] = datetime.now(timezone.utc).isoformat()
    if "confidence" not in node:
        node["confidence"] = confidence
    if "evidence_class" not in node:
        node["evidence_class"] = evidence_class
    if "license" not in node:
        node["license"] = license
    return validate_provenance(node)
