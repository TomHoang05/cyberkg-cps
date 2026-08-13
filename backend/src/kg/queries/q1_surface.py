"""Q1: Attack Surface — D-19 §6.1 / D-18 §III.1"""

LIST_ATTACKS = """
MATCH (a:Attack)
RETURN a.attack_id AS attack_id, a.name AS name, a.year AS year,
       a.industry_sector AS sector, a.bridge_type AS bridge_type,
       a.consequence_type_primary AS consequence_type
ORDER BY a.year DESC
"""

# Returns ONE aggregated row with flat attack node properties + map lists for techniques/systems/zones.
# Map literals (instead of Node objects) ensure JSON-serializability for both the REST API
# and the LLM pipeline (transform_service reads surface.get("name"), surface.get("industry_sector") etc.)
Q1_ATTACK_SURFACE = """
MATCH (a:Attack {attack_id: $attack_id})
OPTIONAL MATCH (a)-[:USES_TECHNIQUE]->(t:ATT_CK_Technique)
OPTIONAL MATCH (t)-[:TARGETS]->(sys)
OPTIONAL MATCH (sys)-[:LOCATED_IN]->(z:Network_Zone)
RETURN a.attack_id      AS attack_id,
       a.name            AS name,
       a.year            AS year,
       a.industry_sector AS industry_sector,
       a.attributed_to   AS attributed_to,
       a.evidence_class  AS evidence_class,
       [x IN collect(DISTINCT {technique_id: t.technique_id, name: t.name,
                                tactic: t.tactic, plane: t.plane,
                                evidence_class: t.evidence_class})
        WHERE x.technique_id IS NOT NULL] AS techniques,
       [x IN collect(DISTINCT {name: sys.name, plane: sys.plane,
                                evidence_class: sys.evidence_class,
                                purdue_level: sys.purdue_level})
        WHERE x.name IS NOT NULL] AS systems,
       [x IN collect(DISTINCT {name: z.name, zone_type: z.zone_type,
                                purdue_level: z.purdue_level})
        WHERE x.name IS NOT NULL] AS zones,
       [x IN collect({from: t.technique_id, to: sys.name})
        WHERE x.from IS NOT NULL AND x.to IS NOT NULL] AS technique_system_edges,
       [x IN collect({from: sys.name, to: z.name})
        WHERE x.from IS NOT NULL AND x.to IS NOT NULL] AS system_zone_edges
"""
