"""Transform Layer: Neo4j graph results → structured LLM prompt dict.
D-18 §III.2 — preserves attack chain order, plane annotations, bridge detail."""
from neo4j import Session
from src.kg.queries import q1_surface, q2_chain, q3_consequence, q4_roles

EVIDENCE_CLASSES = ("documented_fact", "supported_inference", "instructional_extension")


def _compute_provenance_summary(attack_node: dict, chain_rows: list, cons_rows: list) -> dict:
    """Aggregate evidence_class/confidence across attack node, technique chain
    steps, and consequences into a single provenance summary (D-18 §III.2,
    granularity rule per D-04 §IV)."""
    distribution = {ec: 0 for ec in EVIDENCE_CLASSES}
    confidences = []

    candidates = [attack_node] + [dict(r) for r in chain_rows] + [dict(r) for r in cons_rows]
    for node in candidates:
        ec = node.get("evidence_class")
        if ec in distribution:
            distribution[ec] += 1
        conf = node.get("confidence")
        if conf is not None:
            confidences.append(conf)

    overall_confidence = sum(confidences) / len(confidences) if confidences else 0.0

    return {
        "overall_confidence": round(overall_confidence, 3),
        "evidence_class_distribution": distribution,
    }


def build_kg_data(session: Session, attack_id: str, output_type: str) -> dict:
    """Build the intermediate dict passed to LLM prompt templates (D-18 §III.2)."""
    # Q1: surface for attack context
    surface = session.run(q1_surface.Q1_ATTACK_SURFACE, attack_id=attack_id).single()
    # Q2: ordered attack chain
    chain_rows = list(session.run(q2_chain.Q2_ATTACK_CHAIN, attack_id=attack_id))
    # Q3: consequences — now returns single object with 4 layers (fix 0.2)
    cons_rows = session.run(q3_consequence.Q3_CONSEQUENCE, attack_id=attack_id).single()
    cons_rows = dict(cons_rows) if cons_rows else {}
    # Q4: AI/human roles — now returns single object (fix 0.1)
    roles = session.run(q4_roles.Q4_ROLES, attack_id=attack_id).single()

    attack_node = dict(surface["a"]) if surface else {}
    # Q3 now returns a single object (fix 0.2); cons_row is a Record, not a list.
    cons_row = cons_rows if isinstance(cons_rows, dict) else {}
    consequences = list(cons_row.get("layer_4_consequence", []))
    bridges = list(cons_row.get("layer_2_bridge", []))

    # Q4 now returns a single object (fix 0.1); roles is a Record.
    roles_dict = dict(roles) if roles else {}
    return {
        "attack": attack_node,
        "chain": [dict(r) for r in chain_rows],
        "consequences": consequences,
        "bridges": bridges,
        "human_actors":      list(roles_dict.get("human_roles", [])),
        "ai_components":     list(roles_dict.get("ai_components", [])),
        "ai_attack_surfaces": list(roles_dict.get("ai_attack_surfaces", [])),
        "decision_points":   list(roles_dict.get("decision_points", [])),
        "provenance_summary": _compute_provenance_summary(attack_node, chain_rows, consequences),
    }
