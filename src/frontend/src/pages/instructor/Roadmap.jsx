const MVP = [
  '4 attack cases curated (Colonial Pipeline, TRITON, German Steel Mill, Stuxnet)',
  'Neo4j knowledge graph — 104 nodes, 149 edges, 4-plane schema',
  'FastAPI backend — Q1–Q6 query types, full REST API',
  'React frontend — 3 role workspaces (Instructor, Student, Researcher)',
  'Attack Graph Explorer — D3 force-directed, timeline, Purdue diagram',
  'Lab Exercise Builder (Labs 1–3)',
  'Assessment Builder (scenario-based, MCQ)',
  'Instructor dossier export (DOCX)',
  '128 Question nodes (Bloom taxonomy, 5 levels, all 4 cases)',
];

const V1 = [
  'LLM enrichment pipeline (SecureBERT/CySecBERT) — Q125 narrative generation',
  'MITRE ATT&CK Navigator integration — heatmap + JSON export',
  'Comparative dossier — 2 attacks side-by-side (SCR-INS-07)',
  '6 additional case studies (Ukraine 2015/2016, Oldsmar, Maroochy, EKANS, JBS)',
  'Student progress tracking + LMS export (SCORM 2004 / Canvas)',
  'Annotation workspace — semi-auto case ingestion pipeline',
  'API key access (researcher-scoped, read-only)',
  'MITRE ATLAS integration — adversarial ML technique IDs',
];

const V2 = [
  'Operator Decision Simulator — real-time SCADA scenario (SCR-STU-Lab4)',
  'ModuleGen pipeline — auto-generate 5+ case instructional units',
  'Cross-case provenance bundle (multi-case JSON-LD)',
  'Per-student LMS analytics export — Q106, Q116',
  'Light theme',
];

function PhaseBlock({ phase, items, bg, border, color, tag }) {
  return (
    <div style={{ borderRadius: 12, padding: 16, marginBottom: 12, background: bg, border: `1px solid ${border}` }}>
      <div style={{ fontWeight: 800, fontSize: 15, color, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        {phase}
        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
          letterSpacing: '.5px', textTransform: 'uppercase',
          background: bg, color, border: `1px solid ${border}` }}>{tag}</span>
      </div>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,.04)', fontSize: 12 }}>
          <div style={{ flexShrink: 0, width: 16, textAlign: 'center', color }}>{phase.startsWith('✓') ? '✅' : phase.startsWith('V1') ? '⏳' : '🔒'}</div>
          <div>{item}</div>
        </div>
      ))}
    </div>
  );
}

export default function Roadmap() {
  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Project Roadmap</div>
      <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
        What's built, what's coming — MVP → V1 → V2
      </div>
      <PhaseBlock
        phase="✓ Summer MVP — 12 weeks"
        items={MVP}
        bg="rgba(16,185,129,.06)" border="rgba(16,185,129,.3)" color="var(--green)" tag="DONE"
      />
      <PhaseBlock
        phase="V1 — Phase 2 (post-NSF-review)"
        items={V1}
        bg="rgba(245,158,11,.06)" border="rgba(245,158,11,.3)" color="var(--yellow)" tag="V1"
      />
      <PhaseBlock
        phase="V2 — Future"
        items={V2}
        bg="rgba(139,92,246,.06)" border="rgba(139,92,246,.3)" color="var(--purple)" tag="V2"
      />
    </div>
  );
}
