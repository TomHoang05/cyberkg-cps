import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/* ── Shared Badge ───────────────────────────────────────────────── */
function Badge({ label, color }) {
  return (
    <span style={{
      display: 'inline-block', fontSize: 10, padding: '2px 8px', borderRadius: 12,
      fontWeight: 600, background: `${color}22`, color,
    }}>{label}</span>
  );
}

/* ── Case data ──────────────────────────────────────────────────── */
const MVP_CASES = [
  {
    id: 'colonial', name: 'Colonial Pipeline', meta: '2021 · USA · Ransomware + OT Shutdown',
    bridgeLabel: 'Authorized Bridge', bridgeColor: 'var(--blue)',
    consLabel: 'Indirect Disruption', consColor: 'var(--yellow)',
    icon: '🛢',
    summary: 'DarkSide ransomware compromised IT billing via an authorized VPN credential. Operations mgr proactively shut down 5,500 miles of pipeline — indirect physical consequence driven by human decision, not direct OT compromise.',
    bridgeMech: 'VPN without MFA — authorized access channel abused',
    purdue: 'L4 → IT only (no OT compromise)',
    ttps: 'T1566 Spearphishing · T1486 Data Encrypted · T0828 Loss of Control (indirect)',
  },
  {
    id: 'triton', name: 'TRITON / TRISIS', meta: '2017 · Middle East · SIS Attack',
    bridgeLabel: 'Unauthorized Bridge', bridgeColor: 'var(--red)',
    consLabel: 'Safety Suppression', consColor: 'var(--red)',
    icon: '⚠',
    summary: 'Nation-state actors reached a Schneider Triconex Safety Instrumented System via a dual-homed engineering workstation. TRITON attempted to disable fail-safes; a logic bug triggered an unintended trip — and a plant engineer noticed.',
    bridgeMech: 'Dual-homed engineering workstation — IT and OT simultaneously connected',
    purdue: 'L4 → L1 (SIS)',
    ttps: 'T1566 Spearphishing · T0880 Loss of Safety · TA0107 Impair Process Control',
  },
  {
    id: 'steel', name: 'German Steel Mill', meta: '2014 · Germany · Blast Furnace Damage',
    bridgeLabel: 'Structural Exposure', bridgeColor: 'var(--orange)',
    consLabel: 'Direct Manipulation', consColor: 'var(--orange)',
    icon: '🏭',
    summary: 'Spearphishing gave attackers IT access; flat network with no IT/OT segmentation allowed lateral movement directly to blast furnace PLCs at L2. Physical damage to furnace infrastructure — first public OT "direct manipulation" case.',
    bridgeMech: 'Flat network — no IT/OT segmentation, direct reach from office to L2',
    purdue: 'L4 → L2 (PLC)',
    ttps: 'T1566 Spearphishing · T0831 Manipulation of Control · TA0106 Impact',
  },
  {
    id: 'stuxnet', name: 'Stuxnet', meta: '2010 · Iran · Nuclear Sabotage',
    bridgeLabel: 'Air-Gap Bypass', bridgeColor: 'var(--purple)',
    consLabel: 'Direct Manip. + DoV', consColor: 'var(--purple)',
    icon: '☢',
    summary: 'USB drop exploited 4 Windows zero-days to cross the air gap to Siemens Step 7 engineering workstations. PLC logic was rewritten to spin centrifuges at destructive frequencies while Stuxnet replayed normal SCADA readings — defeating human and AI oversight for months.',
    bridgeMech: 'USB drop → Step 7 engineering workstation (air-gap bypass)',
    purdue: 'L4 → L0 (centrifuge PLCs)',
    ttps: 'T1091 USB · T1543 Rootkit · T1055 Process Injection · T0873 PLC Reprogramming · T0832 Manipulation of View',
  },
];

const V1_CASES = [
  { name: 'Ukraine Grid 2015',   meta: 'BlackEnergy3 · Power outage',       bridge: 'Authorized',   bridgeColor: 'var(--blue)',   cons: 'Indirect',       consColor: 'var(--yellow)' },
  { name: 'Ukraine Grid 2016',   meta: 'Industroyer · Protocol attack',      bridge: 'Unauthorized', bridgeColor: 'var(--red)',    cons: 'Direct',         consColor: 'var(--orange)' },
  { name: 'Oldsmar Water 2021',  meta: 'TeamViewer · NaOH spike',            bridge: 'Authorized',   bridgeColor: 'var(--blue)',   cons: 'Direct (attempt)', consColor: 'var(--orange)' },
  { name: 'Maroochy Shire 2000', meta: 'SCADA hijack · Sewage',              bridge: 'Unauthorized', bridgeColor: 'var(--red)',    cons: 'Direct',         consColor: 'var(--orange)' },
  { name: 'EKANS/SNAKE 2020',    meta: 'ICS-aware ransomware',               bridge: 'Structural',   bridgeColor: 'var(--orange)', cons: 'Indirect',       consColor: 'var(--yellow)' },
  { name: 'JBS Foods 2021',      meta: 'REvil · Food supply chain',          bridge: 'Authorized',   bridgeColor: 'var(--blue)',   cons: 'Indirect',       consColor: 'var(--yellow)' },
];

