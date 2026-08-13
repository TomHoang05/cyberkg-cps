"""loader_v6.py — Split-file YAML loader with fixed provenance filling.

Identical to loader_v5.py except imports auto_fill_provenance from
provenance_v2 instead of provenance.

Bug fixed (provenance_v2.py):
  provenance.auto_fill_provenance wrapped all field-filling inside
  `if "source" not in node:`.  YAML case nodes that already supply `source`
  had no ingested_at set, causing validate_provenance to raise for all 104
  case nodes.  provenance_v2.auto_fill_provenance fills each field
  independently (matching the pattern in _fill_rel_provenance here).

All other behaviour — plane labels, entity_id synthesis, relationship
provenance, granularity validation — is unchanged from loader_v5.

Usage (from cyberkg-cps/ root):
    py -3.11 scripts/load_all_cases_v6.py
"""

from __future__ import annotations

import yaml
from datetime import datetime, timezone
from pathlib import Path
from neo4j import Session
from src.kg.provenance_v2 import auto_fill_provenance   # ← v2 fix
from src.kg.granularity import validate_node

# ---------------------------------------------------------------------------
# Canonical primary key per entity type (unchanged from loader.py)
# ---------------------------------------------------------------------------
PRIMARY_KEYS: dict[str, str] = {
    "Attack":                "attack_id",
    "ATT_CK_Technique":      "mitre_id",
    "Vulnerability":         "cve_id",
    "Weakness":              "cwe_id",
    "Attack_Pattern":        "capec_id",
    "IT_System":             "system_id",
    "OT_System":             "system_id",
    "Network_Zone":          "zone_id",
    "Physical_Process":      "process_id",
    "Consequence":           "consequence_id",
    "AI_Component":          "ai_id",
    "AI_Attack_Surface":     "surface_id",
    "Human_Actor":           "actor_id",
    "Human_Action":          "action_id",
    "Bridge_Mechanism":      "bridge_id",
    "Instructional_Concept": "concept_id",
    "Question":              "question_id",
}

# Directory-name → file prefix mapping
CASE_PREFIX: dict[str, str] = {
    "colonial_pipeline": "colonial",
    "german_steel_mill": "gsm",
    "triton":            "triton",
    "stuxnet":           "stuxnet",
}

# Plane suffixes to load per case
PLANE_SUFFIXES = ("cyber", "physical", "ai", "human")

# ---------------------------------------------------------------------------
# Plane label assignments (CYB-13 §II)
# None = derive from category_group (_IC_PLANE_MAP); list = fixed labels.
# ---------------------------------------------------------------------------
PLANE_LABELS: dict[str, list[str] | None] = {
    "Attack":                ["Cyber", "Physical", "AI", "Human"],
    "ATT_CK_Technique":      ["Cyber"],
    "Vulnerability":         ["Cyber"],
    "Weakness":              ["Cyber"],
    "Attack_Pattern":        ["Cyber"],
    "IT_System":             ["Cyber"],
    "OT_System":             ["Physical"],
    "Network_Zone":          ["Cyber"],
    "Bridge_Mechanism":      ["Cyber", "Physical"],
    "Physical_Process":      ["Physical"],
    "Consequence":           ["Physical"],
    "AI_Component":          ["AI"],
    "AI_Attack_Surface":     ["AI"],
    "Human_Actor":           ["Human"],
    "Human_Action":          ["Human"],
    "Instructional_Concept": None,     # derived from category_group
    "Question":              ["Cyber", "Physical", "AI", "Human"],
}

# Instructional_Concept category_group → plane labels (CYB-13 §II + §VI)
_IC_PLANE_MAP: dict[str, list[str]] = {
    "it_ot_transition":      ["Cyber", "Physical"],
    "physical_consequences": ["Physical"],
    "ai_attack_surface":     ["AI"],
    "ai_resilience":         ["AI"],
}


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _plane_labels_for(node_type: str, node: dict) -> list[str]:
    """Return the plane label(s) that should be applied to this node."""
    labels = PLANE_LABELS.get(node_type)
    if labels is not None:
        return labels
    # Instructional_Concept: derive from category_group
    cg = node.get("category_group", "")
    return _IC_PLANE_MAP.get(cg, [])


def _fill_rel_provenance(
    props: dict,
    source: str,
    url: str,
    confidence: float = 0.8,
    license_: str = "public",
) -> dict:
    """Fill missing provenance fields on a relationship properties dict."""
    if "source" not in props:
        props["source"] = source
    if "source_id_or_url" not in props:
        props["source_id_or_url"] = url
    if "ingested_at" not in props:
        props["ingested_at"] = datetime.now(timezone.utc).isoformat()
    if "confidence" not in props:
        props["confidence"] = confidence
    if "evidence_class" not in props:
        props["evidence_class"] = "documented_fact"
    if "license" not in props:
        props["license"] = license_
    return props


