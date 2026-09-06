# RepoFlow

**A GitHub-style developer platform** with its own version-control CLI, issue tracking with AI duplicate detection, realtime notifications, and peer-to-peer code review calls.

Built end-to-end (React frontend + Node backend + AI + cloud infra) from a single repo.

---

## Features

- **Custom Git-like CLI** — `login`, `init`, `add`, `commit`, `push`, `pull`, `revert` from any local folder; commits sync to RepoFlow's backend with a local `.repoFlowGit` working folder.
- **Repositories** — create public/private repos, star/unstar, explore top-level repo listing, and browse commit history with file-level revert.
- **AI duplicate issue detection** — new issues are embedded (Google Gemini) and searched semantically (Pinecone, per-repo namespaces); similar issues are flagged at a 0.82 similarity threshold. Debounced 600ms on the frontend to avoid throwing requests.
- **Realtime notifications** — Socket.IO pushes events live; every notification is also persisted in MongoDB so nothing is missed while offline.
- **Code review rooms** — 1-on-1 WebRTC audio/video calls launched from a commit, with the changed files displayed side-by-side. Socket.IO handles only signaling; media flows peer-to-peer via STUN/TURN.
- **Profiles & contribution heatmap** — GitHub-style activity graph, starred-repos tab, and per-action contribution logging (repo created, starred, issue opened/closed, etc.).
- **Fault-tolerant push** — commit files go to AWS S3 with an automatic MongoDB base64 fallback (`storageType`), so pushes work even when object storage is down.

---

## Tech Stack

| Layer | What's used |
|---|---|
| **Frontend** | React 19 + TypeScript · Vite · Tailwind CSS · React Router 7 · Axios · Socket.IO client · WebRTC (`RTCPeerConnection`) |
| **Backend** | Node.js · Express 5 · MongoDB + Mongoose · JWT auth (bcrypt + middleware ownership checks) · Socket.IO · Redis cache · AWS S3 |
| **AI** | Google Gemini embeddings (768-dim) · Pinecone vector store |
| **Infra** | GitHub Actions CI · AWS Amplify (frontend deploy) · EC2 + PM2 cluster (backend) · Docker Compose (local Redis) |

### Architecture at a glance

```text
React SPA (Vite, TypeScript)
       │  REST (Axios, JWT) + Socket.IO + WebRTC
       ▼
Express API + Socket.IO server
   ├── MongoDB …… users, repos, issues, commits, notifications, contributions
   ├── AWS S3 ……. commit files (falls back to MongoDB base64 on failure)
   ├── Redis ……... API caching (bounded retry/back-off — never takes the app down)
   └── Pinecone …. per-repo issue vector namespaces for AI search
```

---

## Design Decisions

- **Commit storage with graceful degradation** — try S3 first, fall back to MongoDB if unavailable; the read path picks the source via `storageType`, so clients never see a failed push.
- **Semantic duplicate detection** — embeddings beat keyword matching for issues phrased differently but meaning the same thing; results are isolated per repository.
- **Redis as a best-effort layer** — no `REDIS_URL`, unreachable Redis, or timeouts just degrade reads to MongoDB with a 30s back-off instead of failing requests.
- **Notifications that survive offline moments** — write to MongoDB and emit over Socket.IO in one go, so the unread count is always correct.
- **Review calls without media in the server** — Socket.IO does room signaling (max 2 participants); the actual audio/video is true peer-to-peer via WebRTC with STUN/TURN.

---

## Project Structure

```text
RepoFlow/
├── Backend/                  # Express API + custom version-control CLI
│   ├── controllers/          # auth, repos, issues, AI, CLI, commits, notifications
│   ├── helpers/              # redis cache, socket.io, vector store, embeddings, signaling
│   ├── Middleware/           # JWT auth + ownership authorization
│   ├── model/                # Mongoose models
│   ├── routes/               # REST routers
│   └── tests/                # Jest + supertest + mongodb-memory-server
├── frontend/                 # React + TypeScript SPA (Vite)
│   ├── src/components/       # auth, dashboard, repo, issues, review, user pages
│   └── src/config/           # axios, socket, webrtc clients
├── .github/workflows/ci.yml  # CI: backend tests + frontend build
├── docker-compose.yml        # local Redis
└── amplify.yml               # AWS Amplify frontend deployment
```

---

## Run Locally

**Prereqs:** Node.js 20+, MongoDB, Redis (optional), and a `Backend/.env` with your
MongoDB URI, AWS keys, `PINECONE_API_KEY`/`PINECONE_INDEX`, and `GOOGLE_API_KEY`.

```bash
# Backend API  →  http://localhost:3000
cd Backend
npm install
npm start

# Frontend SPA  →  Vite dev server (default http://localhost:5173)
cd frontend
npm install
npm run dev
```

Optional local cache:

```bash
docker compose up -d redis   # Redis on :6379 (production uses hosted REDIS_URL)
```

### CLI usage

```bash
cd Backend && node index.js login --email you@example.com --password "***"
node index.js init my-repo
node index.js add file.js
node index.js commit "Initial commit"
node index.js push
```

---

## Testing & CI/CD

- **Backend tests** — Jest + supertest against an in-memory MongoDB (`mongodb-memory-server`); suites cover auth, CLI init/push, and repo flows. No external services needed: `cd Backend && npm test`.
- **GitHub Actions** — runs backend tests and builds the frontend on every push/PR to `main`.
- **Deployment** — frontend auto-builds and deploys on AWS Amplify; backend runs as a PM2 cluster (one worker per CPU core) on EC2 with auto-restart.

---

*RepoFlow is a self-driven, portfolio-level project: no boilerplate, real infra, real AI, real tests.*