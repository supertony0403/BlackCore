# BlackCore Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vollständige React + Vite Web-App mit Login, Dashboard (Chat + Voice), User-Settings — basierend auf dem BlackCore Onyx Design System.

**Architecture:** Single Page App (React + Vite). Zustand für globalen State (Auth + Chat). React Router für Routing. Socket.io-Client für Echtzeit. simple-peer für WebRTC Voice.

**Tech Stack:** React 18, Vite, React Router v6, Zustand, socket.io-client, simple-peer (WebRTC), axios

---

## File Structure

```
frontend/
├── src/
│   ├── main.jsx                     # React Entry
│   ├── App.jsx                      # Router Setup
│   ├── styles/
│   │   └── globals.css              # Design System CSS Variables + Reset
│   ├── api/
│   │   └── index.js                 # Axios Instance + alle API-Calls
│   ├── store/
│   │   ├── auth.js                  # Zustand: user, token, login/logout
│   │   └── chat.js                  # Zustand: servers, channels, messages
│   ├── hooks/
│   │   ├── useSocket.js             # Socket.io-Client Hook
│   │   └── useVoice.js              # WebRTC Voice Hook (simple-peer)
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.jsx           # Primary, Secondary, Outlined, Inverted
│   │   │   ├── Input.jsx            # Text Input mit Label
│   │   │   └── Avatar.jsx           # Nutzer-Avatar mit Online-Indicator
│   │   ├── layout/
│   │   │   ├── ServerSidebar.jsx    # Linke Spalte: Server-Icons
│   │   │   ├── ChannelSidebar.jsx   # Kanal-Liste (Text + Voice)
│   │   │   └── MemberList.jsx       # Rechte Spalte: Online/Offline User
│   │   └── chat/
│   │       ├── MessageList.jsx      # Nachrichtenliste mit Scroll
│   │       ├── Message.jsx          # Einzelne Nachricht (Text + Anhang + Reaktion)
│   │       ├── MessageInput.jsx     # Eingabe + Datei-Upload Button
│   │       └── TypingIndicator.jsx  # "XY schreibt..."
│   ├── pages/
│   │   ├── Login.jsx                # Login-Seite
│   │   ├── Register.jsx             # Registrierung
│   │   ├── Dashboard.jsx            # Haupt-Chat-Ansicht
│   │   └── Settings.jsx             # User-Einstellungen
│   └── assets/
│       └── logo.svg                 # BlackCore Logo (transparent)
├── index.html
├── vite.config.js
├── package.json
└── Dockerfile
```

---

### Task 1: Vite Projekt-Scaffold

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.js`
- Create: `frontend/index.html`
- Create: `frontend/src/main.jsx`

- [ ] **Step 1: package.json erstellen**

```json
{
  "name": "blackcore-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.6.8",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.3",
    "simple-peer": "^9.11.1",
    "socket.io-client": "^4.7.4",
    "zustand": "^4.5.2"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.2.0"
  }
}
```

- [ ] **Step 2: vite.config.js erstellen**

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:4000',
      '/uploads': 'http://localhost:4000',
      '/socket.io': { target: 'http://localhost:4000', ws: true }
    }
  }
});
```

- [ ] **Step 3: index.html erstellen**

