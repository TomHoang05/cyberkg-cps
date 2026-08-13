import api from './api';

/** GET /relations/* — real Technique->Vulnerability->Weakness->Attack_Pattern chain,
 * plus the full 17-type summary/instance-explorer added for CYB-19 parity (r-vulnchain). */
export const relationService = {
  vulnChain:  () => api.get('/relations/vuln-chain'),
  types:      () => api.get('/relations/types'),
  summary:    () => api.get('/relations/summary'),
  instances:  (relationType, attackId) =>
    api.get('/relations/instances', {
      params: { relation_type: relationType, attack_id: attackId || undefined },
    }),
};
