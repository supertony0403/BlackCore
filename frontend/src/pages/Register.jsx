import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../api/index.js';
import { useAuthStore } from '../store/auth.js';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';

export default function Register() {
  const [form, setForm] = useState({ username: '', display_name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore(s => s.setAuth);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await register(form);
      setAuth(data.user, data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registrierung fehlgeschlagen');
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
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text-heading)' }}>Konto erstellen</h1>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Username" value={form.username}
            onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
          <Input label="Anzeigename" value={form.display_name}
            onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} />
          <Input label="E-Mail" type="email" value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          <Input label="Passwort" type="password" value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          {error && <p style={{ color: 'var(--color-danger)', fontSize: 14 }}>{error}</p>}
          <Button type="submit" disabled={loading} style={{ width: '100%', marginTop: 8 }}>
            {loading ? 'Registrieren...' : 'Konto erstellen'}
          </Button>
        </form>
        <p style={{ marginTop: 16, fontSize: 14, color: 'var(--color-text-muted)' }}>
          Schon ein Konto?{' '}
          <Link to="/login" style={{ color: 'var(--color-primary)' }}>Einloggen</Link>
        </p>
      </div>
    </div>
  );
}
