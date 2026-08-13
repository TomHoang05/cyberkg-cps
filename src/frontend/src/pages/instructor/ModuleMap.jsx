const CASES = [
  { name: 'Colonial Pipeline', phase: 'MVP', m1:'Primary', m2:'Indirect', m3:'Ext.', m4:'—', m5:'Primary', l1:true, l2:true, l3:false, dim: false },
  { name: 'TRITON',            phase: 'MVP', m1:'Primary', m2:'Safety',  m3:'Ext.', m4:'Sec.', m5:'Primary', l1:true, l2:true, l3:true, dim: false },
  { name: 'German Steel Mill', phase: 'MVP', m1:'Primary', m2:'Direct',  m3:'Sec.', m4:'Ext.', m5:'Primary', l1:true, l2:false, l3:true, dim: false },
  { name: 'Stuxnet',           phase: 'MVP', m1:'Primary', m2:'Direct+DoV', m3:'Sec.', m4:'Ext.', m5:'Sec.', l1:true, l2:true, l3:true, dim: false },
  { name: 'Ukraine Grid 2015', phase: 'V1',  m1:'Primary', m2:'Indirect', m3:'Ext.', m4:'Sec.', m5:'Sec.', l1:true, l2:true, l3:false, dim: true },
  { name: 'Ukraine Grid 2016', phase: 'V1',  m1:'Primary', m2:'Direct',  m3:'Ext.', m4:'Sec.', m5:'Sec.', l1:true, l2:true, l3:true, dim: true },
  { name: 'Oldsmar Water',     phase: 'V1',  m1:'Primary', m2:'Direct',  m3:'—',    m4:'—',    m5:'Primary', l1:true, l2:false, l3:false, dim: true },
  { name: 'Maroochy Shire',    phase: 'V1',  m1:'Primary', m2:'Direct',  m3:'—',    m4:'—',    m5:'Sec.', l1:true, l2:false, l3:false, dim: true },
  { name: 'EKANS/SNAKE 2020',  phase: 'V1',  m1:'Primary', m2:'Indirect', m3:'Ext.', m4:'—',  m5:'Sec.', l1:true, l2:true, l3:false, dim: true },
  { name: 'JBS Foods 2021',    phase: 'V1',  m1:'Primary', m2:'Indirect', m3:'—',    m4:'—',  m5:'Primary', l1:true, l2:false, l3:false, dim: true },
];

const BADGE_COLOR = { Primary: 'var(--green)', Indirect: 'var(--yellow)', Safety: 'var(--red)', Direct: 'var(--orange)', 'Direct+DoV': 'var(--orange)', 'Ext.': 'var(--purple)', 'Sec.': 'var(--blue)', '—': 'var(--color-text-secondary)' };

function Badge({ val }) {
  const color = BADGE_COLOR[val] || 'var(--color-text-secondary)';
  return val === '—'
    ? <span style={{ color: 'var(--color-text-secondary)' }}>—</span>
    : <span style={{ display: 'inline-block', fontSize: 10, padding: '2px 8px', borderRadius: 12, fontWeight: 600, background: `${color}22`, color }}>{val}</span>;
}

export default function ModuleMap() {
  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
        Module Alignment Map
        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
          letterSpacing: '.5px', textTransform: 'uppercase',
          background: 'var(--v1-bg)', color: 'var(--v1-text)', border: '1px solid var(--v1-border)' }}>V1</span>
      </div>
      <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
        Attack cases mapped to course modules — MVP cases loaded, V1 cases planned
      </div>

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Case × Module Matrix</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                {['Case', 'Phase', 'M1 IT-OT', 'M2 Physical', 'M3 AI Surf.', 'M4 AI Res.', 'M5 Human', 'Lab 1', 'Lab 2', 'Lab 3'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '9px 12px', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CASES.map(c => (
                <tr key={c.name} style={{ opacity: c.dim ? .55 : 1 }}>
                  <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--bg3)', fontWeight: 700 }}>{c.name}</td>
                  <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--bg3)' }}>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 8,
                      background: c.phase === 'MVP' ? 'var(--mvp-bg)' : 'var(--v1-bg)',
                      color: c.phase === 'MVP' ? 'var(--mvp-text)' : 'var(--v1-text)',
                      border: `1px solid ${c.phase === 'MVP' ? 'var(--mvp-border)' : 'var(--v1-border)'}` }}>
                      {c.phase}
                    </span>
                  </td>
                  {[c.m1, c.m2, c.m3, c.m4, c.m5].map((v, i) => (
                    <td key={i} style={{ padding: '9px 12px', borderBottom: '1px solid var(--bg3)' }}><Badge val={v} /></td>
                  ))}
                  {[c.l1, c.l2, c.l3].map((v, i) => (
                    <td key={i} style={{ padding: '9px 12px', borderBottom: '1px solid var(--bg3)', color: v ? 'var(--teal)' : 'var(--color-text-secondary)' }}>{v ? '✓' : '—'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
