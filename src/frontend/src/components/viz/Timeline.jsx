import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

/**
 * Q2 IT-OT Movement Timeline — swimlane D3 diagram + step interpretation table.
 * Layout matches CYB-19 v5 HTML exactly:
 *   H=260, tPad=16, bPad=16, lPad=90, laneH=57px
 *   Bridge node: r=20, red fill, teal stroke (dashed)
 *   Regular node: r=16, lane-colored fill + stroke
 *   Step number above circle, 2-line label inside, MITRE tag below.
 */

const LANE_ORDER  = ['cyber', 'bridge', 'physical', 'human'];
const LANE_LABELS = { cyber: 'Cyber Plane', bridge: 'Bridge', physical: 'Physical Plane', human: 'Human Plane' };

// Diagram colors (PCOLS) — matches v5: bridge = red in SVG
const PCOLS = {
  cyber:    '#3B82F6',
  bridge:   '#EF4444',
  physical: '#F59E0B',
  human:    '#EC4899',
};

// Table colors (_PLANE_COL) — bridge = teal in table
const TABLE_COLS = {
  cyber:    '#3B82F6',
  bridge:   '#00C9A7',
  physical: '#F59E0B',
  human:    '#EC4899',
};

const TABLE_LANE_LABELS = {
  cyber: 'Cyber', bridge: 'Bridge 🏭', physical: 'Physical', human: 'Human',
};

const LANE_BG = {
  cyber:    'rgba(59,130,246,0.05)',
  bridge:   'rgba(0,201,167,0.07)',
  physical: 'rgba(245,158,11,0.05)',
  human:    'rgba(236,72,153,0.05)',
};

// Hand-crafted short 2-line labels matching v5 for known MITRE IDs
const MITRE_LABELS = {
  T1078: ['VPN Cred',    'Stolen'],
  T1021: ['Lateral',     'Movement'],
  T0822: ['🌉 VPN',     'Bridge'],
  T1486: ['Ransom',      'Deploy'],
  T1566: ['Spear',       'phish'],
  T0864: ['🌉 Dual-Homed','WS Bridge'],
  T0880: ['Safety',      'Suppress'],
  T0842: ['OT Net',      'Compr.'],
  T1091: ['USB Drop',    '4× 0-days'],
  T1543: ['Lateral Mv',  'Rootkit'],
  T1055: ['Process',     'Injection'],
  T0847: ['🌉 Air-Gap',  'USB Bypass'],
  T0873: ['PLC Logic',   'Rewrite'],
  T0831: ['Centrifuge',  'Destruct.'],
  T0832: ['HMI Replay',  'DoV'],
  T0836: ['Modify',      'Param'],
  T0855: ['Unauthorized', 'Cmd'],
  T0856: ['Spoof',       'Report'],
  T0878: ['Alarm',       'Suppress'],
};

function makeLabel(step) {
  const id = step.mitre_id || '';
  if (id && MITRE_LABELS[id]) {
    const lbl = [...MITRE_LABELS[id]];
    // Add bridge emoji if bridge lane and not already present
    if (step.lane === 'bridge' && !lbl[0].includes('🌉')) {
      lbl[0] = '🌉 ' + lbl[0];
    }
    return lbl;
  }
  // Fallback: split name by word midpoint
  const words = (step.name || step.technique_id || '—').split(' ').filter(Boolean);
  if (words.length <= 1) return [words[0] ? words[0].slice(0, 10) : '—'];
  const mid = Math.ceil(words.length / 2);
  const prefix = step.lane === 'bridge' ? '🌉 ' : '';
  return [
    (prefix + words.slice(0, mid).join(' ')).slice(0, 12),
    words.slice(mid).join(' ').slice(0, 12),
  ].filter(Boolean);
}

