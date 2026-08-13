import { useState } from 'react';
import { attackService } from '../../services/attackService';

const ATTACKS = [
  'colonial_pipeline_2021',
  'triton_2017',
  'german_steel_mill_2014',
  'stuxnet_2010',
];

const QUERY_TYPES = ['surface', 'chain', 'consequence', 'roles', 'full', 'purdue'];

// Literal Cypher each query type actually executes (read-only display — fix 1.2)
// The backend executes exactly these — no arbitrary Cypher accepted (Cypher-injection prevention).
const CYPHER_DISPLAY = {
  surface:     `MATCH (a:Attack {attack_id: $attack_id})\nOPTIONAL MATCH (a)-[:USES_TECHNIQUE]->(t:ATT_CK_Technique)\nOPTIONAL MATCH (t)-[:TARGETS]->(sys)\nOPTIONAL MATCH (sys)-[:LOCATED_IN]->(z:Network_Zone)\nRETURN a.attack_id, a.name, collect(DISTINCT t) AS techniques,\n       collect(DISTINCT sys) AS systems, collect(DISTINCT z) AS zones`,
  chain:       `MATCH (a:Attack {attack_id: $attack_id})-[r:USES_TECHNIQUE]->(t:ATT_CK_Technique)\nOPTIONAL MATCH (a)-[:USES_BRIDGE]->(b:Bridge_Mechanism)\nRETURN a.attack_id, collect({step: r.step_order, id: t.technique_id,\n       name: t.name, tactic: t.tactic, plane: t.plane}) AS chain,\n       collect(DISTINCT b) AS bridge_mechanisms`,
  consequence: `MATCH (a:Attack {attack_id: $attack_id})\nOPTIONAL MATCH (a)-[:USES_TECHNIQUE]->(t:ATT_CK_Technique)\nOPTIONAL MATCH (a)-[:USES_BRIDGE]->(brg:Bridge_Mechanism)\nOPTIONAL MATCH (a)-[:CAUSES_CONSEQUENCE]->(c:Consequence)\nOPTIONAL MATCH (c)-[:CONSEQUENCE_TYPE]->(ic:Instructional_Concept)\nRETURN collect(DISTINCT t) AS layer_1_cyber,\n       collect(DISTINCT brg) AS layer_2_bridge,\n       collect(DISTINCT c) AS layer_4_consequence`,
  roles:       `MATCH (a:Attack {attack_id: $attack_id})\nOPTIONAL MATCH (h:Human_Actor)-[hr:HUMAN_ROLE]->(a)\nOPTIONAL MATCH (h)-[:PERFORMS_ACTION]->(ha:Human_Action)\nOPTIONAL MATCH (ai:AI_Component)-[:AI_INVOLVED_IN]->(a)\nOPTIONAL MATCH (ais:AI_Attack_Surface)-[:AI_ATTACK_VIA]->(ai)\nRETURN collect(DISTINCT h) AS human_roles,\n       collect(DISTINCT ai) AS ai_components,\n       collect(DISTINCT ais) AS ai_attack_surfaces,\n       [x IN collect(ha) WHERE ha.action_type = 'decision'] AS decision_points`,
  full:        `MATCH (a:Attack {attack_id: $attack_id})\nOPTIONAL MATCH (a)-[r:USES_TECHNIQUE]->(t:ATT_CK_Technique)\nOPTIONAL MATCH (a)-[:USES_BRIDGE]->(b:Bridge_Mechanism)\nOPTIONAL MATCH (a)-[:CAUSES_CONSEQUENCE]->(c:Consequence)\nOPTIONAL MATCH (ai:AI_Component)-[:AI_INVOLVED_IN]->(a)\nOPTIONAL MATCH (ais:AI_Attack_Surface)-[:AI_ATTACK_VIA]->(ai)\nOPTIONAL MATCH (t)-[:MAPS_TO_CONCEPT]->(mc:Instructional_Concept)\nRETURN a AS attack_surface, collect(DISTINCT t) AS it_ot_movement,\n       collect(DISTINCT b) AS bridges, collect(DISTINCT c) AS physical_consequences,\n       {ai_components: collect(DISTINCT ai), ai_attack_surfaces: collect(DISTINCT ais)} AS ai_human_roles,\n       collect(DISTINCT mc) AS instructional_modules`,
  purdue:      `MATCH (a:Attack {attack_id: $attack_id})-[:USES_TECHNIQUE]->(t:ATT_CK_Technique)\nOPTIONAL MATCH (t)-[:TARGETS]->(sys)-[:LOCATED_IN]->(z:Network_Zone)\nRETURN t.technique_id, t.name, t.plane, sys.purdue_level, sys.name AS system, z.name AS zone\nORDER BY sys.purdue_level DESC`,
};

