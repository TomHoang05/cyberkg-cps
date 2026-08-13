"""CyberKG-CPS FastAPI application v2 — Sprint 3 complete.

Changes vs main.py:
  - Imports attacks_v2   (slug → KG-ID resolution fix)
  - Imports generate_v2  (slug resolution + OUTPUT_TYPE_DEFERRED guard)
  - Imports system_v2    (working /stats entity_counts)
  - All other routers (dossier, entities, schema_route) unchanged.

Startup command (from cyberkg-cps/ root):
    uvicorn src.main_v2:app --reload --port 8000

Expected startup output:
    [startup] Running schema_init...
    [startup] schema_init OK.
    INFO: Uvicorn running on http://127.0.0.1:8000

Source: CYB-26 §7 | CYB-23 §1.1 | Sprint 3 Guide §T048
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.config import settings
from src.api.dependencies import get_driver
from src.api.routes import dossier, entities, schema_route
from src.api.routes import attacks_v2, generate_v2, system_v2
from src.api.routes import questions, relations
from src.kg.schema_init import run_schema_init

log = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup : run CYB-14 schema init (constraints + indexes) against Neo4j.
    Shutdown: close the driver connection pool.

    T057 integration test verifies:
      - run_schema_init() completes without error
      - 21 constraints exist in Neo4j
      - >= 30 indexes exist in Neo4j
    """
    driver = get_driver()
    log.info("=== CyberKG-CPS startup: running Neo4j schema init (CYB-14) ===")
    result = run_schema_init(driver)
    if result.success:
        log.info(
            "[startup] schema_init OK — %d statements in %.1f ms",
            result.statements_run,
            result.duration_ms,
        )
    else:
        log.warning(
            "[startup] schema_init completed with %d error(s): %s",
            len(result.errors),
            result.errors,
        )
    yield
    log.info("=== CyberKG-CPS shutdown: closing Neo4j driver ===")
    driver.close()


app = FastAPI(
    title="CyberKG-CPS API",
    version="1.0.0",
    docs_url="/api/v1/docs",
    redoc_url="/api/v1/redoc",
    openapi_url="/api/v1/openapi.json",
    lifespan=lifespan,
)

# CORS — D-19 §10
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "OPTIONS", "POST"],
    allow_headers=["Content-Type", "Accept", "X-Request-ID"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
# v2 routers (Sprint 3 fixes)
app.include_router(system_v2.router,   prefix="/api/v1")
app.include_router(attacks_v2.router,  prefix="/api/v1")
app.include_router(generate_v2.router, prefix="/api/v1")

# Unchanged routers from Sprint 1-3 skeleton
app.include_router(dossier.router,      prefix="/api/v1")
app.include_router(entities.router,     prefix="/api/v1")
app.include_router(schema_route.router, prefix="/api/v1")

# New Sprint 4 routers (28-Jul integration)
app.include_router(questions.router,    prefix="/api/v1")
app.include_router(relations.router,    prefix="/api/v1")
