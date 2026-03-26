import { useChatStore } from '../../store/chat.js';
import { getSocket } from '../../hooks/useSocket.js';

export default function ChannelSidebar({ onVoiceJoin }) {
  const { activeServer, channels, activeChannel, setActiveChannel } = useChatStore();
  const socket = getSocket();

  const textChannels = channels.filter(c => c.type === 'text');
  const voiceChannels = channels.filter(c => c.type === 'voice');

  const selectChannel = (ch) => {
    if (activeChannel?.type === 'text') socket?.emit('channel:leave', activeChannel.id);
    setActiveChannel(ch);
    if (ch.type === 'text') socket?.emit('channel:join', ch.id);
    else onVoiceJoin?.(ch.id);
  };

  const channelStyle = (ch) => ({
    padding: '6px 16px', cursor: 'pointer', borderRadius: 'var(--radius-sm)',
    margin: '1px 8px', display: 'flex', alignItems: 'center', gap: 8,
    background: activeChannel?.id === ch.id ? 'rgba(88,101,242,0.2)' : 'transparent',
    color: activeChannel?.id === ch.id ? 'var(--color-text-heading)' : 'var(--color-text-muted)'
  });

  const sectionLabel = (label) => (
    <div style={{ padding: '8px 16px 4px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)' }}>
      {label}
    </div>
  );

  return (
    <div style={{ width: 240, background: 'var(--color-secondary)', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--color-border)', flexShrink: 0 }}>
      <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)', fontWeight: 700, color: 'var(--color-text-heading)' }}>
        {activeServer?.name || 'Server'}
      </div>
      <div style={{ overflowY: 'auto', flex: 1, padding: '8px 0' }}>
        {textChannels.length > 0 && (
          <div>
            {sectionLabel('Text Channels')}
            {textChannels.map(ch => (
              <div key={ch.id} onClick={() => selectChannel(ch)} style={channelStyle(ch)}>
                <span style={{ fontSize: 16 }}>#</span>
                <span style={{ fontSize: 14 }}>{ch.name}</span>
              </div>
            ))}
          </div>
        )}
        {voiceChannels.length > 0 && (
          <div style={{ marginTop: 8 }}>
            {sectionLabel('Voice Channels')}
            {voiceChannels.map(ch => (
              <div key={ch.id} onClick={() => selectChannel(ch)} style={channelStyle(ch)}>
                <span style={{ fontSize: 16 }}>🔊</span>
                <span style={{ fontSize: 14 }}>{ch.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
