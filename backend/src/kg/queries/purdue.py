"""Q6: Purdue Level Mapping — D-19 §6.6 / T053b Sprint 3"""

Q6_PURDUE = """
MATCH (a:Attack {attack_id: $attack_id})-[:USES_TECHNIQUE]->(t:ATT_CK_Technique)-[:TARGETS]->(sys)
RETURN t.technique_id  AS technique_id,
       t.name          AS technique_name,
       sys.name        AS system_name,
       sys.plane       AS plane,
       sys.purdue_level AS purdue_level,
       sys.zone_type   AS zone_type
ORDER BY sys.purdue_level
"""
