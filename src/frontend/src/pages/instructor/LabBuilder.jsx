import { useEffect, useState } from 'react';
import { attackService } from '../../services/attackService';
import { toTimelineChain } from '../../utils/graphTransform';

const LAB_TYPES = [
  { key: 'lab1', label: 'Lab 1 — IT-OT Transition (Trace Bridge)' },
  { key: 'lab2', label: 'Lab 2 — AI for Attack Detection' },
  { key: 'lab3', label: 'Lab 3 — Sensor Spoofing & AI Risk' },
];

const OBJECTIVES = {
  lab1: 'Trace the real attack chain for the selected case. Identify the bridge mechanism type, the Purdue levels crossed, the ATT&CK technique used at the crossing step, and classify the resulting physical consequence.',
  lab2: 'Determine what a network-traffic-based AI intrusion detection system could and could not have caught at each step of the real attack chain, and articulate the key limitation of network-only AI monitoring in an OT context.',
  lab3: 'Identify which step(s) in the real attack chain touch sensors or physical-process state, cross-reference against any AI component documented for this case, and reason about how sensor spoofing / view manipulation can defeat AI-based monitoring.',
};

const RUBRICS = {
  lab1: [
    { c: 'Bridge ID', ex: 'Correct type + technique + Purdue levels', ad: 'Type only', po: 'Wrong/missing' },
    { c: 'Technique sequence', ex: 'All in order + Purdue levels', ad: 'Most, partial levels', po: 'Missing' },
    { c: 'Mitigation proposal', ex: 'Specific, targets redacted step', ad: 'Generic', po: 'Missing' },
  ],
  lab2: [
    { c: 'Per-step detectability', ex: 'Correct call + real plane/tactic justification for every step', ad: 'Most steps correct', po: 'Guesses, no justification' },
    { c: 'AI coverage gap', ex: 'Identifies exactly which plane(s) network AI cannot see', ad: 'Partial / vague', po: 'Missing' },
    { c: 'Key limitation write-up', ex: 'Names the specific blind spot for this case', ad: 'Generic AI-limitation statement', po: 'Missing' },
  ],
  lab3: [
    { c: 'Physical-touching step ID', ex: 'Correctly identifies all steps with plane=physical', ad: 'Most steps', po: 'Missing' },
    { c: 'AI component cross-reference', ex: 'Correctly states whether an AI component is documented for this case', ad: 'Attempts but incomplete', po: 'Missing' },
    { c: 'Safeguard proposal', ex: 'Specific, breaks the sensor→AI→consequence chain', ad: 'Generic', po: 'Missing' },
  ],
};

// Heuristic: real plane + tactic -> network-AI visibility label.
// Intentionally simple and labeled as such — grounded in real per-step KG data.
function detectability(step) {
  if (step.plane === 'physical') {
    return { verdict: 'NO', reason: 'Physical/process-level action — invisible to network-traffic monitoring.' };
  }
  if (step.is_bridge_step) {
    return { verdict: 'MAYBE', reason: 'Crosses IT→OT — anomalous traffic pattern, but easily mistaken for legitimate maintenance access.' };
  }
  const tactic = (step.tactic || '').toLowerCase();
  if (['lateral-movement', 'command-and-control', 'exfiltration', 'discovery'].includes(tactic)) {
    return { verdict: 'YES', reason: `Tactic "${step.tactic}" typically produces observable network traffic patterns.` };
  }
  if (['execution', 'persistence', 'defense-evasion', 'privilege-escalation'].includes(tactic)) {
    return { verdict: 'NO', reason: `Tactic "${step.tactic}" is host-level — a network-only AI/IDS is blind to it.` };
  }
  return { verdict: 'MAYBE', reason: 'Insufficient tactic data to classify with confidence.' };
}

const TABS = ['instructions', 'partial', 'answer', 'rubric'];

