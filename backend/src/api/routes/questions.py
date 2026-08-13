"""Question / Q-bank endpoints — CYB-12 SSII entity #17, Sprint 3 T046b.

AUDIT-FIXED (SEVERE, infra gap): 128 real Question nodes were seeded into the KG
(data/kg_data/qbank/questions.yaml) but no REST route ever existed to list or
filter them — the entire Q-bank was completely unreachable from the API or the
frontend. Note: scenario_id (S01..S21, S09b) is a Q-bank-internal scenario code,
NOT the same value as Attack.attack_id — there is no 1:1 mapping between the 22
scenario_ids and the 4 real attack cases, so this route does not (and should
not) accept an attack_id filter; use scenario_id/role/bloom_level instead.
"""
from typing import Literal

from fastapi import APIRouter, Depends, Query
from neo4j import Driver

from src.api.dependencies import get_driver
from src.kg.queries.questions import Q_COUNT_QUESTIONS, Q_LIST_QUESTIONS

router = APIRouter(prefix="/questions", tags=["questions"])


@router.get("")
def list_questions(
    role: Literal["instructor", "student", "security_researcher"] | None = None,
    scenario_id: str | None = None,
    bloom_level: Literal["L1", "L2", "L3", "L4", "L5", "L6"] | None = None,
    page: int = 1,
    page_size: int = Query(default=20, le=100),
    driver: Driver = Depends(get_driver),
):
    """GET /api/v1/questions — list/filter the 128-question Q-bank."""
    skip = (page - 1) * page_size
    with driver.session() as s:
        result = s.run(
            Q_LIST_QUESTIONS,
            user_role=role, scenario_id=scenario_id, bloom_level=bloom_level,
            skip=skip, limit=page_size,
        )
        data = [dict(r) for r in result]
        total = s.run(
            Q_COUNT_QUESTIONS,
            user_role=role, scenario_id=scenario_id, bloom_level=bloom_level,
        ).single()["total"]
    return {
        "success": True,
        "data": data,
        "meta": {"page": page, "page_size": page_size, "total": total},
    }
