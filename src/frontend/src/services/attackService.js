import api from './api';

export const attackService = {
  listAttacks:  ()                          => api.get('/attacks'),
  surface:      (id)                        => api.get(`/attacks/${id}/surface`),
  chain:        (id)                        => api.get(`/attacks/${id}/chain`),
  consequence:  (id)                        => api.get(`/attacks/${id}/consequence`),
  roles:        (id)                        => api.get(`/attacks/${id}/roles`),
  full:         (id)                        => api.get(`/attacks/${id}/full`),
  purdue:       (id)                        => api.get(`/attacks/${id}/purdue`),
  generate:     (id, type, audience = 'instructor') =>
    api.post('/generate', { attack_id: id, output_type: type, audience }),
  provenance:       (id)                    => api.get(`/attacks/${id}/provenance`),
  triggerNarrative: (id)                    => api.post(`/attacks/${id}/narrative`),
  downloadDossier:  (id, audience = 'instructor', deploymentSize = 'standard') =>
    api.get(`/attacks/${id}/dossier`, {
      params: { audience, deployment_size: deploymentSize },
      responseType: 'blob',
      // First call auto-generates via LLM — can take up to 60s
      timeout: 90_000,
    }),
};
