import { useNavigate } from 'react-router-dom';

const SCENARIOS = [
  {
    id: 'colonial_pipeline_2021', slug: 'colonial_pipeline_2021',
    name: 'Colonial Pipeline', meta: '2021 · USA · Ransomware + OT Shutdown',
    bridge: { label: 'Authorized Bridge', color: 'var(--blue)' },
    consequence: { label: 'Indirect Disruption', color: 'var(--yellow)' },
    entities: 26, modules: 'M1, M5',
  },
  {
    id: 'triton_2017', slug: 'triton_2017',
    name: 'TRITON / TRISIS', meta: '2017 · Middle East · SIS Attack',
    bridge: { label: 'Unauthorized Bridge', color: 'var(--red)' },
    consequence: { label: 'Safety Suppression', color: 'var(--red)' },
    entities: 24, modules: 'M1, M2',
  },
  {
    id: 'german_steel_mill_2014', slug: 'german_steel_mill_2014',
    name: 'German Steel Mill', meta: '2014 · Germany · Blast Furnace Damage',
    bridge: { label: 'Structural Exposure', color: 'var(--orange)' },
    consequence: { label: 'Direct Manipulation', color: 'var(--orange)' },
    entities: 26, modules: 'M2, M5',
  },
  {
    id: 'stuxnet_2010', slug: 'stuxnet_2010',
    name: 'Stuxnet', meta: '2010 · Iran · Nuclear Sabotage',
    bridge: { label: 'Air-Gap Bypass', color: 'var(--purple)' },
    consequence: { label: 'Direct Manip. + DoV', color: 'var(--purple)' },
    entities: 26, modules: 'M1–M5',
  },
];

function Badge({ label, color }) {
  return (
    <span style={{
      display: 'inline-block', fontSize: 10, padding: '2px 8px', borderRadius: 12,
      fontWeight: 600, background: `${color}22`, color,
    }}>{label}</span>
  );
}

