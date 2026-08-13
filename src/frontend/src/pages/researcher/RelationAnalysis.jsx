import { useEffect, useState } from 'react';
import { relationService } from '../../services/relationService';

const EC_COLOR = {
  documented_fact: '#16A34A',
  supported_inference: '#F59E0B',
  instructional_extension: '#6B7280',
};

const S = {
  card: { background: 'var(--bg3)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 16, marginBottom: 12 },
  label: { fontSize: 10, fontWeight: 700, color: 'var(--color-text-secondary)', letterSpacing: '.04em', marginBottom: 6, display: 'block' },
  select: { background: 'var(--bg3)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', borderRadius: 8, padding: '7px 10px', fontSize: 12 },
  tab: (active) => ({
    padding: '5px 14px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
    background: active ? 'rgba(0,201,167,0.15)' : 'transparent',
    color: active ? 'var(--teal)' : 'var(--color-text-secondary)',
    border: active ? '1px solid rgba(0,201,167,0.35)' : '1px solid transparent',
  }),
  th: { padding: '6px 10px', fontSize: 9, fontWeight: 700, color: '#475569', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.08)' },
  td: { padding: '6px 10px', fontSize: 10, color: 'var(--color-text-primary)', borderBottom: '1px solid rgba(255,255,255,0.04)' },
};

/**
 * r-vulnchain — Relation Analysis screen (CYB-19 SCR-RES-03).
 * AUDIT-FIXED (infra gap): no route/query existed for the vuln chain or relation
 * type summary before. Now backed by GET /relations/* (see relations route).
 * Tabs: Vulnerability Chain | Relation Type Summary | Instance Explorer
 */
export default function RelationAnalysis() {
  const [tab, setTab] = useState('vuln');
  const [vulnChain, setVulnChain] = useState([]);
  const [summary, setSummary] = useState([]);
  const [types, setTypes] = useState([]);
  const [instances, setInstances] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load vuln chain + summary on mount
  useEffect(() => {
    Promise.all([
      relationService.vulnChain(),
      relationService.summary(),
      relationService.types(),
    ])
      .then(([vc, sum, t]) => {
        setVulnChain(vc?.data || []);
        setSummary(sum?.data || []);
        const typeList = t?.data || [];
        setTypes(typeList);
        if (typeList[0]) setSelectedType(typeList[0]);
      })
      .catch((e) => setError(e.message));
  }, []);

  const loadInstances = () => {
    if (!selectedType) return;
    setLoading(true);
    relationService.instances(selectedType)
      .then((r) => setInstances(r?.data || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  if (error) return <p style={{ color: 'var(--red)' }}>{error}</p>;

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Relation Analysis</h1>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 12, marginBottom: 18 }}>
        17 canonical relationship types — vulnerability chain, type summary, instance explorer.
      </p>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {[['vuln', 'Vulnerability Chain'], ['summary', 'Relation Type Summary'], ['instances', 'Instance Explorer']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={S.tab(tab === k)}>{l}</button>
        ))}
      </div>

      {/* ── Vulnerability Chain ── */}
      {tab === 'vuln' && (
        <div style={S.card}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--teal)', letterSpacing: '.04em', marginBottom: 10 }}>
            ATT_CK_Technique → EXPLOITS → Vulnerability → ROOT_CAUSE → Weakness → MAPS_TO_PATTERN → Attack_Pattern
          </div>
          {vulnChain.length === 0
            ? <p style={{ color: '#64748b', fontSize: 11 }}>No vulnerability chain data in KG (requires CVE-linked techniques).</p>
            : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Technique', 'CVE', 'CVSS', 'CWE', 'Weakness', 'CAPEC', 'Pattern'].map((h) => (
                      <th key={h} style={S.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vulnChain.map((r, i) => (
                    <tr key={i}>
                      <td style={S.td}><code style={{ fontSize: 9, color: 'var(--blue)' }}>{r.technique_id}</code><br /><span style={{ fontSize: 9, color: '#64748b' }}>{r.technique_name}</span></td>
                      <td style={S.td}><code style={{ fontSize: 9, color: '#94a3b8' }}>{r.cve_id || '—'}</code></td>
                      <td style={{ ...S.td, color: r.cvss_v3_score >= 9 ? 'var(--red)' : r.cvss_v3_score >= 7 ? 'var(--yellow)' : 'var(--green)' }}>
                        {r.cvss_v3_score ?? '—'}
                      </td>
                      <td style={S.td}><code style={{ fontSize: 9, color: '#94a3b8' }}>{r.cwe_id || '—'}</code></td>
                      <td style={S.td}>{r.weakness_name || '—'}</td>
                      <td style={S.td}><code style={{ fontSize: 9, color: '#94a3b8' }}>{r.capec_id || '—'}</code></td>
                      <td style={S.td}>{r.pattern_name || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </div>
      )}

      {/* ── Relation Type Summary ── */}
      {tab === 'summary' && (
        <div style={S.card}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Relation Type', 'From', 'To', 'Count', 'Avg Confidence', 'Evidence Classes'].map((h) => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summary.map((row) => (
                <tr key={row.relation_type}>
                  <td style={{ ...S.td, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--teal)' }}>{row.relation_type}</td>
                  <td style={S.td}>{row.from_label || '—'}</td>
                  <td style={S.td}>{row.to_label || '—'}</td>
                  <td style={{ ...S.td, fontWeight: 700, color: row.count > 0 ? 'var(--color-text-primary)' : '#334155' }}>{row.count}</td>
                  <td style={S.td}>{row.avg_confidence != null ? row.avg_confidence.toFixed(2) : '—'}</td>
                  <td style={S.td}>
                    {Object.entries(row.evidence_class_counts || {}).map(([ec, n]) => (
                      <span key={ec} style={{
                        display: 'inline-block', marginRight: 4, fontSize: 8, fontWeight: 700,
                        padding: '1px 5px', borderRadius: 3,
                        background: `${EC_COLOR[ec] || '#334155'}22`,
                        color: EC_COLOR[ec] || '#94a3b8',
                      }}>{ec.replace('_', ' ')} ({n})</span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Instance Explorer ── */}
      {tab === 'instances' && (
        <div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 14 }}>
            <div>
              <label style={S.label}>Relation Type</label>
              <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} style={S.select}>
                {types.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <button
              onClick={loadInstances}
              disabled={loading}
              style={{
                padding: '7px 16px', borderRadius: 8, color: '#fff', fontSize: 11,
                fontWeight: 700, cursor: 'pointer',
                background: 'rgba(0,201,167,0.2)', border: '1px solid rgba(0,201,167,0.4)',
              }}
            >
              {loading ? 'Loading…' : 'Load Instances'}
            </button>
          </div>

          {instances.length > 0 ? (
            <div style={S.card}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--teal)', letterSpacing: '.04em', marginBottom: 8 }}>
                {instances.length} instances of {selectedType}
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['From (Labels)', 'From (Name/ID)', '', 'To (Labels)', 'To (Name/ID)'].map((h, i) => (
                      <th key={i} style={S.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {instances.slice(0, 50).map((row, i) => {
                    const fromProps = row.from?.properties || {};
                    const toProps = row.to?.properties || {};
                    const fromName = fromProps.name || fromProps.attack_id || fromProps.mitre_id || fromProps.cve_id || '—';
                    const toName = toProps.name || toProps.attack_id || toProps.mitre_id || toProps.cve_id || '—';
                    return (
                      <tr key={i}>
                        <td style={{ ...S.td, fontSize: 9, color: '#64748b' }}>{(row.from?.labels || []).join(', ')}</td>
                        <td style={S.td}>{fromName}</td>
                        <td style={{ ...S.td, color: 'var(--teal)', fontSize: 9, textAlign: 'center' }}>→</td>
                        <td style={{ ...S.td, fontSize: 9, color: '#64748b' }}>{(row.to?.labels || []).join(', ')}</td>
                        <td style={S.td}>{toName}</td>
                      </tr>
                    );
                  })}
                  {instances.length > 50 && (
                    <tr>
                      <td colSpan={5} style={{ ...S.td, color: '#64748b', textAlign: 'center' }}>
                        … and {instances.length - 50} more (limit 200 from API)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: '#64748b', fontSize: 11 }}>Select a type and click Load Instances.</p>
          )}
        </div>
      )}
    </div>
  );
}
