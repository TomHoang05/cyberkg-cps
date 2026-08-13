import axios from 'axios';

// baseURL uses Vite proxy (/api → localhost:8000) — never hardcode port here
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Unwrap {success, data} envelope; surface errors cleanly
api.interceptors.response.use(
  (res) => {
    if (res.data?.success === false)
      return Promise.reject(new Error(res.data.error || 'API error'));
    return res.data?.data !== undefined ? res.data.data : res.data;
  },
  async (err) => {
    let data = err.response?.data;

    // When responseType:'blob', error bodies arrive as Blobs — parse to JSON first
    if (data instanceof Blob && data.type?.includes('json')) {
      try { data = JSON.parse(await data.text()); } catch { /* leave as Blob */ }
    }

    const detail = data?.detail;
    // FastAPI 404s return detail as an object {code, message, ...} — extract string
    const detailMsg = typeof detail === 'string'
      ? detail
      : (detail?.message || detail?.msg || (detail ? JSON.stringify(detail) : null));
    const msg = detailMsg
      || data?.error
      || err.message
      || 'Network error';
    return Promise.reject(new Error(msg));
  },
);

export default api;