/* ── Tab: Case Explorer ─────────────────────────────────────────── */
function CaseExplorerTab({ navigate }) {
  const [selected, setSelected] = useState(null);
  const c = MVP_CASES.find(x => x.id === selected);

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', marginBottom: 8 }}>✓ MVP — 4 cases loaded</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginBottom: 16 }}>
        {MVP_CASES.map(m => (
          <div
            key={m.id}
            onClick={() => setSelected(selected === m.id ? null : m.id)}
            style={{
              background: selected === m.id ? 'rgba(0,201,167,.06)' : 'var(--bg2)',
              border: `1px solid ${selected === m.id ? 'var(--teal)' : 'var(--color-border)'}`,
              borderRadius: 11, padding: 14, cursor: 'pointer', transition: '.2s',
            }}
          >
            <div style={{ fontSize: 18, marginBottom: 4 }}>{m.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{m.name}</div>
            <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginBottom: 8 }}>{m.meta}</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              <Badge label={m.bridgeLabel} color={m.bridgeColor} />
              <Badge label={m.consLabel} color={m.consColor} />
            </div>
          </div>
        ))}
      </div>

      {/* Case detail panel */}
      {c && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--teal)', borderRadius: 12, padding: 18, marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, color: c.bridgeColor }}>{c.icon} {c.name}</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.8, marginBottom: 12 }}>{c.summary}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12, marginBottom: 14 }}>
            <div><span style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>Bridge: </span>{c.bridgeMech}</div>
            <div><span style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>Purdue Depth: </span>{c.purdue}</div>
            <div style={{ gridColumn: '1/-1' }}><span style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>ATT&CK ICS TTPs: </span>{c.ttps}</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => navigate(`graph/${c.id === 'steel' ? 'german_steel_mill_2014' : c.id === 'colonial' ? 'colonial_pipeline_2021' : c.id === 'triton' ? 'triton_2017' : 'stuxnet_2010'}`)}
              style={{ padding: '9px 16px', borderRadius: 8, border: 'none', background: 'var(--teal)', color: '#000', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
            >🔗 Open Attack Graph View →</button>
            <button
              onClick={() => setSelected(null)}
              style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'none', color: 'var(--color-text-primary)', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}
            >✕ Close</button>
          </div>
        </div>
      )}

      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--v1-text)', marginBottom: 8 }}>🔒 V1 — 6 additional cases (Phase 2)</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {V1_CASES.map(v => (
          <div key={v.name} style={{
            position: 'relative', opacity: .7, pointerEvents: 'none',
            background: 'var(--bg2)', border: '1px solid var(--v1-border)', borderRadius: 11, padding: 14,
          }}>
            <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: 'var(--v1-bg)', color: 'var(--v1-text)', border: '1px solid var(--v1-border)' }}>V1</div>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2, paddingRight: 30 }}>{v.name}</div>
            <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginBottom: 7 }}>{v.meta}</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              <Badge label={v.bridge} color={v.bridgeColor} />
              <Badge label={v.cons} color={v.consColor} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Chain data ─────────────────────────────────────────────────── */
