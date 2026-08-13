// ============================================================
// D-04A. CyberKG_Neo4j_Schema_Init.cypher
// CyberKG-CPS — Neo4j Schema Initialization (run once)
// Source: CYB-14 v1.1 §VI Neo4j DDL
// Version: 1.1 | Date: 2026-07-03
// Compatible: Neo4j 5.x (Cypher 5)
// Run via: schema_init.py on app startup, or manually in Neo4j Browser
// ============================================================

// ============================================================
// SECTION 1: UNIQUE CONSTRAINTS — External Identifiers
// Prevent duplicate nodes keyed on domain IDs (MITRE, CVE, CWE…)
// ============================================================

// Cyber plane — external IDs
CREATE CONSTRAINT attack_name_unique IF NOT EXISTS
  FOR (a:Attack) REQUIRE a.name IS UNIQUE;

CREATE CONSTRAINT technique_mitre_id_unique IF NOT EXISTS
  FOR (t:ATT_CK_Technique) REQUIRE t.mitre_id IS UNIQUE;

CREATE CONSTRAINT vulnerability_cve_id_unique IF NOT EXISTS
  FOR (v:Vulnerability) REQUIRE v.cve_id IS UNIQUE;

CREATE CONSTRAINT weakness_cwe_id_unique IF NOT EXISTS
  FOR (w:Weakness) REQUIRE w.cwe_id IS UNIQUE;

CREATE CONSTRAINT pattern_capec_id_unique IF NOT EXISTS
  FOR (ap:Attack_Pattern) REQUIRE ap.capec_id IS UNIQUE;

// ============================================================
// SECTION 2: UNIQUE CONSTRAINTS — Internal UUIDs
// All 16 entity types — one UUID constraint each
// ============================================================

// Cyber plane (6 types)
CREATE CONSTRAINT attack_id_unique IF NOT EXISTS
  FOR (a:Attack) REQUIRE a.attack_id IS UNIQUE;

CREATE CONSTRAINT technique_id_unique IF NOT EXISTS
  FOR (t:ATT_CK_Technique) REQUIRE t.technique_id IS UNIQUE;

CREATE CONSTRAINT vuln_id_unique IF NOT EXISTS
  FOR (v:Vulnerability) REQUIRE v.vuln_id IS UNIQUE;

CREATE CONSTRAINT weakness_id_unique IF NOT EXISTS
  FOR (w:Weakness) REQUIRE w.weakness_id IS UNIQUE;

CREATE CONSTRAINT pattern_id_unique IF NOT EXISTS
  FOR (ap:Attack_Pattern) REQUIRE ap.pattern_id IS UNIQUE;

CREATE CONSTRAINT it_system_id_unique IF NOT EXISTS
  FOR (s:IT_System) REQUIRE s.system_id IS UNIQUE;

// Physical plane (4 types)
CREATE CONSTRAINT ot_system_id_unique IF NOT EXISTS
  FOR (s:OT_System) REQUIRE s.system_id IS UNIQUE;

CREATE CONSTRAINT zone_id_unique IF NOT EXISTS
  FOR (z:Network_Zone) REQUIRE z.zone_id IS UNIQUE;

CREATE CONSTRAINT process_id_unique IF NOT EXISTS
  FOR (p:Physical_Process) REQUIRE p.process_id IS UNIQUE;

CREATE CONSTRAINT consequence_id_unique IF NOT EXISTS
  FOR (c:Consequence) REQUIRE c.consequence_id IS UNIQUE;

// AI plane (2 types)
CREATE CONSTRAINT ai_id_unique IF NOT EXISTS
  FOR (ai:AI_Component) REQUIRE ai.ai_id IS UNIQUE;

CREATE CONSTRAINT surface_id_unique IF NOT EXISTS
  FOR (s:AI_Attack_Surface) REQUIRE s.surface_id IS UNIQUE;

