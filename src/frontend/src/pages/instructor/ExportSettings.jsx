import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DownloadDossierButton from '../../components/shared/DownloadDossierButton';

const ATTACKS = [
  { value: 'colonial_pipeline_2021', label: 'Colonial Pipeline (2021)' },
  { value: 'triton_2017',            label: 'TRITON / TRISIS (2017)' },
  { value: 'german_steel_mill_2014', label: 'German Steel Mill (2014)' },
  { value: 'stuxnet_2010',           label: 'Stuxnet (2010)' },
];

const LESSON_PLAN = [
  { time: '0–10 min',  segment: 'Introduction',       activity: 'Historical context, key firsts, attribution — Colonial Pipeline 2021', slide: 'S1' },
  { time: '10–25 min', segment: 'IT-OT Timeline',     activity: 'Walk IT-to-OT movement steps; students identify Purdue levels',        slide: 'S2' },
  { time: '25–40 min', segment: '4-Plane Analysis',   activity: 'Cyber → Physical → Human chain; cross-plane reasoning exercise',       slide: 'S3' },
  { time: '40–55 min', segment: 'Bridge & Consequence', activity: 'Bridge type classification; consequence taxonomy; Q&A discussion',  slide: 'S4' },
  { time: '55–65 min', segment: 'Assessment',         activity: 'Fill-in-the-blank attack chain; scenario-based question',              slide: 'S5' },
  { time: '65–75 min', segment: 'Wrap-up',            activity: 'Key takeaways; next module preview; lab assignment',                   slide: 'S6' },
];

function MvpTag() {
  return <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10, letterSpacing: '.5px', textTransform: 'uppercase', background: 'var(--mvp-bg)', color: 'var(--mvp-text)', border: '1px solid var(--mvp-border)' }}>MVP</span>;
}
function V1Tag() {
  return <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10, letterSpacing: '.5px', textTransform: 'uppercase', background: 'var(--v1-bg)', color: 'var(--v1-text)', border: '1px solid var(--v1-border)' }}>V1</span>;
}
function V2Tag() {
  return <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10, letterSpacing: '.5px', textTransform: 'uppercase', background: 'rgba(139,92,246,.15)', color: 'var(--v2-text)', border: '1px solid var(--v2-border)' }}>V2</span>;
}