const CHAINS = {
  stuxnet: {
    name: 'Stuxnet — Full Cross-Plane Chain',
    steps: [
      { n: '1', dot: 'cyber',    title: 'Initial Access — USB Drop (T1091) + 4× Zero-days', desc: 'USB with Stuxnet dropped at contractors. MS10-046, MS10-061, MS10-073, MS10-092 exploited.', tags: [['Cyber','var(--blue)'],['L4','var(--teal)'],['0-day ×4','var(--red)']] },
      { n: '2', dot: 'cyber',    title: 'Persistence — Windows rootkit (T1543)', desc: 'Rootkit drivers mrxnet.sys/mrxcls.sys installed via stolen Realtek/JMicron certificates. Achieves persistence via registry.', tags: [['Cyber','var(--blue)'],['L3–L4','var(--teal)']] },
      { n: '3', dot: 'cyber',    title: 'Process Injection — Step 7 DLL (T1055)', desc: 'Stuxnet injects into s7otbxdx.dll; intercepts PLC commands transparently.', tags: [['Cyber','var(--blue)'],['L3','var(--teal)']] },
      { n: '🌉', dot: 'bridge',  title: 'Bridge: Air-Gap Bypass → Siemens Step 7 WS (T0847)', desc: 'USB crossed the air gap to engineering workstation with Step 7 — canonical air-gap bypass.', tags: [['BRIDGE','var(--teal)'],['T0847','var(--purple)'],['L3→L2','var(--teal)']] },
      { n: '4', dot: 'physical', title: 'PLC Reprogramming — centrifuge frequency attack (T0873)', desc: 'S7-315/417 PLCs targeted. Ladder logic modified to spin centrifuges at destructive speeds.', tags: [['Physical','var(--yellow)'],['L0/L1','var(--teal)'],['Direct Manipulation','var(--orange)']] },
      { n: '5', dot: 'physical', title: 'Manipulation of Control — centrifuge overspeed (T0831)', desc: '~1,000 IR-1 centrifuges commanded beyond design limits and physically destroyed.', tags: [['Physical','var(--yellow)'],['L0','var(--teal)'],['Direct Manipulation','var(--orange)']] },
      { n: '6', dot: 'physical', title: 'Manipulation of View — replay normal data to HMI (T0832)', desc: 'Stuxnet fed recorded "normal" readings to SCADA HMI. Operators saw nothing for months.', tags: [['Physical','var(--yellow)'],['Denial of View','var(--purple)']] },
      { n: '6', dot: 'human',    title: 'Human Impact — operators deceived for months', desc: 'Iranian engineers saw unexplained failures but HMI showed normal. Human oversight defeated by DoV.', tags: [['Human','var(--purple)'],['Deceived — Months Undetected','var(--red)']] },
    ],
    planes: [
      { label: 'CYBER',    color: 'var(--blue)',   items: '4× Windows zero-days\nUSB propagation\nRootkit concealment\nStep 7 DLL inject' },
      { label: 'PHYSICAL', color: 'var(--yellow)', items: 'IR-1/IR-2 centrifuges\nFreq. converter attack\nPLC logic rewrite\n~1,000 units damaged' },
      { label: 'AI',       color: 'var(--teal)',   items: 'No AI in original\n—\nExtended: AI anomaly detector fed spoofed sensor data → also deceived' },
      { label: 'HUMAN',    color: 'var(--purple)', items: 'Operators deceived\nIAEA saw nothing\nMonths undetected\nDoV defeated oversight' },
    ],
  },
  triton: {
    name: 'TRITON — Full Cross-Plane Chain',
    steps: [
      { n: '1', dot: 'cyber',    title: 'Spearphishing → IT foothold (T1566)', desc: 'Petrochem employee phished; enterprise IT compromised.', tags: [['Cyber','var(--blue)'],['L4','var(--teal)']] },
      { n: '2', dot: 'cyber',    title: 'Lateral movement → OT network (T0865)', desc: 'Attackers pivoted from IT DMZ through dual-homed engineering workstation into OT.', tags: [['Cyber','var(--blue)'],['L3','var(--teal)']] },
      { n: '🌉', dot: 'bridge',  title: 'Bridge: Dual-homed Engineering WS', desc: 'Engineering WS had simultaneous IT and OT connectivity — never segregated. Classic unauthorized bridge.', tags: [['BRIDGE','var(--teal)'],['Unauthorized','var(--red)'],['L3→L1','var(--teal)']] },
      { n: '3', dot: 'physical', title: 'TRITON deployed to Triconex SIS (T0880)', desc: 'Malware written to reprogram Schneider Triconex SIS — last line of defense.', tags: [['Physical','var(--yellow)'],['L1 SIS','var(--teal)'],['Safety Suppression','var(--red)']] },
      { n: '4', dot: 'physical', title: 'SIS fail-safe trip triggered', desc: 'Logic bug in TRITON caused SIS to detect intrusion and go to safe state — attack discovered.', tags: [['Physical','var(--yellow)'],['Human Detected','var(--green)']] },
      { n: '4', dot: 'human',    title: 'Plant engineer noticed anomaly', desc: 'Engineer observed SIS fail-safe trip and launched investigation. Attack discovered before physical damage.', tags: [['Human','var(--purple)'],['Defender','var(--green)']] },
    ],
    planes: [
      { label: 'CYBER',    color: 'var(--blue)',   items: 'Spearphishing IT access\nLateral movement via WS\nCustom TRITON framework\nTriconex TSAA protocol' },
      { label: 'PHYSICAL', color: 'var(--yellow)', items: 'Triconex SIS targeted\nL1 safety system\nFail-safe triggered\nProcess trip (unintended)' },
      { label: 'AI',       color: 'var(--teal)',   items: 'No AI in original\n—\nExtended: LLM monitoring → attacker embeds prompt in SIS log → AI reports "no anomalies"' },
      { label: 'HUMAN',    color: 'var(--purple)', items: 'Engineer detected\nTrip noticed\nAttack halted\nHuman saved the day' },
    ],
  },
  colonial: {
    name: 'Colonial Pipeline — Full Cross-Plane Chain',
    steps: [
      { n: '1', dot: 'cyber',    title: 'Credential theft → VPN access (T1078)', desc: 'DarkSide used compromised VPN credential (no MFA) to enter Colonial IT network.', tags: [['Cyber','var(--blue)'],['L4','var(--teal)'],['Authorized Bridge','var(--blue)']] },
      { n: '🌉', dot: 'bridge',  title: 'Bridge: Authorized VPN (no MFA)', desc: 'Legitimate VPN credential obtained via prior breach. MFA not enforced — authorized channel abused.', tags: [['BRIDGE','var(--teal)'],['Authorized','var(--blue)'],['L4 IT only','var(--teal)']] },
      { n: '2', dot: 'cyber',    title: 'Ransomware deployed — IT billing systems (T1486)', desc: 'DarkSide ransomware encrypted ~100GB of billing/business data. OT systems not directly compromised.', tags: [['Cyber','var(--blue)'],['L4','var(--teal)'],['Data Encrypted','var(--red)']] },
      { n: '3', dot: 'human',    title: 'Operations Mgr — proactive OT shutdown', desc: 'Management shut down 5,500-mile pipeline proactively to prevent spread — indirect physical consequence.', tags: [['Human','var(--purple)'],['Decision-Maker','var(--yellow)'],['Indirect Disruption','var(--yellow)']] },
    ],
    planes: [
      { label: 'CYBER',    color: 'var(--blue)',   items: 'Credential theft\nVPN exploit (no MFA)\nRansomware (DarkSide)\nIT billing encrypted' },
      { label: 'PHYSICAL', color: 'var(--yellow)', items: '5,500-mile pipeline\n6-day shutdown\nIndirect — human decision\nNo OT compromise' },
      { label: 'AI',       color: 'var(--teal)',   items: 'No AI in original\n—\nExtended: AI pipeline monitoring' },
      { label: 'HUMAN',    color: 'var(--purple)', items: 'CEO authorized shutdown\nOperators executed\n$4.4M ransom paid\nFuel shortage — 17 states' },
    ],
  },
  steel: {
    name: 'German Steel Mill — Full Cross-Plane Chain',
    steps: [
      { n: '1', dot: 'cyber',    title: 'Spearphishing → office IT foothold (T1566)', desc: 'Office employee targeted; attacker gained access to enterprise IT.', tags: [['Cyber','var(--blue)'],['L4','var(--teal)'],['Target','var(--red)']] },
      { n: '🌉', dot: 'bridge',  title: 'Bridge: Structural Exposure — flat network', desc: 'No IT/OT segmentation. Office network directly reachable from OT floor — no firewall between L3 and L2.', tags: [['BRIDGE','var(--teal)'],['Structural','var(--orange)'],['L4→L2','var(--teal)']] },
      { n: '2', dot: 'physical', title: 'PLC access → blast furnace control (T0831)', desc: 'Attacker reached L2 blast furnace PLCs directly through flat network. Control logic modified.', tags: [['Physical','var(--yellow)'],['L2 PLC','var(--teal)'],['Direct Manipulation','var(--orange)']] },
      { n: '3', dot: 'physical', title: 'Blast furnace physical damage', desc: 'Furnace could not be properly shut down. Massive physical damage to furnace infrastructure.', tags: [['Physical','var(--yellow)'],['Direct Manipulation','var(--orange)'],['High Severity','var(--red)']] },
      { n: '3', dot: 'human',    title: 'Human — phishing target; operators unable to respond', desc: 'Initial human vector (phishing). Plant operators unable to prevent shutdown due to compromised controls.', tags: [['Human','var(--purple)'],['Target','var(--red)']] },
    ],
    planes: [
      { label: 'CYBER',    color: 'var(--blue)',   items: 'Spearphishing\nIT lateral movement\nFlat network traversal\nOT system access' },
      { label: 'PHYSICAL', color: 'var(--yellow)', items: 'Blast furnace L2\nPLC logic compromised\nPhysical damage\nFirst public OT DM case' },
      { label: 'AI',       color: 'var(--teal)',   items: 'Extended: AI quality control\nSensor spoofing scenario\nTemp sensor falsification\nMisclassifies dangerous state' },
      { label: 'HUMAN',    color: 'var(--purple)', items: 'Phishing victim\nOperators unable to respond\nUnknown attribution\nPlant shutdown required' },
    ],
  },
};

