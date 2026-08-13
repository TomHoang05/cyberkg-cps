"""YAML case loader → Neo4j. CYB-25 T026 + T027.

File naming convention (CYB-25 §IV):
  data/kg_data/{case_dir}/{prefix}_{plane}.yaml
  data/kg_data/{case_dir}/{prefix}_relationships.yaml
  data/kg_data/shared/instructional_concepts.yaml
  data/kg_data/shared/network_zones.yaml       ← load SECOND

Canonical primary keys per entity type (CYB-12 §III + CYB-14 v1.1):
  External IDs (MITRE/CVE/CWE/CAPEC) are used as MERGE keys so
  techniques shared across cases collapse to one node in Neo4j.
  (Shared techniques: TEC-T1566-001, TEC-T0873, TEC-T0831 — CYB-15 §NS)
"""
import yaml
from pathlib import Path
from neo4j import Session
from src.kg.provenance import auto_fill_provenance
from src.kg.granularity import validate_node

# ---------------------------------------------------------------------------
# Canonical primary key per entity type
# External-ID types use their domain identifier as the MERGE key so that
# MITRE ATT&CK techniques (and CVEs/CWEs) shared across attack cases
# collapse to a single node after MERGE — producing 107 canonical nodes
# instead of 118 loaded nodes (CYB-15 §NS).
# ---------------------------------------------------------------------------
PRIMARY_KEYS: dict[str, str] = {
    "Attack":                "attack_id",
    "ATT_CK_Technique":      "mitre_id",       # external — enables cross-case MERGE
    "Vulnerability":         "cve_id",          # external
    "Weakness":              "cwe_id",          # external
    "Attack_Pattern":        "capec_id",        # external
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
    "Question":              "question_id",     # Sprint 3 — T046b / CYB-14 v1.1
}

# Directory-name → file prefix mapping (CYB-25 §IV)
CASE_PREFIX: dict[str, str] = {
    "colonial_pipeline": "colonial",
    "german_steel_mill": "gsm",
    "triton":            "triton",
    "stuxnet":           "stuxnet",
}

# Plane suffixes to load per case
PLANE_SUFFIXES = ("cyber", "physical", "ai", "human")


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _load_nodes(
    session: Session,
    fp: Path,
    source: str,
    url: str,
    report: dict,
) -> None:
    """Merge nodes from one YAML plane file into Neo4j."""
    with open(fp, encoding="utf-8") as fh:
        data = yaml.safe_load(fh) or {}

    for node_type, nodes in data.get("nodes", {}).items():
        pk = PRIMARY_KEYS.get(node_type)
        if pk is None:
            report["errors"].append(
                f"Unknown entity type '{node_type}' in {fp.name} — skipping"
            )
            continue
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
                        f"{node_type}: missing primary key '{pk}' in node {node} — skipping"
                    )
                    continue
                session.run(
                    f"MERGE (n:{node_type} {{{pk}: ${pk}}}) SET n += $props",
                    **{pk: pk_val},
                    props=node,
                )
                report["loaded"] += 1
            except Exception as exc:
                report["errors"].append(f"{node_type}: {exc}")


def _load_relationships(session: Session, fp: Path, report: dict) -> None:
    """Create/merge relationships from a YAML relationships file.

    Each entry must have:
      from_type, from_id, type, to_type, to_id
    Optional: properties (dict)
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
            props     = rel.get("properties", {})

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
# Public API
# ---------------------------------------------------------------------------

def load_shared(session: Session, shared_dir: Path, source: str, url: str) -> dict:
    """Load shared/ YAML files (instructional_concepts, network_zones).

    MUST be called before load_case() so Network_Zone nodes referenced
    by case LOCATED_IN relationships already exist.
    Loading order matters — instructional_concepts first, network_zones second
    (CYB-25 §IV directory tree comment).
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

    Derives the file prefix from the directory name via CASE_PREFIX.
    Falls back to the directory name itself for unknown cases.

    Returns a report dict:
      {"loaded": int, "relationships": int, "errors": [str]}
    """
    report: dict = {"loaded": 0, "relationships": 0, "errors": []}
    prefix = CASE_PREFIX.get(case_dir.name, case_dir.name)

    # 1. Load nodes from each plane file
    for plane in PLANE_SUFFIXES:
        fp = case_dir / f"{prefix}_{plane}.yaml"
        if fp.exists():
            _load_nodes(session, fp, source, url, report)
        # Non-existent plane files are silently skipped (not all cases have all planes)

    # 2. Load relationships
    rel_fp = case_dir / f"{prefix}_relationships.yaml"
    if rel_fp.exists():
        _load_relationships(session, rel_fp, report)

    return report
