import { useEffect, useRef } from 'react';
import Message from './Message.jsx';
import TypingIndicator from './TypingIndicator.jsx';

export default function MessageList({ messages, channelId }) {
  const bottomRef = useRef(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  return (
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: '16px 0' }}>
      {messages.length === 0 && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 48 }}>#</span>
          <p style={{ fontSize: 14 }}>Beginn des Kanals</p>
        </div>
      )}
      {messages.map(msg => <Message key={msg.id} message={msg} />)}
      <TypingIndicator channelId={channelId} />
      <div ref={bottomRef} />
    </div>
  );
}