const DOT_STYLE = {
  cyber:    { background: 'rgba(59,130,246,.25)',  color: 'var(--blue)' },
  physical: { background: 'rgba(245,158,11,.25)',  color: '#000' },
  human:    { background: 'rgba(139,92,246,.25)',  color: 'var(--purple)' },
  bridge:   { background: 'rgba(0,201,167,.25)',   color: 'var(--teal)' },
};

function ChainStep({ step }) {
  const ds = DOT_STYLE[step.dot] || DOT_STYLE.cyber;
  return (
    <div style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--bg3)' }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 800, ...ds,
      }}>{step.n}</div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 3 }}>{step.title}</div>
        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 5 }}>{step.desc}</div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {step.tags.map(([label, color]) => <Badge key={label} label={label} color={color} />)}
        </div>
      </div>
    </div>
  );
}

function AttackChainTab() {
  const [attack, setAttack] = useState('stuxnet');
  const chain = CHAINS[attack];
  return (
    <div>
      <div style={{ maxWidth: 280, marginBottom: 16 }}>
        <label style={{ fontSize: 11, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 5, fontWeight: 600 }}>Select Attack</label>
        <select value={attack} onChange={e => setAttack(e.target.value)} style={{ width: '100%' }}>
          <option value="stuxnet">Stuxnet</option>
          <option value="triton">TRITON / TRISIS</option>
          <option value="colonial">Colonial Pipeline</option>
          <option value="steel">German Steel Mill</option>
        </select>
      </div>

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 18, marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>{chain.name}</div>
        {chain.steps.map((s, i) => <ChainStep key={i} step={s} />)}
      </div>

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>4-Plane Map — {chain.name.split(' —')[0]}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          {chain.planes.map(p => (
            <div key={p.label} style={{ background: 'var(--bg3)', borderRadius: 10, padding: 12, border: `1px solid ${p.color}44` }}>
              <div style={{ fontWeight: 800, color: p.color, fontSize: 10, marginBottom: 7 }}>{p.label}</div>
              <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{p.items}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Tab: Consequences ──────────────────────────────────────────── */
// Bridge layer data (fix 0.2 — Layer 2 Bridge added per SRS SCR-STU-02 requirement)
const BRIDGE_DATA = [
  { attack: 'Colonial Pipeline', bridge: 'Authorized VPN (T0822)', type: 'Authorized', color: 'var(--blue)',   purdue: 'L4 → L2', desc: 'Legitimate VPN credential obtained via prior breach. No new network path needed — attacker walked through the front door.' },
  { attack: 'TRITON',           bridge: 'Dual-Homed Engineering WS', type: 'Unauthorized', color: 'var(--red)',    purdue: 'L3 → L1', desc: 'Engineering workstation simultaneously connected to IT and OT networks — never designed as a gateway, exploited as one.' },
  { attack: 'German Steel Mill', bridge: 'Flat Network (Structural Exposure)', type: 'Structural', color: 'var(--orange)', purdue: 'L4 → L2', desc: 'No IT/OT segmentation — no DMZ, no firewall between office and production floor. The bridge was the architecture itself.' },
  { attack: 'Stuxnet',          bridge: 'USB Air-Gap Bypass (T0847)', type: 'Air-Gap', color: 'var(--purple)', purdue: 'L4 → L0', desc: 'Infected USB drives carried by contractors crossed the air gap to Step 7 engineering workstations — 4 zero-days exploited.' },
];

function ConsequencesTab() {
  const CONS_CARDS = [
    { label: 'Direct Manipulation', color: 'var(--red)',    desc: 'Attacker directly alters OT control logic or process parameters to cause intended damage.', cases: [['Stuxnet','var(--orange)'],['German Steel Mill','var(--orange)']] },
    { label: 'Indirect Disruption', color: 'var(--yellow)', desc: 'IT compromise → physical disruption via human decisions or supply chain effects. Attacker never touches OT.', cases: [['Colonial Pipeline','var(--yellow)']] },
    { label: 'Safety Suppression',  color: 'var(--red)',    desc: 'Attacker disables Safety Instrumented System — removes last line of defense against catastrophic failure.', cases: [['TRITON','var(--red)']] },
    { label: 'Manipulation / Denial of View', color: 'var(--purple)', desc: 'HMI shows falsified "normal" data while destruction occurs — humans/AI cannot detect or respond.', cases: [['Stuxnet','var(--purple)']] },
  ];
  const COMPARISON = [
    { attack: 'Stuxnet',          cons: 'Direct + DoV', consColor: 'var(--orange)',  impact: '~1,000 centrifuges over months', sev: 'Critical',           sevColor: 'var(--red)',    ttps: 'T0873, T0832' },
    { attack: 'TRITON',           cons: 'Safety Suppression', consColor: 'var(--red)', impact: 'SIS disabled; process trip prevented worse', sev: 'Critical (potential)', sevColor: 'var(--red)', ttps: 'T0880, TA0107' },
    { attack: 'German Steel Mill',cons: 'Direct Manipulation', consColor: 'var(--orange)', impact: 'Blast furnace physical damage', sev: 'High',            sevColor: 'var(--orange)', ttps: 'T0831, TA0106' },
    { attack: 'Colonial Pipeline', cons: 'Indirect Disruption', consColor: 'var(--yellow)', impact: '5,500-mile pipeline 6 days', sev: 'High (national)',   sevColor: 'var(--orange)', ttps: 'T1486, T0828' },
  ];
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 14 }}>
        {CONS_CARDS.map(c => (
          <div key={c.label} style={{ background: `${c.color}08`, border: `1px solid ${c.color}44`, borderRadius: 11, padding: 14 }}>
            <div style={{ fontWeight: 800, color: c.color, marginBottom: 5 }}>{c.label}</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 8 }}>{c.desc}</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {c.cases.map(([name, color]) => <Badge key={name} label={name} color={color} />)}
            </div>
          </div>
        ))}
      </div>

      {/* Layer 2 Bridge — per SRS SCR-STU-02 "Layer 2 Bridge: bridge mechanism nodes" (fix 0.2) */}
      <div style={{ background: 'var(--bg2)', border: '1px solid rgba(0,201,167,.3)', borderRadius: 12, padding: 18, marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: 'var(--teal)' }}>
          Layer 2 Bridge — IT→OT Crossing Mechanism
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
          Every case has a distinct bridge type that explains HOW the attacker crossed from IT to OT. Understanding the bridge is the key to understanding the consequence.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
          {BRIDGE_DATA.map(b => (
            <div key={b.attack} style={{
              background: 'var(--bg3)', borderRadius: 10, padding: 12,
              borderLeft: `3px solid ${b.color}`,
            }}>
              <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 3 }}>{b.attack}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: b.color, marginBottom: 2 }}>{b.bridge}</div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <Badge label={b.type} color={b.color} />
                <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', alignSelf: 'center' }}>{b.purdue}</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{b.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Comparison — All 4 MVP Cases</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              {['Attack', 'Primary Consequence', 'Physical Impact', 'Severity', 'MITRE ICS TTP'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '9px 12px', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '.5px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARISON.map(r => (
              <tr key={r.attack}>
                <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--bg3)', fontWeight: 700 }}>{r.attack}</td>
                <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--bg3)' }}><Badge label={r.cons} color={r.consColor} /></td>
                <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--bg3)', color: 'var(--color-text-secondary)', fontSize: 11 }}>{r.impact}</td>
                <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--bg3)' }}><Badge label={r.sev} color={r.sevColor} /></td>
                <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--bg3)', color: 'var(--color-text-secondary)' }}>{r.ttps}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Tab: AI & Human Plane ──────────────────────────────────────── */