function Card({ children, style }) {
  return <div style={{ background: 'var(--bg2)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 18, ...style }}>{children}</div>;
}
function SecHead({ children }) {
  return <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>{children}</div>;
}

export default function ExportSettings() {
  const navigate = useNavigate();
  const [selectedAttack, setSelectedAttack] = useState('colonial_pipeline_2021');
  const selectedLabel = ATTACKS.find(a => a.value === selectedAttack)?.label?.split(' (')[0] || 'Colonial Pipeline';

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
        Export &amp; Settings
        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
          letterSpacing: '.5px', textTransform: 'uppercase',
          background: 'rgba(0,201,167,.12)', color: 'var(--teal)', border: '1px solid rgba(0,201,167,.3)' }}>
          SCR-INS-06
        </span>
        <MvpTag />
      </div>
      <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 20 }}>
        Download the instructional package for the selected case and configure instructor preferences
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Export card */}
        <Card>
          <SecHead>📦 Export — {selectedLabel} <MvpTag /></SecHead>

          {/* Attack selector */}
          <div style={{ marginBottom: 14, maxWidth: 300 }}>
            <label style={{ fontSize: 11, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 5, fontWeight: 600 }}>Select Attack Case</label>
            <select value={selectedAttack} onChange={e => setSelectedAttack(e.target.value)} style={{ width: '100%' }}>
              {ATTACKS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>

          {/* DOCX + PDF cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 22, marginBottom: 7 }}>📄</div>
              <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4 }}>Attack Dossier (DOCX)</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 10, lineHeight: 1.6 }}>
                Full teaching package — all 5 outputs, Table 1 annotations, 2-hour lecture format. Scaled to selected deployment size. 3 embedded PNGs (LibreOffice-compatible). NSF Task 2.2 deliverable.
              </div>
              <DownloadDossierButton attackId={selectedAttack} audience="instructor" />
            </div>
            <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 22, marginBottom: 7 }}>📑</div>
              <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4 }}>Attack Dossier (PDF)</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 10, lineHeight: 1.6 }}>
                Print-ready PDF for distribution. Download → V1.
              </div>
              <button disabled style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid var(--v1-border)', background: 'none', color: 'var(--v1-text)', fontWeight: 600, fontSize: 12, cursor: 'not-allowed', opacity: .6 }}>🔒 Download PDF (V1)</button>
            </div>
          </div>

          {/* 75-minute lesson plan */}
          <div style={{ background: 'rgba(0,201,167,.04)', border: '1px solid rgba(0,201,167,.25)', borderRadius: 10, padding: 14, marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--teal)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              📅 75-Minute Lesson Plan
              <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--color-text-secondary)' }}>Q98 · NSF Task 2.2</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Time', 'Segment', 'Activity', 'Slide'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '4px 8px', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '.4px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {LESSON_PLAN.map((r, i) => (
                  <tr key={i} style={{ borderBottom: i < LESSON_PLAN.length - 1 ? '1px solid rgba(255,255,255,.04)' : 'none' }}>
                    <td style={{ padding: '4px 8px', color: 'var(--color-text-secondary)' }}>{r.time}</td>
                    <td style={{ padding: '4px 8px', fontWeight: 600 }}>{r.segment}</td>
                    <td style={{ padding: '4px 8px', color: 'var(--color-text-secondary)' }}>{r.activity}</td>
                    <td style={{ padding: '4px 8px', color: 'var(--teal)', fontWeight: 600 }}>{r.slide}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 8, fontSize: 10, color: 'var(--color-text-secondary)' }}>
              ⚙ Deployment size: <strong>Micro-unit</strong> — automatically scaled from intake form. Instructor notes included in DOCX export.
            </div>
          </div>

          {/* V1 export options */}
          <div style={{ background: 'rgba(245,158,11,.04)', border: '1px solid var(--v1-border)', borderRadius: 10, padding: 12, marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--v1-text)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              V1 Export Options <V1Tag />
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
              🔒 LLM-enriched narrative explanations per attack step and plane (Q125)<br />
              🔒 MITRE ATT&CK Navigator JSON export<br />
              🔒 Comparative dossier (2 attacks side-by-side) — SCR-INS-07
            </div>
          </div>

          {/* V2 export options */}
          <div style={{ background: 'rgba(139,92,246,.04)', border: '1px solid var(--v2-border)', borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--v2-text)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              V2 Export Options <V2Tag />
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
              🔒 Per-student LMS analytics export (SCORM 2004 / Canvas) — Q106, Q116<br />
              🔒 Cross-case provenance bundle (multi-case JSON-LD) — Q117<br />
              🔒 ModuleGen-compatible instructional unit (5+ cases)
            </div>
          </div>
        </Card>

        {/* All 4 attacks download list */}
        <Card>
          <SecHead>📄 All Dossier Downloads <MvpTag /></SecHead>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ATTACKS.map(atk => (
              <div key={atk.value} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg3)', borderRadius: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{atk.label}</span>
                <DownloadDossierButton attackId={atk.value} audience="instructor" />
              </div>
            ))}
          </div>
        </Card>

        {/* API Access */}
        <Card>
          <SecHead>🔑 API Access <V1Tag /></SecHead>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
            🔒 Generate an API key to query the CyberKG-CPS knowledge graph programmatically (read-only, Researcher-scoped). Planned for V1 alongside SCR-RES-05 Export &amp; API Access.
          </div>
        </Card>

        {/* Instructor Settings */}
        <Card>
          <SecHead>⚙ Instructor Settings</SecHead>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            {[
              { label: 'Default Disciplinary Orientation', opts: ['CS/Cybersecurity', 'Electrical/Controls', 'Mechatronics/Robotics', 'IoT/Embedded', 'Interdisciplinary'] },
              { label: 'Default Course Level',             opts: ['Undergraduate — Introductory', 'Undergraduate — Advanced', 'Graduate / MS', 'Professional'] },
              { label: 'Default Deployment Size',          opts: ['Micro-unit (1 class ~75 min)', 'Standard Unit (1 week)', 'Extended Unit (lab project)'] },
              { label: 'Default Content Depth',            opts: ['Conceptual Overview', 'Technical Analysis', 'Research-Level'] },
              { label: 'Theme',                            opts: ['Dark (default)', 'Light (V1)'] },
              { label: 'Notifications',                    opts: ['All updates', 'Important only', 'None'] },
            ].map(f => (
              <div key={f.label}>
                <label style={{ fontSize: 11, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 5, fontWeight: 600 }}>{f.label}</label>
                <select style={{ width: '100%' }}>
                  {f.opts.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
          <button style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'none', color: 'var(--color-text-primary)', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>Save Settings</button>
        </Card>

      </div>
    </div>
  );
}
