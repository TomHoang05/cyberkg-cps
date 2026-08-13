import { useEffect, useState } from 'react';
import { attackService } from '../../services/attackService';

const MODULES = [
  'M1 — IT-OT Progression', 'M2 — Physical Consequences',
  'M3 — AI Attack Surfaces', 'M4 — AI Resilience',
  'M5 — Human-AI Decision Workflows', 'Cross-cutting M1–M5',
];
const TYPES = ['Scenario-Based (new case)', 'Fill-in-chain', 'MCQ Quiz (10Q)'];
const DIFFICULTIES = ['Introductory', 'Intermediate', 'Advanced'];

const S = {
  card: { background: 'var(--bg3)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 16, marginBottom: 12 },
  label: { fontSize: 10, fontWeight: 700, color: 'var(--color-text-secondary)', letterSpacing: '.04em', marginBottom: 6, display: 'block' },
  select: { background: 'var(--bg3)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', borderRadius: 8, padding: '7px 10px', fontSize: 12, width: '100%' },
};

/**
 * i-assess — Assessment Builder. Generates cross-plane reasoning scenarios from
 * real KG data (/surface + /consequence + /roles) for the selected attack case.
 * AUDIT-FIXED: this screen did not exist in the frontend at all before.
 */
export default function AssessmentBuilder() {
  const [attacks, setAttacks] = useState([]);
  const [attackId, setAttackId] = useState('');
  const [module, setModule] = useState(MODULES[0]);
  const [type, setType] = useState(TYPES[0]);
  const [difficulty, setDifficulty] = useState(DIFFICULTIES[2]);
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    attackService.listAttacks()
      .then((raw) => {
        const a = raw?.data || raw || [];
        setAttacks(a);
        if (a[0]) setAttackId(a[0].slug || a[0].attack_id);
      })
      .catch((e) => setError(e.message));
  }, []);

  const generate = async () => {
    if (!attackId) return;
    setLoading(true);
    setError(null);
    try {
      const [surfaceRaw, consequenceRaw, rolesRaw] = await Promise.all([
        attackService.surface(attackId),
        attackService.consequence(attackId),
        attackService.roles(attackId),
      ]);
      const surface = surfaceRaw?.data || surfaceRaw;
      const surfaceRow = Array.isArray(surface) ? surface[0] : surface;
      const consequences = consequenceRaw?.data?.consequences || consequenceRaw?.data || [];
      const roles = rolesRaw?.data || rolesRaw;
      const attack = attacks.find((a) => (a.slug || a.attack_id) === attackId);
      setAssessment({ attack, surface: surfaceRow, consequences, roles });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (error) return <p style={{ color: 'var(--red)' }}>{error}</p>;

  const aiComponents = (assessment?.roles?.ai_components || []).filter((c) => c.component);
  const humanRoles = (assessment?.roles?.human_roles || []).filter((h) => h.actor);

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Assessment Builder</h1>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 12, marginBottom: 18 }}>
        Scenario-based assessments generated from real KG data (H1–H4).
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        <div>
          <label style={S.label}>Attack Case</label>
          <select value={attackId} onChange={(e) => setAttackId(e.target.value)} style={S.select}>
            {attacks.map((a) => (
              <option key={a.slug || a.attack_id} value={a.slug || a.attack_id}>{a.name || a.attack_id}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={S.label}>Module</label>
          <select value={module} onChange={(e) => setModule(e.target.value)} style={S.select}>
            {MODULES.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label style={S.label}>Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} style={S.select}>
            {TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label style={S.label}>Difficulty</label>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} style={S.select}>
            {DIFFICULTIES.map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <button
        onClick={generate}
        disabled={loading}
        style={{
          padding: '8px 20px', borderRadius: 8, color: '#fff', fontSize: 12,
          fontWeight: 700, marginBottom: 20, cursor: loading ? 'default' : 'pointer',
          background: loading ? '#334155' : 'var(--color-primary)',
          border: 'none', transition: 'background .15s',
        }}
      >
        {loading ? 'Generating…' : 'Generate Assessment'}
      </button>

      {assessment && (
        <div style={S.card}>
          <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: 'var(--color-text-primary)' }}>
            📝 {module} — {type} ({difficulty}) — {assessment.attack?.name}
          </h3>

          {/* Scenario context */}
          <div style={{
            background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 11, lineHeight: 1.65,
          }}>
            <strong style={{ color: 'var(--blue)' }}>Scenario Context</strong><br />
            A {assessment.surface?.industry_sector || 'critical infrastructure'} facility
            {assessment.surface?.attributed_to ? ` was targeted by ${assessment.surface.attributed_to}` : ' was attacked'}
            {' '}in {assessment.attack?.year}. The attack compromised the IT network before crossing into
            the OT environment, causing{' '}
            {assessment.consequences[0]?.consequence || 'physical consequences'}.
            {aiComponents.length > 0 && (
              <> The facility had deployed an AI system ({aiComponents[0]?.component}) that may have
              had visibility into part of the attack chain.</>
            )}
          </div>

          {/* Questions */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--teal)', letterSpacing: '.04em', marginBottom: 8 }}>
              ASSESSMENT QUESTIONS
            </div>
            {[
              `Q1. [${difficulty === 'Introductory' ? 'L2' : difficulty === 'Intermediate' ? 'L3' : 'L4'} ${module}] What is the bridge mechanism type used in the ${assessment.attack?.name} attack, and at which Purdue level does the IT-to-OT transition occur?`,
              `Q2. [L3 ${module}] Trace the attack chain from initial access to the first physical consequence. For each step, identify the ATT&CK technique and the plane (Cyber/Physical/Bridge) it operates in.`,
              aiComponents.length > 0
                ? `Q3. [L4 ${module}] The AI system (${aiComponents[0]?.component}) was deployed. At which steps of the real attack chain would it have had visibility? At which steps would it have been blind, and why?`
                : `Q3. [L4 ${module}] No AI monitoring component is documented in the KG for this case. Propose a specific AI/ML capability that, if deployed, would have detected the bridge crossing step. Justify your choice based on the technique and plane.`,
              `Q4. [L5 Cross-cutting] Propose a layered defense strategy that would have interrupted this attack chain at the bridge crossing step. Reference at least one NIST CSF function.`,
            ].map((q, i) => (
              <div key={i} style={{
                background: 'var(--bg2)', border: '1px solid var(--color-border)',
                borderRadius: 8, padding: '10px 14px', marginBottom: 8,
                fontSize: 11, color: 'var(--color-text-primary)', lineHeight: 1.65,
              }}>
                {q}
              </div>
            ))}
          </div>

          {/* Human roles note */}
          {humanRoles.length > 0 && (
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', borderTop: '1px solid var(--color-border)', paddingTop: 10 }}>
              <strong style={{ color: 'var(--pink)' }}>Human roles documented:</strong>{' '}
              {humanRoles.map((h) => h.actor).join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