function deriveLane(step, allSteps) {
  const id = step.mitre_id || '';
  if (!id) return 'human';
  const isICS = /^T0/.test(id) || step.platform === 'ICS';
  if (!isICS) return 'cyber';
  const firstICS = [...allSteps]
    .filter(s => /^T0/.test(s.mitre_id || '') || s.platform === 'ICS')
    .sort((a, b) => a.step - b.step)[0];
  return step.step === firstICS?.step ? 'bridge' : 'physical';
}

function hexAlpha(hex, a) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function toRgb(hex) {
  const h = hex.replace('#', '');
  return `${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)}`;
}

export default function Timeline({ data }) {
  const svgRef  = useRef(null);
  const wrapRef = useRef(null);

  const raw   = data?.chain || [];
  const steps = raw.map(s => ({ ...s, lane: deriveLane(s, raw) }));

  useEffect(() => {
    if (!raw.length || !svgRef.current || !wrapRef.current) return;

    // ── Layout constants (matching v5 exactly) ───────────────────────────
    const H     = 260;
    const tPad  = 16, bPad = 16, lPad = 90;
    const W     = Math.max(wrapRef.current.clientWidth - 28, 600);
    const laneH = Math.floor((H - tPad - bPad) / LANE_ORDER.length);   // 57
    const avail = W - lPad - 24;
    const stepW = Math.min(86, Math.floor(avail / steps.length));

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', W).attr('height', H).attr('viewBox', `0 0 ${W} ${H}`);

    // ── Lane bands + labels + guide lines ───────────────────────────────
    LANE_ORDER.forEach((ln, i) => {
      const y  = tPad + i * laneH;
      const cy = tPad + (i + 0.5) * laneH;

      svg.append('rect')
        .attr('x', lPad).attr('y', y)
        .attr('width', W - lPad - 8).attr('height', laneH)
        .attr('fill', LANE_BG[ln])
        .attr('stroke', '#1e2d42').attr('stroke-width', 0.5);

      svg.append('text')
        .text(LANE_LABELS[ln])
        .attr('x', lPad - 6).attr('y', cy)
        .attr('font-size', 8.5).attr('fill', PCOLS[ln]).attr('font-weight', 700)
        .attr('text-anchor', 'end').attr('dominant-baseline', 'middle')
        .attr('font-family', 'Segoe UI,system-ui,sans-serif');

      svg.append('line')
        .attr('x1', lPad).attr('x2', W - 12)
        .attr('y1', cy).attr('y2', cy)
        .attr('stroke', 'rgba(100,116,139,0.2)').attr('stroke-width', 0.5)
        .attr('stroke-dasharray', '2,4');
    });

    // ── Pre-compute step centre positions ────────────────────────────────
    const pts = steps.map((s, idx) => ({
      cx:      lPad + idx * stepW + stepW / 2,
      cy:      tPad + (LANE_ORDER.indexOf(s.lane) + 0.5) * laneH,
      lane:    s.lane,
    }));

    // ── Connectors (drawn first so nodes sit on top) ─────────────────────
    steps.forEach((s, idx) => {
      if (idx === 0) return;
      const prev = pts[idx - 1], cur = pts[idx];
      if (prev.lane === cur.lane) {
        svg.append('line')
          .attr('x1', prev.cx + 16).attr('y1', prev.cy)
          .attr('x2', cur.cx  - 16).attr('y2', cur.cy)
          .attr('stroke', PCOLS[cur.lane]).attr('stroke-width', 1.5).attr('opacity', 0.4);
      } else {
        const mx = (prev.cx + cur.cx) / 2;
        svg.append('path')
          .attr('d', `M ${prev.cx} ${prev.cy} L ${mx} ${prev.cy} L ${mx} ${cur.cy} L ${cur.cx} ${cur.cy}`)
          .attr('fill', 'none')
          .attr('stroke', 'rgba(0,201,167,0.5)').attr('stroke-width', 1)
          .attr('stroke-dasharray', '3,2');
      }
    });

    // ── Nodes ─────────────────────────────────────────────────────────────
    steps.forEach((s, idx) => {
      const { cx, cy } = pts[idx];
      const col   = PCOLS[s.lane] || '#64748b';
      const isBr  = s.lane === 'bridge';
      const r     = isBr ? 20 : 16;
      const lbl   = makeLabel(s);
      const lineH = 9;
      const startY = cy - (lbl.length - 1) * lineH / 2;

      // Circle
      svg.append('circle')
        .attr('cx', cx).attr('cy', cy).attr('r', r)
        .attr('fill', hexAlpha(col, 0.15))
        .attr('stroke', isBr ? '#00C9A7' : col)
        .attr('stroke-width', isBr ? 2 : 1.5)
        .attr('stroke-dasharray', isBr ? '3,2' : 'none');

      // Step number above circle
      svg.append('text')
        .text(s.step)
        .attr('x', cx).attr('y', cy - r - 3)
        .attr('font-size', 8).attr('fill', '#475569')
        .attr('text-anchor', 'middle')
        .attr('font-family', 'Segoe UI,system-ui,sans-serif');

      // 2-line label inside circle
      lbl.forEach((line, li) => {
        svg.append('text')
          .text(line)
          .attr('x', cx).attr('y', startY + li * lineH)
          .attr('font-size', 7.5).attr('fill', col).attr('font-weight', 600)
          .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
          .attr('font-family', 'Segoe UI,system-ui,sans-serif');
      });

      // MITRE ID tag below circle
      if (s.mitre_id) {
        svg.append('text')
          .text(s.mitre_id)
          .attr('x', cx).attr('y', cy + r + 9)
          .attr('font-size', 7).attr('fill', hexAlpha(col, 0.75))
          .attr('text-anchor', 'middle')
          .attr('font-family', 'Segoe UI,system-ui,sans-serif');
      }
    });
  }, [data]);   // re-draw when data changes

  // ── Interpretation table (pure React) ──────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* SVG container */}
      <div
        ref={wrapRef}
        style={{
          background: 'var(--bg3)', borderRadius: 10, padding: 14,
          overflowX: 'auto', marginBottom: 14,
        }}
      >
        <svg ref={svgRef} style={{ display: 'block' }} />
      </div>

      {/* Step table */}
      {steps.length > 0 && (
        <div>
          <div style={{
            fontSize: 10, fontWeight: 700, color: 'var(--teal)',
            letterSpacing: '.04em', marginBottom: 7,
          }}>
            📋 ATTACK CHAIN — STEP-BY-STEP INTERPRETATION
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  {['#', 'ACTION', 'LANE', 'ATT&CK', 'INTERPRETATION'].map((h, i) => (
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
                  const isBr  = s.lane === 'bridge';
                  const col   = TABLE_COLS[s.lane] || '#64748b';
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
                        {s.name || '—'}
                      </td>
                      {/* Lane */}
                      <td style={{ padding: '5px 8px', verticalAlign: 'top' }}>
                        <span style={{
                          padding: '1px 6px', borderRadius: 3,
                          background: `rgba(${rgb},0.12)`, color: col,
                          fontSize: 9, fontWeight: 700, whiteSpace: 'nowrap',
                        }}>
                          {TABLE_LANE_LABELS[s.lane] || s.lane}
                        </span>
                      </td>
                      {/* ATT&CK */}
                      <td style={{ padding: '5px 8px', verticalAlign: 'top' }}>
                        {s.mitre_id
                          ? <code style={{ fontSize: 9, color: col, background: `rgba(${rgb},0.12)`, padding: '1px 5px', borderRadius: 3 }}>{s.mitre_id}</code>
                          : <span style={{ color: '#334155' }}>—</span>
                        }
                      </td>
                      {/* Interpretation */}
                      <td style={{ padding: '5px 8px', color: '#94a3b8', lineHeight: 1.55, fontSize: 10 }}>
                        {s.description || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
