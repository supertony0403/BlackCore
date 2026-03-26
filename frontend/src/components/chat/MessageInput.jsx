import { useState, useRef } from 'react';
import { getSocket } from '../../hooks/useSocket.js';
import { uploadFile } from '../../api/index.js';
import { useChatStore } from '../../store/chat.js';

export default function MessageInput({ channelId, channelName }) {
  const [content, setContent] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const socket = getSocket();
  const addMessage = useChatStore(s => s.addMessage);

  const send = () => {
    if (!content.trim() || !channelId) return;
    socket?.emit('message:send', { channelId, content });
    setContent('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    else socket?.emit('typing:start', { channelId });
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file || !channelId) return;
    setUploading(true);
    try {
      const { data } = await uploadFile(channelId, file);
      addMessage(channelId, { id: data.messageId, content: '', attachments: [data.attachment], reactions: [], created_at: new Date().toISOString() });
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
      fileRef.current.value = '';
    }
  };

  return (
    <div style={{ padding: '0 16px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', background: 'var(--color-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', gap: 8, padding: '0 8px' }}>
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: 20, padding: 8, display: 'flex', opacity: uploading ? 0.5 : 1 }}>
          {uploading ? '⏳' : '+'}
        </button>
        <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={handleFile} />
        <input value={content} onChange={e => setContent(e.target.value)} onKeyDown={handleKey}
          placeholder={`Nachricht an #${channelName || 'channel'}`}
          style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--color-text)', fontSize: 14, padding: '14px 0' }} />
      </div>
    </div>
  );
}