function AIHumanTab() {
  const [sub, setSub] = useState('ai-surfaces');
  const SUBS = [
    { key: 'ai-surfaces', label: 'AI Attack Surfaces' },
    { key: 'ai-resilience', label: 'AI Resilience' },
    { key: 'human-roles', label: 'Human Roles' },
    { key: 'atlas', label: 'MITRE ATLAS' },
  ];
  return (
    <div>
      <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--color-border)', marginBottom: 16, flexWrap: 'wrap' }}>
        {SUBS.map(s => (
          <button key={s.key} onClick={() => setSub(s.key)} style={{
            background: 'none', border: 'none',
            color: sub === s.key ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            fontWeight: sub === s.key ? 600 : 400,
            borderBottom: `2px solid ${sub === s.key ? 'var(--teal)' : 'transparent'}`,
            padding: '8px 12px', fontSize: 12, cursor: 'pointer', marginBottom: -1, whiteSpace: 'nowrap',
          }}>{s.label}</button>
        ))}
      </div>

      {sub === 'ai-surfaces' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--color-border)', borderRadius: 11, padding: 16 }}>
            <div style={{ fontWeight: 700, color: 'var(--purple)', marginBottom: 7 }}>Indirect Prompt Injection</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 8 }}>Attacker embeds malicious instructions in data processed by an AI assistant (SCADA log summary, threat report). AI executes attacker instructions without awareness.</div>
            <Badge label="MITRE ATLAS AML.T0052" color="var(--purple)" />
            <div style={{ marginTop: 8, fontSize: 10, color: 'var(--color-text-secondary)', padding: 7, background: 'var(--bg3)', borderRadius: 6 }}>Scenario: TRITON + LLM monitoring → attacker embeds prompt in SIS error log → AI reports "no anomalies."</div>
          </div>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--color-border)', borderRadius: 11, padding: 16 }}>
            <div style={{ fontWeight: 700, color: 'var(--purple)', marginBottom: 7 }}>Physical Perturbation</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 8 }}>Attacker manipulates physical sensors (temp, pressure, vibration) to deceive AI quality/anomaly detection into reporting false normal states.</div>
            <Badge label="Sensor Spoofing" color="var(--orange)" />
            <div style={{ marginTop: 8, fontSize: 10, color: 'var(--color-text-secondary)', padding: 7, background: 'var(--bg3)', borderRadius: 6 }}>Scenario: German Steel Mill + AI quality control → temperature sensors spoofed → AI misclassifies dangerous overheating as normal.</div>
          </div>
        </div>
      )}

      {sub === 'ai-resilience' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 12 }}>
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--color-border)', borderRadius: 11, padding: 16 }}>
              <div style={{ fontWeight: 700, color: 'var(--yellow)', marginBottom: 7 }}>Domain Transfer / Distribution Shift</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 8 }}>AI trained on normal ops fails when deployed in shifted but legitimate conditions — new equipment, seasonal variation, shift pattern change. No adversary needed.</div>
              <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', padding: 7, background: 'var(--bg3)', borderRadius: 6 }}>Model trained on daytime ops deployed 24/7 → night-shift anomalies cause false positives → operators stop trusting alerts → attack undetected.</div>
            </div>
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--color-border)', borderRadius: 11, padding: 16 }}>
              <div style={{ fontWeight: 700, color: 'var(--red)', marginBottom: 7 }}>Error Propagation / Cascading Failure</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 8 }}>AI perception errors in CPS feedback loop: sensor → model → controller → actuator. Small error amplified into large physical consequence. No adversary needed.</div>
              <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', padding: 7, background: 'var(--bg3)', borderRadius: 6 }}>2% sensor error → 8% model deviation → 15% actuator overcorrection → process runaway.</div>
            </div>
          </div>
          <div style={{ background: 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.25)', borderRadius: 10, padding: 12, fontSize: 11 }}>
            <div style={{ fontWeight: 700, color: 'var(--yellow)', marginBottom: 4 }}>⚠ Key Distinction</div>
            <div style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
              <strong>AI Attack Surface</strong> = adversarial (someone exploits AI intentionally)<br />
              <strong>AI Resilience Failure</strong> = non-adversarial (AI fails under legitimate but shifted conditions)<br />
              Both are safety-critical in CPS. Resilience failures are often misclassified as bugs.
            </div>
          </div>
        </div>
      )}

      {sub === 'human-roles' && (
        <>
          {/* Actor Role Summary — per SRS SCR-STU-02: columns AI_Attack_Surface + decision_points (fix 0.1) */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 18, marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Actor Role Summary</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  {['Attack', 'Human Role', 'Action', 'Outcome', 'Type', 'AI Attack Surface', 'Decision Points'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '9px 12px', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '.5px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    atk: 'Colonial', role: 'Operations Mgr', action: 'Proactive OT shutdown',
                    outcome: '6-day outage — human caused physical consequence', type: 'Decision-Maker', typeColor: 'var(--yellow)',
                    aiSurface: 'AIS-EP (Error Propagation)', aiSurfaceColor: 'var(--yellow)',
                    decisionPts: 'Shutdown decision under uncertainty (no OT compromise confirmed)',
                  },
                  {
                    atk: 'TRITON', role: 'Plant Engineer', action: 'Noticed SIS fail-safe trip',
                    outcome: 'Attack discovered — human saved the day', type: 'Defender', typeColor: 'var(--green)',
                    aiSurface: 'AIS-PI (Prompt Injection)', aiSurfaceColor: 'var(--purple)',
                    decisionPts: '—',
                  },
                  {
                    atk: 'German Steel', role: 'Office Employee', action: 'Opened phishing email',
                    outcome: 'Initial access achieved', type: 'Target', typeColor: 'var(--red)',
                    aiSurface: 'AIS-PP (Physical Perturbation)', aiSurfaceColor: 'var(--orange)',
                    decisionPts: '—',
                  },
                  {
                    atk: 'Stuxnet', role: 'Field Engineers', action: 'Observed but could not diagnose',
                    outcome: 'Months undetected — DoV defeated oversight', type: 'Deceived', typeColor: 'var(--purple)',
                    aiSurface: 'AIS-PP + AIS-DT (Sensor Replay + Distribution Shift)', aiSurfaceColor: 'var(--purple)',
                    decisionPts: '—',
                  },
                ].map(r => (
                  <tr key={r.atk}>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--bg3)', fontWeight: 700 }}>{r.atk}</td>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--bg3)', color: 'var(--color-text-secondary)' }}>{r.role}</td>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--bg3)', color: 'var(--color-text-secondary)' }}>{r.action}</td>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--bg3)', color: 'var(--color-text-secondary)', fontSize: 11 }}>{r.outcome}</td>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--bg3)' }}><Badge label={r.type} color={r.typeColor} /></td>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--bg3)' }}><Badge label={r.aiSurface} color={r.aiSurfaceColor} /></td>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--bg3)', color: 'var(--color-text-secondary)', fontSize: 10 }}>{r.decisionPts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {sub === 'atlas' && (
        <div style={{ background: 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.25)', borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, color: 'var(--yellow)' }}>MITRE ATLAS — AI Adversarial Techniques <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10, letterSpacing: '.5px', textTransform: 'uppercase', background: 'var(--v1-bg)', color: 'var(--v1-text)', border: '1px solid var(--v1-border)', marginLeft: 6 }}>V1</span></div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 14, lineHeight: 1.7 }}>MITRE ATLAS (Adversarial Threat Landscape for AI Systems) will be linked to the AI Plane nodes in V1, providing standardized adversarial ML technique IDs parallel to ATT&CK for cyber.</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                {['ATLAS ID', 'Technique', 'CyberKG-CPS Mapping', 'Status'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '9px 12px', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { id: 'AML.T0052', name: 'Indirect Prompt Injection',    map: 'AI_Attack_Surface → SCADA LLM assistant', dim: false },
                { id: 'AML.T0043', name: 'Craft Adversarial Data',       map: 'Physical Perturbation → sensor input',     dim: false },
                { id: 'AML.T0015', name: 'Evade ML Model',               map: 'AI anomaly detection evasion',             dim: false },
                { id: 'AML.T0048', name: 'Poisoning Training Data',      map: 'AI resilience → distribution shift',       dim: false },
                { id: 'AML.T0054', name: 'LLM Meta-Prompt Extraction',   map: 'AI component → LLM interface',             dim: true },
              ].map(r => (
                <tr key={r.id} style={{ opacity: r.dim ? .5 : 1 }}>
                  <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--bg3)', fontWeight: 700, color: 'var(--yellow)' }}>{r.id}</td>
                  <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--bg3)' }}>{r.name}</td>
                  <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--bg3)', color: 'var(--color-text-secondary)' }}>{r.map}</td>
                  <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--bg3)' }}>{r.dim ? <Badge label="V1 Planned" color="var(--yellow)" /> : <Badge label="MVP Mapped" color="var(--green)" />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ── Tab: Lab Exercises ─────────────────────────────────────────── */
