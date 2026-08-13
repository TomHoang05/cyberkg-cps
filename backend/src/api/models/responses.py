"""Pydantic response models — D-19 §9 + D-18 §III.5 InstructionalOutput."""
from pydantic import BaseModel, Field
from typing import Any, Optional, List, Dict
from datetime import datetime
from enum import Enum


# ── Enums (D-19 §9) ───────────────────────────────────────────────────
class EntityType(str, Enum):
    # AUDIT-FIXED (SEVERE): values were all-uppercase and used "&" — never matched
    # real Neo4j labels, so GET /entities always returned an empty list.
    # Values here are the exact node labels from node_schema.yaml / CYB-12.
    ATTACK                = "Attack"
    TECHNIQUE             = "ATT_CK_Technique"
    VULNERABILITY         = "Vulnerability"
    WEAKNESS              = "Weakness"
    ATTACK_PATTERN        = "Attack_Pattern"
    IT_SYSTEM             = "IT_System"
    OT_SYSTEM             = "OT_System"
    NETWORK_ZONE          = "Network_Zone"
    BRIDGE_MECHANISM      = "Bridge_Mechanism"
    PHYSICAL_PROCESS      = "Physical_Process"
    CONSEQUENCE           = "Consequence"
    AI_COMPONENT          = "AI_Component"
    AI_ATTACK_SURFACE     = "AI_Attack_Surface"
    HUMAN_ACTOR           = "Human_Actor"
    HUMAN_ACTION          = "Human_Action"
    INSTRUCTIONAL_CONCEPT = "Instructional_Concept"
    QUESTION              = "Question"

class PlaneType(str, Enum):
    CYBER = "cyber"; BRIDGE = "bridge"; PHYSICAL = "physical"
    AI = "ai"; HUMAN = "human"; CROSS = "cross"

class EvidenceClass(str, Enum):
    DOCUMENTED_FACT = "documented_fact"
    SUPPORTED_INFERENCE = "supported_inference"
    INSTRUCTIONAL_EXTENSION = "instructional_extension"

class BridgeType(str, Enum):
    AUTHORIZED = "authorized"; UNAUTHORIZED = "unauthorized"
    AIR_GAP = "air_gap"; STRUCTURAL = "structural"

class ConsequenceType(str, Enum):
    DIRECT_MANIPULATION = "direct_manipulation"
    INDIRECT_DISRUPTION = "indirect_disruption"
    SAFETY_SUPPRESSION = "safety_suppression"
    MANIPULATION_OF_VIEW = "manipulation_of_view"

class AudienceType(str, Enum):
    INSTRUCTOR = "instructor"; STUDENT = "student"; RESEARCHER = "researcher"

class OutputType(str, Enum):
    ATTACK_SURFACE = "attack_surface"
    IT_OT_MOVEMENT = "it_ot_movement"
    PHYSICAL_CONSEQUENCES = "physical_consequences"
    AI_HUMAN_ROLE = "ai_human_role"
    ATTACK_DOSSIER = "attack_dossier"


# ── Provenance block (D-04 §IV, universal on every node/edge) ─────────
class ProvenanceBlock(BaseModel):
    source: str
    source_id_or_url: str
    ingested_at: datetime
    confidence: float = Field(ge=0.0, le=1.0)
    evidence_class: EvidenceClass
    license: str


# ── Graph models (D-19 §9) ────────────────────────────────────────────
class GraphNode(BaseModel):
    id: str; label: str; type: EntityType; plane: PlaneType
    properties: Dict[str, Any]
    provenance: Optional[ProvenanceBlock] = None

class GraphEdge(BaseModel):
    id: str; source: str; target: str; type: str
    properties: Dict[str, Any]

class GraphResponse(BaseModel):
    nodes: List[GraphNode]; edges: List[GraphEdge]
    summary: Dict[str, Any]


