"""Q3: Physical Consequences — D-19 §6.3 / D-18 §III.1

Fix 0.2 (scope remediation): adds layer_2_bridge (USES_BRIDGE) which was
entirely missing. Returns a SINGLE object with 4 layers:
  layer_1_cyber     — USES_TECHNIQUE techniques
  layer_2_bridge    — USES_BRIDGE bridge mechanisms  ← NEW
  layer_3_physical  — AFFECTS_PROCESS OT→Physical links
  layer_4_consequence — CAUSES_CONSEQUENCE outcomes + instructional context
Caller uses .single(), not iteration.
"""

# REST API query — returns a single row with the 4-layer structure
Q3_CONSEQUENCE = """
MATCH (a:Attack {attack_id: $attack_id})
OPTIONAL MATCH (a)-[:USES_TECHNIQUE]->(t:ATT_CK_Technique)
OPTIONAL MATCH (a)-[:USES_BRIDGE]->(brg:Bridge_Mechanism)
OPTIONAL MATCH (a)-[:CAUSES_CONSEQUENCE]->(c:Consequence)
OPTIONAL MATCH (c)-[:CONSEQUENCE_TYPE]->(ic:Instructional_Concept)
OPTIONAL MATCH (ot:OT_System)-[:AFFECTS_PROCESS]->(pp:Physical_Process)
  WHERE (a)-[:USES_TECHNIQUE]->()-[:TARGETS]->(ot)
RETURN
  [x IN collect(DISTINCT {
      technique_id: t.technique_id,
      name:         t.name,
      tactic:       t.tactic,
      plane:        t.plane,
      evidence_class: t.evidence_class
  }) WHERE x.technique_id IS NOT NULL] AS layer_1_cyber,
  [x IN collect(DISTINCT {
      bridge_id:   brg.bridge_id,
      name:        brg.name,
      bridge_type: brg.bridge_type,
      purdue_from: brg.purdue_from,
      purdue_to:   brg.purdue_to,
      evidence_class: brg.evidence_class
  }) WHERE x.bridge_id IS NOT NULL] AS layer_2_bridge,
  [x IN collect(DISTINCT {
      system_name:   ot.name,
      process_name:  pp.name,
      purdue_level:  ot.purdue_level,
      evidence_class: ot.evidence_class
  }) WHERE x.system_name IS NOT NULL] AS layer_3_physical,
  [x IN collect(DISTINCT {
      consequence_id:   c.consequence_id,
      name:             c.name,
      severity:         c.severity,
      was_realized:     c.was_realized,
      table1_category:  ic.name,
      causal_mechanism: c.causal_mechanism,
      evidence_class:   c.evidence_class,
      confidence:       c.confidence
  }) WHERE x.consequence_id IS NOT NULL] AS layer_4_consequence
"""

# LLM pipeline query — aggregates into ONE row for narrative generation
# Returns: consequences (list), ot_system (str), physical_process (str),
#          instructional_concepts (list), bridge_mechanisms (list)
# Used by generate.py + narrative_service.py (transform_service expects these keys)
Q3_CONSEQUENCE_LLM = """
MATCH (a:Attack {attack_id: $attack_id})
OPTIONAL MATCH (a)-[:CAUSES_CONSEQUENCE]->(c:Consequence)
OPTIONAL MATCH (c)-[:CONSEQUENCE_TYPE]->(ic:Instructional_Concept)
OPTIONAL MATCH (a)-[:USES_BRIDGE]->(brg:Bridge_Mechanism)
OPTIONAL MATCH (ot:OT_System)-[:AFFECTS_PROCESS]->(pp:Physical_Process)
  WHERE (a)-[:USES_TECHNIQUE]->()-[:TARGETS]->(ot)
RETURN collect(DISTINCT {name: c.name, severity: c.severity,
                           was_realized: c.was_realized,
                           table1_category: ic.name,
                           evidence_class: c.evidence_class,
                           confidence: c.confidence}) AS consequences,
       head(collect(DISTINCT ot.name))  AS ot_system,
       head(collect(DISTINCT pp.name))  AS physical_process,
       collect(DISTINCT ic.name)        AS instructional_concepts,
       [x IN collect(DISTINCT {name: brg.name, bridge_type: brg.bridge_type,
                                 purdue_from: brg.purdue_from, purdue_to: brg.purdue_to})
        WHERE x.name IS NOT NULL]       AS bridge_mechanisms
"""
