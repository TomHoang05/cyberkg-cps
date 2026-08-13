"""CyberKG-CPS FastAPI application -- D-19 CORS config."""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.config import settings
from src.api.dependencies import get_driver
from src.api.routes import attacks, dossier, entities, generate, schema_route, system
from src.kg.schema_init import run_schema_init

log = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup: run CYB-14 schema init (constraints + indexes) against Neo4j.
    Shutdown: close the driver connection pool.
    Docs: CYB-14. CyberKG_Neo4j_Schema_Init.cypher
    """
    driver = get_driver()
    log.info("=== CyberKG-CPS startup: running Neo4j schema init (CYB-14) ===")
    result = run_schema_init(driver)
    if result.success:
        log.info(
            "Schema init OK -- %d statements in %.1f ms",
            result.statements_run, result.duration_ms,
        )
    else:
        log.warning(
            "Schema init completed with %d error(s): %s",
            len(result.errors), result.errors,
        )
    yield
    # Shutdown
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

# CORS -- D-19
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "OPTIONS", "POST"],
    allow_headers=["Content-Type", "Accept", "X-Request-ID"],
)

# Routers
app.include_router(system.router,       prefix="/api/v1")
app.include_router(attacks.router,      prefix="/api/v1")
app.include_router(dossier.router,      prefix="/api/v1")
app.include_router(entities.router,     prefix="/api/v1")
app.include_router(generate.router,     prefix="/api/v1")
app.include_router(schema_route.router, prefix="/api/v1")