```html
<!DOCTYPE html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>BlackCore</title>
    <link rel="icon" type="image/svg+xml" href="/src/assets/logo.svg" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 4: main.jsx erstellen**

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 5: Dependencies installieren**

```bash
cd frontend && npm install
```

Expected: `node_modules/` erstellt.

- [ ] **Step 6: Commit**

```bash
git add frontend/
git commit -m "feat: scaffold react+vite frontend"
```

---

### Task 2: Design System (CSS Variables + Logo)

**Files:**
- Create: `frontend/src/styles/globals.css`
- Create: `frontend/src/assets/logo.svg`

- [ ] **Step 1: globals.css erstellen**

```css
:root {
  --color-primary: #5865F2;
  --color-primary-hover: #4752C4;
  --color-secondary: #1E1E1E;
  --color-tertiary: #0F0F0F;
  --color-neutral: #050505;
  --color-surface: #1a1a2e;
  --color-surface-2: #16213e;
  --color-text: #DCDDDE;
  --color-text-muted: #72767D;
  --color-text-heading: #FFFFFF;
  --color-border: #2C2C2C;
  --color-danger: #ED4245;
  --color-success: #3BA55D;
  --color-online: #3BA55D;
  --color-offline: #747F8D;

  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  --shadow-md: 0 4px 16px rgba(0,0,0,0.4);
  --shadow-lg: 0 8px 32px rgba(0,0,0,0.6);
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html, body, #root {
  height: 100%;
  background: var(--color-neutral);
  color: var(--color-text);
  font-family: var(--font-sans);
  font-size: 16px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

/* Dot-Grid Pattern Hintergrund */
.pattern-bg {
  background-color: var(--color-neutral);
  background-image: radial-gradient(circle, #2a2a2a 1px, transparent 1px);
  background-size: 24px 24px;
}

a { color: inherit; text-decoration: none; }
button { cursor: pointer; border: none; background: none; font-family: inherit; }
input, textarea { font-family: inherit; }
img { max-width: 100%; display: block; }

/* Scrollbar */
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: var(--radius-full); }

/* Layout Helper */
.flex { display: flex; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.gap-1 { gap: 4px; }
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
.gap-4 { gap: 16px; }
.w-full { width: 100%; }
.h-full { height: 100%; }
.flex-1 { flex: 1; }
.overflow-hidden { overflow: hidden; }
.overflow-y-auto { overflow-y: auto; }
```

- [ ] **Step 2: Logo SVG erstellen**

`frontend/src/assets/logo.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none">
  <rect x="4" y="4" width="18" height="18" rx="4" fill="#5865F2"/>
  <rect x="26" y="4" width="18" height="18" rx="4" fill="#5865F2" opacity="0.7"/>
  <rect x="4" y="26" width="18" height="18" rx="4" fill="#5865F2" opacity="0.7"/>
  <rect x="26" y="26" width="18" height="18" rx="4" fill="#5865F2" opacity="0.4"/>
  <path d="M8 13h10M8 17h6" stroke="white" stroke-width="2" stroke-linecap="round"/>
</svg>
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/styles/ frontend/src/assets/
git commit -m "feat: add design system css variables and logo"
```

---

### Task 3: API Client & Stores

**Files:**
- Create: `frontend/src/api/index.js`
- Create: `frontend/src/store/auth.js`
- Create: `frontend/src/store/chat.js`

- [ ] **Step 1: API Client erstellen**

`frontend/src/api/index.js`:
```js
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true
});

let accessToken = null;

export function setToken(token) { accessToken = token; }
export function clearToken() { accessToken = null; }

api.interceptors.request.use(config => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { data } = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        setToken(data.token);
        original.headers.Authorization = `Bearer ${data.token}`;
        return api(original);
      } catch {
        clearToken();
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// Auth
export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
export const logout = () => api.post('/auth/logout');
export const getMe = () => api.get('/users/@me');
export const updateMe = (data) => api.patch('/users/@me', data);
export const enable2FA = () => api.post('/auth/2fa/enable');
export const verify2FA = (code) => api.post('/auth/2fa/verify', { code });
export const disable2FA = () => api.post('/auth/2fa/disable');

// Servers
export const getServers = () => api.get('/servers');
export const createServer = (data) => api.post('/servers', data);
export const getChannels = (serverId) => api.get(`/servers/${serverId}/channels`);
export const createChannel = (serverId, data) => api.post(`/servers/${serverId}/channels`, data);
export const joinServer = (serverId) => api.post(`/servers/${serverId}/join`);

// Channels
export const getMessages = (channelId, params) => api.get(`/channels/${channelId}/messages`, { params });
export const sendMessage = (channelId, content) => api.post(`/channels/${channelId}/messages`, { content });
export const uploadFile = (channelId, file) => {
  const form = new FormData();
  form.append('file', file);
  return api.post(`/channels/${channelId}/upload`, form);
};

export default api;
```

- [ ] **Step 2: Auth Store**

`frontend/src/store/auth.js`:
```js
import { create } from 'zustand';
import { setToken, clearToken, getMe } from '../api/index.js';

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  loading: true,

  setAuth: (user, token) => {
    setToken(token);
    set({ user, token, loading: false });
  },

  logout: () => {
    clearToken();
    set({ user: null, token: null, loading: false });
  },

  loadUser: async () => {
    try {
      const { data } = await getMe();
      set({ user: data, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  }
}));
```

- [ ] **Step 3: Chat Store**

`frontend/src/store/chat.js`:
```js
import { create } from 'zustand';

export const useChatStore = create((set, get) => ({
  servers: [],
  channels: [],
  messages: {},        // { channelId: [...messages] }
  activeServer: null,
  activeChannel: null,
  onlineUsers: new Set(),
  typingUsers: {},     // { channelId: [userId, ...] }

  setServers: (servers) => set({ servers }),
  setChannels: (channels) => set({ channels }),
  setActiveServer: (server) => set({ activeServer: server }),
  setActiveChannel: (channel) => set({ activeChannel: channel }),

  setMessages: (channelId, messages) => set(state => ({
    messages: { ...state.messages, [channelId]: messages }
  })),

  addMessage: (channelId, message) => set(state => ({
    messages: {
      ...state.messages,
      [channelId]: [...(state.messages[channelId] || []), message]
    }
  })),

  setUserOnline: (userId) => set(state => ({
    onlineUsers: new Set([...state.onlineUsers, userId])
  })),

  setUserOffline: (userId) => set(state => {
    const next = new Set(state.onlineUsers);
    next.delete(userId);
    return { onlineUsers: next };
  }),

  setTyping: (channelId, userId) => {
    set(state => ({
      typingUsers: {
        ...state.typingUsers,
        [channelId]: [...new Set([...(state.typingUsers[channelId] || []), userId])]
      }
    }));
    setTimeout(() => {
      set(state => ({
        typingUsers: {
          ...state.typingUsers,
          [channelId]: (state.typingUsers[channelId] || []).filter(id => id !== userId)
        }
      }));
    }, 3000);
  }
}));
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/api/ frontend/src/store/
git commit -m "feat: add api client and zustand stores"
```

---

### Task 4: Hooks (Socket + Voice)

**Files:**
- Create: `frontend/src/hooks/useSocket.js`
- Create: `frontend/src/hooks/useVoice.js`

- [ ] **Step 1: useSocket Hook**

`frontend/src/hooks/useSocket.js`:
```js
import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useChatStore } from '../store/chat.js';
import { useAuthStore } from '../store/auth.js';

