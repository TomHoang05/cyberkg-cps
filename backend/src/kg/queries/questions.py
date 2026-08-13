"""Q-bank: Question queries — CYB-12 SSII entity #17 / Sprint 3 T046b.

AUDIT-FIXED (SEVERE, infra gap): 128 real Question nodes are seeded into the KG
(data/kg_data/qbank/questions.yaml, role-filtered instructor/student/
security_researcher, linked to an attack case via the scenario_id string field
-- confirmed there is no ANSWERS relationship anywhere in the schema) but no
Cypher query or REST route ever existed to list/filter them. This file plus
src/api/routes/questions.py is the missing piece.
"""

Q_LIST_QUESTIONS = """
MATCH (q:Question)
WHERE ($user_role IS NULL OR q.user_role = $user_role)
  AND ($scenario_id IS NULL OR q.scenario_id = $scenario_id)
  AND ($bloom_level IS NULL OR q.bloom_level = $bloom_level)
RETURN q.question_id AS question_id, q.text AS text, q.user_role AS user_role,
       q.bloom_level AS bloom_level, q.scenario_id AS scenario_id,
       q.answer_hint AS answer_hint, q.table1_ref AS table1_ref,
       q.evidence_class AS evidence_class, q.confidence AS confidence
ORDER BY q.question_id
SKIP $skip LIMIT $limit
"""

Q_COUNT_QUESTIONS = """
MATCH (q:Question)
WHERE ($user_role IS NULL OR q.user_role = $user_role)
  AND ($scenario_id IS NULL OR q.scenario_id = $scenario_id)
  AND ($bloom_level IS NULL OR q.bloom_level = $bloom_level)
RETURN count(q) AS total
"""
