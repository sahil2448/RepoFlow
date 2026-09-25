# RepoFlow ATS Changes Guide

## How To Read This
This guide explains the ATS-focused engineering work in a detailed, interview-friendly way. It does not only list files. It explains the problem, the change, the reasoning, verification steps, risks, and how to talk about each decision in an interview.

The ATS task was mainly production hardening. RepoFlow already had product features: repositories, auth, custom CLI pushes, issues, notifications, and review rooms. This work made those features more scalable, testable, secure, measurable, and easier to defend.

## Executive Summary
1. The backend moved from a single-process mindset toward a clustered EC2 runtime using PM2.
2. Redis was introduced as a best-effort performance layer for caching and Socket.IO cross-worker coordination.
3. Socket.IO was adjusted for cluster safety with the Redis adapter and websocket-only transport.
4. The backend gained integration-style tests using Jest, Supertest, and mongodb-memory-server.
5. CI/CD became more dependable by validating backend tests and frontend production builds.
6. Security was hardened with Helmet, auth rate limiting, `.pem` key protection, and repository authorization checks.
7. Repository collaboration became a proper data-model concern through collaborator storage and owner-only collaborator management.
8. A benchmark script was added to measure a real 50 MB CLI push path instead of relying on vague performance claims.
9. Documentation was improved so the project reads like production engineering, not only feature building.
10. The later UI/light-theme restyle is intentionally outside this ATS guide.

## Scope
Covered here:
- Scaling and runtime reliability
- Redis cache and Socket.IO adapter work
- Automated testing
- CI/CD and deployment hardening
- Security and authorization
- Benchmarking
- Documentation and resume narrative

Not covered here:
- Original product features built before the ATS task
- Later frontend UI polish/light-theme redesign
- Any implementation detail that cannot be verified from the repo or task facts

## File Map
| Area | Important Files |
|---|---|
| Runtime scaling | `Backend/ecosystem.config.cjs`, `Backend/index.js` |
| Redis/cache | `Backend/helpers/cache.js`, `docker-compose.yml` |
| Realtime | `Backend/index.js`, `frontend/src/config/socket.ts`, `Backend/helpers/reviewSignaling.js` |
| Testing | `Backend/tests/app.js`, `Backend/tests/global-setup.js`, `Backend/tests/global-teardown.js`, `Backend/tests/jest-setup-env.js`, `Backend/jest.config.js`, `Backend/tests/*.test.js` |
| CI/CD | `.github/workflows/ci.yml`, `amplify.yml`, package lockfiles |
| Security | `Backend/index.js`, `Backend/Middleware/authorizeMiddleware.js`, `Backend/routes/repo.router.js`, `.gitignore` |
| Domain model | `Backend/model/repoModel.js` |
| Benchmark | `Backend/benchmark-push.mjs` |
| Documentation | `README.md`, `INTERVIEW_PREP.md`, `INTERVIEW_PREP_ATS.md` |

## 1. Scaling And Runtime Reliability

### Original Problem
The backend originally behaved like a development server: one Node process, local in-memory runtime state, and limited resilience. That is fine for demos, but weak when multiple users connect, websockets stay open, or the process crashes.

In simple words, one Node process is like one cashier handling every customer. It can work for a small queue, but once traffic grows, the app needs more counters and a shared way for those counters to coordinate.

### Change: PM2 Cluster Mode
`Backend/ecosystem.config.cjs` defines PM2 cluster configuration.

What it adds:
- `instances: "max"` so PM2 can run workers across available CPU cores.
- `exec_mode: "cluster"` so the backend runs as multiple Node workers.
- `autorestart: true` so crashed workers are restarted.
- Centralized production runtime configuration.

### Why This Matters
Node.js runs JavaScript on a single main thread per process. A single backend process cannot fully use a multi-core EC2 machine. PM2 cluster mode lets the same app use more CPU capacity without a major rewrite.

It also improves reliability. If one worker crashes, PM2 can restart it. This is not full high availability, but it is a practical step above manually running `node index.js`.

### How To Verify
```bash
npx pm2 status
npx pm2 logs repoflow-backend
```

Expected:
- Multiple `repoflow-backend` workers are visible.
- Workers remain online.
- Logs show clean server startup.

### Interview Explanation
“I moved the backend to PM2 cluster mode because the app has API traffic and realtime connections, and a single Node process would underuse EC2 CPU cores. PM2 gave us multiple workers, automatic restarts, and a more production-like runtime without changing the whole backend architecture.”

