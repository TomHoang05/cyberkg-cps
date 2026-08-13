import { useNavigate, useLocation } from 'react-router-dom';
import { useRole } from '../../contexts/RoleContext';

const ROLE_STYLE = {
  instructor: { background: 'rgba(59,130,246,.15)', color: 'var(--blue)' },
  student:    { background: 'rgba(0,201,167,.15)',  color: 'var(--teal)' },
  researcher: { background: 'rgba(139,92,246,.15)', color: 'var(--purple)' },
};

// Nav links per role.  Use null as a separator (renders a thin vertical rule).
const NAV = {
  instructor: [
    { label: 'SCR-INS-01 · Dashboard',         path: '/instructor' },
    { label: 'SCR-INS-02 · Attack Browser',     path: '/instructor/browse' },
    { label: 'SCR-INS-03 · Attack Graph Explorer', path: '/instructor/explore/colonial_pipeline_2021' },
    { label: 'SCR-INS-06 · Export & Settings',  path: '/instructor/export' },
    null,
    { label: 'Lab Builder',    path: '/instructor/lab' },
    { label: 'Assessment',     path: '/instructor/assess' },
    { label: 'Comparative Attack Analysis', path: '/instructor/compare' },
    { label: 'Module Alignment Map',        path: '/instructor/modules' },
    { label: 'Roadmap',                     path: '/instructor/roadmap' },
  ],
  student: [
    { label: 'SCR-STU-01 · Dashboard',         path: '/student' },
    { label: 'SCR-STU-02 · Scenario Explorer',  path: '/student/scenarios' },
    { label: 'SCR-STU-03 · Attack Graph View',  path: '/student/graph/colonial_pipeline_2021' },
    null,
    { label: 'ATT&CK Navigator',  path: '/student', v1: true },
    { label: 'Compare',           path: '/student', v1: true },
  ],
  researcher: [
    { label: 'SCR-RES-01 · Dashboard',   path: '/researcher' },
    { label: 'SCR-RES-02 · Query Console', path: '/researcher/query' },
    { label: 'SCR-RES-03 · Entity Explorer', path: '/researcher/entities' },
    { label: 'SCR-RES-04 · Relation Analysis', path: '/researcher/relations' },
    { label: 'SCR-RES-05 · Export & API',  path: '/researcher/provenance' },
    null,
    { label: 'ATT&CK Nav',           path: '/researcher', v1: true },
    { label: 'Annotation / LLM Pipeline', path: '/researcher', v1: true },
  ],
};

export default function AppHeader() {
  const { role, clearRole } = useRole();
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => { clearRole(); navigate('/'); };
  const links = (role && NAV[role]) || [];

  return (
    <header style={{
      background: 'var(--bg2)', borderBottom: '1px solid var(--color-border)',
      padding: '0 20px', display: 'flex', alignItems: 'center', gap: 10,
      height: 'var(--header-h)', position: 'sticky', top: 0, zIndex: 100,
      flexWrap: 'nowrap', overflowX: 'auto',
    }}>
      {/* Brand */}
      <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--teal)', whiteSpace: 'nowrap', flexShrink: 0 }}>
        ⚡ CyberKG-CPS
      </span>

      {/* Role badge */}
      {role && (
        <span style={{
          fontSize: 10, padding: '3px 9px', borderRadius: 20, fontWeight: 700,
          flexShrink: 0, ...(ROLE_STYLE[role] || {}),
        }}>
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </span>
      )}

      {/* Nav links */}
      <nav style={{ display: 'flex', gap: 2, overflowX: 'auto', padding: '4px 0' }}>
        {links.map((item, idx) => {
          // Separator
          if (item === null) {
            return (
              <div key={`sep-${idx}`} style={{
                width: 1, background: 'var(--color-border)', alignSelf: 'stretch', margin: '6px 4px', flexShrink: 0,
              }} />
            );
          }
          const { label, path, v1 } = item;
          const active = location.pathname === path || (path !== `/${role}` && location.pathname.startsWith(path));
          return (
            <button
              key={path + label}
              onClick={() => !v1 && navigate(path)}
              style={{
                background: active && !v1 ? 'var(--bg3)' : 'none',
                border: 'none',
                color: v1 ? 'var(--v1-text)' : active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                fontWeight: active && !v1 ? 600 : 400,
                padding: '6px 11px', borderRadius: 7, fontSize: 12,
                cursor: v1 ? 'default' : 'pointer', whiteSpace: 'nowrap', transition: '.15s',
                opacity: v1 ? .65 : 1,
              }}
            >
              {label}{v1 ? ' 🔒' : ''}
            </button>
          );
        })}
      </nav>

      {/* Back button */}
      <button
        onClick={handleBack}
        style={{
          marginLeft: 'auto', background: 'none',
          border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)',
          padding: '5px 12px', borderRadius: 7, fontSize: 11,
          cursor: 'pointer', flexShrink: 0,
        }}
      >
        ← Roles
      </button>
    </header>
  );
}
