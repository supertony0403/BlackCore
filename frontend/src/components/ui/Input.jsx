export default function Input({ label, type = 'text', value, onChange, placeholder, error, disabled }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>
          {label}
        </label>
      )}
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
        style={{
          background: 'var(--color-tertiary)', border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border)'}`,
          borderRadius: 'var(--radius-sm)', padding: '10px 12px', color: 'var(--color-text)',
          fontSize: 16, outline: 'none', width: '100%', transition: 'border-color 0.15s'
        }}
        onFocus={e => { if (!error) e.target.style.borderColor = 'var(--color-primary)'; }}
        onBlur={e => { if (!error) e.target.style.borderColor = 'var(--color-border)'; }}
      />
      {error && <span style={{ fontSize: 12, color: 'var(--color-danger)' }}>{error}</span>}
    </div>
  );
}
