# zrsa-ove-demo

A full-stack demo combining a FastAPI backend with a React/Vite frontend, featuring database migrations, caching, rate-limiting, authentication, WebSocket support, Prometheus metrics, code-generation and an in-browser debug overlay.

---

## Prerequisites

- Node.js ≥ 18.x
- pnpm
- Python ≥ 3.10
- pip install uv (`pip install uv`)
- sqlite3 (if using SQLite) **or** Docker & Docker Compose (if using Postgres)
- Git

---

## Environment

### Backend

Copy `backend/.env.template` → `backend/.env` and fill in:

```dotenv
CACHE_HOST=                       # Redis host
CACHE_PORT=6379
CACHE_EXPIRATION=3600
CACHE_ENABLED=false

FRONTEND_ORIGIN="http://localhost:5173"
WEBSOCKET_ORIGIN="ws://localhost:5173"

DATABASE_URL="sqlite+aiosqlite:///data/main.db"
BASE_PATH="/zrsa-ove-demo"

PORT=80

DISABLE_AUTH="true"
USE_LEGACY_AUTH=true
LEGACY_AUTH_KEY=
METRICS_USERNAME=
METRICS_PASSWORD=

VITE_BACKEND="http://localhost:8000/zrsa-ove-demo"
VITE_SOCKET_SERVER="http://localhost:8000"
VITE_SOCKET_PATH="/zrsa-ove-demo/ws/socket.io"
VITE_ENABLE_DEBUG=true
```

---

## Setup & Install

### 1. Backend

```bash
cd backend
pip install uv
uv sync --locked                   # install Python deps
```

### 2. Frontend

```bash
cd frontend
pnpm install
```

---

## Database Migrations

#### SQLite (default)

```bash
cd backend
uv run alembic upgrade head
```

#### Postgres

```bash
docker-compose up -d
cd backend
uv run alembic upgrade head
```

---

## WebSocket API

Socket.IO mounted at `/ws/socket.io` under namespace `/v1`. Supply:

- `room` query param
- valid session cookie (or `DISABLE_AUTH=true`)

Client example (TS):

```ts
import { createSocketClient } from "@/api/sockets-v1";

const client = createSocketClient(env.VITE_BACKEND, {
  path: "/ws/socket.io",
  withCredentials: true,
  query: { room: "myroom" },
});

client.connect();
client.onConnect(() => console.log("connected"));
client.emitStart();
client.onTick((payload) => console.log("tick", payload));
client.emitStop();
client.emitReset();
```

Example events:

| Event     | Direction      | Payload         | Description                          |
| --------- | -------------- | --------------- | ------------------------------------ |
| get_state | client→server  | _none_          | Ack: returns `{ status, timestamp }` |
| start     | client→server  | _none_          | Begin periodic “tick”                |
| stop      | client→server  | _none_          | Stop ticking                         |
| reset     | client→server  | _none_          | Reset state & timestamp              |
| tick      | server→clients | `{ timestamp }` | Broadcast every `INTERVAL` seconds   |

### Rooms & Synchronization

Each **physical Data Observatory** maps to a unique `room`. All clients — whether controllers (which emit commands) or views (read-only pages) — connect to the same room and share state in real time.

1. **Controllers** connect:

   ```ts
   import { createSocketClient } from "@/api/sockets-v1";
   const ctrl = createSocketClient(env.VITE_BACKEND, {
     path: "/ws/socket.io",
     withCredentials: true,
     query: { room: "data-observatory" },
   });
   ctrl.connect();
   // start the simulation for all viewers:
   ctrl.emitStart();
   // later…
   ctrl.emitStop();
   ctrl.emitReset();
   ```

2. **Views** connect:
   ```ts
   import { createSocketClient } from "@/api/sockets-v1";
   const view = createSocketClient(env.VITE_BACKEND, {
     path: "/ws/socket.io",
     withCredentials: true,
     query: { room: "data-observatory" },
   });
   view.connect();
   view.emitGetState().then((state) => renderState(state));
   view.onTick((payload) => renderTick(payload));
   ```