// Human plane (2 types)
CREATE CONSTRAINT actor_id_unique IF NOT EXISTS
  FOR (h:Human_Actor) REQUIRE h.actor_id IS UNIQUE;

CREATE CONSTRAINT action_id_unique IF NOT EXISTS
  FOR (ha:Human_Action) REQUIRE ha.action_id IS UNIQUE;

// Bridge + Cross-cutting (2 types)
CREATE CONSTRAINT bridge_id_unique IF NOT EXISTS
  FOR (b:Bridge_Mechanism) REQUIRE b.bridge_id IS UNIQUE;

CREATE CONSTRAINT concept_id_unique IF NOT EXISTS
  FOR (ic:Instructional_Concept) REQUIRE ic.concept_id IS UNIQUE;

// Q-Bank (Sprint 3 — T046b / CYB-14 v1.1 §VI)
CREATE CONSTRAINT question_id_unique IF NOT EXISTS
  FOR (q:Question) REQUIRE q.question_id IS UNIQUE;

// ============================================================
// SECTION 3: NODE PROPERTY EXISTENCE CONSTRAINTS
// Enforce the 6-field provenance block on all entity types
// (Neo4j Enterprise only — skip on Community Edition)
// ============================================================

// Uncomment if running Neo4j Enterprise:
// CREATE CONSTRAINT attack_provenance IF NOT EXISTS
//   FOR (a:Attack) REQUIRE a.source IS NOT NULL;
// CREATE CONSTRAINT attack_confidence IF NOT EXISTS
//   FOR (a:Attack) REQUIRE a.confidence IS NOT NULL;
// CREATE CONSTRAINT attack_evidence_class IF NOT EXISTS
//   FOR (a:Attack) REQUIRE a.evidence_class IS NOT NULL;

// ============================================================
// SECTION 4: LOOKUP INDEXES — External IDs
// Speed up MATCH by MITRE/CVE/CWE identifiers
// ============================================================

CREATE INDEX technique_mitre_id_idx IF NOT EXISTS
  FOR (t:ATT_CK_Technique) ON (t.mitre_id);

CREATE INDEX vuln_cve_id_idx IF NOT EXISTS
  FOR (v:Vulnerability) ON (v.cve_id);

CREATE INDEX weakness_cwe_id_idx IF NOT EXISTS
  FOR (w:Weakness) ON (w.cwe_id);

CREATE INDEX pattern_capec_id_idx IF NOT EXISTS
  FOR (ap:Attack_Pattern) ON (ap.capec_id);

// ============================================================
// SECTION 5: COMPOSITE INDEXES — Common Query Patterns
// Q1–Q5 query types + D-11 SRS FR-KG-01..05 paths
// ============================================================

// Attack metadata filters (FR-CASE-07: sector, year, severity, plane, bridge)
CREATE INDEX attack_year_sector_idx IF NOT EXISTS
  FOR (a:Attack) ON (a.year, a.industry_sector);

// Q1 Attack Surface — technique lookup by platform + tactic
CREATE INDEX technique_platform_tactic_idx IF NOT EXISTS
  FOR (t:ATT_CK_Technique) ON (t.platform, t.tactic);

// Q3 Consequences — filter by consequence_type (Table 1)
CREATE INDEX consequence_type_severity_idx IF NOT EXISTS
  FOR (c:Consequence) ON (c.consequence_type, c.severity);

// Bridge filter — Table 1 bridge_type
CREATE INDEX bridge_type_idx IF NOT EXISTS
  FOR (b:Bridge_Mechanism) ON (b.bridge_type);

// Q4 Actor Roles — filter by actor_type
CREATE INDEX actor_type_idx IF NOT EXISTS
  FOR (h:Human_Actor) ON (h.actor_type);

// AI component filter (component_type: anomaly_detector|classifier|nlp_assistant|digital_twin|intrusion_detection)
CREATE INDEX ai_component_type_idx IF NOT EXISTS
  FOR (ai:AI_Component) ON (ai.component_type);