const S = {
  card: { background: 'var(--bg3)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 16, marginBottom: 12 },
  label: { fontSize: 10, fontWeight: 700, color: 'var(--color-text-secondary)', letterSpacing: '.04em', marginBottom: 6, display: 'block' },
  select: { background: 'var(--bg3)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', borderRadius: 8, padding: '7px 10px', fontSize: 12, width: '100%' },
  tab: (active) => ({
    padding: '5px 14px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
    background: active ? 'rgba(0,201,167,0.15)' : 'transparent',
    color: active ? 'var(--teal)' : 'var(--color-text-secondary)',
    border: active ? '1px solid rgba(0,201,167,0.35)' : '1px solid transparent',
  }),
  th: { padding: '6px 10px', fontSize: 9, fontWeight: 700, color: '#475569', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.08)' },
  td: { padding: '6px 10px', fontSize: 10, color: 'var(--color-text-primary)', borderBottom: '1px solid rgba(255,255,255,0.04)' },
};

export default function LabBuilder() {
  const [labType, setLabType] = useState('lab1');
  const [attackId, setAttackId] = useState('');
  const [attacks, setAttacks] = useState([]);
  const [chain, setChain] = useState(null);
  const [roles, setRoles] = useState(null);
  const [consequences, setConsequences] = useState(null);
  const [tab, setTab] = useState('instructions');
  const [error, setError] = useState(null);

  useEffect(() => {
    attackService.listAttacks()
      .then((raw) => {
        const a = raw?.data || raw || [];
        setAttacks(a);
        if (a[0]) setAttackId(a[0].slug || a[0].attack_id);
      })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!attackId) return;
    attackService.chain(attackId)
      .then((raw) => setChain(toTimelineChain(raw?.data || raw || [])))
      .catch((e) => setError(e.message));
    attackService.roles(attackId)
      .then((raw) => setRoles(raw?.data || raw))
      .catch((e) => setError(e.message));
    attackService.consequence(attackId)
      .then((raw) => setConsequences(raw?.data?.consequences || raw?.data || []))
      .catch((e) => setError(e.message));
  }, [attackId]);

  if (error) return <p style={{ color: 'var(--red)' }}>{error}</p>;

  const bridgeIndex = chain?.chain.findIndex((s) => s.is_bridge_step) ?? -1;
  const attack = attacks.find((a) => (a.slug || a.attack_id) === attackId);
  const aiComponents = roles?.ai_components?.filter((c) => c.component) || [];

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Lab Exercise Builder</h1>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 12, marginBottom: 18 }}>
        Real KG data — works for all 4 MVP attack cases.
      </p>

      {/* Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
        <div>
          <label style={S.label}>Lab Type</label>
          <select value={labType} onChange={(e) => setLabType(e.target.value)} style={S.select}>
            {LAB_TYPES.map((l) => <option key={l.key} value={l.key}>{l.label}</option>)}
          </select>
        </div>
        <div>
          <label style={S.label}>Attack Case</label>
          <select value={attackId} onChange={(e) => setAttackId(e.target.value)} style={S.select}>
            {attacks.map((a) => (
              <option key={a.slug || a.attack_id} value={a.slug || a.attack_id}>
                {a.name || a.attack_id}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} style={S.tab(tab === t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Instructions tab ── */}
      {tab === 'instructions' && (
        <div style={S.card}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--teal)', marginBottom: 8 }}>
            {LAB_TYPES.find((l) => l.key === labType)?.label}
          </div>
          <p style={{ fontSize: 12, color: 'var(--color-text-primary)', lineHeight: 1.65, marginBottom: 12 }}>
            {OBJECTIVES[labType]}
          </p>
          {chain && bridgeIndex >= 0 && (
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
              <strong style={{ color: 'var(--teal)' }}>Bridge step:</strong> Step {chain.chain[bridgeIndex]?.step} — {chain.chain[bridgeIndex]?.name} ({chain.chain[bridgeIndex]?.mitre_id})
            </div>
          )}
          {labType !== 'lab1' && aiComponents.length > 0 && (
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 6 }}>
              <strong style={{ color: 'var(--purple)' }}>AI component documented:</strong> {aiComponents.map((c) => c.component).join(', ')}
            </div>
          )}
          {labType !== 'lab1' && aiComponents.length === 0 && (
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>
              No AI component documented in KG for this attack case.
            </div>
          )}
        </div>
      )}

      {/* ── Partial data tab ── */}
      {tab === 'partial' && chain && (
        <div style={S.card}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--teal)', marginBottom: 10, letterSpacing: '.04em' }}>
            PARTIAL CHAIN — INSTRUCTOR HANDOUT
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Step', 'Action', 'ATT&CK', labType === 'lab1' ? 'Purdue (redacted)' : 'AI detectable?'].map((h) => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chain.chain.map((s, i) => {
                const isBridge = s.is_bridge_step;
                const det = labType !== 'lab1' ? detectability(s) : null;
                return (
                  <tr key={s.step} style={{ background: isBridge ? 'rgba(0,201,167,0.06)' : 'transparent' }}>
                    <td style={S.td}>{s.step}</td>
                    <td style={{ ...S.td, color: isBridge ? 'var(--teal)' : 'var(--color-text-primary)' }}>
                      {isBridge ? '🌉 ' : ''}{s.name || '—'}
                    </td>
                    <td style={S.td}><code style={{ fontSize: 9, color: '#94a3b8' }}>{s.mitre_id || '—'}</code></td>
                    <td style={S.td}>
                      {labType === 'lab1'
                        ? (isBridge ? '?' : `L${s.purdue_level ?? '?'}`)
                        : det
                          ? <span style={{ color: det.verdict === 'YES' ? 'var(--green)' : det.verdict === 'NO' ? 'var(--red)' : 'var(--yellow)', fontSize: 9, fontWeight: 700 }}>{det.verdict}</span>
                          : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Answer key tab ── */}
      {tab === 'answer' && chain && (
        <div style={S.card}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--teal)', marginBottom: 10, letterSpacing: '.04em' }}>
            ANSWER KEY
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Step', 'Action', 'ATT&CK', 'Plane', 'Purdue', labType !== 'lab1' ? 'AI Detect?' : null].filter(Boolean).map((h) => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chain.chain.map((s) => {
                const isBridge = s.is_bridge_step;
                const det = labType !== 'lab1' ? detectability(s) : null;
                return (
                  <tr key={s.step} style={{ background: isBridge ? 'rgba(0,201,167,0.06)' : 'transparent' }}>
                    <td style={S.td}>{s.step}</td>
                    <td style={{ ...S.td, color: isBridge ? 'var(--teal)' : 'var(--color-text-primary)' }}>
                      {isBridge ? '🌉 ' : ''}{s.name}
                    </td>
                    <td style={S.td}><code style={{ fontSize: 9, color: '#94a3b8' }}>{s.mitre_id || '—'}</code></td>
                    <td style={S.td}>{s.plane}</td>
                    <td style={S.td}>{s.purdue_level != null ? `L${s.purdue_level}` : '—'}</td>
                    {labType !== 'lab1' && (
                      <td style={S.td}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: det?.verdict === 'YES' ? 'var(--green)' : det?.verdict === 'NO' ? 'var(--red)' : 'var(--yellow)' }}>
                          {det?.verdict}
                        </span>
                        <span style={{ fontSize: 9, color: '#64748b', marginLeft: 6 }}>{det?.reason}</span>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {consequences?.length > 0 && (
            <div style={{ marginTop: 14, fontSize: 11, color: 'var(--color-text-secondary)' }}>
              <strong style={{ color: 'var(--yellow)' }}>Consequences:</strong>{' '}
              {consequences.slice(0, 3).map((c) => c.consequence || c.name).join('; ')}
            </div>
          )}
        </div>
      )}

      {/* ── Rubric tab ── */}
      {tab === 'rubric' && (
        <div style={S.card}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--teal)', marginBottom: 10, letterSpacing: '.04em' }}>
            GRADING RUBRIC
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Criterion', 'Excellent', 'Adequate', 'Poor'].map((h) => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(RUBRICS[labType] || []).map((row) => (
                <tr key={row.c}>
                  <td style={{ ...S.td, fontWeight: 600 }}>{row.c}</td>
                  <td style={{ ...S.td, color: 'var(--green)' }}>{row.ex}</td>
                  <td style={{ ...S.td, color: 'var(--yellow)' }}>{row.ad}</td>
                  <td style={{ ...S.td, color: 'var(--red)' }}>{row.po}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
