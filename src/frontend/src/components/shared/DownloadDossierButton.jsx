import { useState } from 'react';
import { Download } from 'lucide-react';
import { attackService } from '../../services/attackService';

/**
 * COMP-05 — Download Attack Dossier .docx
 * Triggers GET /api/v1/attacks/{id}/dossier and saves the binary blob.
 * If no narrative has been pre-generated, the backend auto-generates it via
 * LLM on first call (may take ~20–60 s — loading state communicates this).
 */
export default function DownloadDossierButton({
  attackId,
  audience = 'instructor',
  deploymentSize = 'standard',
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const handleDownload = async () => {
    setLoading(true);
    setError(null);
    try {
      const blob = await attackService.downloadDossier(attackId, audience, deploymentSize);

      // Verify we actually got a docx blob (not an error JSON wrapped as blob)
      if (blob.type && blob.type.includes('json')) {
        const text = await blob.text();
        let msg = 'Download failed.';
        try { msg = JSON.parse(text)?.detail || msg; } catch { /* ignore */ }
        setError(msg);
        return;
      }

      const url  = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href     = url;
      link.download = `${attackId}_dossier.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      // axios wraps blob error bodies — try to parse them for a useful message
      let msg = err.message || 'Download failed.';
      try {
        const blobData = err.response?.data;
        if (blobData instanceof Blob) {
          const text = await blobData.text();
          const json = JSON.parse(text);
          if (json?.detail) msg = json.detail;
        }
      } catch { /* ignore parse errors — use axios message */ }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <button
        onClick={handleDownload}
        disabled={loading || !attackId}
        aria-label="Download Attack Dossier DOCX"
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '8px 14px', borderRadius: 8, border: 'none',
          background: 'var(--teal)', color: '#000',
          fontWeight: 700, fontSize: 12, cursor: loading ? 'not-allowed' : 'pointer',
          opacity: (loading || !attackId) ? .6 : 1, transition: 'opacity .15s',
        }}
      >
        <Download size={14} />
        {loading ? 'Generating dossier…' : 'Download Dossier'}
      </button>
      {loading && (
        <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>
          First call generates via LLM — may take ~30 s
        </span>
      )}
      {error && (
        <span style={{ fontSize: 11, color: 'var(--red)', maxWidth: 240, lineHeight: 1.4 }}>
          {error}
        </span>
      )}
    </div>
  );
}