## 2. Redis Cache Layer

### Original Problem
Read-heavy endpoints such as repository listings and profile reads can repeatedly hit MongoDB for the same data. That creates avoidable latency and database pressure.

Redis was useful here, but it should not become a hard dependency. If Redis goes down, users should still be able to use the app through MongoDB.

Layman version: Redis is like keeping frequently used notes on your desk. If those notes are missing, you can still open the main book. The desk notes just make common work faster.

### Change: Best-Effort Cache
`Backend/helpers/cache.js` adds a Redis-backed cache helper with:
- lazy Redis client creation
- environment-safe Redis URL loading
- short TTLs
- bounded retry behavior
- graceful fallback when Redis is unavailable
- cache invalidation helpers

### TTL Choices
Repository reads use roughly 60 seconds. Profile reads use roughly 30 seconds.

Why short TTLs:
- They reduce repeated database reads.
- They keep changed data reasonably fresh.
- They fit a developer platform where repo/profile data can change frequently.

### Failure Strategy
The cache is intentionally best-effort. If Redis fails:
- `cacheGet` returns `null`
- the controller continues to MongoDB
- retries are limited
- cooldown prevents repeated slow connection attempts
- write/invalidation helpers fail safely

This matters because a performance layer should not take down the main product.

### How To Verify
With Redis running:
```bash
docker compose up -d redis
```

Then hit cached endpoints repeatedly. With Redis stopped, the same endpoints should still return data and should not hang.

### Interview Explanation
“I treated Redis as a performance optimization, not the source of truth. MongoDB remains the source of truth. Redis improves read latency, but if Redis is unavailable, the app safely falls back to MongoDB instead of blocking user requests.”

## 3. Socket.IO Cluster Safety

### Original Problem
Socket.IO rooms are normally stored in memory inside one Node process. In PM2 cluster mode, there are multiple processes. A user may connect to worker 1, while an event may be emitted from worker 2.

Without coordination, realtime features can break because each worker only knows its own local sockets.

Layman version: each worker has its own guest list. Redis becomes the shared guest list and announcement board.

### Change: Redis Adapter
`Backend/index.js` configures Socket.IO with the Redis adapter when Redis is available. The frontend client in `frontend/src/config/socket.ts` uses websocket-only transport.

### Why Websocket-Only
Socket.IO can start with HTTP polling and later upgrade to websockets. In clustered environments without sticky sessions, polling can jump between workers. Websocket-only keeps the connection path simpler and more stable.

### Graceful Behavior
If Redis cannot connect quickly, the backend still starts and falls back to local in-memory Socket.IO behavior. This is less powerful in cluster mode, but it preserves API availability.

### How To Verify
1. Start Redis.
2. Start PM2 cluster workers.
3. Open two browser sessions.
4. Trigger notifications or review-room socket events.
5. Confirm events are delivered consistently.

### Interview Explanation
“PM2 gave us multiple backend workers, but Socket.IO needed shared room state. I used the Redis adapter so socket events can fan out across workers. I also forced websocket transport to avoid long-polling session drift in a clustered backend.”

## 4. Server Boot Reliability

### Original Problem
The backend had a startup-path issue where running through a process manager or plain Node could hit an incorrect server boot path. In production, startup should be predictable and boring.

### Change
`Backend/index.js` now has a clearer server startup flow. The backend can start through:
```bash
node index.js
```
or through PM2 using the configured script.

### Why This Matters
Deployment should not depend on remembering a fragile command path. PM2 should be able to start the server directly and reliably.

### Interview Explanation
“I fixed the runtime entrypoint so the server can boot predictably under PM2 and direct Node execution. That type of change is small in code but important operationally, because deployment must be reliable.”

## 5. Automated Testing

### Original Problem
Manual testing is not enough for auth, repo permissions, CLI routes, and database writes. It is too easy to break middleware or route behavior and not notice until a demo or deployment.

### Change: Integration-Style Test Harness
The backend test setup uses:
- Jest as the test runner
- Supertest for HTTP route testing
- mongodb-memory-server for a real temporary MongoDB database
- a shared test app that mounts real routers

### Why Not Mock Everything
Mock-heavy tests would only prove mocked functions behave as expected. These tests exercise:
- request parsing
- auth middleware
- router wiring
- controller behavior
- MongoDB reads/writes
- response contracts

