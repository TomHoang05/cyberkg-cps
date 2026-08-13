import { useNavigate } from 'react-router-dom';
import { useAttackData } from '../../hooks/useAttackData';

const S = {
  card:    { background: 'var(--bg2)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 18 },
  cardSm:  { background: 'var(--bg2)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 14 },
  title:   { fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 6 },
  val:     { fontSize: 28, fontWeight: 800 },
  secHead: { fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
};

const CASE_META = {
  colonial_pipeline_2021: { bridge: 'Authorized VPN',    bridgeColor: 'var(--blue)',   consequence: 'Indirect Disruption',   modules: 'M1, M5' },
  triton_2017:            { bridge: 'Unauthorized Bridge', bridgeColor: 'var(--red)',   consequence: 'Safety Suppression',    modules: 'M1, M2' },
  german_steel_mill_2014: { bridge: 'Structural Exposure', bridgeColor: 'var(--orange)', consequence: 'Direct Manipulation',  modules: 'M2, M5' },
  stuxnet_2010:           { bridge: 'Air-Gap Bypass',    bridgeColor: 'var(--purple)', consequence: 'Direct Manip. + DoV',   modules: 'M1–M5' },
};

const V1_CASES = [
  { name: 'Ukraine Grid 2015',       bridge: 'Authorized Bridge',    bridgeColor: 'var(--blue)',   consequence: 'Indirect Disruption',   modules: 'M1, M3' },
  { name: 'Ukraine Grid 2016 (Industroyer)', bridge: 'Unauthorized Bridge', bridgeColor: 'var(--red)', consequence: 'Direct Manipulation', modules: 'M1–M3' },
  { name: 'Oldsmar Water 2021',      bridge: 'Authorized Bridge',    bridgeColor: 'var(--blue)',   consequence: 'Direct Manip. attempt', modules: 'M2, M5' },
  { name: 'Maroochy Shire 2000',     bridge: 'Unauthorized Bridge',  bridgeColor: 'var(--red)',    consequence: 'Direct Manipulation',   modules: 'M1, M2' },
  { name: 'EKANS/SNAKE 2020',        bridge: 'Structural Exposure',  bridgeColor: 'var(--orange)', consequence: 'Indirect Disruption',   modules: 'M1, M3' },
  { name: 'JBS Foods 2021',          bridge: 'Authorized Bridge',    bridgeColor: 'var(--blue)',   consequence: 'Indirect Disruption',   modules: 'M1, M5' },
];

function MvpTag() {
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
      letterSpacing: '.5px', textTransform: 'uppercase',
      background: 'var(--mvp-bg)', color: 'var(--mvp-text)', border: '1px solid var(--mvp-border)',
    }}>MVP</span>
  );
}

function Badge({ label, color }) {
  return (
    <span style={{
      display: 'inline-block', fontSize: 10, padding: '2px 8px', borderRadius: 12,
      fontWeight: 600, background: `${color}22`, color: color,
    }}>{label}</span>
  );
}

