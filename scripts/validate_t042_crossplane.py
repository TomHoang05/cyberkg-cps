"""
T042 — Cross-Plane Path Validation
====================================
Spec source: CYB-25 §7.2 (Cross-Plane Path Validation)
Validates 3 canonical traversal paths confirming semantic correctness
(in addition to structural completeness verified by T041).

Run:
    cd CyberKG-CPS
    python scripts/validate_t042_crossplane.py

Prerequisites:
    - T041 must pass first
    - Neo4j running with KG fully loaded
    - .env file with NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD
"""

import os
import sys
from neo4j import GraphDatabase
from dotenv import load_dotenv

load_dotenv()

# ── Canonical cross-plane paths (CYB-25 §7.2) ───────────────────────────────
#
# Path 1: Colonial Pipeline full chain
#   Attack(ATK-COL-001)
#     -[:USES_TECHNIQUE]-> ATT_CK_Technique(T1078)  [IT plane]
#     -[:USES_BRIDGE]->    Bridge_Mechanism(BRG-VPN) [bridge plane]
#     -[:CAUSES_CONSEQUENCE]-> Consequence(CON-SHUT) [physical plane]
#     -[:MAPS_TO_CONCEPT]-> Instructional_Concept    [cross-cutting]
#
# Path 2: Stuxnet vulnerability chain
#   ATT_CK_Technique(T1091)
#     -[:EXPLOITS]->       Vulnerability(CVE-2010-2568)
#     -[:ROOT_CAUSE]->     Weakness(CWE-20)
#     -[:MAPS_TO_PATTERN]->Attack_Pattern(CAPEC-210)
#
# Path 3: TRITON cross-plane
#   Attack(ATK-TRI-001)
#     -[:USES_TECHNIQUE]-> ATT_CK_Technique (initial-access phase)
#     -[:USES_BRIDGE]->    Bridge_Mechanism(BRG-EWS)  [unauthorized]
#     -[:CAUSES_CONSEQUENCE]-> Consequence (SIS consequence)


# ── Individual validation queries ────────────────────────────────────────────

# Path 1a: Colonial — Attack → Technique (T1078 Valid Accounts)
PATH1A = """
MATCH (a:Attack {attack_id: 'ATK-COL-001'})
      -[:USES_TECHNIQUE]->(t:ATT_CK_Technique {mitre_id: 'T1078'})
RETURN a.attack_id AS attack, t.mitre_id AS technique, t.name AS name
"""

# Path 1b: Colonial — Attack → Bridge → Consequence
PATH1B = """
MATCH (a:Attack {attack_id: 'ATK-COL-001'})
      -[:USES_BRIDGE]->(b:Bridge_Mechanism {bridge_id: 'BRG-VPN'})
MATCH (a)-[:CAUSES_CONSEQUENCE]->(c:Consequence)
RETURN a.attack_id AS attack, b.bridge_id AS bridge,
       b.bridge_type AS bridge_type, collect(c.consequence_id) AS consequences
"""

# Path 1c: Colonial — Technique → Instructional Concept
PATH1C = """
MATCH (t:ATT_CK_Technique)-[:MAPS_TO_CONCEPT]->(ic:Instructional_Concept)
WHERE t.mitre_id IN ['T1078', 'T1021', 'T1486']
RETURN t.mitre_id AS technique, collect(ic.concept_id) AS concepts
"""

# Path 2: Stuxnet vulnerability chain (Technique → CVE → CWE → CAPEC)
PATH2 = """
MATCH (t:ATT_CK_Technique {mitre_id: 'T1091'})
      -[:EXPLOITS]->(v:Vulnerability {cve_id: 'CVE-2010-2568'})
      -[:ROOT_CAUSE]->(w:Weakness {cwe_id: 'CWE-20'})
      -[:MAPS_TO_PATTERN]->(p:Attack_Pattern {capec_id: 'CAPEC-210'})
RETURN t.mitre_id AS technique, v.cve_id AS cve,
       w.cwe_id AS cwe, p.capec_id AS capec
"""

# Path 3a: TRITON — Attack → unauthorized Bridge → SIS Consequence
PATH3A = """
MATCH (a:Attack {attack_id: 'ATK-TRI-001'})
      -[:USES_BRIDGE]->(b:Bridge_Mechanism {bridge_id: 'BRG-EWS'})
WHERE b.bridge_type = 'unauthorized'
RETURN a.attack_id AS attack, b.bridge_id AS bridge, b.bridge_type AS bridge_type
"""

# Path 3b: TRITON — initial-access technique exists
PATH3B = """
MATCH (a:Attack {attack_id: 'ATK-TRI-001'})
      -[:USES_TECHNIQUE]->(t:ATT_CK_Technique)
WHERE t.tactic = 'initial-access'
RETURN a.attack_id AS attack, collect(t.mitre_id) AS initial_access_techniques
"""

# Path 3c: TRITON → SIS consequence (safety_suppression)
PATH3C = """
MATCH (a:Attack {attack_id: 'ATK-TRI-001'})
      -[:CAUSES_CONSEQUENCE]->(c:Consequence)
WHERE c.consequence_type = 'safety_suppression'
RETURN a.attack_id AS attack, collect(c.consequence_id) AS safety_consequences
"""

# Path 4: Stuxnet — Physical Process affected
PATH4 = """
MATCH (a:Attack {attack_id: 'ATK-STX-001'})
      -[:USES_TECHNIQUE]->(t:ATT_CK_Technique)
      -[:AFFECTS_PROCESS]->(p:Physical_Process)
RETURN a.attack_id AS attack, count(t) AS technique_count,
       collect(p.process_id) AS physical_processes
"""

