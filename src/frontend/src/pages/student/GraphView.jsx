import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAttackData } from '../../hooks/useAttackData';
import AttackSurface from '../../components/viz/AttackSurface';
import { toSurfaceGraph } from '../../utils/graphTransform';

/* ── Static chain data per attack ───────────────────────────────── */
const DOT = {
  cyber:    { bg: 'rgba(59,130,246,.25)',  color: 'var(--blue)' },
  bridge:   { bg: 'rgba(239,68,68,.25)',   color: 'var(--red)' },
  physical: { bg: 'rgba(245,158,11,.25)',  color: '#000' },
  human:    { bg: 'rgba(139,92,246,.25)',  color: 'var(--purple)' },
};

const ATTACK_CHAINS = {
  stuxnet_2010: {
    label: 'Stuxnet (2010)',
    steps: [
      { n:'1', plane:'cyber',    label:'Initial Access — USB Drop', sub:'T1091 · 4× Windows zero-days at contractor sites' },
      { n:'2', plane:'cyber',    label:'Persistence — Windows Rootkit', sub:'T1543 · Stolen Realtek/JMicron certificates' },
      { n:'3', plane:'cyber',    label:'Process Injection — Step 7 DLL', sub:'T1055 · s7otbxdx.dll hijack; stealth layer' },
      { n:'🌉', plane:'bridge',  label:'Bridge: Air-Gap Bypass', sub:'USB → Siemens Step 7 engineering WS (T0847) · L3→L2' },
      { n:'4', plane:'physical', label:'PLC Reprogramming', sub:'T0873 · S7-315/417 ladder logic modified — centrifuge overspeed' },
      { n:'5', plane:'physical', label:'Manipulation of Control', sub:'T0831 · ~1,000 IR-1 centrifuges destroyed over months' },
      { n:'6', plane:'physical', label:'Manipulation of View', sub:'T0832 · Stuxnet replays normal SCADA data to HMI' },
      { n:'H', plane:'human',    label:'Human Impact — Operators Deceived', sub:'DoV defeated oversight · months undetected' },
    ],
    table: [
      { step: 1, plane: 'Cyber',    ttp: 'T1091, T1543, T1055', node: 'ITS-*, CVE-*', impact: 'Windows compromise + rootkit concealment' },
      { step: 2, plane: 'Bridge',   ttp: 'T0847',               node: 'BRG-USB',       impact: 'Air-gap crossed via USB drop' },
      { step: 3, plane: 'Physical', ttp: 'T0873',               node: 'OTS-PLC (S7)',  impact: 'PLC ladder logic replaced — centrifuge attack' },
      { step: 4, plane: 'Physical', ttp: 'T0831, T0832',        node: 'PHY-CENT, CON-VIEW', impact: '~1,000 centrifuges + denial of operator view' },
      { step: 5, plane: 'Human',    ttp: '—',                   node: 'HUM-NAT',       impact: 'Operators deceived for months — DoV defeated oversight' },
    ],
  },
  triton_2017: {
    label: 'TRITON / TRISIS (2017)',
    steps: [
      { n:'1', plane:'cyber',    label:'Spearphishing → IT foothold', sub:'T1566 · Petrochem employee phished at L4' },
      { n:'2', plane:'cyber',    label:'Lateral movement to OT', sub:'T0865 · Pivoted through IT DMZ' },
      { n:'🌉', plane:'bridge',  label:'Bridge: Dual-homed Engineering WS', sub:'Unauthorized bridge · IT+OT simultaneously · L3→L1' },
      { n:'3', plane:'physical', label:'TRITON deployed to Triconex SIS', sub:'T0880 · Reprogram Schneider SIS fail-safes' },
      { n:'4', plane:'physical', label:'SIS fail-safe trip triggered', sub:'Logic bug in TRITON caused unintended safe-state trip' },
      { n:'H', plane:'human',    label:'Plant engineer detected attack', sub:'Noticed SIS trip · launched investigation · attack halted' },
    ],
    table: [
      { step: 1, plane: 'Cyber',    ttp: 'T1566',  node: 'ITS-*',     impact: 'IT foothold via spearphishing' },
      { step: 2, plane: 'Bridge',   ttp: 'T0865',  node: 'BRG-EWS',   impact: 'Unauthorized dual-homed workstation' },
      { step: 3, plane: 'Physical', ttp: 'T0880',  node: 'OTS-SIS',   impact: 'TRITON deployed to Triconex — safety suppression' },
      { step: 4, plane: 'Human',    ttp: '—',      node: 'HUM-ENG',   impact: 'Engineer detected SIS trip — attack discovered before damage' },
    ],
  },
  colonial_pipeline_2021: {
    label: 'Colonial Pipeline (2021)',
    steps: [
      { n:'🌉', plane:'bridge',  label:'Bridge: Authorized VPN (no MFA)', sub:'T1078 · Compromised credential · authorized channel abused' },
      { n:'1', plane:'cyber',    label:'DarkSide ransomware deployed', sub:'T1486 · ~100GB billing/business data encrypted (IT only)' },
      { n:'H', plane:'human',    label:'Ops Manager — proactive OT shutdown', sub:'Human decision caused indirect physical consequence (6 days)' },
    ],
    table: [
      { step: 1, plane: 'Bridge', ttp: 'T1078',  node: 'BRG-VPN',   impact: 'Authorized VPN without MFA — credential abused' },
      { step: 2, plane: 'Cyber',  ttp: 'T1486',  node: 'ITS-BILL',  impact: 'DarkSide ransomware — IT billing encrypted' },
      { step: 3, plane: 'Human',  ttp: '—',      node: 'HUM-OPS',   impact: 'OT shutdown decision → 5,500-mile pipeline 6-day outage' },
    ],
  },
  german_steel_mill_2014: {
    label: 'German Steel Mill (2014)',
    steps: [
      { n:'1', plane:'cyber',    label:'Spearphishing → office IT', sub:'T1566 · Office employee phished · L4 IT access' },
      { n:'🌉', plane:'bridge',  label:'Bridge: Structural Exposure', sub:'Flat network — no IT/OT segmentation · L4→L2 direct' },
      { n:'2', plane:'physical', label:'Blast furnace PLC access', sub:'T0831 · L2 PLC reachable directly from flat IT network' },
      { n:'3', plane:'physical', label:'Physical damage to blast furnace', sub:'Control system compromised · furnace could not shut down properly' },
      { n:'H', plane:'human',    label:'Human — phishing target', sub:'Initial vector; operators unable to prevent via compromised controls' },
    ],
    table: [
      { step: 1, plane: 'Cyber',    ttp: 'T1566',        node: 'ITS-OFF',   impact: 'Spearphishing into flat office network' },
      { step: 2, plane: 'Bridge',   ttp: 'Structural',   node: 'BRG-FLAT',  impact: 'No IT/OT segmentation — structural exposure' },
      { step: 3, plane: 'Physical', ttp: 'T0831, TA0106',node: 'OTS-PLC (L2), PHY-FURN', impact: 'Direct PLC manipulation → blast furnace physical damage' },
      { step: 4, plane: 'Human',    ttp: '—',            node: 'HUM-EMP',   impact: 'Phishing target; operators unable to intervene' },
    ],
  },
};