let socketInstance = null;

export function useSocket() {
  const token = useAuthStore(s => s.token);
  const { addMessage, setUserOnline, setUserOffline, setTyping } = useChatStore();

  useEffect(() => {
    if (!token || socketInstance) return;

    socketInstance = io('/', { auth: { token }, transports: ['websocket'] });

    socketInstance.on('message:new', ({ channelId, ...msg }) => {
      addMessage(channelId, msg);
    });

    socketInstance.on('user:online', ({ userId }) => setUserOnline(userId));
    socketInstance.on('user:offline', ({ userId }) => setUserOffline(userId));
    socketInstance.on('typing:update', ({ channelId, userId }) => setTyping(channelId, userId));

    return () => {
      socketInstance?.disconnect();
      socketInstance = null;
    };
  }, [token]);

  return socketInstance;
}

export function getSocket() { return socketInstance; }
```

- [ ] **Step 2: useVoice Hook**

`frontend/src/hooks/useVoice.js`:
```js
import { useEffect, useRef, useState } from 'react';
import SimplePeer from 'simple-peer';
import { getSocket } from './useSocket.js';

const STUN_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

export function useVoice(channelId) {
  const [peers, setPeers] = useState({});
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const streamRef = useRef(null);
  const peersRef = useRef({});

  useEffect(() => {
    if (!channelId) return;
    const socket = getSocket();
    if (!socket) return;

    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      .then(stream => {
        streamRef.current = stream;
        socket.emit('voice:join', { channelId });

        socket.on('voice:peer-joined', ({ peerId }) => {
          const peer = new SimplePeer({
            initiator: true,
            stream,
            trickle: true,
            config: STUN_SERVERS
          });

          peer.on('signal', signal => socket.emit('voice:signal', { peerId, signal }));
          peer.on('stream', remoteStream => {
            const audio = new Audio();
            audio.srcObject = remoteStream;
            audio.play();
          });

          peersRef.current[peerId] = peer;
          setPeers(prev => ({ ...prev, [peerId]: peer }));
        });

        socket.on('voice:signal', ({ peerId, signal }) => {
          if (peersRef.current[peerId]) {
            peersRef.current[peerId].signal(signal);
          } else {
            const peer = new SimplePeer({ initiator: false, stream, trickle: true, config: STUN_SERVERS });
            peer.on('signal', s => socket.emit('voice:signal', { peerId, signal: s }));
            peer.on('stream', remoteStream => {
              const audio = new Audio();
              audio.srcObject = remoteStream;
              audio.play();
            });
            peer.signal(signal);
            peersRef.current[peerId] = peer;
            setPeers(prev => ({ ...prev, [peerId]: peer }));
          }
        });

        socket.on('voice:peer-left', ({ peerId }) => {
          peersRef.current[peerId]?.destroy();
          delete peersRef.current[peerId];
          setPeers(prev => { const next = { ...prev }; delete next[peerId]; return next; });
        });
      })
      .catch(err => console.error('Microphone access denied:', err));

    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      Object.values(peersRef.current).forEach(p => p.destroy());
      peersRef.current = {};
      setPeers({});
      socket.emit('voice:leave', { channelId });
      socket.off('voice:peer-joined');
      socket.off('voice:signal');
      socket.off('voice:peer-left');
    };
  }, [channelId]);

  const toggleMute = () => {
    streamRef.current?.getAudioTracks().forEach(t => { t.enabled = muted; });
    setMuted(m => !m);
  };

  return { peers, muted, cameraOn, toggleMute };
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/hooks/
git commit -m "feat: add socket.io and webrtc voice hooks"
```

---

### Task 5: UI Komponenten

**Files:**
- Create: `frontend/src/components/ui/Button.jsx`
- Create: `frontend/src/components/ui/Input.jsx`
- Create: `frontend/src/components/ui/Avatar.jsx`

- [ ] **Step 1: Button.jsx**

```jsx
export default function Button({ children, variant = 'primary', size = 'md', disabled, onClick, type = 'button', style }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 'var(--radius-sm)', fontWeight: 600,
    fontSize: size === 'sm' ? 13 : 14, transition: 'background 0.15s, opacity 0.15s',
    padding: size === 'sm' ? '6px 12px' : '10px 20px',
    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
    border: '1px solid transparent', ...style
  };
  const variants = {
    primary: { background: 'var(--color-primary)', color: '#fff', ':hover': { background: 'var(--color-primary-hover)' } },
    secondary: { background: 'var(--color-secondary)', color: 'var(--color-text)', border: '1px solid var(--color-border)' },
    inverted: { background: '#fff', color: 'var(--color-primary)' },
    outlined: { background: 'transparent', color: 'var(--color-primary)', border: '1px solid var(--color-primary)' },
    danger: { background: 'var(--color-danger)', color: '#fff' }
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      style={{ ...base, ...variants[variant] }}
      onMouseEnter={e => { if (!disabled && variant === 'primary') e.target.style.background = 'var(--color-primary-hover)'; }}
      onMouseLeave={e => { if (!disabled && variant === 'primary') e.target.style.background = 'var(--color-primary)'; }}>
      {children}
    </button>
  );
}
```

- [ ] **Step 2: Input.jsx**

```jsx
export default function Input({ label, type = 'text', value, onChange, placeholder, error, disabled }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>
          {label}
        </label>
      )}
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
        style={{
          background: 'var(--color-tertiary)', border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border)'}`,
          borderRadius: 'var(--radius-sm)', padding: '10px 12px', color: 'var(--color-text)',
          fontSize: 16, outline: 'none', width: '100%',
          transition: 'border-color 0.15s'
        }}
        onFocus={e => { if (!error) e.target.style.borderColor = 'var(--color-primary)'; }}
        onBlur={e => { if (!error) e.target.style.borderColor = 'var(--color-border)'; }}
      />
      {error && <span style={{ fontSize: 12, color: 'var(--color-danger)' }}>{error}</span>}
    </div>
  );
}
```

- [ ] **Step 3: Avatar.jsx**

```jsx
export default function Avatar({ src, name = '?', size = 36, online }) {
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <div style={{ position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: src ? 'transparent' : 'var(--color-primary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', fontSize: size * 0.38, fontWeight: 700, color: '#fff'
      }}>
        {src ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
      </div>
      {online !== undefined && (
        <div style={{
          position: 'absolute', bottom: 0, right: 0,
          width: size * 0.28, height: size * 0.28, borderRadius: '50%',
          background: online ? 'var(--color-online)' : 'var(--color-offline)',
          border: '2px solid var(--color-neutral)'
        }} />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/ui/
git commit -m "feat: add ui components (Button, Input, Avatar)"
```

---

### Task 6: Login & Register Seiten

**Files:**
- Create: `frontend/src/pages/Login.jsx`
- Create: `frontend/src/pages/Register.jsx`
- Create: `frontend/src/App.jsx`

- [ ] **Step 1: App.jsx mit Routing**

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/auth.js';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Settings from './pages/Settings.jsx';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuthStore();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--color-text-muted)' }}>Laden...</div>;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const loadUser = useAuthStore(s => s.loadUser);
  useEffect(() => { loadUser(); }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 2: Login.jsx**

```jsx
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
          <Input label="E-Mail oder Telefon" type="email" value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          <Input label="Passwort" type="password" value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          {requires2FA && (
            <Input label="2FA Code" value={form.totp_code}
              onChange={e => setForm(f => ({ ...f, totp_code: e.target.value }))}
              placeholder="6-stelliger Code aus der App" />
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
```

- [ ] **Step 3: Register.jsx**

```jsx
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
          <Input label="Username" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
          <Input label="Anzeigename" value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} />
          <Input label="E-Mail" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          <Input label="Passwort" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
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
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/App.jsx frontend/src/pages/Login.jsx frontend/src/pages/Register.jsx
git commit -m "feat: add login and register pages"
```

---

### Task 7: Layout Komponenten (Sidebar, Channel, Members)

**Files:**
- Create: `frontend/src/components/layout/ServerSidebar.jsx`
- Create: `frontend/src/components/layout/ChannelSidebar.jsx`
- Create: `frontend/src/components/layout/MemberList.jsx`

- [ ] **Step 1: ServerSidebar.jsx**

```jsx
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../../store/chat.js';
import { createServer } from '../../api/index.js';
import Avatar from '../ui/Avatar.jsx';

export default function ServerSidebar() {
  const { servers, activeServer, setActiveServer, setServers } = useChatStore();
  const navigate = useNavigate();

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
            width: 48, height: 48, borderRadius: activeServer?.id === server.id ? 'var(--radius-md)' : '50%',
            background: activeServer?.id === server.id ? 'var(--color-primary)' : 'var(--color-secondary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'border-radius 0.2s, background 0.2s',
            fontSize: 18, fontWeight: 700, color: 'var(--color-text-heading)',
            flexShrink: 0
          }}>
          {server.icon ? <img src={server.icon} alt={server.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
            : server.name.slice(0, 2).toUpperCase()}
        </div>
      ))}
      <div title="Server erstellen"
        onClick={async () => { const name = prompt('Servername:'); if (name) { const { data } = await createServer({ name }); setServers([...useChatStore.getState().servers, data]); } }}
        style={{
          width: 48, height: 48, borderRadius: '50%', background: 'var(--color-secondary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          fontSize: 24, color: 'var(--color-success)', border: '2px dashed var(--color-border)'
        }}>+</div>
      <div style={{ flex: 1 }} />
      <div title="Einstellungen" onClick={() => navigate('/settings')}
        style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--color-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 20 }}>
        ⚙️
      </div>
    </div>
  );
}
```

- [ ] **Step 2: ChannelSidebar.jsx**

```jsx
import { useChatStore } from '../../store/chat.js';
import { getSocket } from '../../hooks/useSocket.js';

