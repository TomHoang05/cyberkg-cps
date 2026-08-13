import { useNavigate } from 'react-router-dom';

const S = {
  card:    { background: 'var(--bg2)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 18 },
  cardSm:  { background: 'var(--bg2)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 14 },
  secHead: { fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  title:   { fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 6 },
  val:     { fontSize: 28, fontWeight: 800 },
};

function BarRow({ label, pct, color, count }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
      <div style={{ width: 130, fontSize: 10, color: 'var(--color-text-secondary)', flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, background: 'var(--bg3)', borderRadius: 4, height: 18, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, background: color, height: '100%', borderRadius: 4, display: 'flex', alignItems: 'center', paddingLeft: 4, fontSize: 9, fontWeight: 700, color: pct < 30 ? 'transparent' : 'rgba(255,255,255,.8)', minWidth: count ? 24 : 0, transition: 'width .4s' }}>{count}</div>
      </div>
      <div style={{ width: 20, fontSize: 10, color: 'var(--color-text-secondary)', textAlign: 'right' }}>{count}</div>
    </div>
  );
}

const ENTITY_TYPES = [
  { type: 'Attack',               plane: 'Cross',          planeColor: 'var(--color-text-secondary)', count: 4 },
  { type: 'ATT_CK_Technique',     plane: 'Cyber',          planeColor: 'var(--blue)',    count: 15 },
  { type: 'Vulnerability',        plane: 'Cyber',          planeColor: 'var(--blue)',    count: 6 },
  { type: 'Weakness',             plane: 'Cyber',          planeColor: 'var(--blue)',    count: 6 },
  { type: 'Attack_Pattern',       plane: 'Cyber',          planeColor: 'var(--blue)',    count: 6 },
  { type: 'IT_System',            plane: 'Cyber',          planeColor: 'var(--blue)',    count: 10 },
  { type: 'OT_System',            plane: 'Physical',       planeColor: 'var(--yellow)',  count: 8 },
  { type: 'Network_Zone',         plane: 'Cyber',          planeColor: 'var(--blue)',    count: 6 },
  { type: 'Physical_Process',     plane: 'Physical',       planeColor: 'var(--yellow)',  count: 6 },
  { type: 'Consequence',          plane: 'Physical',       planeColor: 'var(--yellow)',  count: 8 },
  { type: 'AI_Component',         plane: 'AI',             planeColor: 'var(--teal)',    count: 4 },
  { type: 'AI_Attack_Surface',    plane: 'AI',             planeColor: 'var(--teal)',    count: 4 },
  { type: 'Human_Actor',          plane: 'Human',          planeColor: 'var(--purple)',  count: 4 },
  { type: 'Human_Action',         plane: 'Human',          planeColor: 'var(--purple)',  count: 4 },
  { type: 'Instructional_Concept',plane: 'Cross',          planeColor: 'var(--color-text-secondary)', count: 12 },
  { type: 'Bridge_Mechanism',     plane: 'Cyber+Physical', planeColor: 'var(--red)',     count: 4 },
  { type: 'Question',             plane: 'Cross',          planeColor: 'var(--color-text-secondary)', count: 0 },
];

const REL_TYPES = [
  { rel: 'USES_TECHNIQUE',    from: 'Attack→ATT_CK_Technique',       count: 18 },
  { rel: 'TECHNIQUE_ORDER',   from: 'Technique→Technique',            count: 15 },
  { rel: 'EXPLOITS',          from: 'Attack→Vulnerability',           count: 6  },
  { rel: 'ROOT_CAUSE',        from: 'Vulnerability→Weakness',         count: 6  },
  { rel: 'MAPS_TO_PATTERN',   from: 'Weakness→Attack_Pattern',        count: 7  },
  { rel: 'TARGETS',           from: 'Attack→IT/OT_System',            count: 16 },
  { rel: 'LOCATED_IN',        from: 'System→Network_Zone',            count: 16 },
  { rel: 'BRIDGES_TO',        from: 'Bridge_Mechanism→NetZone',       count: 8  },
  { rel: 'AFFECTS_PROCESS',   from: 'OT_System→Phys_Process',         count: 6  },
  { rel: 'CAUSES_CONSEQUENCE',from: 'Attack→Consequence',             count: 5  },
  { rel: 'CONSEQUENCE_TYPE',  from: 'Consequence→Concept',            count: 5  },
  { rel: 'AI_INVOLVED_IN',    from: 'AI_Component→Attack',            count: 3  },
  { rel: 'AI_ATTACK_VIA',     from: 'AI_Atk_Surface→AI_Comp',        count: 4  },
  { rel: 'HUMAN_ROLE',        from: 'Human_Actor→Attack',             count: 4  },
  { rel: 'PERFORMS_ACTION',   from: 'Human_Actor→Human_Action',       count: 4  },
  { rel: 'MAPS_TO_CONCEPT',   from: 'Tech/Bridge→Concept',            count: 22 },
  { rel: 'USES_BRIDGE',       from: 'Attack→Bridge_Mechanism',        count: 4  },
];

const DATASET_STATUS = [
  { name: 'MITRE ATT&CK Enterprise', status: '✓ Loaded',      ok: true },
  { name: 'ATT&CK for ICS',          status: '✓ Loaded',      ok: true },
  { name: 'NVD / CVE',               status: '✓ Loaded',      ok: true },
  { name: 'CWE / CAPEC',             status: '✓ Loaded',      ok: true },
  { name: '4 Attack Case JSON',       status: '✓ Loaded',      ok: true },
  { name: 'MITRE ATLAS',             status: 'Planned',        ok: false },
  { name: '6 V1 Case JSON',          status: 'In curation',    ok: false },
  { name: 'SecureBERT NER',          status: 'Planned',        ok: false },
  { name: 'ICS-CERT Advisories',     status: 'Planned',        ok: false },
];

export default function ResearcherHome() {
  const navigate = useNavigate();

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
        Research Dashboard
        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
          letterSpacing: '.5px', textTransform: 'uppercase',
          background: 'rgba(0,201,167,.12)', color: 'var(--teal)', border: '1px solid rgba(0,201,167,.3)' }}>
          SCR-RES-01
        </span>
      </div>
      <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 20 }}>
        CyberKG-CPS knowledge graph — MVP active · V1 roadmap below
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 11, marginBottom: 18 }}>
        {[
          { label: 'Graph Nodes',         val: '104', color: 'var(--purple)' },
          { label: 'Graph Edges',         val: '149', color: 'var(--blue)' },
          { label: 'ATT&CK Techniques',   val: '18',  color: 'var(--teal)' },
          { label: 'CVE Entries',         val: '6',   color: 'var(--orange)' },
        ].map(s => (
          <div key={s.label} style={S.cardSm}>
            <div style={S.title}>{s.label}</div>
            <div style={{ ...S.val, color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Quick action cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
        <div style={S.card}>
          <div style={S.secHead}>MVP Tools</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={() => navigate('query')} style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: 'var(--teal)', color: '#000', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>💻 KG Query Console (Q1–Q5)</button>
            {[
              ['🔍 Entity Explorer', 'entities'],
              ['🗂 KG Schema Overview (17 types)', 'entities'],
              ['🔗 Relation Analysis (17 types)', 'relations'],
              ['📋 Data Provenance & Export', 'provenance'],
            ].map(([lbl, path]) => (
              <button key={lbl} onClick={() => navigate(path)} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'none', color: 'var(--color-text-primary)', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>{lbl}</button>
            ))}
          </div>
        </div>
        <div style={S.card}>
          <div style={S.secHead}>
            V1 Research Tools
            <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10, letterSpacing: '.5px', textTransform: 'uppercase', background: 'var(--v1-bg)', color: 'var(--v1-text)', border: '1px solid var(--v1-border)' }}>V1</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              ['🎯 ATT&CK Navigator Integration', false],
              ['🤖 LLM Enrichment Pipeline', false],
              ['📥 Semi-auto Case Ingestion', false],
              ['✏ Annotation Workspace', false],
            ].map(([lbl]) => (
              <button key={lbl} disabled style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid var(--v1-border)', background: 'none', color: 'var(--v1-text)', fontWeight: 600, fontSize: 12, cursor: 'not-allowed', opacity: .7 }}>{lbl}</button>
            ))}
            <button disabled style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid var(--v2-border)', background: 'none', color: 'var(--v2-text)', fontWeight: 600, fontSize: 12, cursor: 'not-allowed', opacity: .6 }}>🔬 MITRE ATLAS Integration</button>
          </div>
        </div>
      </div>

      {/* Cross-Case Pattern Statistics */}
      <div style={{ ...S.card, marginBottom: 14 }}>
        <div style={S.secHead}>Cross-Case Pattern Statistics</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>ATT&CK Technique Frequency</div>
            <BarRow label="T1566 Phishing"      pct={50} color="var(--blue)"   count={2} />
            <BarRow label="T0831 Manipulation"  pct={50} color="var(--orange)" count={2} />
            <BarRow label="T0873 PLC Modify"    pct={50} color="var(--orange)" count={2} />
            <BarRow label="T0847 Air-Gap"       pct={25} color="var(--purple)" count={1} />
            <BarRow label="T0880 Safety Manip"  pct={25} color="var(--red)"    count={1} />
            <BarRow label="T1486 Ransomware"    pct={25} color="var(--orange)" count={1} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>Consequence Types (Table 1)</div>
            <BarRow label="Direct Manipulation" pct={50} color="var(--orange)" count={2} />
            <BarRow label="Indirect Disruption" pct={25} color="var(--yellow)" count={1} />
            <BarRow label="Safety Suppression"  pct={25} color="var(--red)"    count={1} />
            <BarRow label="Manipulation of View" pct={25} color="var(--purple)" count={1} />
            <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginTop: 6 }}>Stuxnet covers 2 types (total &gt; 4). V1: 10-case stats.</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>Purdue Level Targeting</div>
            <BarRow label="L4/L5 Enterprise"  pct={100} color="var(--blue)"   count={4} />
            <BarRow label="L3 Site Business"  pct={75}  color="var(--blue)"   count={3} />
            <BarRow label="L2 Supervisory"    pct={75}  color="var(--yellow)" count={3} />
            <BarRow label="L1 Control"        pct={50}  color="var(--orange)" count={2} />
            <BarRow label="L0 Field"          pct={25}  color="var(--red)"    count={1} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>Bridge Distribution (Table 1)</div>
            <BarRow label="Authorized Bridge"   pct={25} color="var(--blue)"   count={1} />
            <BarRow label="Unauthorized Bridge" pct={25} color="var(--red)"    count={1} />
            <BarRow label="Air-Gap Bypass"      pct={25} color="var(--purple)" count={1} />
            <BarRow label="Structural Exposure" pct={25} color="var(--orange)" count={1} />
            <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginTop: 6 }}>MVP covers all 4 Table 1 bridge categories by design.</div>
          </div>
        </div>
      </div>

      {/* Dataset Status */}
      <div style={{ ...S.card, marginBottom: 14 }}>
        <div style={S.secHead}>Dataset Status</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, fontSize: 11 }}>
          {DATASET_STATUS.map(d => (
            <div key={d.name} style={{ padding: 8, background: 'var(--bg3)', borderRadius: 8 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{d.name}</div>
              <div style={{ color: d.ok ? 'var(--green)' : 'var(--v1-text)' }}>{d.status}</div>
            </div>
          ))}
        </div>
      </div>

      {/* KG Health Panel */}
      <div style={S.card}>
        <div style={{ ...S.secHead, justifyContent: 'space-between' }}>
          <span>KG Health Panel</span>
          <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', fontWeight: 400 }}>
            Backend: <span style={{ color: 'var(--green)' }}>✓ Neo4j Online</span> · Last sync: <span style={{ color: 'var(--teal)' }}>2024-06-14 08:31 UTC</span>
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Entity Types table */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>Entity Types (17 / 17 loaded)</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr>
                    {['Entity Type', 'Plane', 'Count'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '.4px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ENTITY_TYPES.map((e, i) => (
                    <tr key={e.type} style={{ background: i === ENTITY_TYPES.length - 1 ? 'var(--bg3)' : '' }}>
                      <td style={{ padding: '5px 8px', borderBottom: '1px solid var(--bg3)', fontFamily: 'monospace', fontSize: 10 }}>{e.type}</td>
                      <td style={{ padding: '5px 8px', borderBottom: '1px solid var(--bg3)' }}>
                        <span style={{ fontSize: 9, fontWeight: 600, color: e.planeColor }}>{e.plane}</span>
                      </td>
                      <td style={{ padding: '5px 8px', borderBottom: '1px solid var(--bg3)', fontWeight: i === ENTITY_TYPES.length - 1 ? 700 : 400, color: e.count === 0 ? 'var(--color-text-secondary)' : 'var(--color-text-primary)' }}>
                        {e.count === 0 ? <span>0 <span style={{ fontSize: 9, color: 'var(--color-text-secondary)' }}>(Sprint 3: 128)</span></span> : e.count}
                        {i === ENTITY_TYPES.length - 1 ? ' (total)' : ''}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ background: 'var(--bg3)', fontWeight: 700 }}>
                    <td style={{ padding: '6px 8px' }}>Total (17 types)</td>
                    <td style={{ padding: '6px 8px' }}></td>
                    <td style={{ padding: '6px 8px' }}>104</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div style={{ fontSize: 9, color: 'var(--color-text-secondary)', marginTop: 4, lineHeight: 1.6 }}>
              Node counts reflect unique Neo4j nodes after MERGE deduplication (Sprint 1–2 baseline). ATT&amp;CK_Technique: 18 USES_TECHNIQUE edges across 4 attacks → 15 unique nodes (T1566.001, T0873, T0831 shared). Sprint 3 adds 128 Question nodes → 232 total.
            </div>
          </div>

          {/* Relationship Types table */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>Relationship Types (17 / 17 loaded)</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr>
                    {['Relationship', 'From → To', 'Count'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '.4px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {REL_TYPES.map((r, i) => (
                    <tr key={r.rel}>
                      <td style={{ padding: '5px 8px', borderBottom: '1px solid var(--bg3)', fontFamily: 'monospace', fontSize: 10 }}>{r.rel}</td>
                      <td style={{ padding: '5px 8px', borderBottom: '1px solid var(--bg3)', fontSize: 10, color: 'var(--color-text-secondary)' }}>{r.from}</td>
                      <td style={{ padding: '5px 8px', borderBottom: '1px solid var(--bg3)' }}>{r.count}</td>
                    </tr>
                  ))}
                  <tr style={{ background: 'var(--bg3)', fontWeight: 700 }}>
                    <td style={{ padding: '6px 8px' }}>Total (149 edges)</td>
                    <td style={{ padding: '6px 8px' }}></td>
                    <td style={{ padding: '6px 8px' }}>149 ✓</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
