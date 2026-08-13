"""load_all_cases_v6.py — Full KG load from 10-Jul split-file data.

Identical to load_all_cases_v5.py except uses loader_v6 (which imports
provenance_v2 with the fixed auto_fill_provenance).

Bug fixed:
  provenance.auto_fill_provenance only filled ingested_at inside
  `if "source" not in node:`.  All 104 YAML case nodes already supply
  `source`, so ingested_at was never set and validate_provenance raised,
  causing every case node to be skipped (0/104 nodes loaded).

Expected result after clean load:
  Nodes: 104  (canonical MERGE-deduplicated, per CYB-13 §VIII)
  Edges: 149  (per 10-Jul validate_t041_kg_counts.py EXPECTED_EDGE_COUNT)

Run from cyberkg-cps/ project root:
    py -3.11 scripts/load_all_cases_v6.py

Prerequisites:
  - Neo4j running with schema initialised:
      py -3.11 -m src.kg.schema_init
  - .env file at cyberkg-cps/ root with NEO4J_URI / NEO4J_USER / NEO4J_PASSWORD
  - pip install neo4j pyyaml python-dotenv
"""

import sys
import logging
from pathlib import Path

ROOT = Path(__file__).parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from dotenv import load_dotenv           # noqa: E402
load_dotenv(ROOT / ".env")

from neo4j import GraphDatabase          # noqa: E402
from src.api.config import settings      # noqa: E402
from src.kg.loader_v6 import load_shared, load_case   # noqa: E402  ← v6

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger(__name__)

DATA_DIR = ROOT / "data" / "kg_data"

# Case directories in preferred load order
CASE_DIRS = [
    DATA_DIR / "colonial_pipeline",
    DATA_DIR / "triton",
    DATA_DIR / "german_steel_mill",
    DATA_DIR / "stuxnet",
]

# Default provenance for shared data
SHARED_SOURCE = "CyberKG-CPS Ontology (CYB-13 v1.3)"
SHARED_URL    = "internal — CYB-13 §VI Table 1"

# Per-case provenance
CASE_PROVENANCE: dict[str, tuple[str, str]] = {
    "colonial_pipeline": (
        "CISA Advisory AA21-131A / Beerman et al. 2023",
        "https://www.cisa.gov/news-events/cybersecurity-advisories/aa21-131a",
    ),
    "triton": (
        "CISA ICS-CERT MAR-17-352-01 / Dragos / Mandiant",
        "https://www.cisa.gov/news-events/analysis-reports/ar18-074a",
    ),
    "german_steel_mill": (
        "SANS Lee et al. 2014 / BSI Lagebericht 2014",
        "https://www.bsi.bund.de/DE/Service-Navi/Publikationen/Lageberichte/lageberichte_node.html",
    ),
    "stuxnet": (
        "Symantec W32.Stuxnet Dossier v1.4 / Langner 2011",
        "https://docs.broadcom.com/doc/security-response-w32-stuxnet-dossier-11-en",
    ),
}


def main() -> None:
    log.info("load_all_cases_v6.py  — CyberKG-CPS full load (10-Jul data, provenance_v2 fix)")
    log.info("Neo4j URI: %s", settings.NEO4J_URI)
    log.info("Data root: %s", DATA_DIR)

    driver = GraphDatabase.driver(
        settings.NEO4J_URI,
        auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD),
    )

    total_nodes = 0
    total_rels  = 0
    all_errors: list[str] = []

    with driver.session(database="neo4j") as session:

        # ── 0. Wipe existing graph ───────────────────────────────────────────
        log.info("Clearing existing graph …")
        result  = session.run("MATCH (n) DETACH DELETE n")
        summary = result.consume()
        log.info(
            "  Deleted %d nodes and %d relationships",
            summary.counters.nodes_deleted,
            summary.counters.relationships_deleted,
        )

        # ── 1. Load shared nodes (instructional_concepts + network_zones) ───
        log.info("Loading shared/ …")
        r = load_shared(session, DATA_DIR / "shared", SHARED_SOURCE, SHARED_URL)
        log.info("  Loaded %d shared nodes (%d errors)", r["loaded"], len(r["errors"]))
        total_nodes += r["loaded"]
        all_errors.extend(r["errors"])

        # ── 2. Load each attack case ─────────────────────────────────────────
        for case_dir in CASE_DIRS:
            if not case_dir.exists():
                log.warning("Case directory not found, skipping: %s", case_dir)
                continue

            src, url = CASE_PROVENANCE.get(case_dir.name, ("CyberKG-CPS", "internal"))
            log.info("Loading case: %s …", case_dir.name)
            r = load_case(session, case_dir, src, url)

            log.info(
                "  %-22s  nodes=%-4d  rels=%-4d  errors=%d",
                case_dir.name,
                r["loaded"],
                r.get("relationships", 0),
                len(r["errors"]),
            )
            total_nodes += r["loaded"]
            total_rels  += r.get("relationships", 0)
            all_errors.extend(r["errors"])

        # ── 3. Count canonical graph ─────────────────────────────────────────
        canon_nodes = session.run("MATCH (n) RETURN count(n) AS c").single()["c"]
        canon_rels  = session.run("MATCH ()-[r]->() RETURN count(r) AS c").single()["c"]

    driver.close()

    # ── Summary ───────────────────────────────────────────────────────────────
    print()
    print("=" * 64)
    print("  LOAD SUMMARY (v6 — provenance_v2 fix, split files, plane labels)")
    print("=" * 64)
    print(f"  YAML nodes processed (pre-MERGE) : {total_nodes}")
    print(f"  Relationships loaded              : {total_rels}")
    print(f"  Errors                            : {len(all_errors)}")
    print()
    print(f"  Neo4j canonical nodes (post-MERGE): {canon_nodes}  (expect 104)")
    print(f"  Neo4j canonical edges             : {canon_rels}   (expect 149)")
    print()

    if all_errors:
        print("  ERRORS:")
        for e in all_errors:
            print(f"    • {e}")
        print()

    if canon_nodes == 104 and canon_rels == 149:
        print("  ✓  Graph matches CYB-13 canonical counts (104 / 149)")
    else:
        print("  ✗  Node/edge count mismatch — check errors above")
        print("     Run: py -3.11 scripts/validate_t041_kg_counts.py")

    print("=" * 64)

    if all_errors:
        sys.exit(1)


if __name__ == "__main__":
    main()