export default function ChannelSidebar({ onVoiceJoin }) {
  const { activeServer, channels, activeChannel, setActiveChannel } = useChatStore();
  const socket = getSocket();

  const textChannels = channels.filter(c => c.type === 'text');
  const voiceChannels = channels.filter(c => c.type === 'voice');

  const selectChannel = (ch) => {
    if (activeChannel) socket?.emit('channel:leave', activeChannel.id);
    setActiveChannel(ch);
    if (ch.type === 'text') socket?.emit('channel:join', ch.id);
    else onVoiceJoin?.(ch.id);
  };

  return (
    <div style={{ width: 240, background: 'var(--color-secondary)', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--color-border)', flexShrink: 0 }}>
      <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)', fontWeight: 700, color: 'var(--color-text-heading)' }}>
        {activeServer?.name || 'Server'}
      </div>
      <div style={{ overflowY: 'auto', flex: 1, padding: '8px 0' }}>
        {textChannels.length > 0 && (
          <div>
            <div style={{ padding: '8px 16px 4px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)' }}>Text Channels</div>
            {textChannels.map(ch => (
              <div key={ch.id} onClick={() => selectChannel(ch)}
                style={{
                  padding: '6px 16px', cursor: 'pointer', borderRadius: 'var(--radius-sm)',
                  margin: '1px 8px', display: 'flex', alignItems: 'center', gap: 8,
                  background: activeChannel?.id === ch.id ? 'rgba(88,101,242,0.2)' : 'transparent',
                  color: activeChannel?.id === ch.id ? 'var(--color-text-heading)' : 'var(--color-text-muted)'
                }}>
                <span style={{ fontSize: 16 }}>#</span>
                <span style={{ fontSize: 14 }}>{ch.name}</span>
              </div>
            ))}
          </div>
        )}
        {voiceChannels.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ padding: '8px 16px 4px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)' }}>Voice Channels</div>
            {voiceChannels.map(ch => (
              <div key={ch.id} onClick={() => selectChannel(ch)}
                style={{
                  padding: '6px 16px', cursor: 'pointer', borderRadius: 'var(--radius-sm)',
                  margin: '1px 8px', display: 'flex', alignItems: 'center', gap: 8,
                  background: activeChannel?.id === ch.id ? 'rgba(88,101,242,0.2)' : 'transparent',
                  color: activeChannel?.id === ch.id ? 'var(--color-text-heading)' : 'var(--color-text-muted)'
                }}>
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
```

- [ ] **Step 3: MemberList.jsx**

```jsx
import { useChatStore } from '../../store/chat.js';
import Avatar from '../ui/Avatar.jsx';

export default function MemberList({ members }) {
  const { onlineUsers } = useChatStore();
  const online = members.filter(m => onlineUsers.has(m.id));
  const offline = members.filter(m => !onlineUsers.has(m.id));

  const MemberItem = ({ member, isOnline }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', borderRadius: 'var(--radius-sm)' }}>
      <Avatar src={member.avatar} name={member.display_name} size={32} online={isOnline} />
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: isOnline ? 'var(--color-text)' : 'var(--color-text-muted)' }}>{member.display_name}</div>
        {member.status && <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{member.status}</div>}
      </div>
    </div>
  );

  return (
    <div style={{ width: 240, background: 'var(--color-secondary)', borderLeft: '1px solid var(--color-border)', overflowY: 'auto', flexShrink: 0, padding: '16px 8px' }}>
      {online.length > 0 && (
        <div>
          <div style={{ padding: '0 8px 4px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.08em' }}>Online — {online.length}</div>
          {online.map(m => <MemberItem key={m.id} member={m} isOnline />)}
        </div>
      )}
      {offline.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ padding: '0 8px 4px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.08em' }}>Offline — {offline.length}</div>
          {offline.map(m => <MemberItem key={m.id} member={m} isOnline={false} />)}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/layout/
git commit -m "feat: add layout components (ServerSidebar, ChannelSidebar, MemberList)"
```

---

### Task 8: Chat Komponenten

**Files:**
- Create: `frontend/src/components/chat/Message.jsx`
- Create: `frontend/src/components/chat/MessageList.jsx`
- Create: `frontend/src/components/chat/MessageInput.jsx`
- Create: `frontend/src/components/chat/TypingIndicator.jsx`

- [ ] **Step 1: Message.jsx**

```jsx
import Avatar from '../ui/Avatar.jsx';

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

export default function Message({ message }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '4px 16px', borderRadius: 'var(--radius-sm)' }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <Avatar src={message.avatar} name={message.display_name || message.username} size={40} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
          <span style={{ fontWeight: 600, color: 'var(--color-text-heading)', fontSize: 14 }}>{message.display_name || message.username}</span>
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{formatTime(message.created_at)}</span>
          {message.edited_at && <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>(bearbeitet)</span>}
        </div>
        {message.content && <p style={{ fontSize: 14, lineHeight: 1.5, wordBreak: 'break-word', color: 'var(--color-text)' }}>{message.content}</p>}
        {message.attachments?.map(att => (
          <div key={att.id} style={{ marginTop: 8 }}>
            {att.mimetype?.startsWith('image/') ? (
              <img src={att.url} alt={att.filename} style={{ maxWidth: 400, maxHeight: 300, borderRadius: 'var(--radius-sm)', objectFit: 'contain' }} />
            ) : (
              <a href={att.url} download={att.filename} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--color-tertiary)', borderRadius: 'var(--radius-sm)', color: 'var(--color-primary)', fontSize: 13 }}>
                📎 {att.filename} ({(att.size / 1024).toFixed(1)} KB)
              </a>
            )}
          </div>
        ))}
        {message.reactions?.length > 0 && (
          <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
            {message.reactions.map((r, i) => (
              <span key={i} style={{ background: 'var(--color-tertiary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-full)', padding: '2px 8px', fontSize: 13, cursor: 'pointer' }}>
                {r.emoji} {r.count}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: MessageList.jsx**

```jsx
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
```

- [ ] **Step 3: TypingIndicator.jsx**

```jsx
import { useChatStore } from '../../store/chat.js';
import { useAuthStore } from '../../store/auth.js';

export default function TypingIndicator({ channelId }) {
  const typingUsers = useChatStore(s => s.typingUsers[channelId] || []);
  const me = useAuthStore(s => s.user);
  const others = typingUsers.filter(id => id !== me?.id);
  if (!others.length) return null;
  return (
    <div style={{ padding: '0 16px 4px', fontSize: 12, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ display: 'inline-flex', gap: 2 }}>
        {[0, 1, 2].map(i => <span key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--color-text-muted)', animation: `bounce 1s ${i * 0.2}s infinite` }} />)}
      </span>
      <span>{others.length === 1 ? 'Jemand schreibt' : `${others.length} Personen schreiben`}...</span>
      <style>{`@keyframes bounce { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }`}</style>
    </div>
  );
}
```

- [ ] **Step 4: MessageInput.jsx**

```jsx
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
      addMessage(channelId, { id: data.messageId, content: '', attachments: [data.attachment], reactions: [] });
    } finally {
      setUploading(false);
      fileRef.current.value = '';
    }
  };

  return (
    <div style={{ padding: '0 16px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', background: 'var(--color-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', gap: 8, padding: '0 8px' }}>
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: 20, padding: 8, display: 'flex' }}>
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
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/chat/
git commit -m "feat: add chat components (Message, MessageList, Input, Typing)"
```

---

### Task 9: Dashboard Seite

**Files:**
- Create: `frontend/src/pages/Dashboard.jsx`

- [ ] **Step 1: Dashboard.jsx erstellen**

```jsx
import { useEffect, useState } from 'react';
import { useChatStore } from '../store/chat.js';
import { useAuthStore } from '../store/auth.js';
import { useSocket } from '../hooks/useSocket.js';
import { useVoice } from '../hooks/useVoice.js';
import { getServers, getChannels, getMessages } from '../api/index.js';
import ServerSidebar from '../components/layout/ServerSidebar.jsx';
import ChannelSidebar from '../components/layout/ChannelSidebar.jsx';
import MemberList from '../components/layout/MemberList.jsx';
import MessageList from '../components/chat/MessageList.jsx';
import MessageInput from '../components/chat/MessageInput.jsx';

export default function Dashboard() {
  const user = useAuthStore(s => s.user);
  const { activeServer, activeChannel, messages, setServers, setChannels } = useChatStore();
  const [members, setMembers] = useState([]);
  const [voiceChannelId, setVoiceChannelId] = useState(null);
  useSocket();
  const { muted, toggleMute } = useVoice(voiceChannelId);

  useEffect(() => {
    getServers().then(({ data }) => {
      setServers(data);
    });
  }, []);

  useEffect(() => {
    if (!activeServer) return;
    getChannels(activeServer.id).then(({ data }) => setChannels(data));
  }, [activeServer]);

  useEffect(() => {
    if (!activeChannel || activeChannel.type !== 'text') return;
    getMessages(activeChannel.id).then(({ data }) => {
      useChatStore.getState().setMessages(activeChannel.id, data);
    });
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
            <div style={{ padding: '0 16px', height: 48, display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--color-border)', gap: 8, flexShrink: 0 }}>
              <span style={{ fontSize: 18, color: 'var(--color-text-muted)' }}>{activeChannel.type === 'voice' ? '🔊' : '#'}</span>
              <span style={{ fontWeight: 600, color: 'var(--color-text-heading)' }}>{activeChannel.name}</span>
              {voiceChannelId && activeChannel.type === 'voice' && (
                <>
                  <div style={{ flex: 1 }} />
                  <button onClick={toggleMute} style={{ background: muted ? 'var(--color-danger)' : 'var(--color-success)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', padding: '4px 12px', cursor: 'pointer', fontSize: 13 }}>
                    {muted ? '🔇 Stumm' : '🎙️ Aktiv'}
                  </button>
                  <button onClick={() => setVoiceChannelId(null)} style={{ background: 'var(--color-danger)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', padding: '4px 12px', cursor: 'pointer', fontSize: 13 }}>
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
                <p style={{ color: 'var(--color-text-muted)' }}>Voice Channel: {activeChannel.name}</p>
                {!voiceChannelId && (
                  <button onClick={() => setVoiceChannelId(activeChannel.id)} style={{ background: 'var(--color-success)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', padding: '10px 20px', cursor: 'pointer', fontWeight: 600 }}>
                    Beitreten
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
            {activeServer ? 'Kanal auswählen' : 'Server auswählen oder erstellen'}
          </div>
        )}
      </div>

      {activeServer && <MemberList members={members} />}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/Dashboard.jsx
git commit -m "feat: add dashboard page with full layout"
```

---

### Task 10: Settings Seite

**Files:**
- Create: `frontend/src/pages/Settings.jsx`

- [ ] **Step 1: Settings.jsx erstellen**

```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.js';
import { updateMe, enable2FA, verify2FA, disable2FA, logout } from '../api/index.js';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Avatar from '../components/ui/Avatar.jsx';

const NAV = ['Mein Konto', 'Profil', 'Datenschutz & Sicherheit', 'Erscheinungsbild', 'Benachrichtigungen'];

export default function Settings() {
  const { user, setAuth, logout: authLogout } = useAuthStore();
  const navigate = useNavigate();
  const [active, setActive] = useState('Mein Konto');
  const [form, setForm] = useState({ display_name: user?.display_name || '', password: '', new_password: '' });
  const [twoFAData, setTwoFAData] = useState(null);
  const [totpCode, setTotpCode] = useState('');
  const [msg, setMsg] = useState('');

  const saveProfile = async () => {
    try {
      const payload = {};
      if (form.display_name) payload.display_name = form.display_name;
      if (form.password && form.new_password) { payload.password = form.password; payload.new_password = form.new_password; }
      const { data } = await updateMe(payload);
      setAuth({ ...user, ...data }, useAuthStore.getState().token);
      setMsg('Gespeichert!');
    } catch (err) {
      setMsg(err.response?.data?.error || 'Fehler beim Speichern');
    }
  };

  const setup2FA = async () => {
    const { data } = await enable2FA();
    setTwoFAData(data);
  };

  const confirm2FA = async () => {
    try {
      await verify2FA(totpCode);
      setMsg('2FA aktiviert!');
      setTwoFAData(null);
      setAuth({ ...user, two_fa_enabled: true }, useAuthStore.getState().token);
    } catch {
      setMsg('Ungültiger Code');
    }
  };

  const handleLogout = async () => {
    await logout();
    authLogout();
    navigate('/login');
  };

  return (
    <div className="pattern-bg" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Linke Nav */}
      <div style={{ width: 280, background: 'var(--color-secondary)', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', padding: '32px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32, padding: '0 8px' }}>
          <Avatar src={user?.avatar} name={user?.display_name} size={40} />
          <div>
            <div style={{ fontWeight: 700, color: 'var(--color-text-heading)', fontSize: 14 }}>{user?.display_name}</div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>#{user?.username}</div>
          </div>
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', padding: '0 8px', marginBottom: 4 }}>Nutzereinstellungen</div>
        {NAV.map(item => (
          <div key={item} onClick={() => setActive(item)}
            style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 14,
              background: active === item ? 'rgba(88,101,242,0.2)' : 'transparent',
              color: active === item ? 'var(--color-text-heading)' : 'var(--color-text-muted)' }}>
            {item}
          </div>
        ))}
        <div style={{ marginTop: 'auto' }}>
          <Button variant="danger" onClick={handleLogout} style={{ width: '100%' }}>Ausloggen</Button>
        </div>
      </div>

      {/* Rechter Inhalt */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 40 }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', marginBottom: 24, fontSize: 14 }}>← Zurück</button>

        {active === 'Mein Konto' && (
          <div style={{ maxWidth: 600 }}>
            <h2 style={{ color: 'var(--color-text-heading)', marginBottom: 24 }}>Mein Konto</h2>
            {/* Profil-Banner */}
            <div style={{ background: 'var(--color-primary)', borderRadius: 'var(--radius-md)', height: 80, marginBottom: -20, position: 'relative' }}>
              <div style={{ position: 'absolute', bottom: -20, left: 16 }}>
                <Avatar src={user?.avatar} name={user?.display_name} size={56} />
              </div>
            </div>
            <div style={{ background: 'var(--color-secondary)', borderRadius: '0 0 var(--radius-md) var(--radius-md)', padding: '32px 16px 16px', marginBottom: 24 }}>
              <div style={{ fontWeight: 700, color: 'var(--color-text-heading)' }}>{user?.display_name} <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>#{user?.username}</span></div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Input label="Anzeigename" value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} />
              <Input label="E-Mail" value={user?.email || ''} disabled />
              <Input label="Aktuelles Passwort" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              <Input label="Neues Passwort" type="password" value={form.new_password} onChange={e => setForm(f => ({ ...f, new_password: e.target.value }))} />
              {msg && <p style={{ color: msg.includes('!') ? 'var(--color-success)' : 'var(--color-danger)', fontSize: 14 }}>{msg}</p>}
              <Button onClick={saveProfile}>Speichern</Button>
            </div>

            <div style={{ marginTop: 32, padding: 20, background: 'var(--color-secondary)', borderRadius: 'var(--radius-md)' }}>
              <h3 style={{ color: 'var(--color-text-heading)', marginBottom: 8 }}>Zwei-Faktor-Authentifizierung</h3>
              <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 16 }}>
                {user?.two_fa_enabled ? '2FA ist aktiv.' : 'Füge eine zusätzliche Sicherheitsebene hinzu.'}
              </p>
              {!twoFAData && !user?.two_fa_enabled && <Button onClick={setup2FA}>2FA aktivieren</Button>}
              {user?.two_fa_enabled && <Button variant="danger" onClick={async () => { await disable2FA(); setAuth({ ...user, two_fa_enabled: false }, useAuthStore.getState().token); }}>2FA deaktivieren</Button>}
              {twoFAData && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Scanne den QR-Code mit Google Authenticator:</p>
                  <img src={twoFAData.qr} alt="2FA QR" style={{ width: 180, borderRadius: 8 }} />
                  <Input label="Code bestätigen" value={totpCode} onChange={e => setTotpCode(e.target.value)} placeholder="6-stelliger Code" />
                  <Button onClick={confirm2FA}>Bestätigen</Button>
                </div>
              )}
            </div>
          </div>
        )}

        {active !== 'Mein Konto' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--color-text-muted)' }}>
            <p>{active} — kommt bald</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/Settings.jsx
git commit -m "feat: add settings page with profile, password and 2FA"
```

---

### Task 11: Frontend Dockerfile & Push

**Files:**
- Create: `frontend/Dockerfile`

- [ ] **Step 1: Dockerfile erstellen**

`frontend/Dockerfile`:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

- [ ] **Step 2: nginx.conf für SPA Routing**

`frontend/nginx.conf`:
```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

- [ ] **Step 3: Frontend starten und testen**

```bash
cd frontend && npm run dev
```

Öffne http://localhost:3000 — Login-Seite sollte erscheinen mit Pattern-Hintergrund und BlackCore Logo.

- [ ] **Step 4: Commit und Push**

```bash
git add frontend/
git commit -m "feat: add frontend dockerfile and complete frontend implementation"
git push origin master
```

Expected: Alle Dateien auf GitHub gepusht.

---

## Nächster Plan

Weiter mit: `docs/superpowers/plans/2026-03-27-blackcore-docker.md`
