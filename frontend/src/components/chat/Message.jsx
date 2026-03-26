import Avatar from '../ui/Avatar.jsx';

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

export default function Message({ message }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '4px 16px', borderRadius: 'var(--radius-sm)' }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <Avatar src={message.avatar} name={message.display_name || message.username} size={40} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
          <span style={{ fontWeight: 600, color: 'var(--color-text-heading)', fontSize: 14 }}>
            {message.display_name || message.username}
          </span>
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{formatTime(message.created_at)}</span>
          {message.edited_at && <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>(bearbeitet)</span>}
        </div>
        {message.content && (
          <p style={{ fontSize: 14, lineHeight: 1.5, wordBreak: 'break-word', color: 'var(--color-text)' }}>
            {message.content}
          </p>
        )}
        {message.attachments?.map(att => (
          <div key={att.id} style={{ marginTop: 8 }}>
            {att.mimetype?.startsWith('image/') ? (
              <img src={att.url} alt={att.filename}
                style={{ maxWidth: 400, maxHeight: 300, borderRadius: 'var(--radius-sm)', objectFit: 'contain' }} />
            ) : (
              <a href={att.url} download={att.filename}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--color-tertiary)', borderRadius: 'var(--radius-sm)', color: 'var(--color-primary)', fontSize: 13 }}>
                📎 {att.filename} ({(att.size / 1024).toFixed(1)} KB)
              </a>
            )}
          </div>
        ))}
        {message.reactions?.length > 0 && (
          <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
            {message.reactions.map((r, i) => (
              <span key={i} style={{ background: 'var(--color-tertiary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-full)', padding: '2px 8px', fontSize: 13, cursor: 'pointer' }}>
                {r.emoji} {r.count}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
