"""
CyberKG-CPS — Neo4j Schema Initializer
CYB-14 v1.1 §VI: Run all constraints + indexes from CYB-14.cypher on app startup.

Usage (called automatically from main.py lifespan):
    from src.kg.schema_init import run_schema_init
    run_schema_init(driver)

Or standalone CLI:
    python -m src.kg.schema_init
"""

import logging
import sys
import time
from pathlib import Path
from typing import NamedTuple

from neo4j import Driver, GraphDatabase, exceptions as neo4j_exc

from src.api.config import settings

log = logging.getLogger(__name__)

# Path to the .cypher file (sibling of this file: src/kg/schema_init.py)
# Resolves to: backend/src/kg/CYB-14. CyberKG_Neo4j_Schema_Init.cypher
# Alternatively kept in project root and path overridden via env var.
_DEFAULT_CYPHER_FILE = (
    Path(__file__).parent / "CYB-14. CyberKG_Neo4j_Schema_Init.cypher"
)
# Fallback: look for the file two levels up (project docs folder)
_FALLBACK_CYPHER_FILE = (
    Path(__file__).parents[4] / "CYB-14. CyberKG_Neo4j_Schema_Init.cypher"
)


# ------------------------------------------------------------------ #
# Result dataclass                                                     #
# ------------------------------------------------------------------ #

class SchemaInitResult(NamedTuple):
    success: bool
    statements_run: int
    statements_skipped: int   # already existed (IF NOT EXISTS)
    errors: list[str]
    duration_ms: float


# ------------------------------------------------------------------ #
# Helpers                                                              #
# ------------------------------------------------------------------ #

def _resolve_cypher_file(override: Path | None = None) -> Path:
    """Resolve the .cypher file path, trying multiple locations."""
    candidates = [p for p in [override, _DEFAULT_CYPHER_FILE, _FALLBACK_CYPHER_FILE] if p]
    for path in candidates:
        if path and path.exists():
            return path
    raise FileNotFoundError(
        "CYB-14 cypher file not found. Tried:\n"
        + "\n".join(f"  {p}" for p in candidates)
    )


def _parse_statements(cypher_text: str) -> list[str]:
    """
    Split cypher file into individual statements.
    Rules:
      - Lines starting with '//' are comments → skip
      - Lines starting with 'CALL' or 'SHOW' are verification queries → skip
      - Statements separated by blank lines or semicolons
      - Leading/trailing whitespace stripped
    """
    statements: list[str] = []
    current_lines: list[str] = []

    for raw_line in cypher_text.splitlines():
        line = raw_line.strip()

        # Skip comment lines and section headers
        if not line or line.startswith("//"):
            if current_lines:
                stmt = " ".join(current_lines).strip()
                if stmt:
                    statements.append(stmt)
                current_lines = []
            continue

        # Skip read-only verification queries (CALL / SHOW) — those are comments anyway
        if line.upper().startswith(("CALL ", "SHOW ")):
            continue

        # Strip inline trailing comments
        if "//" in line:
            line = line[: line.index("//")].strip()
            if not line:
                continue

        # Strip trailing semicolons (neo4j driver doesn't need them)
        line = line.rstrip(";").strip()
        if line:
            current_lines.append(line)

    # Flush last statement
    if current_lines:
        stmt = " ".join(current_lines).strip()
        if stmt:
            statements.append(stmt)

    # Filter to only CREATE CONSTRAINT / CREATE INDEX / CREATE RANGE INDEX / CREATE FULLTEXT INDEX
    valid_prefixes = (
        "CREATE CONSTRAINT",
        "CREATE INDEX",
        "CREATE RANGE INDEX",
        "CREATE FULLTEXT INDEX",
    )
    return [s for s in statements if s.upper().startswith(valid_prefixes)]


def _run_statement(session, stmt: str) -> tuple[bool, str | None]:
    """
    Execute a single Cypher DDL statement.
    Returns (success, error_message_or_None).
    IF NOT EXISTS means Neo4j silently skips duplicates — not an error.
    """
    try:
        session.run(stmt)
        return True, None
    except neo4j_exc.ClientError as exc:
        # Neo4j raises ClientError if constraint/index already exists
        # without IF NOT EXISTS — treat as skipped, not failure
        msg = str(exc)
        if "already exists" in msg.lower() or "equivalent" in msg.lower():
            log.debug("Already exists (skipped): %s", stmt[:80])
            return True, None
        log.warning("ClientError on DDL statement: %s | %s", stmt[:120], msg)
        return False, msg
    except Exception as exc:  # noqa: BLE001
        log.error("Unexpected error on DDL: %s | %s", stmt[:120], exc)
        return False, str(exc)