All events are scoped to `"data-observatory"`. When a controller emits `start`, every connected view in that room begins receiving `tick` broadcasts and stays in sync.

---

## Code Generation

After any backend schema or API change:

```bash
cd backend
uv run scripts/schemas.py          # outputs JSON-Schemas & AsyncAPI

cd ../frontend
pnpm run sync                     # regenerates TS schemas, REST hooks & socket clients
```

---

## Development

### Run Backend

```bash
cd backend
uv run uvicorn app.main:app \
  --reload --host 0.0.0.0 --port $PORT
```

- OpenAPI UI: `http://localhost:$PORT/docs`
- AsyncAPI UI: `http://localhost:$PORT/public/asyncapi.html`
- Metrics: `http://localhost:$PORT/metrics`

### Run Frontend

```bash
cd frontend
pnpm run dev
```

Visit `http://localhost:5173`

---

## Debug Overlay

Press **Ctrl+K** (or ⌘+K) to toggle the debug panel:

- Live Socket.IO events & payloads
- HTTP request/response log
- Application‐level logs
- Inline editing of client state (Zustand)
- Toast notifications for errors

Enable in production via `VITE_ENABLE_DEBUG=true`.

---

## Production with Docker

### docker-compose

```bash
docker-compose up -d
```

- `backend/.env.production` → mounted as `/.env`
- `backend/data` → persisted DB & Redis volume

### Manual build & run

```bash
docker build -t zrsa-ove-demo:latest .
docker run -d \
  --name zrsa-ove-demo \
  -p 80:80 \
  -v $(pwd)/backend/.env.production:/.env:ro \
  -v $(pwd)/backend/data:/data \
  zrsa-ove-demo:latest
```

---

## Project Layout

├── backend/
│ ├── app/ FastAPI app (auth, cache, sockets, API, DB)
│ ├── data/ SQLite file or Postgres data
│ ├── migrations/ Alembic configs & versions
│ ├── scripts/ Codegen: OpenAPI, AsyncAPI, JSON-Schemas
│ ├── public/ Static docs (asyncapi.html, docs.html)
│ ├── .env(.production) Environment variables
│ └── main.py Entrypoint
├── frontend/
│ ├── src/ React code, hooks, styles, Debug overlay
│ ├── api/ Generated REST hooks & socket clients
│ ├── cli/codegen/ TS generators for schemas, API & sockets
│ ├── public/ Static assets (favicon, robots.txt, manifest)
│ ├── package.json Scripts & dependencies
│ └── vite.config.ts
├── docker-compose.yml
├── Dockerfile
└── README.md

---

## Frontend Scripts

From the `frontend/` directory:

- `pnpm run dev` — start HMR/Vite server
- `pnpm run build` — compile production assets
- `pnpm run serve` — preview production build
- `pnpm run test` — run Vitest suite
- `pnpm run sync` — regenerate TS schemas, API & sockets
- `pnpm run check` — Prettier & ESLint fixes
- `pnpm run lint` — ESLint only
- `pnpm run format` — Prettier only
- `pnpm run clean` — remove `dist/`

---

## Backend Commands

From the `backend/` directory:

- `uv sync --locked` — install dependencies
- `uv run alembic revision --autogenerate -m "..."`
- `uv run alembic upgrade head` — apply migrations
- `uv run scripts/schemas.py` — generate OpenAPI/AsyncAPI/JSON-Schemas

---

## Tips & Next Steps

- Keep `.env*` files out of version control.
- After any schema/API change, run codegen then frontend sync.
- Adjust cache, rate-limit and auth policies in `app/core/config.py`.
- Use React-Query DevTools for inspecting REST queries.
- Customize UI primitives via the `components/` folder or `shadcn` presets.

---
