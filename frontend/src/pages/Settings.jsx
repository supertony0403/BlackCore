import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.js';
import { updateMe, enable2FA, verify2FA, disable2FA, logout } from '../api/index.js';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Avatar from '../components/ui/Avatar.jsx';

const NAV_ITEMS = ['Mein Konto', 'Profil', 'Datenschutz & Sicherheit', 'Erscheinungsbild', 'Benachrichtigungen'];

export default function Settings() {
  const { user, token, setAuth, logout: authLogout } = useAuthStore();
  const navigate = useNavigate();
  const [active, setActive] = useState('Mein Konto');
  const [form, setForm] = useState({ display_name: user?.display_name || '', password: '', new_password: '' });
  const [twoFAData, setTwoFAData] = useState(null);
  const [totpCode, setTotpCode] = useState('');
  const [msg, setMsg] = useState('');

  const saveProfile = async () => {
    try {
      const payload = {};
      if (form.display_name && form.display_name !== user?.display_name) payload.display_name = form.display_name;
      if (form.password && form.new_password) {
        payload.password = form.password;
        payload.new_password = form.new_password;
      }
      if (!Object.keys(payload).length) { setMsg('Keine Änderungen'); return; }
      const { data } = await updateMe(payload);
      setAuth({ ...user, ...data }, token);
      setMsg('Gespeichert!');
      setForm(f => ({ ...f, password: '', new_password: '' }));
    } catch (err) {
      setMsg(err.response?.data?.error || 'Fehler beim Speichern');
    }
  };

  const setup2FA = async () => {
    try {
      const { data } = await enable2FA();
      setTwoFAData(data);
    } catch {
      setMsg('Fehler beim Einrichten von 2FA');
    }
  };

  const confirm2FA = async () => {
    try {
      await verify2FA(totpCode);
      setMsg('2FA aktiviert!');
      setTwoFAData(null);
      setTotpCode('');
      setAuth({ ...user, two_fa_enabled: true }, token);
    } catch {
      setMsg('Ungültiger Code');
    }
  };

  const handleDisable2FA = async () => {
    try {
      await disable2FA();
      setAuth({ ...user, two_fa_enabled: false }, token);
      setMsg('2FA deaktiviert');
    } catch {
      setMsg('Fehler beim Deaktivieren');
    }
  };

  const handleLogout = async () => {
    try { await logout(); } catch {}
    authLogout();
    navigate('/login');
  };

  return (
    <div className="pattern-bg" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Linke Navigation */}
      <div style={{
        width: 280, background: 'var(--color-secondary)', borderRight: '1px solid var(--color-border)',
        display: 'flex', flexDirection: 'column', padding: '32px 16px', flexShrink: 0
      }}>
        {/* User Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32, padding: '0 8px' }}>
          <Avatar src={user?.avatar} name={user?.display_name || user?.username} size={40} online={true} />
          <div>
            <div style={{ fontWeight: 700, color: 'var(--color-text-heading)', fontSize: 14 }}>{user?.display_name}</div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>#{user?.username}</div>
          </div>
        </div>

        {/* Nav */}
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', padding: '0 8px', marginBottom: 4, letterSpacing: '0.08em' }}>
          Nutzereinstellungen
        </div>
        {NAV_ITEMS.map(item => (
          <div key={item} onClick={() => setActive(item)}
            style={{
              padding: '8px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 14,
              background: active === item ? 'rgba(88,101,242,0.2)' : 'transparent',
              color: active === item ? 'var(--color-text-heading)' : 'var(--color-text-muted)',
              marginBottom: 2
            }}>
            {item}
          </div>
        ))}

        <div style={{ flex: 1 }} />
        <Button variant="danger" onClick={handleLogout} style={{ width: '100%' }}>Ausloggen</Button>
      </div>

      {/* Rechter Inhalt */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '40px 40px' }}>
        <button onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', marginBottom: 24, fontSize: 14, display: 'flex', alignItems: 'center', gap: 4 }}>
          ← Zurück zum Chat
        </button>

        {active === 'Mein Konto' && (
          <div style={{ maxWidth: 600 }}>
            <h2 style={{ color: 'var(--color-text-heading)', marginBottom: 24, fontSize: 20 }}>Mein Konto</h2>

            {/* Profil-Karte */}
            <div style={{ marginBottom: 24, borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <div style={{ background: 'var(--color-primary)', height: 80, position: 'relative' }}>
                <div style={{ position: 'absolute', bottom: -20, left: 16 }}>
                  <Avatar src={user?.avatar} name={user?.display_name || user?.username} size={56} />
                </div>
              </div>
              <div style={{ background: 'var(--color-secondary)', padding: '28px 16px 16px' }}>
                <span style={{ fontWeight: 700, color: 'var(--color-text-heading)' }}>{user?.display_name}</span>
                <span style={{ color: 'var(--color-text-muted)', marginLeft: 4 }}>#{user?.username}</span>
              </div>
            </div>

            {/* Formular */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
              <Input label="Anzeigename" value={form.display_name}
                onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} />
              <Input label="E-Mail" value={user?.email || ''} disabled />
              <Input label="Aktuelles Passwort" type="password" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              <Input label="Neues Passwort" type="password" value={form.new_password}
                onChange={e => setForm(f => ({ ...f, new_password: e.target.value }))} />
              {msg && (
                <p style={{ color: msg.includes('!') || msg === 'Gespeichert!' ? 'var(--color-success)' : 'var(--color-danger)', fontSize: 14 }}>
                  {msg}
                </p>
              )}
              <Button onClick={saveProfile}>Speichern</Button>
            </div>

            {/* 2FA */}
            <div style={{ padding: 20, background: 'var(--color-secondary)', borderRadius: 'var(--radius-md)' }}>
              <h3 style={{ color: 'var(--color-text-heading)', marginBottom: 8, fontSize: 16 }}>
                Zwei-Faktor-Authentifizierung
              </h3>
              <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 16 }}>
                {user?.two_fa_enabled
                  ? '✅ 2FA ist aktiv. Dein Konto ist zusätzlich geschützt.'
                  : 'Füge eine zusätzliche Sicherheitsebene hinzu.'}
              </p>
              {!twoFAData && !user?.two_fa_enabled && (
                <Button onClick={setup2FA}>2FA aktivieren</Button>
              )}
              {user?.two_fa_enabled && (
                <Button variant="danger" onClick={handleDisable2FA}>2FA deaktivieren</Button>
              )}
              {twoFAData && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                    Scanne diesen QR-Code mit Google Authenticator oder einer anderen TOTP-App:
                  </p>
                  <img src={twoFAData.qr} alt="2FA QR-Code"
                    style={{ width: 180, borderRadius: 'var(--radius-md)', background: '#fff', padding: 8 }} />
                  <p style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                    Manueller Code: {twoFAData.secret}
                  </p>
                  <Input label="Code bestätigen" value={totpCode}
                    onChange={e => setTotpCode(e.target.value)} placeholder="6-stelliger Code" />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button onClick={confirm2FA}>Bestätigen</Button>
                    <Button variant="secondary" onClick={() => { setTwoFAData(null); setTotpCode(''); }}>Abbrechen</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {active !== 'Mein Konto' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12, color: 'var(--color-text-muted)' }}>
            <span style={{ fontSize: 48 }}>🚧</span>
            <p style={{ fontSize: 16 }}>{active} — kommt bald</p>
          </div>
        )}
      </div>
    </div>
  );
}