# ------------------------------------------------------------------ #
# Public API                                                          #
# ------------------------------------------------------------------ #

def run_schema_init(
    driver: Driver,
    cypher_file: Path | None = None,
    database: str = "neo4j",
) -> SchemaInitResult:
    """
    Read CYB-14.cypher and execute all CREATE CONSTRAINT / CREATE INDEX
    statements against the connected Neo4j instance.

    Args:
        driver:       Active neo4j.Driver (from dependencies.get_driver())
        cypher_file:  Override path to .cypher file (optional)
        database:     Target Neo4j database name (default "neo4j")

    Returns:
        SchemaInitResult with counts and any error messages.
    """
    t0 = time.monotonic()
    errors: list[str] = []
    run_count = 0
    skip_count = 0

    # 1. Resolve file
    try:
        fpath = _resolve_cypher_file(cypher_file)
    except FileNotFoundError as exc:
        log.error("Schema init aborted: %s", exc)
        return SchemaInitResult(
            success=False,
            statements_run=0,
            statements_skipped=0,
            errors=[str(exc)],
            duration_ms=0.0,
        )

    log.info("Running schema init from: %s", fpath)

    # 2. Parse statements
    cypher_text = fpath.read_text(encoding="utf-8")
    statements = _parse_statements(cypher_text)
    log.info("Parsed %d DDL statements to execute", len(statements))

    # 3. Execute in a single write transaction per statement
    #    (Neo4j DDL must run statement-by-statement, not in a single tx)
    with driver.session(database=database) as session:
        for i, stmt in enumerate(statements, start=1):
            log.debug("[%d/%d] %s", i, len(statements), stmt[:100])
            ok, err = _run_statement(session, stmt)
            if ok:
                run_count += 1
            else:
                errors.append(f"[stmt {i}] {err}")
                skip_count += 1

    duration_ms = (time.monotonic() - t0) * 1000
    success = len(errors) == 0

    if success:
        log.info(
            "Schema init complete: %d statements executed in %.1f ms",
            run_count, duration_ms,
        )
    else:
        log.warning(
            "Schema init finished with %d errors (%d ok, %.1f ms)",
            len(errors), run_count, duration_ms,
        )

    return SchemaInitResult(
        success=success,
        statements_run=run_count,
        statements_skipped=skip_count,
        errors=errors,
        duration_ms=duration_ms,
    )


def verify_schema(driver: Driver, database: str = "neo4j") -> dict:
    """
    Read back SHOW CONSTRAINTS and SHOW INDEXES from Neo4j.
    Returns summary counts for the /api/v1/health endpoint.
    """
    with driver.session(database=database) as session:
        constraints = session.run("SHOW CONSTRAINTS").data()
        indexes = session.run("SHOW INDEXES").data()

    return {
        "constraints": len(constraints),
        "indexes": len(indexes),
        "constraint_names": [c.get("name") for c in constraints],
        "index_names": [ix.get("name") for ix in indexes],
    }


# ------------------------------------------------------------------ #
# main.py integration — paste into src/main.py                        #
# ------------------------------------------------------------------ #
# Add this to src/main.py to wire schema_init into the FastAPI lifespan:
#
#   from contextlib import asynccontextmanager
#   from src.kg.schema_init import run_schema_init
#   from src.api.dependencies import get_driver
#
#   @asynccontextmanager
#   async def lifespan(app: FastAPI):
#       driver = get_driver()
#       result = run_schema_init(driver)
#       if not result.success:
#           import logging
#           logging.getLogger(__name__).error(
#               "Schema init had errors: %s", result.errors
#           )
#       yield
#       driver.close()
#
#   app = FastAPI(..., lifespan=lifespan)


# ------------------------------------------------------------------ #
# Standalone CLI — python -m src.kg.schema_init                       #
# ------------------------------------------------------------------ #

def _cli() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    )
    log.info("Connecting to Neo4j at %s ...", settings.NEO4J_URI)
    driver = GraphDatabase.driver(
        settings.NEO4J_URI,
        auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD),
    )
    try:
        result = run_schema_init(driver)
        print("\n=== Schema Init Result ===")
        print(f"  Success          : {result.success}")
        print(f"  Statements run   : {result.statements_run}")
        print(f"  Errors           : {result.statements_skipped}")
        print(f"  Duration         : {result.duration_ms:.1f} ms")
        if result.errors:
            print("\n  Error details:")
            for e in result.errors:
                print(f"    • {e}")

        print("\n=== Schema Verification ===")
        info = verify_schema(driver)
        print(f"  Constraints in DB: {info['constraints']}")
        print(f"  Indexes in DB    : {info['indexes']}")

        sys.exit(0 if result.success else 1)
    finally:
        driver.close()


if __name__ == "__main__":
    _cli()
