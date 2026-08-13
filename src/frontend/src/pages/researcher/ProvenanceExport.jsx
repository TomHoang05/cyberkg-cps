import { useEffect, useState } from 'react';
import { attackService } from '../../services/attackService';

const EC_COLOR = {
  documented_fact: '#16A34A',
  supported_inference: '#F59E0B',
  instructional_extension: '#6B7280',
};

const ATTACK_SLUGS = [
  { slug: 'colonial_pipeline_2021', name: 'Colonial Pipeline (2021)' },
  { slug: 'triton_2017',            name: 'TRITON (2017)' },
  { slug: 'german_steel_mill_2014', name: 'German Steel Mill (2014)' },
  { slug: 'stuxnet_2010',           name: 'Stuxnet (2010)' },
];

const S = {
  card: { background: 'var(--bg3)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 16, marginBottom: 12 },
  label: { fontSize: 10, fontWeight: 700, color: 'var(--color-text-secondary)', letterSpacing: '.04em', marginBottom: 6, display: 'block' },
  select: { background: 'var(--bg3)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', borderRadius: 8, padding: '7px 10px', fontSize: 12 },
  th: { padding: '6px 10px', fontSize: 9, fontWeight: 700, color: '#475569', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.08)' },
  td: { padding: '6px 10px', fontSize: 10, color: 'var(--color-text-primary)', borderBottom: '1px solid rgba(255,255,255,0.04)' },
};

/**
 * r-provenance — Data Provenance tab (CYB-19 SCR-RES-05).
 * AUDIT-FIXED (feature gap): this screen previously only had a schema/API-export
 * tab; the per-fact provenance list had no backing route or query.
 */
export default function ProvenanceExport() {
  const [slug, setSlug] = useState(ATTACK_SLUGS[0].slug);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    attackService.provenance(slug)
      .then((raw) => setRecords(raw?.data || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  // Auto-load on slug change
  useEffect(() => { load(); }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

  // Confidence bar helper
  const ConfBar = ({ value }) => {
    const pct = Math.round((value ?? 0.8) * 100);
    const color = pct >= 90 ? '#16A34A' : pct >= 70 ? '#F59E0B' : '#EF4444';
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ flex: 1, height: 4, background: 'var(--bg2)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2 }} />
        </div>
        <span style={{ fontSize: 9, color, minWidth: 28 }}>{pct}%</span>
      </div>
    );
  };

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Data Provenance</h1>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 12, marginBottom: 18 }}>
        Per-fact source citation, confidence and evidence class for each attack case.
      </p>

      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 18 }}>
        <div>
          <label style={S.label}>Attack Case</label>
          <select value={slug} onChange={(e) => setSlug(e.target.value)} style={S.select}>
            {ATTACK_SLUGS.map((a) => <option key={a.slug} value={a.slug}>{a.name}</option>)}
          </select>
        </div>
        {loading && <span style={{ fontSize: 11, color: '#64748b' }}>Loading…</span>}
      </div>

      {error && <p style={{ color: 'var(--red)', fontSize: 11 }}>{error}</p>}

      {records.length === 0 && !loading && (
        <p style={{ color: '#64748b', fontSize: 11 }}>No provenance records returned. Check Neo4j provenance fields (source, confidence, evidence_class).</p>
      )}

      {records.length > 0 && (
        <div style={S.card}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--teal)', letterSpacing: '.04em', marginBottom: 10 }}>
            {records.length} provenance records — {ATTACK_SLUGS.find((a) => a.slug === slug)?.name}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Entity Type', 'ID', 'Name', 'Source', 'Evidence Class', 'Confidence', 'Ingested'].map((h) => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => {
                const ec = r.evidence_class;
                const ecColor = EC_COLOR[ec] || '#64748b';
                return (
                  <tr key={i}>
                    <td style={{ ...S.td, fontSize: 9, color: '#64748b' }}>{r.label || '—'}</td>
                    <td style={S.td}><code style={{ fontSize: 9, color: 'var(--blue)' }}>{r.entity_id || '—'}</code></td>
                    <td style={S.td}>{r.name || '—'}</td>
                    <td style={{ ...S.td, fontSize: 9 }}>
                      {r.source_id_or_url
                        ? <a href={r.source_id_or_url} target="_blank" rel="noreferrer" style={{ color: 'var(--teal)' }}>{r.source || r.source_id_or_url}</a>
                        : r.source || '—'
                      }
                    </td>
                    <td style={S.td}>
                      <span style={{
                        fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
                        background: `${ecColor}22`, color: ecColor,
                      }}>{ec || '—'}</span>
                    </td>
                    <td style={{ ...S.td, minWidth: 100 }}>
                      <ConfBar value={r.confidence} />
                    </td>
                    <td style={{ ...S.td, fontSize: 9, color: '#64748b' }}>
                      {r.ingested_at ? new Date(r.ingested_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
