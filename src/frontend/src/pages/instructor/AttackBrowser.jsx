import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAttackData } from '../../hooks/useAttackData';

const V1_CASES = [
  { name: 'Ukraine Grid 2015',   meta: 'BlackEnergy3 · SCADA',         bridge: 'Authorized',   bridgeColor: 'var(--blue)' },
  { name: 'Ukraine Grid 2016',   meta: 'Industroyer · Protocol Attack', bridge: 'Unauthorized', bridgeColor: 'var(--red)' },
  { name: 'Oldsmar Water 2021',  meta: 'TeamViewer · NaOH Spike',       bridge: 'Authorized',   bridgeColor: 'var(--blue)' },
  { name: 'Maroochy Shire 2000', meta: 'SCADA hijack · Sewage',         bridge: 'Unauthorized', bridgeColor: 'var(--red)' },
  { name: 'EKANS/SNAKE 2020',    meta: 'ICS-aware ransomware',          bridge: 'Structural',   bridgeColor: 'var(--orange)' },
  { name: 'JBS Foods 2021',      meta: 'REvil · Food supply',           bridge: 'Authorized',   bridgeColor: 'var(--blue)' },
];

const BRIDGE_BADGE = {
  colonial_pipeline_2021: { label: 'Authorized VPN',     color: 'var(--blue)' },
  triton_2017:            { label: 'Unauthorized Bridge', color: 'var(--red)' },
  german_steel_mill_2014: { label: 'Structural Exposure', color: 'var(--orange)' },
  stuxnet_2010:           { label: 'Air-Gap USB',         color: 'var(--purple)' },
};
const CONSEQUENCE_BADGE = {
  colonial_pipeline_2021: { label: 'Indirect Disruption',   color: 'var(--yellow)' },
  triton_2017:            { label: 'Safety Suppression',     color: 'var(--red)' },
  german_steel_mill_2014: { label: 'Direct Manipulation',    color: 'var(--orange)' },
  stuxnet_2010:           { label: 'Direct Manip. + DoV',    color: 'var(--purple)' },
};

function Badge({ label, color }) {
  return (
    <span style={{
      display: 'inline-block', fontSize: 10, padding: '2px 8px', borderRadius: 12,
      fontWeight: 600, background: `${color}22`, color,
    }}>{label}</span>
  );
}

