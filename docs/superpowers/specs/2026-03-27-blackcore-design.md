# BlackCore — Design Spec
**Datum:** 2026-03-27
**Status:** Approved

---

## Überblick

BlackCore ist ein selbst gehosteter Discord-Klon als Web-App. Ziel ist echter Einsatz mit Freunden/Community. Design basiert auf dem BlackCord Onyx Design System (Dark Theme, Primary #5865F2).

---

## Architektur

**Monolith mit Docker Compose** — ein Repository, alle Services via Docker orchestriert.

```
blackcore/
├── frontend/          # React + Vite
├── backend/           # Node.js + Express + Socket.io
├── nginx/             # Reverse Proxy
├── uploads/           # Persistentes Volume für Datei-Uploads
├── docker-compose.yml
└── .env
```

**nginx** routet:
- `/` → Frontend
- `/api` → Backend REST API
- `/ws` → Socket.io WebSocket

---

## Tech Stack

| Schicht | Technologie |
|---|---|
| Frontend | React + Vite, Zustand (State), React Router |
| Backend | Node.js + Express |
| Echtzeit | Socket.io |
| Voice | WebRTC (Peer-to-Peer via öffentliche STUN-Server) |
| Datenbank | PostgreSQL |
| Auth | JWT (Access 15min + Refresh 7 Tage, HttpOnly Cookie) |
| 2FA | TOTP (Google Authenticator kompatibel) |
| Uploads | Lokal im Docker Volume `/uploads` (max. 100MB) |
| Proxy | nginx |
| Deployment | Docker Compose |

**STUN-Server (öffentlich, kein eigenes Hosting):**
```js
iceServers: [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
]
```

---

## Features (MVP)

### Authentifizierung
- Registrierung (Username, E-Mail, Passwort)
- Login mit E-Mail + Passwort
- 2FA (TOTP) — aktivierbar in den Einstellungen
- JWT Refresh Token Flow

### Dashboard
- Linke Sidebar: Server-Icons, Kanal-Liste (Text + Voice Channels)
- Mitte: Chat (Nachrichten, Reaktionen, Datei-Anhänge, Typing-Indicator)
- Rechte Sidebar: Online/Offline Nutzerliste

### Voice Channels
- WebRTC Peer-to-Peer
- Stummschalten (Mute), Kamera an/aus

### User Settings
- Profil bearbeiten (Display Name, Avatar, Banner)
- Passwort ändern
- 2FA aktivieren/deaktivieren
- Verbundene Accounts: Spotify, GitHub

### Datei-Upload
- Bilder, Videos, Dokumente bis 100MB
- Speicherung als Docker Volume

### Nicht im MVP
- QR-Code Login (kann später nachgerüstet werden)
- Mobile App
- Microservices

---

## Datenbank-Schema

```sql
-- Nutzer
users (id, username, display_name, email, password_hash, avatar, banner, created_at)
user_2fa (user_id, secret, enabled)

-- Server & Kanäle
servers (id, name, icon, owner_id, created_at)
server_members (server_id, user_id, role, joined_at)
channels (id, server_id, name, type [text|voice], position)

-- Nachrichten
messages (id, channel_id, author_id, content, edited_at, created_at)
attachments (id, message_id, filename, url, size, mimetype)
reactions (id, message_id, user_id, emoji)

-- Verbindungen
connected_accounts (id, user_id, provider [spotify|github], provider_id, data)
```

---

## REST API

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
POST   /api/auth/2fa/enable
POST   /api/auth/2fa/verify

GET    /api/servers
POST   /api/servers
GET    /api/servers/:id/channels
POST   /api/servers/:id/channels

GET    /api/channels/:id/messages
POST   /api/channels/:id/messages
POST   /api/channels/:id/upload

GET    /api/users/@me
PATCH  /api/users/@me
```

---

## Socket.io Events

```
// Client → Server
message:send       { channelId, content }
typing:start       { channelId }
reaction:add       { messageId, emoji }
voice:join         { channelId }
voice:signal       { peerId, signal }

// Server → Client
message:new        { message }
user:online        { userId }
user:offline       { userId }
typing:update      { channelId, users }
voice:peer-joined  { peerId }
voice:signal       { peerId, signal }
```

---

## Design System

- **Primary:** #5865F2 (Blurple)
- **Secondary:** #1E1E1E
- **Tertiary:** #0F0F0F
- **Neutral:** #050505
- **Pattern-Hintergrund:** Dot-Grid auf Dark Background
- **Logo:** SVG, transparent

---

## Deployment

```yaml
# docker-compose.yml Services:
- frontend   (React Build via nginx)
- backend    (Node.js)
- postgres   (PostgreSQL)
- nginx      (Reverse Proxy)
```

Alle Secrets via `.env`. Uploads als persistentes Docker Volume.
