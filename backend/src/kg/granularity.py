"""Granularity Rule checker — T023 Sprint 1. Source: CYB-12 §III."""

MIN_CONFIDENCE = {
    "documented_fact": 0.8,
    "supported_inference": 0.6,
    "instructional_extension": 0.0,
}
MAX_ABSTRACTION_LEVEL = "Base"  # CWE abstraction: Pillar > Class > Base > Variant

# Canonical component_type enum — CYB-12 §III.12 / CYB-14 v1.1 ai_component_type_idx
COMPONENT_TYPE_ENUM: frozenset[str] = frozenset({
    "anomaly_detector",
    "classifier",
    "nlp_assistant",
    "digital_twin",
    "intrusion_detection",
})


def check_confidence_threshold(node: dict) -> bool:
    """Confidence must meet minimum per evidence_class."""
    ec = node.get("evidence_class", "supported_inference")
    threshold = MIN_CONFIDENCE.get(ec, 0.5)
    return node.get("confidence", 0.0) >= threshold


def check_cwe_abstraction(cwe_abstraction: str) -> bool:
    """Prefer Base-level CWE (not too broad, not too specific)."""
    order = ["Pillar", "Class", "Base", "Variant"]
    allowed = order[order.index(MAX_ABSTRACTION_LEVEL):]
    return cwe_abstraction in allowed


def validate_node(node: dict, node_type: str) -> list[str]:
    """Return list of granularity violations. Empty = OK."""
    issues = []

    # 1. Confidence threshold (all node types)
    if not check_confidence_threshold(node):
        issues.append(
            f"{node_type}: confidence {node.get('confidence')} below "
            f"threshold for {node.get('evidence_class')}"
        )

    # 2. CWE abstraction level (Weakness nodes only)
    if node_type == "Weakness" and "abstraction" in node:
        if not check_cwe_abstraction(node["abstraction"]):
            issues.append(
                f"CWE abstraction '{node['abstraction']}' too broad; use Base level"
            )

    # 3. AI_Component: component_type must be in canonical enum (CYB-12 §III.12)
    if node_type == "AI_Component":
        ct = node.get("component_type")
        if ct is None:
            issues.append("AI_Component: missing required field 'component_type'")
        elif ct not in COMPONENT_TYPE_ENUM:
            issues.append(
                f"AI_Component: component_type '{ct}' not in canonical enum "
                f"{sorted(COMPONENT_TYPE_ENUM)}"
            )

    return issues
