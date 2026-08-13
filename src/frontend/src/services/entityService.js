import api from './api';

/**
 * GET /entities + /entities/{id} -- AUDIT-FIXED: previously had zero frontend
 * consumers even though the backend route was fully implemented (and its
 * EntityType enum bug, which made every list_entities call return empty, is
 * now fixed in backend/src/api/models/responses.py).
 */
export const entityService = {
  list: (type, { attackId, plane, evidenceClass, page = 1, pageSize = 20 } = {}) =>
    api.get('/entities', {
      params: {
        type,
        attack_id: attackId || undefined,
        plane: plane || 'all',
        evidence_class: evidenceClass || undefined,
        page,
        page_size: pageSize,
      },
    }),
  get: (entityId) => api.get(`/entities/${entityId}`),
};

// Real Neo4j labels (data/kg_data/schema/node_schema.yaml node_types: keys) --
// must match backend/src/api/models/responses.py EntityType values exactly.
export const ENTITY_TYPES = [
  'Attack', 'ATT_CK_Technique', 'Vulnerability', 'Weakness', 'Attack_Pattern',
  'IT_System', 'OT_System', 'Network_Zone', 'Bridge_Mechanism', 'Physical_Process',
  'Consequence', 'AI_Component', 'AI_Attack_Surface', 'Human_Actor', 'Human_Action',
  'Instructional_Concept', 'Question',
];