// Network zone — Purdue level traversal (Q1 surface diagram)
CREATE INDEX zone_purdue_level_idx IF NOT EXISTS
  FOR (z:Network_Zone) ON (z.purdue_level);

// OT/IT system type filter
CREATE INDEX ot_system_type_idx IF NOT EXISTS
  FOR (s:OT_System) ON (s.system_type);

CREATE INDEX it_system_type_idx IF NOT EXISTS
  FOR (s:IT_System) ON (s.system_type);

// Instructional concept — module alignment (SCR-INS-04 Module Map; M1-M4)
CREATE INDEX concept_category_module_idx IF NOT EXISTS
  FOR (ic:Instructional_Concept) ON (ic.category_group, ic.module_alignment);

// Provenance filter (SCR-RES-05 Data Provenance)
CREATE INDEX evidence_class_idx IF NOT EXISTS
  FOR (a:Attack) ON (a.evidence_class);

// Q-Bank lookup (CYB-14 v1.1: Q01-Q128, 3 user roles, bloom levels L1-L6)
CREATE INDEX question_role_bloom_idx IF NOT EXISTS
  FOR (q:Question) ON (q.user_role, q.bloom_level);

// ============================================================
// SECTION 6: RANGE INDEXES — Numeric Filters
// ============================================================

CREATE RANGE INDEX vuln_cvss_idx IF NOT EXISTS
  FOR (v:Vulnerability) ON (v.cvss_v3_score);

CREATE RANGE INDEX zone_purdue_range_idx IF NOT EXISTS
  FOR (z:Network_Zone) ON (z.purdue_level);

CREATE RANGE INDEX attack_year_range_idx IF NOT EXISTS
  FOR (a:Attack) ON (a.year);

CREATE RANGE INDEX technique_step_order_idx IF NOT EXISTS
  FOR ()-[r:USES_TECHNIQUE]-() ON (r.step_order);

// ============================================================
// SECTION 7: FULL-TEXT SEARCH INDEXES
// Powers the COMP-04 SearchFilterBar text search
// ============================================================

CREATE FULLTEXT INDEX attack_fulltext IF NOT EXISTS
  FOR (a:Attack) ON EACH [a.name, a.description, a.kill_chain_summary];

CREATE FULLTEXT INDEX technique_fulltext IF NOT EXISTS
  FOR (t:ATT_CK_Technique) ON EACH [t.name, t.description];

CREATE FULLTEXT INDEX concept_fulltext IF NOT EXISTS
  FOR (ic:Instructional_Concept) ON EACH [ic.name, ic.description];

CREATE FULLTEXT INDEX consequence_fulltext IF NOT EXISTS
  FOR (c:Consequence) ON EACH [c.name, c.description];

CREATE FULLTEXT INDEX bridge_fulltext IF NOT EXISTS
  FOR (b:Bridge_Mechanism) ON EACH [b.name, b.description];

CREATE FULLTEXT INDEX question_fulltext IF NOT EXISTS
  FOR (q:Question) ON EACH [q.text, q.explanation];

// ============================================================
// SECTION 7b: SPRINT 4 — Narrative pre-materialisation indexes
// Speeds up GET /attacks/{id}/dossier narrative reads
// ============================================================

CREATE RANGE INDEX attack_narrative_generated_at_idx IF NOT EXISTS
  FOR (a:Attack) ON (a.narrative_generated_at);

// ============================================================
// SECTION 8: RELATIONSHIP TYPE VERIFICATION QUERY
// Run after loading data to confirm all 17 canonical types exist
// (READ-ONLY — does not create anything)
// ============================================================

// CALL db.relationshipTypes()
// YIELD relationshipType
// RETURN relationshipType ORDER BY relationshipType;
//
// Expected 17 types (CYB-13 §V):
//   AFFECTS_PROCESS, AI_ATTACK_VIA, AI_INVOLVED_IN,
//   BRIDGES_TO, CAUSES_CONSEQUENCE