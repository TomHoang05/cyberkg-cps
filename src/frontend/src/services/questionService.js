import api from './api';

/**
 * GET /questions — AUDIT-FIXED: the 128-question Q-bank had no REST route or
 * frontend service at all before (see backend/src/api/routes/questions.py).
 * Note: scenario_id (S01..S21, S09b) is NOT the same as an attack_id — there
 * is no 1:1 mapping between the 22 Q-bank scenarios and the 4 real attack
 * cases, so callers filter by role/scenario_id/bloom_level, not attack_id.
 */
export const questionService = {
  list: ({ role, scenarioId, bloomLevel, page = 1, pageSize = 20 } = {}) =>
    api.get('/questions', {
      params: {
        role: role || undefined,
        scenario_id: scenarioId || undefined,
        bloom_level: bloomLevel || undefined,
        page,
        page_size: pageSize,
      },
    }),
};
