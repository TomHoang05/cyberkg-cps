"""Pydantic request body models — D-19 §12.1 POST /generate."""
from pydantic import BaseModel
from src.api.models.responses import AudienceType, OutputType


class GenerateRequest(BaseModel):
    """Request body for POST /api/v1/generate (D-19 §12.1)."""
    attack_id: str
    output_type: OutputType
    audience: AudienceType = AudienceType.INSTRUCTOR

    model_config = {
        "json_schema_extra": {
            "example": {
                "attack_id": "colonial_pipeline_2021",
                "output_type": "it_ot_movement",
                "audience": "instructor"
            }
        }
    }
