import { useEffect, useState } from 'react';
import { useChatStore } from '../store/chat.js';
import { useSocket } from '../hooks/useSocket.js';
import { useVoice } from '../hooks/useVoice.js';
import { getServers, getChannels, getMessages } from '../api/index.js';
import ServerSidebar from '../components/layout/ServerSidebar.jsx';
import ChannelSidebar from '../components/layout/ChannelSidebar.jsx';
import MemberList from '../components/layout/MemberList.jsx';
import MessageList from '../components/chat/MessageList.jsx';
import MessageInput from '../components/chat/MessageInput.jsx';

export default function Dashboard() {
  const { activeServer, activeChannel, messages, setServers, setChannels } = useChatStore();
  const [voiceChannelId, setVoiceChannelId] = useState(null);
  useSocket();
  const { muted, toggleMute } = useVoice(voiceChannelId);

  useEffect(() => {
    getServers().then(({ data }) => setServers(data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!activeServer) return;
    getChannels(activeServer.id).then(({ data }) => setChannels(data)).catch(() => {});
  }, [activeServer]);

  useEffect(() => {
    if (!activeChannel || activeChannel.type !== 'text') return;
    getMessages(activeChannel.id).then(({ data }) => {
      useChatStore.getState().setMessages(activeChannel.id, data);
    }).catch(() => {});
  }, [activeChannel]);

  const channelMessages = activeChannel ? (messages[activeChannel.id] || []) : [];

  return (
    <div className="pattern-bg" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <ServerSidebar />

      {activeServer && <ChannelSidebar onVoiceJoin={setVoiceChannelId} />}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {activeChannel ? (
          <>
            {/* Header */}
            <div style={{
              padding: '0 16px', height: 48, display: 'flex', alignItems: 'center',
              borderBottom: '1px solid var(--color-border)', gap: 8, flexShrink: 0,
              background: 'rgba(0,0,0,0.2)'
            }}>
              <span style={{ fontSize: 18, color: 'var(--color-text-muted)' }}>
                {activeChannel.type === 'voice' ? '🔊' : '#'}
              </span>
              <span style={{ fontWeight: 600, color: 'var(--color-text-heading)' }}>
                {activeChannel.name}
              </span>
              {voiceChannelId && activeChannel.type === 'voice' && (
                <>
                  <div style={{ flex: 1 }} />
                  <button onClick={toggleMute} style={{
                    background: muted ? 'var(--color-danger)' : 'var(--color-success)',
                    color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)',
                    padding: '4px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 600
                  }}>
                    {muted ? '🔇 Stumm' : '🎙️ Aktiv'}
                  </button>
                  <button onClick={() => setVoiceChannelId(null)} style={{
                    background: 'var(--color-danger)', color: '#fff', border: 'none',
                    borderRadius: 'var(--radius-sm)', padding: '4px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 600
                  }}>
                    Verlassen
                  </button>
                </>
              )}
            </div>

            {activeChannel.type === 'text' ? (
              <>
                <MessageList messages={channelMessages} channelId={activeChannel.id} />
                <MessageInput channelId={activeChannel.id} channelName={activeChannel.name} />
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
                <span style={{ fontSize: 64 }}>🔊</span>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 18 }}>{activeChannel.name}</p>
                {!voiceChannelId && (
                  <button onClick={() => setVoiceChannelId(activeChannel.id)} style={{
                    background: 'var(--color-success)', color: '#fff', border: 'none',
                    borderRadius: 'var(--radius-sm)', padding: '10px 24px', cursor: 'pointer',
                    fontWeight: 600, fontSize: 15
                  }}>
                    Beitreten
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: 'var(--color-text-muted)' }}>
            <span style={{ fontSize: 64 }}>👾</span>
            <p style={{ fontSize: 18 }}>{activeServer ? 'Kanal auswählen' : 'Server auswählen oder erstellen'}</p>
          </div>
        )}
      </div>

      {activeServer && <MemberList members={[]} />}
    </div>
  );
}
