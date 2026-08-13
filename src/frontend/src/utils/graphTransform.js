/**
 * Adapters: real (flat) REST API response shapes -> the nested shapes the D3
 * visualization components expect.
 *
 * AUDIT-FIXED (SEVERE): no adapter layer existed anywhere in the frontend before.
 * GET /attacks/{id}/surface, /chain and /purdue all return flat arrays (one
 * aggregated row, or one row per item), but AttackSurface.jsx expects
 * {nodes,edges}, Timeline.jsx expects {chain,bridge_mechanisms}, and
 * PurdueModel.jsx expects {levels,bridge} -- shapes no REST endpoint produces.
 * GraphExplorer.jsx/GraphView.jsx used to pass the raw hook result straight into
 * these components, so all three rendered permanently blank against real data.
 * These functions bridge that gap; call them once, right where the API result is
 * consumed, before handing data to the viz components.
 */

/** GET /attacks/{id}/surface -> AttackSurface.jsx's {nodes, edges, summary}. */
export function toSurfaceGraph(raw) {
  const row = Array.isArray(raw) ? raw[0] : raw;
  if (!row) return { nodes: [], edges: [], summary: {} };

  const nodes = [];
  const edges = [];
  const seen = new Set();

  const addNode = (id, type, properties) => {
    if (id == null || seen.has(id)) return;
    seen.add(id);
    // AttackSurface.jsx reads d.label (not d.type) for ENT_COLOR / LABEL_ABBREV / nodeR
    nodes.push({ id, label: type, properties });
  };

  if (row.attack_id) {
    // AttackSurface expects 'CPS_Attack', not 'Attack'
    addNode(row.attack_id, 'CPS_Attack', {
      name: row.name,
      year: row.year,
      industry_sector: row.industry_sector,
      attributed_to: row.attributed_to,
      evidence_class: row.evidence_class,
      plane: 'cyber',
    });
  }

  (row.techniques || []).forEach((t) => {
    if (!t?.technique_id) return;
    addNode(t.technique_id, 'ATT_CK_Technique', {
      name: t.name,
      tactic: t.tactic,
      evidence_class: t.evidence_class,
      plane: t.plane || 'cyber',
    });
    if (row.attack_id) edges.push({ source: row.attack_id, target: t.technique_id });
  });

  // Q1 /surface returns {name, plane, evidence_class, purdue_level} for systems —
  // no system_id. Use plain name as the node ID (no prefix) so it matches
  // technique_system_edges.to which carries sys.name directly from Cypher.
  (row.systems || []).forEach((s) => {
    if (!s?.name && !s?.system_id) return;
    const sid = s.system_id || s.name;
    const type = s.plane === 'physical' ? 'OT_System' : 'IT_System';
    addNode(sid, type, {
      name: s.name,
      plane: s.plane || 'cyber',
      evidence_class: s.evidence_class,
      purdue_level: s.purdue_level,
    });
  });

  // Q1 /surface zones also have no zone_id — use plain name as ID.
  (row.zones || []).forEach((z) => {
    if (!z?.name && !z?.zone_id) return;
    const zid = z.zone_id || z.name;
    addNode(zid, 'Network_Zone', {
      name: z.name,
      zone_type: z.zone_type,
      plane: 'physical',
      purdue_level: z.purdue_level,
    });
  });

  // Technique → System edges from the updated Cypher query.
  const techSysEdges = (row.technique_system_edges || []).filter(
    (e) => e?.from && e?.to && seen.has(e.from) && seen.has(e.to),
  );
  techSysEdges.forEach((e) => edges.push({ source: e.from, target: e.to }));

  // System → Zone edges from the updated Cypher query.
  (row.system_zone_edges || []).forEach((e) => {
    if (e?.from && e?.to && seen.has(e.from) && seen.has(e.to)) {
      edges.push({ source: e.from, target: e.to });
    }
  });

  // Fallback: if Neo4j has no TARGETS relationships loaded yet, wire every system
  // directly to the attack root so the graph stays connected (no orphan nodes).
  if (techSysEdges.length === 0 && row.attack_id) {
    (row.systems || []).forEach((s) => {
      const sid = s.system_id || s.name;
      if (seen.has(sid)) edges.push({ source: row.attack_id, target: sid });
    });
  }

  return {
    nodes,
    edges,
    summary: {
      node_count: nodes.length,
      edge_count: edges.length,
      planes_present: [...new Set(nodes.map((n) => n.properties?.plane).filter(Boolean))],
    },
  };
}

/** GET /attacks/{id}/chain -> Timeline.jsx's {chain, bridge_mechanisms}. */
export function toTimelineChain(raw) {
  const rows = Array.isArray(raw) ? raw : [];

  const chain = rows
    .map((r) => ({
      step: r.step ?? r.step_order,
      // Q2 returns `mitre_id` (the real T-number like T1078) and `name` directly.
      // Earlier code read r.technique_id (internal ID) and r.technique_name (undefined),
      // which broke deriveLane() (no ^T0 prefix match → every step landed in 'cyber').
      mitre_id: r.mitre_id || r.technique_id,
      name: r.name || r.technique_name,
      tactic: r.tactic,
      plane: r.plane || 'cyber',
      purdue_level: r.purdue_level,
      evidence_class: r.evidence_class,
      confidence: r.confidence,
    }))
    .sort((a, b) => (a.step ?? 0) - (b.step ?? 0));

  // Derive which step is the IT->OT bridge crossing: /chain denormalizes the
  // same bridge onto every row, so reconstruct from per-step purdue_level:
  // the first step where the level drops from IT range (>=4) into OT range (<=3).
  let bridgeStepIndex = -1;
  for (let i = 1; i < chain.length; i++) {
    const prev = chain[i - 1].purdue_level;
    const cur = chain[i].purdue_level;
    if (prev != null && cur != null && prev >= 4 && cur <= 3) {
      bridgeStepIndex = i;
      break;
    }
  }
  chain.forEach((s, i) => { s.is_bridge_step = i === bridgeStepIndex; });

  const bridgeRow = rows.find((r) => r.bridge_type || r.bridge_name);
  const bridge_mechanisms = bridgeRow
    ? [{ bridge_type: bridgeRow.bridge_type, name: bridgeRow.bridge_name }]
    : [];

  return { chain, bridge_mechanisms };
}

/** GET /attacks/{id}/purdue -> PurdueModel.jsx's {levels, bridge}. */
export function toPurdueLevels(raw) {
  const rows = Array.isArray(raw) ? raw : [];

  const byLevel = new Map();
  const seenSystems = new Set();
  rows.forEach((r) => {
    if (r.purdue_level == null || !r.system_name) return;
    const key = `${r.purdue_level}::${r.system_name}`;
    if (seenSystems.has(key)) return;
    seenSystems.add(key);
    if (!byLevel.has(r.purdue_level)) byLevel.set(r.purdue_level, []);
    byLevel.get(r.purdue_level).push({
      name: r.system_name,
      plane: r.plane,
      zone_type: r.zone_type,
    });
  });

  const levels = Array.from(byLevel.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([level, systems]) => ({ level, systems }));

  const bridgeRow = rows.find((r) => r.bridge_type || r.bridge_name);
  const bridge = bridgeRow
    ? {
        name: bridgeRow.bridge_name,
        bridge_type: bridgeRow.bridge_type,
        purdue_from: bridgeRow.purdue_from,
        purdue_to: bridgeRow.purdue_to,
      }
    : null;

  return { levels, bridge };
}
