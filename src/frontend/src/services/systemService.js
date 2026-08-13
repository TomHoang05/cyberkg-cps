import api from './api';

/**
 * System-level endpoints (GET /stats, GET /schema) -- used by the 3 role
 * dashboards for KPI cards / coverage tables. Previously unused by any
 * frontend page (no dashboards existed at all).
 */
export const systemService = {
  health:     () => api.get('/health'),
  stats:      () => api.get('/stats'),
  schema:     () => api.get('/schema'),
  // Added for CYB-19 parity (r-dash Cross-Case Pattern Statistics, r-pattern KG Schema Overview).
  crossCase:  () => api.get('/stats/cross-case'),
  byCase:     () => api.get('/stats/by-case'),
  // Added for CYB-19 parity (r-query Cypher panel) -- real literal query text
  // per query type, re-exported live from the backend's own query constants.
  queryTemplates: () => api.get('/queries/templates'),
};