That is closer to real user behavior.

### Key Files
`Backend/tests/app.js`
- Builds a test Express app using real routes.

`Backend/tests/global-setup.js`
- Starts temporary MongoDB.
- Writes test env config.

`Backend/tests/global-teardown.js`
- Stops MongoDB after tests.
- Cleans temporary files.

`Backend/tests/jest-setup-env.js`
- Injects safe dummy keys for external services.
- Prevents cloud SDK imports from crashing tests.

`Backend/jest.config.js`
- Wires setup/teardown.
- Runs tests in a stable single-worker mode.

### What The Tests Cover
The suite covers:
- signup
- login
- invalid password rejection
- invalid/no auth token rejection
- repository creation and reads
- repository visibility behavior
- CLI push/init behavior
- collaborator-related route behavior

### Why Dummy Env Vars Are Used
The app imports SDKs for services like AWS, Pinecone, or Gemini. In tests, the goal is not to call those services. Dummy values allow modules to import cleanly while keeping CI free from real secrets.

### How To Verify
```bash
cd Backend
npm test
```

Expected:
- Backend tests pass.
- No real MongoDB Atlas connection is needed.
- No production cloud credentials are required.

### Interview Explanation
“I built integration-style backend tests instead of shallow unit tests because the important risk was route behavior: auth, middleware, database writes, and response contracts. Using mongodb-memory-server gave us a real MongoDB engine without external credentials.”

## 6. CI/CD Hardening

### Original Problem
A full-stack project can pass locally but fail in CI because of OS differences, missing env vars, lockfile drift, or frontend build issues.

### Change
The CI pipeline validates:
- backend dependency install
- backend test execution
- frontend dependency install
- frontend production build

It also injects safe test/CI environment values so imports do not fail due to missing cloud secrets.

### Why Frontend Build Matters
React/Vite apps can fail at build time even when the dev server appears fine. TypeScript errors, bundler problems, and missing native bindings often show up only during production build.

### Lockfile Importance
The lockfiles help ensure the same dependency graph installs across machines. This matters especially for native packages and Linux CI runners.

### Amplify Deployment
`amplify.yml` supports frontend deployment through AWS Amplify. This separates frontend hosting from the EC2 backend runtime.

### How To Verify
In CI:
- backend tests are green
- frontend build is green

Locally:
```bash
cd frontend
npm run build
```

### Interview Explanation
“I made CI validate both halves of the full-stack app. Backend tests prove the API contract, and the frontend production build proves the app can actually be bundled for deployment. I also made the CI environment hermetic by using dummy non-production keys for services that are imported but not tested.”

## 7. Security Hardening

### Original Problem
Authentication alone is not enough. The backend also needs secure headers, brute-force protection, permission checks, and secret-safety hygiene.

### Change: Helmet
`Backend/index.js` uses `helmet()` to add common HTTP security headers.

### Change: Auth Rate Limiting
Login and signup routes have request limits. Auth routes are common brute-force targets, so rate limiting slows repeated automated attempts.

### Change: `.pem` Protection
`.gitignore` excludes `.pem` files because they often contain private SSH keys. Committing one can expose server access.

### How To Verify
Security headers:
```bash
curl -I http://localhost:3000/login
```

Rate limit:
- Send repeated login/signup attempts.
- Expect HTTP 429 after the configured threshold.

`.pem` ignore:
```bash
git status --short
```

### Interview Explanation
“I added baseline production hardening: Helmet for security headers, rate limiting around authentication, and repository authorization checks. I would not claim this is complete security, but it moves the app from default Express behavior toward a safer production posture.”

## 8. Repository Authorization And Collaborators

### Original Problem
Repository actions should not be controlled only by “is the user logged in?” The app must know whether the user owns the repository or is allowed to collaborate on it.

### Change: Collaborator Model
`Backend/model/repoModel.js` stores collaborators on the repository. This makes permissions part of the domain model instead of scattered controller logic.

### Change: Authorization Middleware
`Backend/Middleware/authorizeMiddleware.js` separates:
- owner-only actions
- member/collaborator actions

Deleting settings or adding collaborators should be stricter than reading or contributing to a repo.

### Change: Owner-Only Collaborator Route
`Backend/routes/repo.router.js` protects collaborator management so only repo owners can grant access.

### How To Verify
1. Create a repository as user A.
2. Add a collaborator as user A. It should work.
3. Try adding a collaborator as user B. It should fail.
4. Access member-allowed actions as a collaborator. They should work where intended.

