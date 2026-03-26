import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../../store/chat.js';
import { createServer } from '../../api/index.js';

export default function ServerSidebar() {
  const { servers, activeServer, setActiveServer, setServers } = useChatStore();
  const navigate = useNavigate();

  const handleCreateServer = async () => {
    const name = prompt('Servername:');
    if (!name) return;
    try {
      const { data } = await createServer({ name });
      setServers([...useChatStore.getState().servers, data]);
      setActiveServer(data);
    } catch (err) {
      alert('Server konnte nicht erstellt werden');
    }
  };

  return (
    <div style={{
      width: 72, background: 'var(--color-neutral)', display: 'flex',
      flexDirection: 'column', alignItems: 'center', padding: '12px 0', gap: 8,
      borderRight: '1px solid var(--color-border)', overflowY: 'auto', flexShrink: 0
    }}>
      {servers.map(server => (
        <div key={server.id} title={server.name}
          onClick={() => setActiveServer(server)}
          style={{
            width: 48, height: 48,
            borderRadius: activeServer?.id === server.id ? 'var(--radius-md)' : '50%',
            background: activeServer?.id === server.id ? 'var(--color-primary)' : 'var(--color-secondary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'border-radius 0.2s, background 0.2s',
            fontSize: 18, fontWeight: 700, color: 'var(--color-text-heading)', flexShrink: 0
          }}>
          {server.icon
            ? <img src={server.icon} alt={server.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
            : server.name.slice(0, 2).toUpperCase()}
        </div>
      ))}
      <div title="Server erstellen" onClick={handleCreateServer}
        style={{
          width: 48, height: 48, borderRadius: '50%', background: 'var(--color-secondary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          fontSize: 24, color: 'var(--color-success)', border: '2px dashed var(--color-border)'
        }}>+</div>
      <div style={{ flex: 1 }} />
      <div title="Einstellungen" onClick={() => navigate('/settings')}
        style={{
          width: 48, height: 48, borderRadius: '50%', background: 'var(--color-secondary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 20
        }}>⚙️</div>
    </div>
  );
}