# ── API envelope (D-19 §3.1) ──────────────────────────────────────────
class Meta(BaseModel):
    request_id: str; response_time_ms: int
    version: str = "1.0"; attack_id: Optional[str] = None

class APIResponse(BaseModel):
    success: bool; data: Any; meta: Meta


# ── Q3 Consequence response models (fix 0.2) ─────────────────────────
class CyberLayerItem(BaseModel):
    technique_id: str
    name: str
    tactic: Optional[str] = None
    plane: Optional[str] = None
    evidence_class: Optional[str] = None

class BridgeLayerItem(BaseModel):
    bridge_id: str
    name: str
    bridge_type: Optional[str] = None
    purdue_from: Optional[str] = None
    purdue_to: Optional[str] = None
    evidence_class: Optional[str] = None

class PhysicalLayerItem(BaseModel):
    system_name: str
    process_name: Optional[str] = None
    purdue_level: Optional[int] = None
    evidence_class: Optional[str] = None

class ConsequenceLayerItem(BaseModel):
    consequence_id: str
    name: str
    severity: Optional[str] = None
    was_realized: Optional[bool] = None
    consequence_type: Optional[str] = None
    causal_mechanism: Optional[str] = None
    evidence_class: Optional[str] = None
    confidence: Optional[float] = None
    learning_objectives: List[str] = []

class ConsequenceResponse(BaseModel):
    layer_1_cyber: List[CyberLayerItem] = []
    layer_2_bridge: List[BridgeLayerItem] = []
    layer_3_physical: List[PhysicalLayerItem] = []
    layer_4_consequence: List[ConsequenceLayerItem] = []


# ── Q4 AI/Human Roles response models (fix 0.1) ──────────────────────
class HumanRoleItem(BaseModel):
    actor_id: str
    role_type: Optional[str] = None
    role_description: Optional[str] = None
    action: Optional[str] = None

class AIComponentItem(BaseModel):
    component_id: str
    name: str
    ai_type: Optional[str] = None
    is_hypothetical: Optional[bool] = True
    role: Optional[str] = None
    scenario_description: Optional[str] = None

class AIAttackSurfaceItem(BaseModel):
    surface_id: str
    name: str
    surface_type: Optional[str] = None
    is_adversarial: Optional[bool] = True
    table1_category: Optional[str] = None
    evidence_class: Optional[str] = None
    description: Optional[str] = None
    mitre_atlas_id: Optional[str] = None

class DecisionPoint(BaseModel):
    action_id: str
    description: Optional[str] = None
    action_type: Optional[str] = None

class AIHumanRoleResponse(BaseModel):
    human_roles: List[HumanRoleItem] = []
    ai_components: List[AIComponentItem] = []
    ai_attack_surfaces: List[AIAttackSurfaceItem] = []
    decision_points: List[DecisionPoint] = []


# ── Q5 Full chain response model (fix 0.3) ───────────────────────────
class InstructionalModuleItem(BaseModel):
    concept_id: str
    name: str
    module: Optional[str] = None
    learning_objectives: Optional[Any] = None

class FullChainResponse(BaseModel):
    attack_surface: Dict[str, Any]
    it_ot_movement: List[Dict[str, Any]] = []
    bridges: List[Dict[str, Any]] = []
    physical_consequences: List[Dict[str, Any]] = []
    ai_human_roles: Dict[str, Any] = {}
    instructional_modules: List[InstructionalModuleItem] = []


# ── InstructionalOutput (D-18 §III.5 / D-19 §12.1) ───────────────────
class EvidenceDistribution(BaseModel):
    documented_fact: int = 0
    supported_inference: int = 0
    instructional_extension: int = 0

class InstructionalOutput(BaseModel):
    attack: str
    output_type: OutputType
    content: str
    model_used: str
    kg_confidence: float = Field(ge=0.0, le=1.0)
    evidence_class_distribution: EvidenceDistribution
    table1_concepts_covered: List[str] = []
    module_alignment: List[str] = []
    generated_at: datetime
    generation_latency_ms: int