### Interview Explanation
“I separated authentication from authorization. Authentication answers ‘who are you?’ Authorization answers ‘are you allowed to do this action on this repo?’ Adding collaborators to the repo model made access control explicit and testable.”

## 9. Benchmarking

### Original Problem
Performance claims are weak if they are only based on feelings. The project needed measurable evidence for the CLI push path.

### Change
`Backend/benchmark-push.mjs` creates a realistic benchmark path:
- login
- create repository
- generate a large payload
- run real push requests
- record timings

The measured result was roughly 238 ms average for a 50 MB push in the tested environment, compared with the older roughly 9 second baseline.

### Why This Is Credible
It is not a tiny isolated function benchmark. It exercises the actual API contract used by the CLI-style push flow.

### Limitations
Be honest:
- It is not a distributed load test.
- It does not prove p95/p99 under many users.
- Results depend on machine, network, DB state, and environment.
- More samples would make the claim stronger.

### Better Future Benchmarking
Next iteration should include:
- warm-up runs
- larger sample size
- p50/p95/p99
- k6 or Artillery load tests
- comparison across local, staging, and production

### Interview Explanation
“I added a benchmark for the real push path because performance claims should be measurable. I would present the number with context: around 238 ms average for a 50 MB payload in the measured environment, not a universal claim for all traffic patterns.”

## 10. Documentation And Resume Narrative

### Original Problem
Strong engineering work can be undervalued if it is not explained well. Recruiters and interviewers need to quickly understand architecture, tradeoffs, and measurable impact.

### Change
The documentation was rewritten around:
- product overview
- architecture
- scaling decisions
- testing strategy
- CI/CD
- security
- benchmark evidence
- interview preparation

### Why It Matters
Documentation is part of engineering quality. It helps future maintainers, interview storytelling, resume bullet accuracy, demo preparation, and onboarding.

### Interview Explanation
“I improved the documentation because the work was not just feature implementation. It was infrastructure and production hardening, so the explanation needed to show tradeoffs, verification, and measurable impact.”

## Resume Bullet Mapping
| Resume Claim | Supporting Work | Evidence |
|---|---|---|
| Scaled backend runtime on EC2 | PM2 cluster mode | `Backend/ecosystem.config.cjs` |
| Improved read latency and DB pressure | Redis read-through cache | `Backend/helpers/cache.js` |
| Made realtime cluster-safe | Socket.IO Redis adapter | `Backend/index.js`, `frontend/src/config/socket.ts` |
| Improved outage resilience | Redis timeout/fallback behavior | `Backend/helpers/cache.js` |
| Added automated backend tests | Jest + Supertest + memory MongoDB | `Backend/tests/*`, `Backend/jest.config.js` |
| Hardened CI/CD | Backend tests + frontend build | `.github/workflows/ci.yml` |
| Improved API security | Helmet + rate limiting | `Backend/index.js` |
| Added repo authorization | owner/member middleware | `Backend/Middleware/authorizeMiddleware.js` |
| Supported collaboration model | collaborators on repo | `Backend/model/repoModel.js` |
| Measured performance | 50 MB push benchmark | `Backend/benchmark-push.mjs` |

## Honest Gaps And Next Steps
1. Add distributed load testing with k6 or Artillery.
2. Add live smoke tests against deployed staging.
3. Improve cache invalidation with event-driven invalidation for repo/profile mutations.
4. Add more granular role-based authorization for repo actions.
5. Add audit logs for sensitive operations.
6. Add production monitoring, alerting, and health checks.
7. Consider managed Redis/high-availability Redis for production resilience.
8. Add e2e browser tests for signup, repo creation, CLI guide flow, and profile behavior.

## Final Narrative
The ATS task changed RepoFlow from a feature-heavy prototype into a more defensible engineering project. The major improvement was not one single feature. It was the combination of clustered runtime, Redis-backed performance and realtime coordination, safe fallback behavior, real automated tests, CI validation, security hardening, authorization checks, measurable benchmark evidence, and clearer documentation.

In an interview, the strongest framing is:

“I took an existing full-stack developer platform and hardened it like a production system. I improved runtime scaling with PM2, used Redis carefully for cache and realtime coordination, added integration-style tests with memory MongoDB, strengthened CI/CD, added security and authorization controls, and backed the performance story with a real benchmark instead of a vague claim.”
