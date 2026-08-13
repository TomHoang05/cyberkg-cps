import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

// ── Entity styling constants (exported for use in COMP-03 panel) ──────────────
export const ENT_COLOR = {
  CPS_Attack:           '#9333EA',
  ATT_CK_Technique:     '#3B82F6',
  ITSystem:             '#60A5FA',
  OTSystem:             '#F59E0B',
  PhysicalSystem:       '#D97706',
  Bridge:               '#EF4444',
  NetworkZone:          '#6B7280',
  CVE:                  '#EAB308',
  CWE:                  '#CA8A04',
  CAPEC:                '#A16207',
  Vulnerability:        '#FBBF24',
  Consequence:          '#F97316',
  Human_Actor:          '#EC4899',
  Human_Action:         '#F472B6',
  InstructionalConcept: '#8B5CF6',
};

export const ENT_LABEL = {
  CPS_Attack:           'Attack Case',
  ATT_CK_Technique:     'Technique',
  ITSystem:             'IT System',
  OTSystem:             'OT System',
  PhysicalSystem:       'Physical Sys',
  Bridge:               'Bridge',
  NetworkZone:          'Network Zone',
  CVE:                  'CVE',
  CWE:                  'CWE',
  CAPEC:                'CAPEC',
  Vulnerability:        'Vulnerability',
  Consequence:          'Consequence',
  Human_Actor:          'Human Actor',
  Human_Action:         'Human Action',
  InstructionalConcept: 'Concept',
};

// ── Edge styling ──────────────────────────────────────────────────────────────
const EDGE_COLOR = {
  USES_TECHNIQUE:     '#3B82F6',
  TECHNIQUE_ORDER:    '#60A5FA',
  EXPLOITS:           '#EF4444',
  COMPROMISES:        '#F97316',
  CROSSES_INTO:       '#00C9A7',
  CAUSES_CONSEQUENCE: '#F59E0B',
  CAUSES:             '#FBBF24',
  IMPACTS:            '#D97706',
  INVOLVES:           '#9333EA',
  PERFORMS:           '#EC4899',
  AFFECTS:            '#F472B6',
  TRAVERSES:          '#EF4444',
  CONTAINS:           '#374151',
  TRANSITIONS_TO:     '#4B5563',
  HAS_ZONE:           '#6B7280',
  CONNECTS:           '#6B7280',
  ENABLES:            '#10B981',
  HAS_CWE:            '#CA8A04',
  HAS_VULNERABILITY:  '#EAB308',
  USES:               '#EF4444',
  TARGETS:            '#F97316',
  default:            '#4B5563',
};

const IMPORTANT_EDGE_TYPES = new Set([
  'TECHNIQUE_ORDER', 'CROSSES_INTO', 'CAUSES_CONSEQUENCE', 'EXPLOITS', 'COMPROMISES',
]);

// Node icon abbreviation
const LABEL_ABBREV = {
  CPS_Attack:       'ATK',
  ATT_CK_Technique: 'T',
  ITSystem:         'ITS',
  OTSystem:         'OTS',
  PhysicalSystem:   'PHY',
  Bridge:           'BRG',
  NetworkZone:      'NZ',
  CVE:              'CVE',
  CWE:              'CWE',
  CAPEC:            'CAP',
  Consequence:      'CSQ',
  Human_Actor:      'HA',
  Human_Action:     'HAC',
};

function nodeR(d) {
  if (d.label === 'CPS_Attack')       return 20;
  if (d.label === 'Bridge')           return 15;
  if (d.label === 'ATT_CK_Technique') return 13;
  return 11;
}

/**
 * Q1 Attack Surface — D3 force-directed graph.
 * Exactly matches CYB-19 v6 drawSurfaceGraph().
 *
 * Props:
 *   data        — { nodes: [{id, label, name, ...}], edges: [{source, target, type}] }
 *   onNodeClick — (node | null, edges, nodes) => void   (null = clear selection)
 *   onResetRef  — React ref; after mount, ref.current() resets the zoom
 */
