"""Relation analysis queries — researcher r-vulnchain / Relation Analysis screen.

Sprint 4 (post-CYB-19-parity audit): the screen previously only supported ONE
hardcoded traversal (the vuln chain below). CYB-19's mockup r-vulnchain screen
defines a 17-row Relation Type Summary table (all relationship types, not just
one) plus a Relation Instance Explorer that lets the user pick ANY of the 17
types and see real instances. These queries back both of those.

Real chain: (ATT_CK_Technique)-[:EXPLOITS]->(Vulnerability)-[:ROOT_CAUSE]->(Weakness)
            -[:MAPS_TO_PATTERN]->(Attack_Pattern)  (CYB-12 §III relationship table)
No dedicated route/query existed for this traversal before -- GET /entities/{id} only
follows OUTGOING edges one hop, which can't reconstruct this 3-hop chain starting
from Vulnerability (EXPLOITS points INTO Vulnerability, not out of it).
"""

Q_VULN_CHAIN = """
MATCH (t:ATT_CK_Technique)-[:EXPLOITS]->(v:Vulnerability)
OPTIONAL MATCH (v)-[:ROOT_CAUSE]->(w:Weakness)
OPTIONAL MATCH (w)-[:MAPS_TO_PATTERN]->(ap:Attack_Pattern)
RETURN t.mitre_id AS technique_id, t.name AS technique_name,
       v.cve_id AS cve_id, v.name AS vuln_name, v.cvss_v3_score AS cvss_v3_score,
       w.cwe_id AS cwe_id, w.name AS weakness_name,
       ap.capec_id AS capec_id, ap.name AS pattern_name
ORDER BY v.cvss_v3_score DESC
"""

# All 17 CyberKG-CPS relationship types (CYB-12 §III / data/kg_data/schema/relation_schema.yaml).
# Used as an explicit whitelist before interpolating a relationship type name into
# Cypher (Neo4j has no clean way to parameterize `[:TYPE]` without APOC, which this
# stack doesn't require elsewhere) -- every value here is a fixed literal, never
# user-supplied text, so string formatting is safe.
RELATIONSHIP_TYPES = [
    "USES_TECHNIQUE", "TECHNIQUE_ORDER", "EXPLOITS", "ROOT_CAUSE",
    "MAPS_TO_PATTERN", "TARGETS", "LOCATED_IN", "BRIDGES_TO",
    "AFFECTS_PROCESS", "CAUSES_CONSEQUENCE", "CONSEQUENCE_TYPE",
    "AI_INVOLVED_IN", "AI_ATTACK_VIA", "HUMAN_ROLE",
    "PERFORMS_ACTION", "MAPS_TO_CONCEPT", "USES_BRIDGE",
]


def q_relation_type_summary(rel_type: str) -> str:
    """Count + evidence_class breakdown + avg endpoint-node confidence for one
    relationship type. Edges themselves only carry evidence_class (CYB-12
    relation_schema.yaml required_properties) -- confidence lives on nodes --
    so "avg confidence" here is the average of the two endpoint nodes'
    confidence, a defensible proxy rather than fabricated per-edge data.
    """
    return f"""
    MATCH (a)-[r:`{rel_type}`]->(b)
    RETURN count(r) AS count,
           labels(a)[0] AS from_label, labels(b)[0] AS to_label,
           avg((coalesce(a.confidence, 0.8) + coalesce(b.confidence, 0.8)) / 2.0) AS avg_confidence,
           collect(r.evidence_class) AS evidence_classes
    """


def q_relation_instances(rel_type: str) -> str:
    """Real instances of one relationship type, optionally scoped to a single
    attack case (via a bounded path from that Attack to either endpoint).
    """
    return f"""
    MATCH (a)-[r:`{rel_type}`]->(b)
    WHERE $attack_id IS NULL
       OR EXISTS {{ MATCH (att:Attack {{attack_id: $attack_id}})-[*0..4]-(a) }}
       OR EXISTS {{ MATCH (att:Attack {{attack_id: $attack_id}})-[*0..4]-(b) }}
    RETURN properties(a) AS from_props, labels(a) AS from_labels,
           type(r) AS rel_type, properties(r) AS rel_props,
           properties(b) AS to_props, labels(b) AS to_labels
    LIMIT 200
    """
