export default function Avatar({ src, name = '?', size = 36, online }) {
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <div style={{ position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: src ? 'transparent' : 'var(--color-primary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', fontSize: size * 0.38, fontWeight: 700, color: '#fff'
      }}>
        {src ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
      </div>
      {online !== undefined && (
        <div style={{
          position: 'absolute', bottom: 0, right: 0,
          width: size * 0.28, height: size * 0.28, borderRadius: '50%',
          background: online ? 'var(--color-online)' : 'var(--color-offline)',
          border: '2px solid var(--color-neutral)'
        }} />
      )}
    </div>
  );
}