export default function InstructorHome() {
  const navigate = useNavigate();
  const { data: attacks, loading } = useAttackData(null, 'listAttacks');

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
        Instructor Dashboard
        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
          letterSpacing: '.5px', textTransform: 'uppercase',
          background: 'rgba(0,201,167,.12)', color: 'var(--teal)', border: '1px solid rgba(0,201,167,.3)' }}>
          SCR-INS-01
        </span>
        <MvpTag />
      </div>
      <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 24 }}>
        CyberKG-CPS Attack Analyzer — track what's live and what's coming
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 11, marginBottom: 18 }}>
        {[
          { label: 'Total Nodes',       val: '104', color: 'var(--green)' },
          { label: 'Total Relationships', val: '147', color: 'var(--blue)' },
          { label: 'Attack Scenarios',   val: '4',   color: 'var(--orange)' },
          { label: 'Entity Types',       val: '17',  color: 'var(--purple)' },
        ].map(s => (
          <div key={s.label} style={S.cardSm}>
            <div style={S.title}>{s.label}</div>
            <div style={{ ...S.val, color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
        <div style={S.card}>
          <div style={S.secHead}>MVP Features <MvpTag /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={() => navigate('browse')} style={{
              padding: '10px 16px', borderRadius: 8, border: 'none',
              background: 'var(--teal)', color: '#000', fontWeight: 600, fontSize: 12,
              cursor: 'pointer', textAlign: 'center',
            }}>📄 Attack Browser → Graph Explorer</button>
            <button onClick={() => navigate('lab')} style={{
              padding: '10px 16px', borderRadius: 8,
              background: 'none', border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)', fontWeight: 600, fontSize: 12,
              cursor: 'pointer', textAlign: 'center',
            }}>🔬 Lab Exercise Builder</button>
            <button onClick={() => navigate('assess')} style={{
              padding: '10px 16px', borderRadius: 8,
              background: 'none', border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)', fontWeight: 600, fontSize: 12,
              cursor: 'pointer', textAlign: 'center',
            }}>📝 Assessment Builder</button>
          </div>
        </div>
        <div style={S.card}>
          <div style={S.secHead}>
            V1 Features
            <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
              letterSpacing: '.5px', textTransform: 'uppercase',
              background: 'var(--v1-bg)', color: 'var(--v1-text)', border: '1px solid var(--v1-border)' }}>
              V1
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              ['⚖ Comparative Attack Analysis', 'compare'],
              ['🗺 Module Alignment Map', 'modules'],
            ].map(([lbl, path]) => (
              <button key={lbl} onClick={() => navigate(path)} style={{
                padding: '10px 16px', borderRadius: 8,
                background: 'none', border: '1px solid var(--v1-border)',
                color: 'var(--v1-text)', fontWeight: 600, fontSize: 12,
                cursor: 'pointer', textAlign: 'center',
              }}>{lbl}</button>
            ))}
            <button disabled style={{
              padding: '10px 16px', borderRadius: 8,
              background: 'none', border: '1px solid var(--v2-border)',
              color: 'var(--v2-text)', fontWeight: 600, fontSize: 12,
              cursor: 'not-allowed', opacity: .6, textAlign: 'center',
            }}>🤖 ModuleGen Pipeline</button>
          </div>
        </div>
      </div>

      {/* Cases table */}
      <div style={S.card}>
        <div style={S.secHead}>
          MVP Coverage — 4 Cases × Table 1 Concepts <MvpTag />
        </div>
        {loading ? (
          <div style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>Loading…</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                {['Attack', 'Bridge Type (Table 1)', 'Consequence Type', 'Key Module', 'Status'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '9px 12px',
                    borderBottom: '1px solid var(--color-border)',
                    color: 'var(--color-text-secondary)', fontWeight: 600,
                    fontSize: 10, textTransform: 'uppercase', letterSpacing: '.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(attacks || []).map(atk => {
                const m = CASE_META[atk.attack_id] || {};
                return (
                  <tr
                    key={atk.attack_id}
                    onClick={() => navigate(`explore/${atk.slug || atk.attack_id}`)}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.querySelectorAll('td').forEach(td => td.style.background = 'rgba(255,255,255,.015)')}
                    onMouseLeave={e => e.currentTarget.querySelectorAll('td').forEach(td => td.style.background = '')}
                  >
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--bg3)', fontWeight: 700 }}>{atk.name}</td>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--bg3)' }}>
                      <Badge label={m.bridge || '—'} color={m.bridgeColor || 'var(--teal)'} />
                    </td>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--bg3)', color: 'var(--color-text-secondary)' }}>{m.consequence || '—'}</td>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--bg3)', color: 'var(--color-text-secondary)' }}>{m.modules || '—'}</td>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--bg3)' }}>
                      <Badge label="✓ Loaded" color="var(--green)" />
                    </td>
                  </tr>
                );
              })}
              {V1_CASES.map(c => (
                <tr key={c.name} style={{ opacity: .5, cursor: 'default' }}>
                  <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--bg3)', fontWeight: 700 }}>{c.name}</td>
                  <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--bg3)' }}>
                    <Badge label={c.bridge} color={c.bridgeColor} />
                  </td>
                  <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--bg3)', color: 'var(--color-text-secondary)' }}>{c.consequence}</td>
                  <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--bg3)', color: 'var(--color-text-secondary)' }}>{c.modules}</td>
                  <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--bg3)' }}>
                    <Badge label="V1 Planned" color="var(--yellow)" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
