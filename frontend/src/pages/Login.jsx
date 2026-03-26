import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../api/index.js';
import { useAuthStore } from '../store/auth.js';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '', totp_code: '' });
  const [requires2FA, setRequires2FA] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore(s => s.setAuth);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await login(form);
      if (data.requires_2fa) { setRequires2FA(true); setLoading(false); return; }
      setAuth(data.user, data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pattern-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        background: 'var(--color-secondary)', borderRadius: 'var(--radius-lg)',
        padding: 40, width: '100%', maxWidth: 420, boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/src/assets/logo.svg" alt="BlackCore" style={{ width: 48, margin: '0 auto 16px' }} />
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text-heading)' }}>Welcome back!</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginTop: 4 }}>Schön, dich wieder zu sehen!</p>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="E-Mail" type="email" value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          <Input label="Passwort" type="password" value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          {requires2FA && (
            <Input label="2FA Code" value={form.totp_code}
              onChange={e => setForm(f => ({ ...f, totp_code: e.target.value }))}
              placeholder="6-stelliger Code" />
          )}
          {error && <p style={{ color: 'var(--color-danger)', fontSize: 14 }}>{error}</p>}
          <Button type="submit" disabled={loading} style={{ width: '100%', marginTop: 8 }}>
            {loading ? 'Einloggen...' : 'Einloggen'}
          </Button>
        </form>
        <p style={{ marginTop: 16, fontSize: 14, color: 'var(--color-text-muted)' }}>
          Noch kein Konto?{' '}
          <Link to="/register" style={{ color: 'var(--color-primary)' }}>Registrieren</Link>
        </p>
      </div>
    </div>
  );
}
