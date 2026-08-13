/**
 * Reusable KPI stats card row — used by all three role dashboard home pages.
 * Each card: { label: string, value: number|undefined }
 * Shows a teal-accented spinner/dash when value is undefined (still loading).
 */
export default function StatsCards({ cards = [] }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${Math.min(cards.length, 4)}, 1fr)`,
      gap: 12,
      marginBottom: 20,
    }}>
      {cards.map(({ label, value }) => (
        <div
          key={label}
          style={{
            background: 'var(--bg3)',
            border: '1px solid var(--color-border)',
            borderRadius: 10,
            padding: '14px 18px',
          }}
        >
          <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', fontWeight: 600, letterSpacing: '.05em', marginBottom: 6 }}>
            {label.toUpperCase()}
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: value != null ? 'var(--teal)' : 'var(--color-text-secondary)' }}>
            {value != null ? value.toLocaleString() : '—'}
          </div>
        </div>
      ))}
    </div>
  );
}
