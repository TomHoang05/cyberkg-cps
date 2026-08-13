/**
 * Step interpretation table — shows chain steps with Purdue level + bridge
 * annotation. Used by LabBuilder and GraphExplorer (chain tab).
 * Props:
 *   steps: array of { step, name, mitre_id, plane, purdue_level, is_bridge_step, tactic, description }
 */
import { PLANE_COLOR } from '../../utils/colorMap';

const TABLE_COLS = {
  cyber:    PLANE_COLOR.cyber,
  bridge:   PLANE_COLOR.bridge,   // teal in table (red only in SVG diagram)
  physical: PLANE_COLOR.physical,
  human:    PLANE_COLOR.human,
  ai:       PLANE_COLOR.ai,
};

function toRgb(hex) {
  const h = hex.replace('#', '');
  return `${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)}`;
}

export default function StepInterpretationTable({ steps = [] }) {
  if (!steps.length) return null;

  return (
    <div>
      <div style={{
        fontSize: 10, fontWeight: 700, color: 'var(--teal)',
        letterSpacing: '.04em', marginBottom: 7,
      }}>
        📋 STEP-BY-STEP INTERPRETATION
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              {['#', 'ACTION', 'PLANE', 'PURDUE', 'ATT&CK', 'DESCRIPTION'].map((h, i) => (
                <th key={h} style={{
                  textAlign: i === 0 ? 'center' : 'left',
                  padding: '4px 8px', color: '#475569',
                  fontWeight: 600, fontSize: 9, whiteSpace: 'nowrap',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {steps.map((s, i) => {
              const isBr  = s.is_bridge_step || s.plane === 'bridge';
              const col   = TABLE_COLS[s.plane] || '#64748b';
              const rgb   = toRgb(col);
              const rowBg = isBr
                ? 'rgba(0,201,167,0.07)'
                : i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent';

              return (
                <tr
                  key={s.step}
                  style={{
                    background: rowBg,
                    borderLeft: isBr ? '2px solid #00C9A7' : '2px solid transparent',
                  }}
                >
                  {/* # */}
                  <td style={{ textAlign: 'center', padding: '5px 8px', verticalAlign: 'top' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 18, height: 18, borderRadius: '50%',
                      background: `rgba(${rgb},0.15)`, color: col,
                      fontSize: 9, fontWeight: 700, border: `1px solid rgba(${rgb},0.4)`,
                    }}>{s.step}</span>
                  </td>
                  {/* Action */}
                  <td style={{
                    padding: '5px 8px', fontWeight: 600, color: col,
                    whiteSpace: 'nowrap', fontSize: 10, verticalAlign: 'top',
                  }}>
                    {isBr && <span style={{ marginRight: 4 }}>🌉</span>}
                    {s.name || '—'}
                  </td>
                  {/* Plane */}
                  <td style={{ padding: '5px 8px', verticalAlign: 'top' }}>
                    <span style={{
                      padding: '1px 6px', borderRadius: 3,
                      background: `rgba(${rgb},0.12)`, color: col,
                      fontSize: 9, fontWeight: 700, whiteSpace: 'nowrap',
                    }}>{s.plane || '—'}</span>
                  </td>
                  {/* Purdue */}
                  <td style={{ padding: '5px 8px', verticalAlign: 'top', fontSize: 9, color: '#64748b' }}>
                    {s.purdue_level != null ? `L${s.purdue_level}` : '—'}
                  </td>
                  {/* ATT&CK */}
                  <td style={{ padding: '5px 8px', verticalAlign: 'top' }}>
                    {s.mitre_id
                      ? <code style={{ fontSize: 9, color: col, background: `rgba(${rgb},0.12)`, padding: '1px 5px', borderRadius: 3 }}>{s.mitre_id}</code>
                      : <span style={{ color: '#334155' }}>—</span>
                    }
                  </td>
                  {/* Description */}
                  <td style={{ padding: '5px 8px', color: '#94a3b8', lineHeight: 1.55, fontSize: 10 }}>
                    {s.description || s.tactic || '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
