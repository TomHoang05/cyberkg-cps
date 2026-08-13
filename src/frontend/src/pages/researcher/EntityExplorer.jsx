export default function EntityExplorer() {
  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
        Entity Explorer
        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
          letterSpacing: '.5px', textTransform: 'uppercase',
          background: 'rgba(139,92,246,.12)', color: 'var(--purple)', border: '1px solid rgba(139,92,246,.3)' }}>
          SCR-RES-03
        </span>
        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
          letterSpacing: '.5px', textTransform: 'uppercase',
          background: 'var(--v1-bg)', color: 'var(--v1-text)', border: '1px solid var(--v1-border)' }}>
          V1 · Phase 2
        </span>
      </div>
      <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 24 }}>
        Browse and filter all KG entities by type, plane, and evidence class
      </div>

      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--v1-border)',
        borderRadius: 12, padding: 24, opacity: .7, textAlign: 'center',
      }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🔬</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--v1-text)', marginBottom: 4 }}>Coming in Phase 2</div>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
          Entity browser with full-text search, type filters, and inline graph preview.
        </div>
      </div>
    </div>
  );
}
