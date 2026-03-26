import { useChatStore } from '../../store/chat.js';
import { useAuthStore } from '../../store/auth.js';

export default function TypingIndicator({ channelId }) {
  const typingUsers = useChatStore(s => s.typingUsers[channelId] || []);
  const me = useAuthStore(s => s.user);
  const others = typingUsers.filter(id => id !== me?.id);
  if (!others.length) return null;
  return (
    <div style={{ padding: '0 16px 4px', fontSize: 12, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ display: 'inline-flex', gap: 3 }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--color-text-muted)', display: 'inline-block', animation: `bounce 1s ${i * 0.2}s infinite` }} />
        ))}
      </span>
      <span>{others.length === 1 ? 'Jemand schreibt' : `${others.length} Personen schreiben`}...</span>
      <style>{`@keyframes bounce { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }`}</style>
    </div>
  );
}
