import { useNavigate } from 'react-router-dom';
import { useRole } from '../contexts/RoleContext';

const ROLES = [
  {
    id: 'instructor',
    label: 'Instructor',
    icon: '📋',
    desc: 'Generate attack dossiers, design lab exercises, build scenario assessments, align to course modules',
    route: '/instructor',
    nameColor: 'var(--blue)',
  },
  {
    id: 'student',
    label: 'Student',
    icon: '🎓',
    desc: 'Explore attack cases interactively, trace cross-plane chains, complete lab assignments',
    route: '/student',
    nameColor: 'var(--teal)',
  },
  {
    id: 'researcher',
    label: 'Security Researcher',
    icon: '🔬',
    desc: 'Analyze patterns, trace vulnerability chains, validate provenance, run graph queries',
    route: '/researcher',
    nameColor: 'var(--purple)',
  },
];

export default function RoleSelection() {
  const { selectRole } = useRole();
  const navigate = useNavigate();

  const enter = (r) => {
    selectRole(r.id);
    navigate(r.route);
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh', padding: '40px 20px',
      background: 'radial-gradient(ellipse at 30% 20%,rgba(0,201,167,.06) 0%,transparent 60%),radial-gradient(ellipse at 70% 80%,rgba(59,130,246,.05) 0%,transparent 60%)',
    }}>
      <div style={{
        fontSize: 30, fontWeight: 800, letterSpacing: 1, marginBottom: 6,
        background: 'linear-gradient(90deg,var(--teal),var(--blue))',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      }}>
        ⚡ CyberKG-CPS Attack Analyzer
      </div>
      <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 10, textAlign: 'center' }}>
        Knowledge Graph Platform for Cyber-Physical Security Education
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 40, justifyContent: 'center', flexWrap: 'wrap' }}>
        {[
          { label: '✓ MVP · Summer 2026 · 4 Cases', bg: 'var(--mvp-bg)', color: 'var(--mvp-text)', border: 'var(--mvp-border)' },
          { label: 'V1 · Phase 2 · 10 Cases + LLM',  bg: 'var(--v1-bg)',  color: 'var(--v1-text)',  border: 'var(--v1-border)' },
        ].map(t => (
          <span key={t.label} style={{
            display:'inline-flex', alignItems:'center', fontSize:9, fontWeight:700,
            padding:'2px 8px', borderRadius:10, letterSpacing:'.5px', textTransform:'uppercase',
            background: t.bg, color: t.color, border: `1px solid ${t.border}`,
          }}>{t.label}</span>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
        {ROLES.map((r) => (
          <div
            key={r.id}
            onClick={() => enter(r)}
            style={{
              background: 'var(--bg2)', border: '1px solid var(--color-border)',
              borderRadius: 16, padding: '32px 28px', width: 270, cursor: 'pointer',
              textAlign: 'center', transition: 'all .2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--teal)';
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,201,167,.12)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--color-border)';
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 16 }}>{r.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: r.nameColor }}>{r.label}</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
              {r.desc}
            </div>
            <button
              style={{
                width: '100%', padding: '10px 0', border: 'none', borderRadius: 8,
                background: 'var(--teal)', color: '#000', fontWeight: 700, fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Enter as {r.label}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
