"""
T041 v2 — KG Validation: Node Counts + Orphan Check
=====================================================
Spec source: CYB-25 §7.1 (Validation and Quality Assurance)
Canonical expected values: CLAUDE.md §6

Changes vs validate_t041_kg_counts.py:
  1. EXPECTED_EDGE_COUNT corrected to 147 (not 149).
     The 10-Jul YAML defines 149 total relationship entries, but 2 are
     intentional shared-node relationships that MERGE deduplicates:
       • T1566.001 -[:TARGETS]-> ITS-EMAIL  (triton + gsm both define this;
         ITS-EMAIL is a shared node used by both cases)
       • T0873 -[:TECHNIQUE_ORDER]-> T0831  (gsm + stuxnet both define this;
         both cases use the same technique ordering)
     After MERGE the unique edge count is 147, which is the canonical value.

  2. "Question" removed from CANONICAL_ENTITY_LABELS (and EXPECTED_ENTITY_TYPES
     corrected to 16).  Question nodes are Sprint 3 scope (T047+) and are not
     loaded in Sprint 2.  The T041 Sprint 2 check should not require them.

Run:
    cd CyberKG-CPS
    python scripts/validate_t041_v2.py

Prerequisites:
    - Neo4j running with KG fully loaded (Sprint 2 T039-T040 complete)
    - .env file with NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD
    - pip install neo4j python-dotenv
"""

import os
import sys
from neo4j import GraphDatabase
from dotenv import load_dotenv

load_dotenv()

# ── Canonical expected values ─────────────────────────────────────────────────
EXPECTED_NODE_COUNT   = 104   # post-MERGE, 4 MVP attack cases
EXPECTED_EDGE_COUNT   = 147   # 149 YAML entries − 2 intentional shared-node dedupes
EXPECTED_REL_TYPES    = 17
EXPECTED_ENTITY_TYPES = 16   # 16 MVP labels; Question is Sprint 3 only

CANONICAL_REL_TYPES = {
    "AFFECTS_PROCESS", "AI_ATTACK_VIA", "AI_INVOLVED_IN",
    "BRIDGES_TO", "CAUSES_CONSEQUENCE", "CONSEQUENCE_TYPE",
    "EXPLOITS", "HUMAN_ROLE", "LOCATED_IN",
    "MAPS_TO_CONCEPT", "MAPS_TO_PATTERN", "PERFORMS_ACTION",
    "ROOT_CAUSE", "TARGETS", "TECHNIQUE_ORDER",
    "USES_BRIDGE", "USES_TECHNIQUE",
}

# 16 MVP entity labels — Question excluded (Sprint 3)
CANONICAL_ENTITY_LABELS = {
    "Attack", "ATT_CK_Technique", "Vulnerability", "Weakness", "Attack_Pattern",
    "IT_System", "OT_System", "Network_Zone", "Physical_Process", "Consequence",
    "AI_Component", "AI_Attack_Surface", "Human_Actor", "Human_Action",
    "Bridge_Mechanism", "Instructional_Concept",
}

PROVENANCE_REQUIRED = ["source", "confidence", "evidence_class", "ingested_at", "entity_id"]
PROVENANCE_OPTIONAL = ["source_id_or_url"]


