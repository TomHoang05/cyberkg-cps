"""Q4: AI/Human Roles — D-19 §6.4 / D-18 §III.1

Fix 0.1 (scope remediation): adds ai_attack_surfaces (via AI_ATTACK_VIA) and
decision_points (Human_Action where action_type='decision').
Returns a SINGLE row (object) — caller uses .single(), not iteration.
"""

Q4_ROLES = """
MATCH (a:Attack {attack_id: $attack_id})
OPTIONAL MATCH (h:Human_Actor)-[hr:HUMAN_ROLE]->(a)
OPTIONAL MATCH (h)-[:PERFORMS_ACTION]->(ha:Human_Action)
OPTIONAL MATCH (ai:AI_Component)-[:AI_INVOLVED_IN]->(a)
OPTIONAL MATCH (ais:AI_Attack_Surface)-[:AI_ATTACK_VIA]->(ai)
RETURN
  [x IN collect(DISTINCT {
      actor_id:         h.actor_id,
      role_type:        hr.role_type,
      role_description: coalesce(h.role_description, h.actor_type),
      action:           ha.description
  }) WHERE x.actor_id IS NOT NULL] AS human_roles,
  [x IN collect(DISTINCT {
      component_id:         ai.component_id,
      name:                 ai.name,
      ai_type:              ai.ai_type,
      is_hypothetical:      ai.is_hypothetical,
      role:                 ai.role,
      scenario_description: ai.scenario_description
  }) WHERE x.component_id IS NOT NULL] AS ai_components,
  [x IN collect(DISTINCT {
      surface_id:      ais.surface_id,
      name:            ais.name,
      surface_type:    ais.surface_type,
      is_adversarial:  ais.is_adversarial,
      table1_category: ais.table1_category,
      evidence_class:  ais.evidence_class,
      description:     ais.description,
      mitre_atlas_id:  ais.mitre_atlas_id
  }) WHERE x.surface_id IS NOT NULL] AS ai_attack_surfaces,
  [x IN collect(DISTINCT {
      action_id:   ha.action_id,
      description: ha.description,
      action_type: ha.action_type
  }) WHERE x.action_type = 'decision' AND x.action_id IS NOT NULL] AS decision_points
"""