export default function AttackBrowser() {
  const navigate = useNavigate();
  const { data: attacks, loading, error } = useAttackData(null, 'listAttacks');
  const [search, setSearch] = useState('');

  const filtered = (attacks || []).filter(atk =>
    !search || atk.name?.toLowerCase().includes(search.toLowerCase())
      || atk.attack_id?.includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
        Attack Browser
        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
          letterSpacing: '.5px', textTransform: 'uppercase',
          background: 'rgba(0,201,167,.12)', color: 'var(--teal)', border: '1px solid rgba(0,201,167,.3)' }}>
          SCR-INS-02
        </span>
      </div>
      <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 20 }}>
        Select a case to open the Attack Graph Explorer
      </div>

      {/* Search filter bar — COMP-04 */}
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--color-border)',
        borderRadius: 12, padding: '12px 16px', marginBottom: 16,
      }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: 160 }}>
            <label style={{ fontSize: 11, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 5, fontWeight: 600, letterSpacing: '.3px' }}>Search</label>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Filter by name, year, sector…"
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 120 }}>
            <label style={{ fontSize: 11, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 5, fontWeight: 600, letterSpacing: '.3px' }}>Plane</label>
            <select style={{ width: '100%' }}><option>All Planes</option><option>Cyber</option><option>Physical</option><option>AI</option><option>Human</option><option>Bridge</option></select>
          </div>
          <div style={{ flex: 1, minWidth: 120 }}>
            <label style={{ fontSize: 11, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 5, fontWeight: 600, letterSpacing: '.3px' }}>Severity</label>
            <select style={{ width: '100%' }}><option>All Severity</option><option>HIGH</option><option>MEDIUM</option><option>LOW</option></select>
          </div>
          <button
            onClick={() => setSearch('')}
            style={{
              padding: '8px 14px', borderRadius: 8, background: 'none',
              border: '1px solid var(--color-border)', color: 'var(--color-text-primary)',
              fontSize: 12, cursor: 'pointer', flexShrink: 0, marginBottom: 2,
            }}
          >↺ Reset</button>
        </div>
      </div>

      {/* Attack cards */}
      {loading && <p style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>Loading…</p>}
      {error   && <p style={{ color: 'var(--red)', fontSize: 12 }}>{error}</p>}

      {/* MVP Attack cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 16 }}>
        {filtered.map(atk => {
          const bb = BRIDGE_BADGE[atk.attack_id] || { label: atk.bridge_type || 'Bridge', color: 'var(--teal)' };
          const cb = CONSEQUENCE_BADGE[atk.attack_id] || { label: '—', color: 'var(--color-text-secondary)' };
          return (
            <div
              key={atk.attack_id}
              onClick={() => navigate(`../explore/${atk.slug || atk.attack_id}`)}
              style={{
                background: 'var(--bg2)', border: '1px solid var(--color-border)',
                borderRadius: 11, padding: 16, cursor: 'pointer', transition: '.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--teal)'; e.currentTarget.style.background = 'rgba(0,201,167,.04)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'var(--bg2)'; }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>{atk.name}</div>
              <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                {atk.year} · {atk.sector}
              </div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                <Badge label={bb.label} color={bb.color} />
                <Badge label={cb.label} color={cb.color} />
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
                  letterSpacing: '.5px', textTransform: 'uppercase',
                  background: 'var(--mvp-bg)', color: 'var(--mvp-text)', border: '1px solid var(--mvp-border)',
                }}>MVP</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* V1 locked cases */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          V1 Cases
          <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
            letterSpacing: '.5px', textTransform: 'uppercase',
            background: 'var(--v1-bg)', color: 'var(--v1-text)', border: '1px solid var(--v1-border)' }}>V1</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {V1_CASES.map(c => (
            <div key={c.name} style={{
              position: 'relative', opacity: .7, pointerEvents: 'none',
              background: 'var(--bg2)', border: '1px solid var(--v1-border)',
              borderRadius: 11, padding: 14,
            }}>
              <div style={{
                position: 'absolute', top: 8, right: 8,
                fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
                background: 'var(--v1-bg)', color: 'var(--v1-text)', border: '1px solid var(--v1-border)',
              }}>V1</div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3, paddingRight: 30 }}>{c.name}</div>
              <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginBottom: 8 }}>{c.meta}</div>
              <Badge label={c.bridge} color={c.bridgeColor} />
            </div>
          ))}
        </div>
      </div>

      {/* Faculty Intake Form */}
      <div style={{
        background: 'rgba(0,201,167,.04)', border: '1px solid rgba(0,201,167,.25)',
        borderRadius: 12, padding: 18, marginBottom: 16,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--teal)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          📋 Faculty Intake Form
          <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--color-text-secondary)' }}>NSF Task 2.2 — Q102 · lightweight intake form</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          {[
            { label: 'Disciplinary Orientation', opts: ['CS / Cybersecurity', 'Electrical / Controls Engineering', 'Mechatronics / Robotics', 'IoT / Embedded Systems', 'Interdisciplinary (mixed)'] },
            { label: 'Course Level',              opts: ['Undergraduate — Introductory', 'Undergraduate — Advanced', 'Graduate / MS', 'Professional / Industry'] },
            { label: 'Prerequisite Knowledge',    opts: ['None (general audience)', 'Basic Networking (OSI, TCP/IP)', 'OS / Systems Programming', 'Embedded / Industrial Control Systems'] },
            { label: 'Content Depth',             opts: ['Conceptual Overview (no code)', 'Technical Analysis (diagrams + ATT&CK)', 'Research-Level (full provenance)'] },
          ].map(f => (
            <div key={f.label}>
              <label style={{ fontSize: 11, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 5, fontWeight: 600 }}>{f.label}</label>
              <select style={{ width: '100%' }}>
                {f.opts.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--teal)', marginBottom: 8 }}>Deployment Size — NSF Task 2.2</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { val: 'micro',    label: 'Micro-unit',    sub: '1 class period (~75 min)\nKey facts + one Q-type', default: true },
              { val: 'standard', label: 'Standard Unit', sub: '1 week (3–5 classes)\nFull 5-output dossier + labs' },
              { val: 'extended', label: 'Extended Unit', sub: '3+ weeks (lab project)\nAll 3 labs + assessments' },
            ].map(d => (
              <label key={d.val} style={{
                display: 'flex', alignItems: 'flex-start', gap: 8, flex: 1, minWidth: 160,
                padding: 10, background: 'var(--bg3)', borderRadius: 8, cursor: 'pointer',
                border: d.default ? '2px solid var(--teal)' : '1px solid var(--color-border)',
              }}>
                <input type="radio" name="deploy-size" value={d.val} defaultChecked={d.default} style={{ marginTop: 2 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 11, color: d.default ? 'var(--teal)' : 'var(--color-text-primary)' }}>{d.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-line' }}>{d.sub}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate(`../explore/colonial_pipeline_2021`)}
            style={{ padding: '10px 18px', borderRadius: 8, border: 'none', background: 'var(--teal)', color: '#000', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
          >→ Open Attack Graph Explorer (Q1–Q5)</button>
          <button
            onClick={() => alert('Topic alignment preview:\n\nCase: Colonial Pipeline (2021)\nDiscipline: CS/Cybersecurity\nDeployment: Micro-unit (75 min)\n\n✅ M1 IT-OT Progression — strong fit\n✅ M2 Physical Consequences — strong fit\n⚠ M3 AI Attack Surfaces — requires V1\n✅ Prerequisite match: Basic Networking')}
            style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'none', color: 'var(--color-text-primary)', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}
          >👁 Preview Topic Alignment (Q103)</button>
        </div>
      </div>
    </div>
  );
}
