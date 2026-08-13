"""Per-attack provenance record aggregation — researcher r-provenance "Data
Provenance" tab (CYB-19 SCR-RES-05). AUDIT-FIXED (feature gap): this screen
previously only had a schema/API-export tab; the mockup's per-fact provenance
list (source citation + confidence per fact, grouped by attack case) had no
backing query -- GET /entities/{id} returns one entity's own provenance, not a
curated cross-entity list scoped to an attack.

Pulls the 6-field provenance block (CYB-12 §II universal block) off every node
type directly relevant to one attack: the Attack itself, its ATT&CK techniques,
its bridge mechanism, the systems those techniques target, its consequences,
and any AI components / human actors involved.
"""

Q_ATTACK_PROVENANCE = """
MATCH (a:Attack {attack_id: $attack_id})
OPTIONAL MATCH (a)-[:USES_TECHNIQUE]->(t:ATT_CK_Technique)
OPTIONAL MATCH (a)-[:USES_BRIDGE]->(br:Bridge_Mechanism)
OPTIONAL MATCH (a)-[:CAUSES_CONSEQUENCE]->(c:Consequence)
OPTIONAL MATCH (ai:AI_Component)-[:AI_INVOLVED_IN]->(a)
OPTIONAL MATCH (h:Human_Actor)-[:HUMAN_ROLE]->(a)
WITH a,
  collect(DISTINCT CASE WHEN t IS NULL THEN NULL ELSE {
    label: 'ATT_CK_Technique', entity_id: t.mitre_id, name: t.name,
    source: t.source, source_id_or_url: t.source_id_or_url, ingested_at: t.ingested_at,
    confidence: t.confidence, evidence_class: t.evidence_class, license: t.license
  } END) AS techs,
  collect(DISTINCT CASE WHEN br IS NULL THEN NULL ELSE {
    label: 'Bridge_Mechanism', entity_id: br.bridge_id, name: br.name,
    source: br.source, source_id_or_url: br.source_id_or_url, ingested_at: br.ingested_at,
    confidence: br.confidence, evidence_class: br.evidence_class, license: br.license
  } END) AS bridges,
  collect(DISTINCT CASE WHEN c IS NULL THEN NULL ELSE {
    label: 'Consequence', entity_id: c.consequence_id, name: c.consequence,
    source: c.source, source_id_or_url: c.source_id_or_url, ingested_at: c.ingested_at,
    confidence: c.confidence, evidence_class: c.evidence_class, license: c.license
  } END) AS consequences,
  collect(DISTINCT CASE WHEN ai IS NULL THEN NULL ELSE {
    label: 'AI_Component', entity_id: coalesce(ai.ai_id, ai.name), name: ai.name,
    source: ai.source, source_id_or_url: ai.source_id_or_url, ingested_at: ai.ingested_at,
    confidence: ai.confidence, evidence_class: ai.evidence_class, license: ai.license
  } END) AS ais,
  collect(DISTINCT CASE WHEN h IS NULL THEN NULL ELSE {
    label: 'Human_Actor', entity_id: coalesce(h.actor_id, h.name), name: h.name,
    source: h.source, source_id_or_url: h.source_id_or_url, ingested_at: h.ingested_at,
    confidence: h.confidence, evidence_class: h.evidence_class, license: h.license
  } END) AS humans
RETURN
  [{
    label: 'Attack', entity_id: a.attack_id, name: a.name,
    source: a.source, source_id_or_url: a.source_id_or_url, ingested_at: a.ingested_at,
    confidence: a.confidence, evidence_class: a.evidence_class, license: a.license
  }] + techs + bridges + consequences + ais + humans AS records
"""
