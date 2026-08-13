"""Entity queries — D-19 §7 GET /entities + /entities/{id}.

AUDIT-FIXED (SEVERE): previous queries returned raw `n` (Neo4j Node objects,
not JSON-serializable) — every real call raised an unhandled 500. Now uses
properties(n) + labels(n) so the route can return plain dicts.
GET /{entity_id} now also returns bidirectional relationships (incoming + outgoing)
with a `direction` field, matching the 28-Jul entities.py fix.
"""

Q_LIST_ENTITIES = """
MATCH (n)
WHERE $entity_type IN labels(n)
  AND ($attack_id IS NULL OR EXISTS {
    MATCH (a:Attack {attack_id: $attack_id})-[*1..3]-(n)
  })
RETURN properties(n) AS props, labels(n) AS labels
ORDER BY n.name
SKIP $skip LIMIT $limit
"""

Q_GET_ENTITY = """
MATCH (n)
WHERE any(prop IN keys(n) WHERE n[prop] = $entity_id)
OPTIONAL MATCH (n)-[r_out]->(m_out)
OPTIONAL MATCH (n)<-[r_in]-(m_in)
RETURN
  properties(n) AS props,
  labels(n) AS labels,
  collect(DISTINCT {
    direction: 'outgoing',
    rel_type:  type(r_out),
    target:    properties(m_out),
    target_labels: labels(m_out)
  }) AS outgoing,
  collect(DISTINCT {
    direction: 'incoming',
    rel_type:  type(r_in),
    source:    properties(m_in),
    source_labels: labels(m_in)
  }) AS incoming
LIMIT 1
"""
