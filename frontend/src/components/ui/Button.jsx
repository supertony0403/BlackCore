export default function Button({ children, variant = 'primary', size = 'md', disabled, onClick, type = 'button', style }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 'var(--radius-sm)', fontWeight: 600,
    fontSize: size === 'sm' ? 13 : 14, transition: 'background 0.15s, opacity 0.15s',
    padding: size === 'sm' ? '6px 12px' : '10px 20px',
    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
    border: '1px solid transparent', ...style
  };
  const variants = {
    primary: { background: 'var(--color-primary)', color: '#fff' },
    secondary: { background: 'var(--color-secondary)', color: 'var(--color-text)', border: '1px solid var(--color-border)' },
    inverted: { background: '#fff', color: 'var(--color-primary)' },
    outlined: { background: 'transparent', color: 'var(--color-primary)', border: '1px solid var(--color-primary)' },
    danger: { background: 'var(--color-danger)', color: '#fff' }
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      style={{ ...base, ...variants[variant] }}>
      {children}
    </button>
  );
}
