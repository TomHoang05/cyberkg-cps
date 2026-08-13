# CyberKG-CPS

A knowledge-graph-backed web application for teaching CPS (Cyber-Physical Systems) cybersecurity. It models four landmark ICS attacks — Stuxnet, TRITON, Colonial Pipeline, and German Steel Mill — as a Neo4j graph and exposes them through role-based dashboards for instructors, students, and researchers.

**Tech stack:** FastAPI · Neo4j 5 · React 18 + D3.js · Vite

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Python | 3.11+ | |
| Node.js | 18+ | |
| Neo4j | 5.x Community | Desktop app **or** Docker |
| Docker + Compose | any recent | Only needed for the Docker path |

---

## Option A — Local Development (recommended for first-time setup)

This path uses **Neo4j Desktop** (free GUI) so you don't need Docker at all.

### 1. Clone and configure

```bash
git clone <repo-url>
cd cyberkg-cps
```

Copy the example env file (Windows: `copy .env.example .env`; Mac/Linux: `cp .env.example .env`), then open `.env` and set `NEO4J_PASSWORD` to match the password you will set in Neo4j Desktop.

### 2. Start Neo4j

Open **Neo4j Desktop**, create a new project, add a **Local DBMS** (Neo4j 5.x), install the **APOC** plugin from the plugin tab, then start it.

> The default Bolt URI is `bolt://localhost:7687`. If yours differs, update `NEO4J_URI` in `.env`.

### 3. Install dependencies

```bash
# Backend — create a virtual environment first (keeps packages isolated)
cd backend
python -m venv venv

# Activate it:
#   Windows:   venv\Scripts\activate
#   Mac/Linux: source venv/bin/activate

pip install -r requirements.txt
cd ..

# Frontend
cd src/frontend
npm install
cd ../..
```

### 4. Load the knowledge graph

The backend auto-initialises the Neo4j schema (constraints + indexes) on its first startup. Load the four attack case datasets after starting the backend:

```bash
# Terminal 1 — start the backend (keeps running)
cd backend
uvicorn src.main_v2:app --reload --port 8000
```

```bash
# Terminal 2 — run from the project root (cyberkg-cps/), not inside backend/
python scripts/load_all_cases_v6.py
```

You should see output ending with:

```
Nodes loaded: 104
Edges loaded: 149
KG ready.
```

### 5. Start the frontend

```bash
# Terminal 3
cd src/frontend
npm run dev
```

Open **http://localhost:5173** — select a role (Instructor / Student / Researcher) to begin.

API docs are available at **http://localhost:8000/api/v1/docs**.

---

## Option B — Docker Compose (full stack)

Runs Neo4j, the FastAPI backend, and a production-built frontend in containers. No local Python or Node installation required beyond Docker.

```bash
git clone <repo-url>
cd cyberkg-cps

cp .env.example .env
# Set NEO4J_PASSWORD in .env (any value you choose)

docker compose up --build
```

Wait for all three services to report healthy (Neo4j takes ~30 s on first boot), then load the data into Neo4j via the running backend container:

```bash
docker compose exec backend python /app/scripts/load_all_cases_v6.py
```

You should see output ending with `Nodes loaded: 104 / Edges loaded: 149 / KG ready.`

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000/api/v1/docs |
| Neo4j Browser | http://localhost:7474 |

To stop:

```bash
docker compose down
```

---

## Project structure

```
cyberkg-cps/
├── backend/                  # FastAPI application
│   ├── src/
│   │   ├── main_v2.py        # App entry point (uvicorn src.main_v2:app)
│   │   ├── api/
│   │   │   ├── routes/       # attacks_v2, dossier, generate_v2, …
│   │   │   └── services/     # narrative, dossier_builder
│   │   └── kg/
│   │       ├── queries/      # Q1–Q5 Cypher query modules
│   │       ├── loader_v6.py  # YAML → Neo4j loader
│   │       └── schema_init.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── src/
│   └── frontend/             # React + Vite SPA
│       ├── src/
│       │   ├── pages/        # instructor/, student/, researcher/
│       │   ├── components/   # viz/ (D3 graphs), shared/
│       │   ├── services/     # api.js, attackService.js
│       │   └── hooks/        # useAttackData.js
│       ├── Dockerfile
│       ├── nginx.conf
│       └── package.json
│
├── data/
│   └── kg_data/              # YAML source files for the 4 MVP attacks
│       ├── colonial_pipeline/
│       ├── triton/
│       ├── german_steel_mill/
│       ├── stuxnet/
│       └── shared/           # instructional_concepts, network_zones
│
├── scripts/
│   └── load_all_cases_v6.py  # One-shot KG data loader (run after backend starts)
│
├── docker-compose.yml
├── Makefile                  # Convenience targets (see make help)
└── .env.example
```

---

## Make targets

```bash
make help           # list all targets
make install        # pip install + npm install
make dev-backend    # start FastAPI on :8000
make dev-frontend   # start Vite on :5173
make load-data      # run scripts/load_all_cases_v6.py
make schema         # force Neo4j schema init (normally automatic)
make test           # pytest + jest
make docker         # docker compose up --build
make clean          # remove __pycache__, node_modules, dist
```

---

## Environment variables

Copy `.env.example` to `.env` and fill in at minimum:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEO4J_PASSWORD` | Yes | Password for the `neo4j` user |
| `NEO4J_URI` | No | Default: `bolt://localhost:7687` |
| `NEO4J_USER` | No | Default: `neo4j` |
| `OPENAI_API_KEY` | No | Only needed for LLM-generated dossiers |
| `ANTHROPIC_API_KEY` | No | Alternative LLM provider |

The dossier download feature works without any LLM key — it generates a structured Word document directly from the knowledge graph.

---

## Roles

| Role | URL | Description |
|------|-----|-------------|
| Instructor | `/instructor` | Full KG explorer, query console, dossier download |
| Student | `/student` | Guided scenario explorer, attack graph, lab exercises |
| Researcher | `/researcher` | Data provenance, full chain analysis, export tools |
