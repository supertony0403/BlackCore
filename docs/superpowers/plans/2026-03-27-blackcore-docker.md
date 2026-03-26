# BlackCore Docker Deployment Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Docker Compose Setup das Frontend, Backend, PostgreSQL und nginx zusammenfasst und mit einem Befehl (`docker compose up`) vollständig startet.

**Architecture:** nginx als Reverse Proxy routet alles. PostgreSQL mit persistentem Volume. Backend und Frontend als separate Container. `.env` für alle Secrets.

**Tech Stack:** Docker, Docker Compose, nginx, PostgreSQL 16

---

## File Structure

```
blackcore/
├── docker-compose.yml
├── nginx/
│   └── nginx.conf
├── .env.example
├── backend/Dockerfile         (bereits vorhanden)
└── frontend/Dockerfile        (bereits vorhanden)
```

---

### Task 1: nginx Reverse Proxy Config

**Files:**
- Create: `nginx/nginx.conf`

- [ ] **Step 1: nginx.conf erstellen**

```nginx
upstream backend {
    server backend:4000;
}

server {
    listen 80;
    client_max_body_size 110M;

    # Frontend (React SPA)
    location / {
        proxy_pass http://frontend:80;
        proxy_set_header Host $host;
    }

    # Backend REST API
    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Datei-Uploads
    location /uploads {
        proxy_pass http://backend;
        proxy_set_header Host $host;
    }

    # Socket.io WebSocket
    location /socket.io {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add nginx/
git commit -m "feat: add nginx reverse proxy config"
```

---

### Task 2: docker-compose.yml

**Files:**
- Create: `docker-compose.yml`
- Create: `.env.example`

- [ ] **Step 1: .env.example erstellen**

```env
# Datenbank
POSTGRES_DB=blackcore
POSTGRES_USER=blackcore
POSTGRES_PASSWORD=changeme_strong_password

# Backend
DATABASE_URL=postgresql://blackcore:changeme_strong_password@postgres:5432/blackcore
JWT_SECRET=changeme_very_long_jwt_secret_at_least_32_chars
JWT_REFRESH_SECRET=changeme_refresh_secret_at_least_32_chars
PORT=4000
UPLOAD_DIR=./src/uploads
MAX_FILE_SIZE=104857600
FRONTEND_URL=http://localhost

# NODE_ENV
NODE_ENV=production
```

- [ ] **Step 2: .env aus .env.example erstellen**

```bash
cp .env.example .env
# Dann eigene Passwörter/Secrets in .env setzen!
```

- [ ] **Step 3: docker-compose.yml erstellen**

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/src/db/migrations/001_init.sql:/docker-entrypoint-initdb.d/001_init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    restart: unless-stopped
    environment:
      DATABASE_URL: ${DATABASE_URL}
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      PORT: ${PORT}
      UPLOAD_DIR: /app/uploads
      MAX_FILE_SIZE: ${MAX_FILE_SIZE}
      FRONTEND_URL: ${FRONTEND_URL}
      NODE_ENV: ${NODE_ENV}
    volumes:
      - uploads_data:/app/uploads
    depends_on:
      postgres:
        condition: service_healthy

  frontend:
    build: ./frontend
    restart: unless-stopped
    depends_on:
      - backend

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - frontend
      - backend

volumes:
  postgres_data:
  uploads_data:
```

- [ ] **Step 4: Commit**

```bash
git add docker-compose.yml .env.example
git commit -m "feat: add docker compose with postgres, backend, frontend, nginx"
```

---

### Task 3: Alles starten & testen

- [ ] **Step 1: Images bauen**

```bash
docker compose build
```

Expected: Alle 3 Images (backend, frontend, nginx base) werden gebaut. Kein Error.

- [ ] **Step 2: Services starten**

```bash
docker compose up -d
```

Expected: `postgres`, `backend`, `frontend`, `nginx` laufen alle.

- [ ] **Step 3: Health Check**

```bash
curl http://localhost/api/health
```

Expected: `{"status":"ok"}`

- [ ] **Step 4: Logs checken**

```bash
docker compose logs backend
```

Expected: `BlackCore Backend running on :4000`, kein DB-Fehler.

- [ ] **Step 5: Registrierung testen**

```bash
curl -X POST http://localhost/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","display_name":"Admin","email":"admin@test.com","password":"Test1234!"}'
```

Expected: JSON mit `user` und `token`.

- [ ] **Step 6: Browser testen**

Öffne http://localhost — Login-Seite erscheint, Registrierung + Login funktionieren.

- [ ] **Step 7: Finaler Push**

```bash
git add .
git commit -m "feat: complete blackcore docker deployment setup"
source ~/.config/envman/PATH.env
gh repo create BlackCore --public --source=. --remote=origin --push 2>/dev/null || git push origin master
```

Expected: Alle 3 Pläne + Code auf GitHub.

---

## BlackCore ist fertig! 🎉

**Starten:** `docker compose up -d`
**Stoppen:** `docker compose down`
**Logs:** `docker compose logs -f`
**Updates deployen:** `docker compose build && docker compose up -d`
