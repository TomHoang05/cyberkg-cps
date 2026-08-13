"""Q5: Full Chain — D-19 §6.5 composite Q1-Q4

Fix 0.3 (scope remediation):
  - Adds OPTIONAL MATCH (ais:AI_Attack_Surface)-[:AI_ATTACK_VIA]->(ai)
    so ai_attack_surfaces are included (was entirely absent — same bug as Q4).
  - Adds instructional_modules via MAPS_TO_CONCEPT.
  - Response nested as {attack_surface, it_ot_movement, physical_consequences,
    ai_human_roles, instructional_modules} per CYB-23 §6.5.
"""

Q5_FULL = """
MATCH (a:Attack {attack_id: $attack_id})
OPTIONAL MATCH (a)-[r:USES_TECHNIQUE]->(t:ATT_CK_Technique)
OPTIONAL MATCH (a)-[:USES_BRIDGE]->(b:Bridge_Mechanism)
OPTIONAL MATCH (a)-[:CAUSES_CONSEQUENCE]->(c:Consequence)
OPTIONAL MATCH (c)-[:CONSEQUENCE_TYPE]->(ic:Instructional_Concept)
OPTIONAL MATCH (h:Human_Actor)-[:HUMAN_ROLE]->(a)
OPTIONAL MATCH (h)-[:PERFORMS_ACTION]->(ha:Human_Action)
OPTIONAL MATCH (ai:AI_Component)-[:AI_INVOLVED_IN]->(a)
OPTIONAL MATCH (ais:AI_Attack_Surface)-[:AI_ATTACK_VIA]->(ai)
OPTIONAL MATCH (t)-[:MAPS_TO_CONCEPT]->(mc:Instructional_Concept)
RETURN
  {
    attack_id:   a.attack_id,
    name:        a.name,
    year:        a.year,
    sector:      a.industry_sector,
    attributed_to: a.attributed_to
  } AS attack_surface,
  collect(DISTINCT {
    technique_id: t.technique_id,
    name:         t.name,
    tactic:       t.tactic,
    plane:        t.plane,
    step_order:   r.step_order
  }) AS it_ot_movement,
  [x IN collect(DISTINCT {
      bridge_id:   b.bridge_id,
      name:        b.name,
      bridge_type: b.bridge_type,
      purdue_from: b.purdue_from,
      purdue_to:   b.purdue_to
  }) WHERE x.bridge_id IS NOT NULL] AS bridges,
  [x IN collect(DISTINCT {
      consequence_id:   c.consequence_id,
      name:             c.name,
      severity:         c.severity,
      was_realized:     c.was_realized,
      consequence_type: ic.name
  }) WHERE x.consequence_id IS NOT NULL] AS physical_consequences,
  {
    human_roles: [x IN collect(DISTINCT {
        actor_id:    h.actor_id,
        role_type:   r.role_type,
        role_description: coalesce(h.role_description, h.actor_type),
        action:      ha.description
    }) WHERE x.actor_id IS NOT NULL],
    ai_components: [x IN collect(DISTINCT {
        component_id:    ai.component_id,
        name:            ai.name,
        ai_type:         ai.ai_type,
        is_hypothetical: ai.is_hypothetical,
        role:            ai.role
    }) WHERE x.component_id IS NOT NULL],
    ai_attack_surfaces: [x IN collect(DISTINCT {
        surface_id:      ais.surface_id,
        name:            ais.name,
        surface_type:    ais.surface_type,
        is_adversarial:  ais.is_adversarial,
        table1_category: ais.table1_category,
        description:     ais.description,
        mitre_atlas_id:  ais.mitre_atlas_id
    }) WHERE x.surface_id IS NOT NULL]
  } AS ai_human_roles,
  [x IN collect(DISTINCT {
      concept_id: mc.concept_id,
      name:       mc.name,
      module:     mc.module_alignment,
      learning_objectives: mc.learning_objectives
  }) WHERE x.concept_id IS NOT NULL] AS instructional_modules
"""