export default function StudentHome() {
  const navigate = useNavigate();

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
        Student Dashboard
        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
          letterSpacing: '.5px', textTransform: 'uppercase',
          background: 'rgba(0,201,167,.12)', color: 'var(--teal)', border: '1px solid rgba(0,201,167,.3)' }}>
          SCR-STU-01
        </span>
      </div>
      <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
        Explore ICS/CPS cyber-attack scenarios across 4 planes — from Cyber intrusion to Physical consequence
      </div>

      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg,rgba(59,130,246,.08) 0%,rgba(0,201,167,.06) 100%)',
        border: '1px solid rgba(0,201,167,.25)', borderRadius: 12, padding: 18, marginBottom: 14,
      }}>
        <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 5 }}>Welcome to CyberKG-CPS</div>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
          Explore ICS/CPS cyber-attack scenarios using a knowledge-graph lens — trace cross-plane attack chains,
          analyze physical consequences, and examine AI &amp; Human roles.{' '}
          <span style={{ color: 'var(--teal)', fontWeight: 600 }}>4 MVP cases loaded</span>{' '}
          across all 4 planes and Modules M1–M5.
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap', fontSize: 10 }}>
          {[
            { label: '4 Attack Cases (MVP)', bg: 'rgba(59,130,246,.12)', color: 'var(--blue)', border: 'rgba(59,130,246,.25)' },
            { label: '4 Planes', bg: 'rgba(0,201,167,.12)', color: 'var(--teal)', border: 'rgba(0,201,167,.25)' },
            { label: 'Modules M1–M5', bg: 'rgba(245,158,11,.12)', color: 'var(--orange)', border: 'rgba(245,158,11,.25)' },
            { label: 'Progress Tracking → V1', bg: 'rgba(139,92,246,.12)', color: 'var(--purple)', border: 'rgba(139,92,246,.25)' },
          ].map(t => (
            <span key={t.label} style={{
              padding: '3px 8px', borderRadius: 4, background: t.bg, color: t.color, border: `1px solid ${t.border}`,
            }}>{t.label}</span>
          ))}
        </div>
      </div>

      {/* Quick action cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        {/* MVP */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            MVP — Start Here
            <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
              letterSpacing: '.5px', textTransform: 'uppercase',
              background: 'var(--mvp-bg)', color: 'var(--mvp-text)', border: '1px solid var(--mvp-border)' }}>MVP</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={() => navigate('scenarios')} style={{
              padding: '10px 16px', borderRadius: 8, border: 'none',
              background: 'var(--teal)', color: '#000', fontWeight: 600, fontSize: 12,
              cursor: 'pointer', textAlign: 'center',
            }}>🔍 Explore 4 Attack Cases</button>
            {[
              ['⛓ Trace Attack Chain', 'scenarios'],
              ['💥 Analyze Consequences', 'scenarios'],
              ['🤖 AI &amp; Human Plane', 'scenarios'],
              ['🔗 View Attack Graph (Read-Only)', 'graph/colonial_pipeline_2021'],
            ].map(([lbl, path]) => (
              <button key={lbl} onClick={() => navigate(path)} style={{
                padding: '10px 16px', borderRadius: 8, background: 'none',
                border: '1px solid var(--color-border)', color: 'var(--color-text-primary)',
                fontWeight: 600, fontSize: 12, cursor: 'pointer', textAlign: 'center',
              }} dangerouslySetInnerHTML={{ __html: lbl }} />
            ))}
          </div>
        </div>
        {/* V1 */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            V1 Features Coming
            <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
              letterSpacing: '.5px', textTransform: 'uppercase',
              background: 'var(--v1-bg)', color: 'var(--v1-text)', border: '1px solid var(--v1-border)' }}>V1</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              '🎯 ATT&CK Navigator Heatmap',
              '⚖ Compare Two Attacks',
              '🤖 LLM Explanations per step',
            ].map(lbl => (
              <button key={lbl} disabled style={{
                padding: '10px 16px', borderRadius: 8, background: 'none',
                border: '1px solid var(--v1-border)', color: 'var(--v1-text)',
                fontWeight: 600, fontSize: 12, cursor: 'not-allowed', textAlign: 'center', opacity: .6,
              }}>{lbl}</button>
            ))}
            <button disabled style={{
              padding: '10px 16px', borderRadius: 8, background: 'none',
              border: '1px solid var(--v2-border)', color: 'var(--v2-text)',
              fontWeight: 600, fontSize: 12, cursor: 'not-allowed', textAlign: 'center', opacity: .6,
            }}>🎮 Operator Decision Simulator</button>
          </div>
        </div>
      </div>

      {/* Scenario Cards */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          Scenario Cards — 4 MVP Attack Cases
          <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
            letterSpacing: '.5px', textTransform: 'uppercase',
            background: 'var(--mvp-bg)', color: 'var(--mvp-text)', border: '1px solid var(--mvp-border)' }}>MVP</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
          {SCENARIOS.map(sc => (
            <div
              key={sc.id}
              onClick={() => navigate('scenarios')}
              style={{
                background: 'var(--bg3)', border: '1px solid var(--color-border)',
                borderRadius: 11, padding: 16, cursor: 'pointer', transition: '.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--teal)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>{sc.name}</div>
              <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginBottom: 8 }}>{sc.meta}</div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 6 }}>
                <Badge label={sc.bridge.label} color={sc.bridge.color} />
                <Badge label={sc.consequence.label} color={sc.consequence.color} />
              </div>
              <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                {sc.entities} entities · {sc.modules}
              </div>
              <button
                onClick={e => { e.stopPropagation(); navigate('scenarios'); }}
                style={{
                  width: '100%', padding: '7px 12px', borderRadius: 8, border: 'none',
                  background: 'var(--teal)', color: '#000', fontWeight: 600, fontSize: 11,
                  cursor: 'pointer', textAlign: 'center',
                }}
              >Explore Scenario →</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