function LabExercisesTab() {
  const [lab, setLab] = useState('l1');
  const [l1Answers, setL1Answers] = useState({ q1: '', q2: '', q3: '', q4: '' });
  const [l1Result, setL1Result] = useState(null);
  const LABS = [
    { key: 'l1', label: 'Lab 1 — IT-OT' },
    { key: 'l2', label: 'Lab 2 — AI Detection' },
    { key: 'l3', label: 'Lab 3 — Sensor Spoofing' },
    { key: 'l4', label: 'Lab 4 — Operator Sim' },
  ];
  const checkLab1 = () => {
    const correct = l1Answers.q1 === 'Unauthorized Bridge (dual-homed workstation)' && l1Answers.q4 === 'Safety Suppression';
    setL1Result(correct ? '✅ Correct! Unauthorized Bridge (dual-homed workstation) — L3→L1 — Safety Suppression.' : '⚠ Not quite. Check: Bridge = Unauthorized (dual-homed WS), Consequence = Safety Suppression.');
  };
  return (
    <div>
      <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--color-border)', marginBottom: 16, flexWrap: 'wrap' }}>
        {LABS.map(l => (
          <button key={l.key} onClick={() => setLab(l.key)} style={{
            background: 'none', border: 'none',
            color: lab === l.key ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            fontWeight: lab === l.key ? 600 : 400,
            borderBottom: `2px solid ${lab === l.key ? 'var(--teal)' : 'transparent'}`,
            padding: '8px 12px', fontSize: 12, cursor: 'pointer', marginBottom: -1, whiteSpace: 'nowrap',
          }}>{l.label}</button>
        ))}
      </div>

      {lab === 'l1' && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Lab 1 — TRITON IT-OT Transition</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 14, lineHeight: 1.6 }}><strong>Objective:</strong> Identify the bridge mechanism, Purdue levels, and ATT&CK ICS techniques in TRITON. Classify the consequence type.</div>
          {[
            { key: 'q1', label: 'Q1: Bridge mechanism type?', opts: ['-- Select --', 'Authorized Bridge (VPN)', 'Unauthorized Bridge (dual-homed workstation)', 'Air-Gap Bypass (USB)', 'Structural Exposure'] },
            { key: 'q4', label: 'Q4: Consequence type?', opts: ['-- Select --', 'Direct Manipulation', 'Indirect Disruption', 'Safety Suppression', 'Manipulation / Denial of View'] },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 5 }}>{f.label}</label>
              <select value={l1Answers[f.key]} onChange={e => setL1Answers({ ...l1Answers, [f.key]: e.target.value })} style={{ width: '100%', maxWidth: 340 }}>
                {f.opts.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 5 }}>Q2: Purdue levels crossed?</label>
            <input placeholder="e.g., L3 to L1" value={l1Answers.q2} onChange={e => setL1Answers({ ...l1Answers, q2: e.target.value })} style={{ width: '100%', maxWidth: 340 }} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 5 }}>Q3: ATT&CK ICS technique ID for bridge?</label>
            <input placeholder="e.g., T0XXX" value={l1Answers.q3} onChange={e => setL1Answers({ ...l1Answers, q3: e.target.value })} style={{ width: '100%', maxWidth: 340 }} />
          </div>
          <button onClick={checkLab1} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: 'var(--teal)', color: '#000', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Submit</button>
          {l1Result && <div style={{ marginTop: 12, fontSize: 12, padding: 12, borderRadius: 8, background: 'var(--bg3)', color: l1Result.startsWith('✅') ? 'var(--green)' : 'var(--yellow)' }}>{l1Result}</div>}
        </div>
      )}

      {lab === 'l2' && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Lab 2 — AI for Attack Detection (Stuxnet)</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 14, lineHeight: 1.6 }}><strong>Objective:</strong> Determine what an AI-based IDS monitoring Stuxnet network traffic can and cannot detect.</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 14 }}>
            <thead>
              <tr>{['Attack Step', 'AI Detects?', 'Reason'].map(h => <th key={h} style={{ textAlign: 'left', padding: '9px 12px', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '.5px' }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {[
                { step: 'USB insertion at contractor WS', det: 'NO', detColor: 'var(--red)', reason: 'USB events not visible to network AI' },
                { step: 'Lateral movement via print spooler', det: 'MAYBE', detColor: 'var(--yellow)', reason: 'Unusual but print traffic is common' },
                { step: 'Step 7 DLL injection on engineering WS', det: 'NO', detColor: 'var(--red)', reason: 'Host-level — network AI is blind' },
                { step: 'PLC comms changes (Stuxnet Step 7 blocks)', det: 'YES', detColor: 'var(--green)', reason: 'Anomalous S7 protocol patterns detectable' },
                { step: 'Centrifuge speed manipulation', det: 'NO', detColor: 'var(--red)', reason: 'PLC commands look like valid operations; no OT process context' },
              ].map(r => (
                <tr key={r.step}>
                  <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--bg3)', color: 'var(--color-text-secondary)', fontSize: 11 }}>{r.step}</td>
                  <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--bg3)' }}><Badge label={r.det} color={r.detColor} /></td>
                  <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--bg3)', color: 'var(--color-text-secondary)', fontSize: 11 }}>{r.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 5 }}>Analysis: What is the key limitation of this AI IDS in OT context?</label>
            <textarea rows={3} placeholder="Your analysis..." style={{ width: '100%', resize: 'vertical' }} />
          </div>
          <button style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: 'var(--teal)', color: '#000', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Submit</button>
        </div>
      )}

      {lab === 'l3' && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Lab 3 — Sensor Spoofing → AI → Physical Consequence (Stuxnet)</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 14 }}>Trace how Stuxnet's SCADA replay attack defeats the AI frequency detector and propagates to centrifuge destruction at Natanz.</div>
          {[
            { n: 'S', bg: 'rgba(239,68,68,.2)', color: 'var(--red)', title: 'Sensor: WinCC shows 1,064 Hz nominal (actual: cycling 1,410 Hz → 2 Hz)', desc: 'Stuxnet (T0832 · Manipulation of View) intercepts the WinCC SCADA data stream and replays 21 seconds of pre-recorded normal sensor readings.', tags: [['AIS-PP · Physical Sensor Perturbation','var(--orange)'],['T0832 · Manipulation of View','var(--red)']] },
            { n: 'AI', bg: 'rgba(139,92,246,.2)', color: 'var(--purple)', title: 'AI Frequency Detector (AIC-STX): classifies as NORMAL', desc: 'The hypothetical LSTM-based PLC Frequency Anomaly Detector receives only the replayed 1,064 Hz readings — all within training distribution. Model outputs: NORMAL.', tags: [['Distribution Shift Miss','var(--purple)'],['Replay Attack Bypass','var(--purple)']] },
            { n: 'C', bg: 'rgba(245,158,11,.2)', color: 'var(--yellow)', title: 'WinCC SCADA: all-green. PLC: no corrective command.', desc: 'Operators see nominal readings for months. No corrective PLC command issued. Centrifuges continue at destructive speeds.', tags: [['AIS-EP · Error Propagation','var(--yellow)']] },
            { n: 'P', bg: 'rgba(245,158,11,.2)', color: '#000', title: 'Physical: ~1,000 IR-1 centrifuge rotors stress-fracture', desc: 'Repeated 1,410 Hz → 2 Hz cycling causes mechanical fatigue. ~1,000 centrifuges physically destroyed (T0831 · Manipulation of Control).', tags: [['CON-CENT · Direct Manipulation','var(--orange)'],['T0831 · Manipulation of Control','var(--red)']] },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--bg3)' }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, background: s.bg, color: s.color }}>{s.n}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 3 }}>{s.title}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 5 }}>{s.desc}</div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {s.tags.map(([label, color]) => <Badge key={label} label={label} color={color} />)}
                </div>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 14, marginBottom: 10 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 5 }}>Where would you add a safeguard to break this chain?</label>
            <textarea rows={2} placeholder="Your answer..." style={{ width: '100%', resize: 'vertical' }} />
          </div>
          <button style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: 'var(--teal)', color: '#000', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Submit</button>
        </div>
      )}

      {lab === 'l4' && (
        <div style={{ background: 'rgba(139,92,246,.06)', border: '1px solid var(--v2-border)', borderRadius: 12, padding: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: 'var(--v2-text)' }}>Lab 4 — Operator Decision Simulator <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10, letterSpacing: '.5px', textTransform: 'uppercase', background: 'rgba(139,92,246,.15)', color: 'var(--v2-text)', border: '1px solid var(--v2-border)', marginLeft: 6 }}>V2</span></div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
            In V2, this lab places you in the role of a control room operator during an active attack scenario. You receive real-time SCADA display updates, AI anomaly alerts, and radio calls from field engineers — and must make decisions that affect the physical outcome of the attack.<br /><br />
            This simulates the Human Plane in Module 5: how operator trust in AI, information uncertainty, and time pressure affect response quality.
          </div>
          <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--v2-text)', marginBottom: 6 }}>[V2 Scenario Preview]</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
              It is 2:14 AM. The AI anomaly detector fires an alert: "Unusual centrifuge vibration pattern — confidence: 67%." Your field engineer says nothing looks wrong. The SCADA HMI shows all green. Do you initiate an emergency shutdown?<br /><br />
              <em>This is the exact decision Natanz operators faced during Stuxnet.</em>
            </div>
          </div>
          <button disabled style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid var(--v2-border)', background: 'none', color: 'var(--v2-text)', fontWeight: 700, fontSize: 12, cursor: 'not-allowed', opacity: .6 }}>🔒 Launch Simulator (V2)</button>
        </div>
      )}
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────── */
export default function ScenarioExplorer() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('cases');
  const topRef = useRef(null);

  // When outer tab changes, scroll main back to top so shorter tabs aren't
  // hidden below the fold (scroll position is preserved across tab switches
  // by the overflowY:auto main container in StudentDashboard).
  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
  }, [tab]);

  const TABS = [
    { key: 'cases',      label: 'Case Explorer' },
    { key: 'chain',      label: 'Attack Chain Tracer' },
    { key: 'cons',       label: 'Consequences' },
    { key: 'ai-human',   label: 'AI & Human Plane' },
    { key: 'labs',       label: 'Lab Exercises', extra: true },
  ];

  return (
    <div ref={topRef}>
      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
        Scenario Explorer
        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
          letterSpacing: '.5px', textTransform: 'uppercase',
          background: 'rgba(0,201,167,.12)', color: 'var(--teal)', border: '1px solid rgba(0,201,167,.3)' }}>
          SCR-STU-02
        </span>
      </div>
      <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 20 }}>
        Guided view — explore cases, trace the attack chain, review consequences, and AI & Human plane roles
      </div>

      <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--color-border)', marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            background: 'none', border: 'none',
            color: tab === t.key ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            fontWeight: tab === t.key ? 600 : 400,
            borderBottom: `2px solid ${tab === t.key ? 'var(--teal)' : 'transparent'}`,
            padding: '9px 14px', fontSize: 12, cursor: 'pointer', marginBottom: -1, whiteSpace: 'nowrap', transition: '.15s',
          }}>
            {t.label}
            {t.extra && (
              <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 8, marginLeft: 6,
                background: 'rgba(100,100,100,.15)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
                Extra
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'cases'    && <CaseExplorerTab navigate={navigate} />}
      {tab === 'chain'    && <AttackChainTab />}
      {tab === 'cons'     && <ConsequencesTab />}
      {tab === 'ai-human' && <AIHumanTab />}
      {tab === 'labs'     && <LabExercisesTab />}
    </div>
  );
}