def _load_nodes(
    session: Session,
    fp: Path,
    source: str,
    url: str,
    report: dict,
) -> None:
    """Merge nodes from one YAML plane file into Neo4j.

    After MERGE, applies plane labels via additional SET labels(n) += [...].
    Also synthesises entity_id = primary key value if not already set.
    """
    with open(fp, encoding="utf-8") as fh:
        data = yaml.safe_load(fh) or {}

    for node_type, nodes in data.get("nodes", {}).items():
        pk = PRIMARY_KEYS.get(node_type)
        if pk is None:
            report["errors"].append(
                f"Unknown entity type '{node_type}' in {fp.name} — skipping"
            )
            continue

        plane_lbls = PLANE_LABELS.get(node_type)  # None for IC (checked per node)

        for node in (nodes or []):
            try:
                auto_fill_provenance(
                    node, source, url,
                    confidence=node.get("confidence", 0.8),
                    evidence_class=node.get("evidence_class", "documented_fact"),
                )
                issues = validate_node(node, node_type)
                if issues:
                    report["errors"].extend(issues)
                    continue

                pk_val = node.get(pk)
                if pk_val is None:
                    report["errors"].append(
                        f"{node_type}: missing primary key '{pk}' in {node} — skipping"
                    )
                    continue

                # Synthesise entity_id from the primary key value (T041 requires it)
                if "entity_id" not in node:
                    node["entity_id"] = pk_val

                # Determine plane labels for this node
                if plane_lbls is None:
                    # Instructional_Concept: look up by category_group
                    active_labels = _IC_PLANE_MAP.get(
                        node.get("category_group", ""), []
                    )
                else:
                    active_labels = plane_lbls

                # MERGE on primary key, then SET all properties
                session.run(
                    f"MERGE (n:{node_type} {{{pk}: ${pk}}}) SET n += $props",
                    **{pk: pk_val},
                    props=node,
                )

                # Apply plane labels (idempotent — SET n:Label is a no-op if already set)
                for lbl in active_labels:
                    session.run(
                        f"MATCH (n:{node_type} {{{pk}: $pk_val}}) SET n:{lbl}",
                        pk_val=pk_val,
                    )

                report["loaded"] += 1

            except Exception as exc:
                report["errors"].append(f"{node_type} ({pk_val if 'pk_val' in dir() else '?'}): {exc}")


def _load_relationships(
    session: Session,
    fp: Path,
    source: str,
    url: str,
    report: dict,
) -> None:
    """Create/merge relationships from a YAML relationships file.

    Fills provenance fields on each relationship before MERGE.
    """
    with open(fp, encoding="utf-8") as fh:
        data = yaml.safe_load(fh) or {}

    for rel in data.get("relationships", []):
        try:
            from_type = rel["from_type"]
            to_type   = rel["to_type"]
            rel_type  = rel["type"]
            from_pk   = PRIMARY_KEYS.get(from_type, "id")
            to_pk     = PRIMARY_KEYS.get(to_type,   "id")
            props     = dict(rel.get("properties", {}) or {})

            # Fill relationship provenance
            _fill_rel_provenance(props, source, url)

            session.run(
                f"""
                MATCH (a:{from_type} {{{from_pk}: $from_id}})
                MATCH (b:{to_type}   {{{to_pk}:   $to_id}})
                MERGE (a)-[r:{rel_type}]->(b)
                SET r += $props
                """,
                from_id=rel["from_id"],
                to_id=rel["to_id"],
                props=props,
            )
            report["relationships"] = report.get("relationships", 0) + 1

        except KeyError as exc:
            report["errors"].append(
                f"Relationship missing required field {exc}: {rel}"
            )
        except Exception as exc:
            report["errors"].append(f"Relationship {rel.get('type')}: {exc}")


# ---------------------------------------------------------------------------
# Public API (mirrors loader.py interface — drop-in replacement)
# ---------------------------------------------------------------------------

def load_shared(session: Session, shared_dir: Path, source: str, url: str) -> dict:
    """Load shared/ YAML files (instructional_concepts, network_zones).

    MUST be called before load_case() so Network_Zone and Instructional_Concept
    nodes exist when relationship files reference them.
    """
    report: dict = {"loaded": 0, "relationships": 0, "errors": []}
    for fname in ("instructional_concepts.yaml", "network_zones.yaml"):
        fp = shared_dir / fname
        if fp.exists():
            _load_nodes(session, fp, source, url, report)
        else:
            report["errors"].append(f"shared/{fname} not found — skipping")
    return report


def load_case(session: Session, case_dir: Path, source: str, url: str) -> dict:
    """Load one attack case (4 plane files + relationships file).

    Derives file prefix from directory name via CASE_PREFIX.
    Falls back to directory name for unknown cases.

    Returns:
        {"loaded": int, "relationships": int, "errors": [str]}
    """
    report: dict = {"loaded": 0, "relationships": 0, "errors": []}
    prefix = CASE_PREFIX.get(case_dir.name, case_dir.name)

    # 1. Load nodes from each plane file
    for plane in PLANE_SUFFIXES:
        fp = case_dir / f"{prefix}_{plane}.yaml"
        if fp.exists():
            _load_nodes(session, fp, source, url, report)

    # 2. Load relationships (with provenance fill)
    rel_fp = case_dir / f"{prefix}_relationships.yaml"
    if rel_fp.exists():
        _load_relationships(session, rel_fp, source, url, report)

    return report