export default function QueryConsole() {
  const [attackId, setAttackId]   = useState('colonial_pipeline_2021');
  const [queryType, setQueryType] = useState('surface');
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  const run = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const data = await attackService[queryType](attackId);
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
        Query Console
        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
          letterSpacing: '.5px', textTransform: 'uppercase',
          background: 'rgba(139,92,246,.12)', color: 'var(--purple)', border: '1px solid rgba(139,92,246,.3)' }}>
          SCR-RES-02
        </span>
      </div>
      <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 20 }}>
        Execute Q1–Q6 graph queries directly against the KG
      </div>

      {/* Controls */}
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--color-border)',
        borderRadius: 12, padding: '14px 16px', marginBottom: 14,
        display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap',
      }}>
        <div style={{ flex: 2, minWidth: 180 }}>
          <label style={{ fontSize: 11, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 5, fontWeight: 600 }}>
            Attack ID
          </label>
          <select value={attackId} onChange={e => setAttackId(e.target.value)} style={{ width: '100%' }}>
            {ATTACKS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 140 }}>
          <label style={{ fontSize: 11, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 5, fontWeight: 600 }}>
            Query Type
          </label>
          <select value={queryType} onChange={e => setQueryType(e.target.value)} style={{ width: '100%' }}>
            {QUERY_TYPES.map(q => <option key={q} value={q}>Q: {q}</option>)}
          </select>
        </div>
        <button
          onClick={run}
          disabled={loading}
          style={{
            padding: '8px 18px', borderRadius: 8, border: 'none',
            background: 'var(--teal)', color: '#000',
            fontWeight: 700, fontSize: 12, cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? .7 : 1, flexShrink: 0,
          }}
        >
          {loading ? 'Running…' : '▶ Run'}
        </button>
      </div>

      {/* Read-only Cypher display — fix 1.2: no free-form execution; shows exact literal query */}
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--color-border)',
        borderRadius: 12, padding: '12px 16px', marginBottom: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', letterSpacing: '.04em' }}>
            CYPHER — READ-ONLY (exact query executed by backend)
          </span>
          <button
            onClick={() => navigator.clipboard?.writeText(CYPHER_DISPLAY[queryType] || '')}
            style={{
              fontSize: 10, padding: '2px 8px', borderRadius: 4, cursor: 'pointer',
              background: 'var(--bg3)', border: '1px solid var(--color-border)',
              color: 'var(--color-text-secondary)',
            }}
          >Copy</button>
        </div>
        <pre style={{
          margin: 0, fontFamily: 'var(--font-mono)', fontSize: 10,
          color: '#7dd3fc', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          userSelect: 'text',
        }}>
          {CYPHER_DISPLAY[queryType] || '— query not available —'}
        </pre>
        <div style={{ fontSize: 9, color: 'var(--color-text-secondary)', marginTop: 6 }}>
          ⚠ Arbitrary Cypher execution is disabled — injection prevention (system.py). Only the exact queries above run.
        </div>
      </div>

      {error && <p style={{ color: 'var(--red)', fontSize: 12, marginBottom: 10 }}>{error}</p>}

      {result && (
        <pre style={{
          background: 'var(--bg3)', borderRadius: 10, padding: 16,
          fontFamily: 'var(--font-mono)', fontSize: 11, color: '#a3e635',
          overflowX: 'auto', maxHeight: 480, lineHeight: 1.6,
        }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
