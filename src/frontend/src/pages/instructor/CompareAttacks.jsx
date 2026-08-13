import { useState } from 'react';

const ATTACKS = {
  colonial: { name: 'Colonial Pipeline', year: '2021', bridge: 'Authorized Bridge (VPN)', bridgeLabel: 'Authorized', bridgeColor: 'var(--blue)', bridgeMech: 'VPN without MFA', consequence: 'Indirect Disruption', target: 'IT billing/ops systems', purdue: 'L4 → IT only', aiRole: 'Extended scenario only', humanRole: 'Decision-Maker (ops shutdown)', soph: 'Criminal group (DarkSide)', ttpCount: '3' },
  triton:   { name: 'TRITON / TRISIS', year: '2017', bridge: 'Unauthorized Bridge', bridgeLabel: 'Unauthorized', bridgeColor: 'var(--red)', bridgeMech: 'Dual-homed engineering workstation', consequence: 'Safety Suppression', target: 'Schneider Triconex SIS (L1)', purdue: 'L4 → L1', aiRole: 'Extended scenario only', humanRole: 'Defender (engineer detected)', soph: 'Nation-state', ttpCount: '4' },
  steel:    { name: 'German Steel Mill', year: '2014', bridge: 'Structural Exposure', bridgeLabel: 'Structural', bridgeColor: 'var(--orange)', bridgeMech: 'Flat network — no IT/OT segmentation', consequence: 'Direct Manipulation', target: 'Blast furnace PLC (L2)', purdue: 'L4 → L2', aiRole: 'Secondary (sensor-based)', humanRole: 'Target (phishing victim)', soph: 'Nation-state', ttpCount: '3' },
  stuxnet:  { name: 'Stuxnet', year: '2010', bridge: 'Air-Gap Bypass', bridgeLabel: 'Air-Gap', bridgeColor: 'var(--purple)', bridgeMech: 'USB drop → Step 7 engineering workstation', consequence: 'Direct Manip. + Denial of View', target: 'Siemens S7-315/417 PLCs (L0/L1)', purdue: 'L4 → L0', aiRole: 'Extended scenario only', humanRole: 'Deceived (DoV defeated oversight)', soph: 'Nation-state', ttpCount: '6' },
};

function Badge({ label, color }) {
  return <span style={{ display: 'inline-block', fontSize: 10, padding: '2px 8px', borderRadius: 12, fontWeight: 600, background: `${color}22`, color }}>{label}</span>;
}

function CompareCol({ atk }) {
  if (!atk) return <div style={{ flex: 1, background: 'var(--bg2)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 16, opacity: .4 }}><div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Select an attack</div></div>;
  return (
    <div style={{ flex: 1, background: 'var(--bg2)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid var(--color-border)', color: atk.bridgeColor }}>{atk.name} ({atk.year})</div>
      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.9 }}>
        <div><span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Bridge:</span> {atk.bridge} — {atk.bridgeMech}</div>
        <div><span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Target:</span> {atk.target}</div>
        <div><span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Consequence:</span> {atk.consequence}</div>
        <div><span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Human Role:</span> {atk.humanRole}</div>
        <div><span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>AI Role:</span> {atk.aiRole}</div>
        <div><span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Sophistication:</span> {atk.soph}</div>
        <div><span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Purdue Depth:</span> {atk.purdue}</div>
        <div><span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>ATT&CK ICS TTP count:</span> {atk.ttpCount}</div>
      </div>
    </div>
  );
}

const MATRIX_ROWS = [
  { dim: 'Year',            ka: a => a.year,                                kb: b => b.year },
  { dim: 'Bridge Type',     ka: a => <Badge label={a.bridgeLabel} color={a.bridgeColor} />, kb: b => <Badge label={b.bridgeLabel} color={b.bridgeColor} /> },
  { dim: 'Bridge Mechanism', ka: a => a.bridgeMech,                         kb: b => b.bridgeMech },
  { dim: 'Consequence Type', ka: a => a.consequence,                        kb: b => b.consequence },
  { dim: 'Target System',    ka: a => a.target,                             kb: b => b.target },
  { dim: 'Purdue Depth',    ka: a => a.purdue,                              kb: b => b.purdue },
  { dim: 'AI Role',         ka: a => a.aiRole,                              kb: b => b.aiRole },
  { dim: 'Human Role',      ka: a => a.humanRole,                           kb: b => b.humanRole },
  { dim: 'Sophistication',  ka: a => a.soph,                                kb: b => b.soph },
  { dim: 'ATT&CK ICS TTPs', ka: a => a.ttpCount,                            kb: b => b.ttpCount },
];

const opts = [
  { value: 'triton',   label: 'TRITON / TRISIS' },
  { value: 'stuxnet',  label: 'Stuxnet' },
  { value: 'colonial', label: 'Colonial Pipeline' },
  { value: 'steel',    label: 'German Steel Mill' },
];

export default function CompareAttacks() {
  const [selA, setSelA] = useState('triton');
  const [selB, setSelB] = useState('stuxnet');
  const atkA = ATTACKS[selA];
  const atkB = ATTACKS[selB];

  const sel = (val, onChange) => (
    <div style={{ flex: 1, minWidth: 160 }}>
      <select value={val} onChange={e => onChange(e.target.value)} style={{ width: '100%' }}>
        {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
        Comparative Attack Analysis
        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
          letterSpacing: '.5px', textTransform: 'uppercase',
          background: 'var(--v1-bg)', color: 'var(--v1-text)', border: '1px solid var(--v1-border)' }}>V1</span>
      </div>
      <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
        Side-by-side comparison of two attack cases — bridge mechanisms, chains, and consequences
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
        <div>
          <label style={{ fontSize: 11, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 5, fontWeight: 600 }}>Attack A</label>
          <select value={selA} onChange={e => setSelA(e.target.value)} style={{ width: '100%' }}>
            {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 5, fontWeight: 600 }}>Attack B</label>
          <select value={selB} onChange={e => setSelB(e.target.value)} style={{ width: '100%' }}>
            {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
        <CompareCol atk={atkA} />
        <CompareCol atk={atkB} />
      </div>

      {/* Comparison Matrix */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 18, marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Comparison Matrix</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              {['Dimension', atkA?.name || 'Attack A', atkB?.name || 'Attack B'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '9px 12px', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '.5px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MATRIX_ROWS.map(({ dim, ka, kb }) => (
              <tr key={dim}>
                <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--bg3)', fontWeight: 600 }}>{dim}</td>
                <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--bg3)', color: 'var(--color-text-secondary)' }}>{atkA ? ka(atkA) : '—'}</td>
                <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--bg3)', color: 'var(--color-text-secondary)' }}>{atkB ? kb(atkB) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Common Patterns */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Common Patterns</div>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
          <strong>Both attacks share:</strong> Nation-state attribution · IT-to-OT lateral movement · Targeting industrial control systems at L1/L2 · Multi-month dwell time · No documented AI involvement (AI scenarios are instructional extensions).<br />
          <span style={{ color: 'var(--yellow)' }}>⚠ Initial access differs:</span> Both use Spearphishing (T1566) or USB (T1091) — the bridge crossing technique determines the physical reach. Stuxnet specifically bypassed an air-gapped network; TRITON entered via internet-facing IT.<br /><br />
          <strong>Key difference:</strong> TRITON targeted the <em>safety system</em> (last line of defense) while Stuxnet targeted the <em>control logic</em> directly. TRITON was stopped by a bug in its own malware and human detection; Stuxnet caused months of undetected damage via manipulation of view.
        </div>
      </div>
    </div>
  );
}
