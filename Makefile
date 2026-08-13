.PHONY: help install install-backend install-frontend \
        dev dev-backend dev-frontend \
        load-data schema \
        test test-backend test-frontend \
        docker docker-down \
        clean

# ── Variables ─────────────────────────────────────────────────────────────────

PYTHON       ?= python
BACKEND_DIR   = backend
FRONTEND_DIR  = src/frontend

# ── Help ──────────────────────────────────────────────────────────────────────

help:
	@echo ""
	@echo "CyberKG-CPS — available commands"
	@echo "---------------------------------"
	@echo "  make install          Install all Python + Node dependencies"
	@echo "  make schema           Initialise Neo4j schema (run once after Neo4j starts)"
	@echo "  make load-data        Load the 4 MVP attack cases into Neo4j"
	@echo "  make dev-backend      Start FastAPI backend (port 8000)"
	@echo "  make dev-frontend     Start Vite dev server (port 5173)"
	@echo "  make test             Run backend + frontend tests"
	@echo "  make docker           Build and start the full stack via Docker Compose"
	@echo "  make docker-down      Stop and remove Docker Compose containers"
	@echo "  make clean            Remove caches and build artefacts"
	@echo ""

# ── Install ───────────────────────────────────────────────────────────────────

install: install-backend install-frontend

install-backend:
	cd $(BACKEND_DIR) && pip install -r requirements.txt

install-frontend:
	cd $(FRONTEND_DIR) && npm install

# ── Neo4j schema (runs automatically on backend startup, but can be forced) ──

schema:
	@echo "Running Neo4j schema initialiser..."
	cd $(BACKEND_DIR) && $(PYTHON) -m src.kg.schema_init
	@echo "Schema init complete."

# ── Data loading ──────────────────────────────────────────────────────────────

load-data:
	@echo "Loading 4 MVP attack cases into Neo4j..."
	$(PYTHON) scripts/load_all_cases_v6.py
	@echo "Data load complete."

# ── Dev servers ───────────────────────────────────────────────────────────────
# Run each in its own terminal; they cannot share one shell.

dev-backend:
	cd $(BACKEND_DIR) && uvicorn src.main_v2:app --reload --port 8000

dev-frontend:
	cd $(FRONTEND_DIR) && npm run dev

# ── Tests ─────────────────────────────────────────────────────────────────────

test: test-backend test-frontend

test-backend:
	cd $(BACKEND_DIR) && $(PYTHON) -m pytest tests/ -v

test-frontend:
	cd $(FRONTEND_DIR) && npm test

# ── Docker ────────────────────────────────────────────────────────────────────

docker:
	docker compose up --build

docker-down:
	docker compose down

# ── Clean ─────────────────────────────────────────────────────────────────────

clean:
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null; true
	find . -name "*.pyc" -delete 2>/dev/null; true
	find . -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null; true
	rm -rf $(FRONTEND_DIR)/node_modules $(FRONTEND_DIR)/dist 2>/dev/null; true
