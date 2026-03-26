import { useChatStore } from '../../store/chat.js';
import Avatar from '../ui/Avatar.jsx';

export default function MemberList({ members = [] }) {
  const { onlineUsers } = useChatStore();
  const online = members.filter(m => onlineUsers.has(m.id));
  const offline = members.filter(m => !onlineUsers.has(m.id));

  const MemberItem = ({ member, isOnline }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', borderRadius: 'var(--radius-sm)' }}>
      <Avatar src={member.avatar} name={member.display_name || member.username} size={32} online={isOnline} />
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: isOnline ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
          {member.display_name || member.username}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ width: 240, background: 'var(--color-secondary)', borderLeft: '1px solid var(--color-border)', overflowY: 'auto', flexShrink: 0, padding: '16px 8px' }}>
      {online.length > 0 && (
        <div>
          <div style={{ padding: '0 8px 4px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.08em' }}>
            Online — {online.length}
          </div>
          {online.map(m => <MemberItem key={m.id} member={m} isOnline />)}
        </div>
      )}
      {offline.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ padding: '0 8px 4px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.08em' }}>
            Offline — {offline.length}
          </div>
          {offline.map(m => <MemberItem key={m.id} member={m} isOnline={false} />)}
        </div>
      )}
      {members.length === 0 && (
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', padding: '8px' }}>Keine Mitglieder</p>
      )}
    </div>
  );
}
