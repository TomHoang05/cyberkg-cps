"""Q2: IT-OT Movement Chain — D-19 §6.2 / D-18 §III.1"""

# REST API query — returns one flat row per technique (used by GET /attacks/{id}/chain)
Q2_ATTACK_CHAIN = """
MATCH (a:Attack {attack_id: $attack_id})-[r:USES_TECHNIQUE]->(t:ATT_CK_Technique)
OPTIONAL MATCH (a)-[:USES_BRIDGE]->(b:Bridge_Mechanism)
RETURN t.technique_id          AS technique_id,
       coalesce(t.mitre_id, t.technique_id) AS mitre_id,
       t.name                  AS name,
       t.description           AS description,
       t.platform              AS platform,
       t.tactic                AS tactic,
       t.plane                 AS plane,
       r.step_order            AS step,
       r.phase                 AS phase,
       r.purdue_level          AS purdue_level,
       b.bridge_type           AS bridge_type,
       b.name                  AS bridge_name,
       t.evidence_class        AS evidence_class,
       t.confidence            AS confidence
ORDER BY r.step_order
"""

# LLM pipeline query — aggregates into ONE row with chain + bridge_mechanisms lists
# Used by generate.py + narrative_service.py (transform_service expects these keys)
Q2_ATTACK_CHAIN_LLM = """
MATCH (a:Attack {attack_id: $attack_id})-[r:USES_TECHNIQUE]->(t:ATT_CK_Technique)
WITH a, t, r ORDER BY r.step_order
WITH a, collect({technique_id: t.technique_id, name: t.name, tactic: t.tactic,
                  plane: t.plane, step: r.step_order, purdue_level: r.purdue_level,
                  evidence_class: t.evidence_class, confidence: t.confidence}) AS chain
OPTIONAL MATCH (a)-[:USES_BRIDGE]->(b:Bridge_Mechanism)
WITH a, chain, collect(b) AS bridges
RETURN chain,
       [b IN bridges | {bridge_type: b.bridge_type, name: b.name,
                         purdue_from: b.purdue_from, purdue_to: b.purdue_to}] AS bridge_mechanisms
"""
