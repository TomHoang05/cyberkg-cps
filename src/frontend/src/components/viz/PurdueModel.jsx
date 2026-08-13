import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const PLANE_COLS = {
  cyber:    '#3B82F6',
  physical: '#F59E0B',
  ai:       '#8B5CF6',
  human:    '#EC4899',
};

function hexAlpha(hex, a) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

/**
 * Q6 Purdue Level Diagram — matches CYB-19 v6 exactly.
 * Props: attackData = VIZ_DATA[attackId] from GraphExplorer.
 * 7 ISA-95 levels (L5→L0), rectangles for nodes, IT/OT boundary line, bridge row highlight.
 */
export default function PurdueModel({ attackData }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!attackData?.purdue) return;

    const W = 380, H = 380;
    const LEVELS = [5, 4, 3.5, 3, 2, 1, 0];
    const bH = Math.floor(H / LEVELS.length);
    const lblW = 78;
    const NW = 80, NH = 26, NR = 4;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${W} ${H}`).attr('width', '100%').attr('height', H);

    // ── Level bands ──────────────────────────────────────────────────────────
    LEVELS.forEach((lv, i) => {
      const y = i * bH;
      const isOT = lv <= 2;
      const bg = isOT
        ? (lv === 0 ? '#1a3012' : lv === 1 ? '#1d3415' : '#1f3718')
        : '#0f182c';

      svg.append('rect')
        .attr('x', 0).attr('y', y)
        .attr('width', W).attr('height', bH)
        .attr('fill', bg)
        .attr('stroke', '#1e2d42').attr('stroke-width', 0.5);

      // Level badge (number)
      svg.append('text')
        .text(`L${lv}`)
        .attr('x', 3).attr('y', y + bH / 2)
        .attr('font-size', 9)
        .attr('fill', isOT ? '#F59E0B' : '#475569')
        .attr('font-weight', '700')
        .attr('dominant-baseline', 'middle')
        .attr('font-family', 'Inter,system-ui,sans-serif');

      // Level label (name)
      const lvData = attackData.purdue.find(p => p.level === lv);
      const lname = lvData ? lvData.label.replace(/^L[\d.]+\s*/, '') : '';
      svg.append('text')
        .text(lname)
        .attr('x', 22).attr('y', y + bH / 2)
        .attr('font-size', 8).attr('fill', '#475569')
        .attr('dominant-baseline', 'middle')
        .attr('font-family', 'Inter,system-ui,sans-serif');
    });

    // ── IT/OT boundary line between L3 (index 3) and L2 (index 4) ───────────
    const boundY = 4 * bH; // after 4th row (L3)
    svg.append('line')
      .attr('x1', lblW).attr('x2', W - 6)
      .attr('y1', boundY).attr('y2', boundY)
      .attr('stroke', 'rgba(0,201,167,0.45)')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '6,4');
    svg.append('text')
      .text('─── IT / OT Boundary ───')
      .attr('x', lblW + 4).attr('y', boundY - 3)
      .attr('font-size', 7).attr('fill', 'rgba(0,201,167,0.65)')
      .attr('font-weight', '700')
      .attr('font-family', 'Inter,system-ui,sans-serif');

    // ── Bridge row highlight ─────────────────────────────────────────────────
    if (attackData.bridgeRow !== undefined) {
      const brY = attackData.bridgeRow * bH;
      svg.append('rect')
        .attr('x', 0).attr('y', brY)
        .attr('width', W).attr('height', bH)
        .attr('fill', 'rgba(0,201,167,0.06)')
        .attr('stroke', '#00C9A7').attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '4,3');

      if (attackData.bridgeLabel) {
        svg.append('text')
          .text('🌉 ' + attackData.bridgeLabel)
          .attr('x', W - 4).attr('y', brY + bH / 2)
          .attr('font-size', 7).attr('fill', '#00C9A7')
          .attr('font-weight', '700').attr('text-anchor', 'end')
          .attr('dominant-baseline', 'middle')
          .attr('font-family', 'Inter,system-ui,sans-serif');
      }
    }

    // ── System node rectangles ───────────────────────────────────────────────
    LEVELS.forEach((lv, i) => {
      const lvData = attackData.purdue.find(p => p.level === lv);
      if (!lvData?.systems?.length) return;

      const cy = i * bH + bH / 2;
      const sys = lvData.systems;
      const totalW = sys.length * (NW + 4) - 4;
      const startX = lblW + (W - lblW - totalW) / 2;

      sys.forEach((s, j) => {
        const x = startX + j * (NW + 4);
        const y = cy - NH / 2;
        const col = PLANE_COLS[s.p] || '#64748b';
        const isBr = s.bridge;

        svg.append('rect')
          .attr('x', x).attr('y', y)
          .attr('width', NW).attr('height', NH)
          .attr('rx', NR).attr('ry', NR)
          .attr('fill', hexAlpha(col, 0.15))
          .attr('stroke', isBr ? '#00C9A7' : col)
          .attr('stroke-width', isBr ? 2 : 1)
          .attr('stroke-dasharray', isBr ? '4,2' : 'none');

        let label = s.n.replace(/\n/g, ' ');
        if (label.length > 13) label = label.slice(0, 12) + '…';
        svg.append('text')
          .text(label)
          .attr('x', x + NW / 2).attr('y', cy)
          .attr('font-size', 8).attr('fill', col)
          .attr('font-weight', '600')
          .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
          .attr('font-family', 'Inter,system-ui,sans-serif');
      });
    });

  }, [attackData]);

  return (
    <svg
      ref={svgRef}
      style={{ width: '100%', display: 'block', borderRadius: 8 }}
    />
  );
}