def run_validation():
    uri  = os.getenv("NEO4J_URI",      "bolt://localhost:7687")
    user = os.getenv("NEO4J_USER",     "neo4j")
    pwd  = os.getenv("NEO4J_PASSWORD", "password")

    driver = GraphDatabase.driver(uri, auth=(user, pwd))
    passed = []
    failed = []

    def ok(msg):   passed.append(f"  PASS  {msg}")
    def err(msg):  failed.append(f"  FAIL  {msg}")
    def warn(msg): passed.append(f"  WARN  {msg}")

    with driver.session() as s:

        # 1. Total node count
        total_nodes = s.run("MATCH (n) RETURN count(n) AS c").single()["c"]
        if total_nodes == EXPECTED_NODE_COUNT:
            ok(f"Node count: {total_nodes} (expected {EXPECTED_NODE_COUNT})")
        else:
            err(f"Node count: {total_nodes} != {EXPECTED_NODE_COUNT}")

        # 2. Total edge count
        total_edges = s.run("MATCH ()-[r]->() RETURN count(r) AS c").single()["c"]
        if total_edges == EXPECTED_EDGE_COUNT:
            ok(f"Edge count: {total_edges} (expected {EXPECTED_EDGE_COUNT})")
        else:
            err(f"Edge count: {total_edges} != {EXPECTED_EDGE_COUNT}")

        # 3. Node breakdown by label
        print("\n  Node counts by label:")
        rows = list(s.run(
            "MATCH (n) RETURN labels(n)[0] AS label, count(n) AS cnt ORDER BY label"
        ))
        found_labels = set()
        for r in rows:
            label = r["label"]
            cnt   = r["cnt"]
            found_labels.add(label)
            print(f"    {label:35s} {cnt}")

        missing_labels = CANONICAL_ENTITY_LABELS - found_labels
        if missing_labels:
            err(f"Missing entity labels: {sorted(missing_labels)}")
        else:
            ok(f"All {len(CANONICAL_ENTITY_LABELS)} MVP entity labels present")

        # 4. Orphan check (no relationships)
        orphans = list(s.run(
            "MATCH (n) WHERE NOT (n)--() "
            "RETURN labels(n) AS lbl, "
            "coalesce(n.name, n.attack_id, n.concept_id, n.question_id, n.entity_id, '') AS name"
        ))
        if len(orphans) == 0:
            ok("Orphan check: 0 orphan nodes")
        else:
            err(f"Orphan check: {len(orphans)} orphan node(s) found")
            for o in orphans:
                print(f"    Orphan: {o['lbl']} -- {o['name']}")

        # 5. Required provenance fields (null check)
        for field in PROVENANCE_REQUIRED:
            null_count = s.run(
                f"MATCH (n) WHERE n.{field} IS NULL RETURN count(n) AS c"
            ).single()["c"]
            if null_count == 0:
                ok(f"Provenance '{field}': no nulls")
            else:
                err(f"Provenance '{field}': {null_count} null value(s)")

        for field in PROVENANCE_OPTIONAL:
            null_count = s.run(
                f"MATCH (n) WHERE n.{field} IS NULL RETURN count(n) AS c"
            ).single()["c"]
            if null_count > 0:
                warn(f"Provenance '{field}': {null_count} null(s) (optional field -- review)")

        # 6. Relationship types (exactly 17 canonical types)
        rel_types_found = {
            r["relationshipType"]
            for r in s.run(
                "CALL db.relationshipTypes() YIELD relationshipType "
                "RETURN relationshipType"
            )
        }
        missing_rels = CANONICAL_REL_TYPES - rel_types_found
        extra_rels   = rel_types_found - CANONICAL_REL_TYPES
        if not missing_rels and not extra_rels:
            ok(f"Relationship types: {len(rel_types_found)} == {EXPECTED_REL_TYPES} canonical")
        else:
            if missing_rels:
                err(f"Missing rel types: {sorted(missing_rels)}")
            if extra_rels:
                err(f"Unexpected rel types: {sorted(extra_rels)}")

        # 7. Evidence class values (only 3 valid values)
        invalid_ec = list(s.run(
            "MATCH (n) WHERE n.evidence_class IS NOT NULL "
            "AND NOT n.evidence_class IN "
            "['documented_fact','supported_inference','instructional_extension'] "
            "RETURN labels(n) AS lbl, n.evidence_class AS ec LIMIT 20"
        ))
        if not invalid_ec:
            ok("Evidence class values: all valid")
        else:
            for row in invalid_ec:
                err(f"Invalid evidence_class '{row['ec']}' on {row['lbl']}")

        # 8. Confidence range [0.0, 1.0]
        bad_conf = list(s.run(
            "MATCH (n) WHERE n.confidence IS NOT NULL "
            "AND (n.confidence < 0.0 OR n.confidence > 1.0) "
            "RETURN labels(n) AS lbl, n.confidence AS c LIMIT 10"
        ))
        if not bad_conf:
            ok("Confidence values: all in [0.0, 1.0]")
        else:
            for row in bad_conf:
                err(f"Out-of-range confidence {row['c']} on {row['lbl']}")

        # 9. All 4 attack cases present
        attack_ids = [r["id"] for r in s.run(
            "MATCH (a:Attack) RETURN a.attack_id AS id ORDER BY id"
        )]
        expected_attacks = ["ATK-COL-001", "ATK-GSM-001", "ATK-STX-001", "ATK-TRI-001"]
        if sorted(attack_ids) == expected_attacks:
            ok(f"All 4 attack cases present: {attack_ids}")
        else:
            err(f"Attack cases mismatch: found {attack_ids}, expected {expected_attacks}")

    driver.close()

    # Summary
    print("\n" + "="*60)
    print("T041 VALIDATION SUMMARY (v2)")
    print("="*60)
    for msg in passed:
        print(msg)
    for msg in failed:
        print(msg)
    print("="*60)
    print(f"Result: {len(passed)} passed, {len(failed)} failed")

    if failed:
        print("\nFAILED -- resolve issues before proceeding to T042")
        sys.exit(1)
    else:
        print("\nPASSED -- KG structure is valid")
        sys.exit(0)


if __name__ == "__main__":
    print("CyberKG-CPS -- T041 v2: KG Counts + Orphan Check")
    print("Spec: CYB-25 §7.1 | Expected: 104 nodes, 147 edges, 0 orphans, 17 rel types\n")
    run_validation()