export default function AttackSurface({ data, onNodeClick, onResetRef }) {
  const svgRef  = useRef(null);
  const simRef  = useRef(null);
  const zoomRef = useRef(null);

  useEffect(() => {
    if (!data?.nodes?.length) return;

    const svgEl = svgRef.current;
    if (!svgEl) return;

    const W = svgEl.clientWidth || 620;
    const H = 430;

    if (simRef.current) simRef.current.stop();

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();
    svg.attr('height', H);

    // ── Arrow markers (one per edge type) ────────────────────────────────────
    const defs = svg.append('defs');
    Object.entries(EDGE_COLOR).forEach(([t, col]) => {
      defs.append('marker')
        .attr('id', `arr-${t}`)
        .attr('viewBox', '0 -3 8 6')
        .attr('refX', 18).attr('refY', 0)
        .attr('markerWidth', 5).attr('markerHeight', 5)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-3L8,0L0,3')
        .attr('fill', col)
        .attr('opacity', 0.8);
    });

    const g = svg.append('g');

    // Deep-copy so D3 mutation doesn't affect React state
    const nodes = data.nodes.map((n) => ({ ...n }));
    const edges = data.edges.map((e) => ({ ...e }));

    // ── Force simulation ──────────────────────────────────────────────────────
    simRef.current = d3.forceSimulation(nodes)
      .force('link',    d3.forceLink(edges).id((d) => d.id).distance(110).strength(0.5))
      .force('charge',  d3.forceManyBody().strength(-320))
      .force('center',  d3.forceCenter(W / 2, H / 2).strength(0.08))
      .force('collide', d3.forceCollide(28))
      .alphaDecay(0.025);

    // ── Edges ─────────────────────────────────────────────────────────────────
    const link = g.selectAll('.q1-link').data(edges).enter().append('line')
      .attr('class', 'q1-link')
      .attr('stroke',         (d) => EDGE_COLOR[d.type] || EDGE_COLOR.default)
      .attr('stroke-width',   (d) => d.type === 'TECHNIQUE_ORDER' ? 2.5 : d.type === 'USES_TECHNIQUE' ? 2 : 1.2)
      .attr('stroke-opacity', (d) => ['CONTAINS','HAS_ZONE','TRANSITIONS_TO'].includes(d.type) ? 0.3 : 0.65)
      .attr('stroke-dasharray', (d) => ['CONTAINS','HAS_ZONE'].includes(d.type) ? '4,3' : 'none')
      .attr('marker-end',     (d) => `url(#arr-${EDGE_COLOR[d.type] ? d.type : 'default'})`);

    // ── Edge labels (important types only) ────────────────────────────────────
    const linkLabel = g.selectAll('.q1-linklbl')
      .data(edges.filter((d) => IMPORTANT_EDGE_TYPES.has(d.type)))
      .enter().append('text')
      .attr('class', 'q1-linklbl')
      .attr('font-size', '8')
      .attr('fill', '#475569')
      .attr('text-anchor', 'middle')
      .attr('pointer-events', 'none')
      .text((d) => d.type.replace(/_/g, ' '));

    // ── Nodes ─────────────────────────────────────────────────────────────────
    let dragMoved = false;
    const node = g.selectAll('.q1-node').data(nodes).enter().append('g')
      .attr('class', 'q1-node')
      .style('cursor', 'pointer')
      .call(d3.drag()
        .on('start', (event, d) => {
          dragMoved = false;
          if (!event.active) simRef.current.alphaTarget(0.3).restart();
          d.fx = d.x; d.fy = d.y;
        })
        .on('drag', (event, d) => {
          dragMoved = true;
          d.fx = event.x; d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simRef.current.alphaTarget(0);
          d.fx = null; d.fy = null;
          if (!dragMoved && onNodeClick) onNodeClick(d, edges, nodes);
        }),
      )
      .on('click', (event, d) => {
        event.stopPropagation();
        if (!dragMoved && onNodeClick) onNodeClick(d, edges, nodes);
      });

    // Circle
    node.append('circle')
      .attr('r',            nodeR)
      .attr('fill',         (d) => ENT_COLOR[d.label] || '#888')
      .attr('stroke',       '#0b1220')
      .attr('stroke-width', 2)
      .attr('opacity',      (d) => d.label === 'CPS_Attack' ? 1 : 0.88);

    // Icon / abbreviation inside circle
    node.append('text')
      .attr('text-anchor',       'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size',   (d) => d.label === 'CPS_Attack' ? '10' : '8')
      .attr('font-weight', '700')
      .attr('fill',        'white')
      .attr('pointer-events', 'none')
      .text((d) => LABEL_ABBREV[d.label] || d.label.slice(0, 3).toUpperCase());

    // Id label below node
    node.append('text')
      .attr('dy',           (d) => nodeR(d) + 10)
      .attr('text-anchor',  'middle')
      .attr('font-size',    '9')
      .attr('fill',         (d) => ENT_COLOR[d.label] || '#888')
      .attr('opacity',      0.85)
      .attr('pointer-events', 'none')
      .text((d) => d.id);

    // ── Tick ─────────────────────────────────────────────────────────────────
    simRef.current.on('tick', () => {
      link
        .attr('x1', (d) => d.source.x).attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x).attr('y2', (d) => d.target.y);
      linkLabel
        .attr('x', (d) => (d.source.x + d.target.x) / 2)
        .attr('y', (d) => (d.source.y + d.target.y) / 2 - 3);
      node.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    // ── Zoom / pan ───────────────────────────────────────────────────────────
    zoomRef.current = d3.zoom()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => { g.attr('transform', event.transform); });
    svg.call(zoomRef.current);

    // Click on canvas background → clear selection
    svg.on('click', () => {
      if (onNodeClick) onNodeClick(null, edges, nodes);
    });

    // Expose reset function to parent via ref
    if (onResetRef) {
      onResetRef.current = () => {
        svg.transition().duration(500).call(zoomRef.current.transform, d3.zoomIdentity);
      };
    }

    // Auto-populate COMP-03 with root attack node after short delay
    const rootNode = nodes.find((n) => n.label === 'CPS_Attack');
    if (rootNode) {
      setTimeout(() => {
        if (onNodeClick) onNodeClick(rootNode, edges, nodes);
      }, 300);
    }

    return () => {
      if (simRef.current) simRef.current.stop();
    };
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <svg
      ref={svgRef}
      width="100%"
      style={{ display: 'block', borderRadius: 8, background: '#0b1220', cursor: 'grab' }}
    />
  );
}
