import { X } from 'lucide-react';

const EVIDENCE_COLORS = {
  documented_fact:         '#10B981',
  supported_inference:     '#F59E0B',
  instructional_extension: '#64748b',
};

export default function EntityDetailPanel({ node, onClose }) {
  if (!node) return null;

  const props = node.properties || {};
  const evidenceColor = EVIDENCE_COLORS[props.evidence_class] || '#64748b';

  return (
    <div style={{
      position: 'absolute', top: 12, right: 12, width: 240,
      background: 'var(--bg4)', border: '1px solid var(--color-border)',
      borderRadius: 12, padding: 14, zIndex: 10,
      boxShadow: '0 4px 24px rgba(0,0,0,.5)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {props.name || node.id}
        </span>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: 2, flexShrink: 0 }}
        >
          <X size={14} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11 }}>
        <Row label="Type"   value={node.type} />
        {props.plane        && <Row label="Plane"        value={props.plane} />}
        {props.purdue_level !== undefined && <Row label="Purdue Level" value={`L${props.purdue_level}`} />}
        {props.tactic       && <Row label="Tactic"       value={props.tactic} />}
        {props.severity     && <Row label="Severity"     value={props.severity} />}
        {props.evidence_class && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>Evidence</span>
            <span style={{ fontWeight: 600, color: evidenceColor }}>
              {props.evidence_class.replace(/_/g, ' ')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
      <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', textTransform: 'capitalize' }}>{value}</span>
    </div>
  );
}
