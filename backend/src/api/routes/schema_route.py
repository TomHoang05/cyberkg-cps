"""Schema endpoint — D-19 §8 GET /schema (16 entity + 17 relation types)."""
from fastapi import APIRouter
from src.api.models.responses import EntityType, EvidenceClass

router = APIRouter(tags=["schema"])

ENTITY_TYPES = [
    {"name": e.value, "bio_tag": f"B-{e.name[:4]}", "plane": "cyber"}
    for e in EntityType
]

@router.get("/schema")
def get_schema():
    """GET /api/v1/schema — D-19 §8.1"""
    return {
        "success": True,
        "data": {
            "entity_types": ENTITY_TYPES,
            "relationship_types": [
                {"name": r} for r in [
                    "USES_TECHNIQUE","TECHNIQUE_ORDER","EXPLOITS","ROOT_CAUSE",
                    "MAPS_TO_PATTERN","TARGETS","LOCATED_IN","BRIDGES_TO",
                    "AFFECTS_PROCESS","CAUSES_CONSEQUENCE","CONSEQUENCE_TYPE",
                    "AI_INVOLVED_IN","AI_ATTACK_VIA","HUMAN_ROLE",
                    "PERFORMS_ACTION","MAPS_TO_CONCEPT","USES_BRIDGE",
                ]
            ],
            "evidence_classes": [e.value for e in EvidenceClass],
        }
    }