# Path 5: All attacks have at least one Instructional_Concept
PATH5 = """
MATCH (a:Attack)-[:USES_TECHNIQUE]->(t:ATT_CK_Technique)
      -[:MAPS_TO_CONCEPT]->(ic:Instructional_Concept)
RETURN a.attack_id AS attack, count(DISTINCT ic) AS concept_count
ORDER BY attack
"""


def run_validation():
    uri  = os.getenv("NEO4J_URI",      "bolt://localhost:7687")
    user = os.getenv("NEO4J_USER",     "neo4j")
    pwd  = os.getenv("NEO4J_PASSWORD", "password")

    driver = GraphDatabase.driver(uri, auth=(user, pwd))
    passed = []
    failed = []

    def ok(msg):  passed.append(f"  PASS  {msg}")
    def err(msg): failed.append(f"  FAIL  {msg}")

    with driver.session() as s:

        # ── Path 1a: Colonial — Attack → T1078 ──────────────────────────────
        rows = list(s.run(PATH1A))
        if rows:
            r = rows[0]
            ok(f"Path 1a: Colonial -> T1078 ({r['name']})")
        else:
            err("Path 1a: ATK-COL-001 -[:USES_TECHNIQUE]-> T1078 not found")

        # ── Path 1b: Colonial — Attack → BRG-VPN → Consequence ──────────────
        rows = list(s.run(PATH1B))
        if rows:
            r = rows[0]
            ok(f"Path 1b: Colonial -> BRG-VPN (bridge_type={r['bridge_type']}) -> {r['consequences']}")
        else:
            err("Path 1b: Colonial -> BRG-VPN -> Consequence path not found")

        # ── Path 1c: Colonial techniques → Instructional Concepts ────────────
        rows = list(s.run(PATH1C))
        if rows:
            for r in rows:
                ok(f"Path 1c: {r['technique']} -> concepts {r['concepts']}")
        else:
            err("Path 1c: No MAPS_TO_CONCEPT from Colonial techniques")

        # ── Path 2: Stuxnet vuln chain (T1091 -> CVE -> CWE -> CAPEC) ───────
        rows = list(s.run(PATH2))
        if rows:
            r = rows[0]
            ok(f"Path 2: Stuxnet vuln chain T1091->{r['cve']}->{r['cwe']}->{r['capec']}")
        else:
            err("Path 2: Stuxnet T1091 -> CVE-2010-2568 -> CWE-20 -> CAPEC-210 chain not found")

        # ── Path 3a: TRITON → unauthorized bridge BRG-EWS ───────────────────
        rows = list(s.run(PATH3A))
        if rows:
            r = rows[0]
            ok(f"Path 3a: TRITON -> BRG-EWS (bridge_type={r['bridge_type']})")
        else:
            err("Path 3a: ATK-TRI-001 -> BRG-EWS (unauthorized) not found")

        # ── Path 3b: TRITON initial-access technique ─────────────────────────
        rows = list(s.run(PATH3B))
        if rows and rows[0]["initial_access_techniques"]:
            ok(f"Path 3b: TRITON initial-access techniques: {rows[0]['initial_access_techniques']}")
        else:
            err("Path 3b: No initial-access technique found for TRITON")

        # ── Path 3c: TRITON safety_suppression consequence ───────────────────
        rows = list(s.run(PATH3C))
        if rows and rows[0]["safety_consequences"]:
            ok(f"Path 3c: TRITON safety_suppression: {rows[0]['safety_consequences']}")
        else:
            err("Path 3c: No safety_suppression consequence found for TRITON")

        # ── Path 4: Stuxnet physical process affected ────────────────────────
        rows = list(s.run(PATH4))
        if rows and rows[0]["physical_processes"]:
            r = rows[0]
            ok(f"Path 4: Stuxnet affects {r['technique_count']} technique(s) -> {r['physical_processes']}")
        else:
            err("Path 4: Stuxnet -[:AFFECTS_PROCESS]-> Physical_Process not found")

        # ── Path 5: All 4 attacks connect to Instructional_Concepts ─────────
        rows = list(s.run(PATH5))
        attack_ids_found = {r["attack"] for r in rows if r["concept_count"] > 0}
        expected_attacks = {"ATK-COL-001", "ATK-GSM-001", "ATK-STX-001", "ATK-TRI-001"}
        if expected_attacks == attack_ids_found:
            for r in rows:
                ok(f"Path 5: {r['attack']} has {r['concept_count']} instructional concept(s)")
        else:
            missing = expected_attacks - attack_ids_found
            err(f"Path 5: Attacks missing instructional concepts: {sorted(missing)}")

    driver.close()

    # Summary
    print("\n" + "="*60)
    print("T042 CROSS-PLANE PATH VALIDATION SUMMARY")
    print("="*60)
    for msg in passed:
        print(msg)
    for msg in failed:
        print(msg)
    print("="*60)
    print(f"Result: {len(passed)} passed, {len(failed)} failed")

    if failed:
        print("\nFAILED -- resolve path gaps before advisor demo")
        sys.exit(1)
    else:
        print("\nPASSED -- all cross-plane paths validated")
        sys.exit(0)


if __name__ == "__main__":
    print("CyberKG-CPS -- T042: Cross-Plane Path Validation")
    print("Spec: CYB-25 §7.2 | 3 canonical paths: Colonial, Stuxnet vuln chain, TRITON\n")
    run_validation()