const PLANE_COLOR = {
  Cyber:    'var(--blue)',
  Bridge:   'var(--red)',
  Physical: 'var(--yellow)',
  Human:    'var(--purple)',
  AI:       'var(--teal)',
};

function Badge({ label, color }) {
  return (
    <span style={{ display: 'inline-block', fontSize: 10, padding: '2px 8px', borderRadius: 12, fontWeight: 600, background: `${color}22`, color }}>
      {label}
    </span>
  );
}

export default function GraphView() {
  const { attackId } = useParams();
  const navigate = useNavigate();
  const { data, loading, error } = useAttackData(attackId, 'surface');

  const vizData = useMemo(() => {
    if (!data) return null;
    const raw = data?.data ?? data;
    return toSurfaceGraph(raw);
  }, [data]);

  const chain = ATTACK_CHAINS[attackId] || ATTACK_CHAINS.stuxnet_2010;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}
        >← Back</button>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            {chain.label}
            <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10, letterSpacing: '.5px', textTransform: 'uppercase', background: 'rgba(0,201,167,.12)', color: 'var(--teal)', border: '1px solid rgba(0,201,167,.3)' }}>SCR-STU-03</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Read-only attack graph view — pan/zoom/click nodes for details</div>
        </div>
      </div>

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 16 }}>
        {/* Top row: KG Graph (left) + Chain Timeline (right) */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 16 }}>

          {/* LEFT: Live D3 KG Graph */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--teal)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.5px' }}>Knowledge Graph</div>
            <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: 10, minHeight: 280 }}>
              {loading && <p style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>Loading graph…</p>}
              {error   && <p style={{ color: 'var(--red)', fontSize: 12 }}>{error}</p>}
              {!loading && !error && vizData && (
                <>
                  <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                    Drag nodes · Scroll to zoom · Click node for details
                  </div>
                  <AttackSurface data={vizData} />
                </>
              )}
            </div>
          </div>

          {/* RIGHT: Attack chain timeline */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--teal)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.5px' }}>Attack Chain Timeline</div>
            <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: 12, minHeight: 280 }}>
              {chain.steps.map((s, i) => {
                const ds = DOT[s.plane] || DOT.cyber;
                return (
                  <div key={i} style={{ display: 'flex', gap: 10, paddingBottom: 10, marginBottom: 10, borderBottom: i < chain.steps.length - 1 ? '1px solid rgba(255,255,255,.06)' : 'none' }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, background: ds.bg, color: ds.color }}>{s.n}</div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 1 }}>{s.label}</div>
                      <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{s.sub}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom: Step-by-step interpretation table */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--teal)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.5px' }}>📋 Step-by-Step Interpretation</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  {['Step', 'Plane', 'ATT&CK ICS TTP', 'KG Node(s)', 'Impact'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chain.table.map((r, i) => (
                  <tr key={i}>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--bg3)', fontWeight: 700, color: 'var(--teal)' }}>{r.step}</td>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--bg3)' }}>
                      <Badge label={r.plane} color={PLANE_COLOR[r.plane] || 'var(--teal)'} />
                    </td>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--bg3)', color: 'var(--color-text-secondary)', fontFamily: 'monospace', fontSize: 11 }}>{r.ttp}</td>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--bg3)', color: 'var(--color-text-secondary)', fontFamily: 'monospace', fontSize: 11 }}>{r.node}</td>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--bg3)', color: 'var(--color-text-secondary)', fontSize: 11 }}>{r.impact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
