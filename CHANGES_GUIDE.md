# CHANGES_GUIDE.md

## TL;DR
1. The ATS task was operational hardening and production-readiness work, not a new app feature set.
2. RepoFlow moved to a PM2 multi-worker EC2 backend and adopted Redis-backed caching to reduce read latency and improve scaling.
3. Socket.IO was upgraded to the Redis adapter and websocket-only transport so rooms and live notifications remain shared across workers.
4. The backend gained a real test harness with in-memory MongoDB, Jest, and Supertest, making 13 route-level tests pass locally.
5. CI/CD was stabilized by injecting dummy env keys, locking down frontend build behavior, and validating the app on GitHub Actions.
6. Security controls were added: helmet headers, auth rate limiting, and repository member authorization checks.
7. The repo now records collaborator access on repositories and restricts collaborator creation to the repo owner.
8. The benchmark script proves a 50 MB push path that averages roughly 238 ms on measured runs, a major improvement over the claimed baseline.
9. Documentation was rewritten to be resume-ready and the repo keeps a pre-task backup tag to anchor the audit boundary.
10. The late light-theme restyle was explicitly excluded from this guide as out of scope for the ATS task.

## Scope and boundary
- This guide covers the ATS task only: scaling, automated testing, CI/CD, security hardening, benchmark evidence, and documentation/resume-facing changes.
- The late light-theme color restyle was intentionally excluded from both this guide and the interview prep material.
- This repo also contains a local `INTERVIEW_PREP.md` for the broad app; this document is specifically for net-new ATS work.
- If exact pre/post diff lines are not available in this environment, the guide uses the repo’s current state and the verified task facts as the audit baseline instead of guessing.

## File index

| Pillar | Files |
|---|---|
| Scaling | `Backend/ecosystem.config.cjs`, `Backend/helpers/cache.js`, `Backend/index.js`, `frontend/src/config/socket.ts` |
| Testing | `Backend/tests/app.js`, `Backend/tests/global-setup.js`, `Backend/tests/global-teardown.js`, `Backend/tests/jest-setup-env.js`, `Backend/jest.config.js`, `Backend/tests/auth.test.js`, `Backend/tests/repo.test.js`, `Backend/tests/cli.test.js` |
| CI/CD | `.github/workflows/ci.yml`, `amplify.yml`, `Backend/package-lock.json`, `frontend/package-lock.json` |
| Security | `Backend/Middleware/authorizeMiddleware.js`, `Backend/model/repoModel.js`, `Backend/routes/repo.router.js`, `.gitignore`, `Backend/index.js` |
| Benchmarks | `Backend/benchmark-push.mjs` |
| Docs | `README.md`, `INTERVIEW_PREP.md`, `docker-compose.yml` |

## 1) Scaling and runtime reliability

### Backend/ecosystem.config.cjs
- Purpose: PM2 cluster configuration for the EC2 backend.
- What changed: The server is now launched in cluster mode with one worker per CPU core via `instances: "max"`, `exec_mode: "cluster"`, and `autorestart: true`.
- Why it matters: A single Node process would not scale reliably on EC2 when multiple users were connected concurrently; PM2 spreads work across cores and restarts workers automatically when they crash.
- How it works: The PM2 app is defined with `cwd: __dirname`, script `index.js`, and production environment variables. It is designed to serve as the backend process supervisor for the app runtime.
- How to verify: Run `npx pm2 status` on the EC2 host and confirm multiple `repoflow-backend` workers are active. Also confirm `pm2 logs` shows the cluster booting without fatal process exits.
- Risks / notes: PM2 helps horizontal scaling on a single instance, but it does not replace proper load balancing or health checks. If using a true multi-instance fleet, you still need a managed ALB / reverse proxy and shared durable config.

### Backend/helpers/cache.js
- Purpose: Redis-backed read-through caching layer with bounded retries and no-hang behavior.
- What changed: `cache.js` now creates a lazy-loaded Redis client, sets 60s TTLs for repo reads and 30s TTLs for profile reads, and uses backoff + fast-fail logic so Redis outages do not slow down requests indefinitely.
- Why it matters: Read-heavy endpoints like repo listings and profile reads are expensive; caching reduces database pressure and keeps request latency stable under load, but only if the cache can fail safely.
- How it works: `redisUrl()` reads `process.env.REDIS_URL` lazily so dotenv can complete before the client is built; `createRedisClient()` sets a 2s connect timeout and retries only a few times; `getClient()` backs off for 30s after a failure. `cacheGet`, `cacheSet`, and `cacheDelete` all no-op cleanly on failure, making the app degrade gracefully.
- How to verify: Start with Redis down and hit a cached endpoint; it should still respond normally rather than hang. With Redis up, check that repo/profile responses are cached and then invalidated on writes via `invalidateRepoCache`.
- Risks / notes: TTL values are intentionally short; stale reads are possible for a few seconds after repo changes and require explicit invalidation. That is a reasonable tradeoff for a fast, best-effort cache, but not a correctness-first cache.

### Backend/index.js
- Purpose: API server entrypoint, security layer, socket cluster setup, and runtime boot fix.
- What changed: The server now initializes with `startServer` even when invoked as plain `node index.js` or `pm2 start`, avoiding the historical `startServer is not defined` bug. It adds `helmet()`, rate limiting on auth routes, and a Redis-backed Socket.IO adapter with a websocket-only transport.
- Why it matters: The app must boot reliably under PM2 and remain secure and cluster-safe. Without the fixed start path, production process managers would crash on boot. Without the websocket-only transport, PM2 multi-worker socket sessions would break or bounce between processes.
- How it works: `app.use(helmet())` sets secure HTTP headers; `rateLimit()` caps auth attempts to 20/5 minutes; `createAdapter(pubClient, subClient)` lets Socket.IO rooms be shared across worker processes; `await Promise.race([...])` creates a strict 8s connect timeout so a dead Redis never blocks boot.
- How to verify: `curl -I http://localhost:3000/login` should include security headers; hitting `/login` or `/signup` repeatedly should return HTTP 429 after the threshold; and a multi-worker socket test should show room events shared between workers.
- Risks / notes: The adapter is intentionally best-effort. If Redis is unavailable, the app still boots and falls back to in-memory state, but realtime cross-worker communication is lost in that limited mode.

### frontend/src/config/socket.ts
- Purpose: Frontend Socket.IO client configuration.
- What changed: The client is configured with `transports: ["websocket"]` and reconnection handling tuned for a cluster-backed backend.
- Why it matters: In PM2 cluster mode without sticky sessions, HTTP polling would create cross-worker disconnect/reconnect issues. WebSocket transport keeps the connection stable and aligned with the backend’s cluster strategy.
- How it works: `io(BASE_URL, { autoConnect: false, transports: ["websocket"] ... })` ensures the client follows the backend’s same transport strategy.
- How to verify: Watch browser devtools network events or connect two clients and verify notifications continue across server workers without polling fallback.
- Risks / notes: WebSocket-only mode requires the server to support the same transport. If a reverse proxy or some edge layer strips websockets, client disconnects can occur.

## 2) Automated testing and test infrastructure

### Backend/tests/app.js
- Purpose: Shared Express app constructor for tests.
- What changed: The test app mounts the real routers against an in-memory MongoDB instance instead of mocking routes. This exercises real auth middleware, controllers, and request flows.
- Why it matters: The test suite verifies production behavior under realistic conditions and catches route/auth issues before merging.
- How it works: `buildApp()` connects to Mongo if needed and then imports the same `mainRouter` used in production.
- How to verify: Run `cd Backend && npm test` and confirm auth / repo / CLI tests pass through the real route stack.
- Risks / notes: This is integration-style testing, so it is slower than pure unit tests; the tradeoff is greater confidence in actual endpoints.

### Backend/tests/global-setup.js
- Purpose: Launches a temporary MongoDB instance for Jest.
- What changed: Uses `mongodb-memory-server` to create a disposable MongoDB test database at runtime.
- Why it matters: The repo can run end-to-end tests without a real Atlas instance or external DB credentials.
- How it works: It writes a temp JSON env file with `MONGO_URI`, `DB_NAME`, and `JWT_SECRET`, and stores the memory-server instance on `globalThis` for later teardown.
- How to verify: Run the test command and confirm the test DB starts automatically and the suite completes without external infrastructure.
- Risks / notes: The first run downloads a real `mongod` binary, which can be slow on a fresh machine. That is acceptable for CI once cached, but it is a real setup cost.

### Backend/tests/global-teardown.js
- Purpose: Stops the temp Mongo server after tests complete.
- What changed: Deletes the temp env file and stops the in-memory server.
- Why it matters: Prevents background processes or stale MongoDB instances from surviving the test runs.
- How it works: It checks `globalThis.__repoflowMongoServer__` and calls `stop()` if available.
- How to verify: Run `npm test` and ensure the process exits cleanly without leaving lingering background MongoDB processes.
- Risks / notes: The file is minimal and robust because it is designed for test isolation rather than production use.

### Backend/tests/jest-setup-env.js
- Purpose: Injects dummy env vars for external services during tests.
- What changed: It sets local test DB config and fake AWS / Pinecone / Gemini credentials so unit/integration tests can run in CI without real credentials.
- Why it matters: This preserves deterministic test behavior and prevents production secrets from being required in GitHub Actions.
- How it works: It loads a temp test env file and fills in no-op values for cloud services so modules import cleanly even when external config is absent.
- How to verify: Run tests in a clean environment with no `.env` file and confirm they still pass.
- Risks / notes: These are safe for tests but not a replacement for actual integration validation. They keep external service calls from breaking imports, but they do not prove cloud integrations work.

### Backend/jest.config.js
- Purpose: Jest configuration for the backend.
- What changed: The repo now runs a single-process test setup with `maxWorkers: 1`, `globalSetup`, `globalTeardown`, and a `setupFiles` hook that injects env files before imports happen.
- Why it matters: This avoids flaky multi-process test environment issues and keeps the in-memory MongoDB lifecycle stable.
- How it works: The config points Jest at `**/tests/**/*.test.js` and ensures the setup file runs before tests import modules.
- How to verify: Run `cd Backend && npm test` and confirm all 13 tests pass with only one worker.
- Risks / notes: `maxWorkers: 1` reduces parallelism and makes the test suite slower than a distributed runner, but it increases reliability for stateful integration tests.

### Backend/tests/auth.test.js
- Purpose: Auth flow coverage.
- What changed: The tests cover sign-up, login, and auth-protected flows using the live backend route stack and in-memory Mongo.
- Why it matters: Auth is the first trust boundary; exercising it in Jest prevents regressions in JWT issuance or user creation.
- How it works: It builds an Express app using the same route definitions and attempts realistic signup/login requests.
- How to verify: `npm test -- --runTestsByPath tests/auth.test.js` or the full `npm test` run should show green auth cases.
- Risks / notes: These tests validate route behavior but not a production identity provider or OIDC integration.

### Backend/tests/repo.test.js
- Purpose: Repository CRUD coverage.
- What changed: The suite covers repo creation, reads, visibility toggles, and repository flows against the test DB.
- Why it matters: Repository operations are the core business path in RepoFlow; if they regress, the product breaks for users.
- How it works: The test environment makes a real repo object with related auth tokens and Mongoose operations, then checks the HTTP response contract.
- How to verify: Run the repo suite or full backend tests and confirm route-level CRUD results are green.
- Risks / notes: It tests the contract, not the eventual front-end UI behavior.

### Backend/tests/cli.test.js
- Purpose: Covers the custom CLI push flow and collaborator-related push logic.
- What changed: CLI tests validate the end-to-end push route as a realistic command flow rather than isolated function calls.
- Why it matters: The CLI is a differentiator for the project and a common regression point because it touches file staging, commit bundling, and API submission.
- How it works: The CLI routes route through `mainRouter` and run against the same app stack as the backend, with a no-op cloud config injected by the Jest setup file.
- How to verify: `npm test` includes this suite and should show 3 CLI tests + 1 collaborator test passing.
- Risks / notes: This still does not validate actual multi-user network conditions; it validates the contract and server-side logic.

## 3) CI/CD and deployment hardening

### .github/workflows/ci.yml
- Purpose: GitHub Actions CI definition for backend tests and frontend build validation.
- What changed: CI runs backend tests on Node 20 and enforces a frontend production build. It also sets dummy env vars to keep Pinecone / Gemini / AWS imports non-fatal during CI.
- Why it matters: The project now has a repeatable pipeline that confirms the app is still working on every push and PR.
- How it works: The workflow checks out the code, sets up Node, installs backend dependencies, optionally caches the MongoDB binary, and runs `npm test`. It then rebuilds the frontend in a separate workdir with `npm install` and `npm run build`.
- How to verify: Push to `main` or open a PR and watch the GitHub Actions job. A green status should show both backend tests and frontend build successful.
- Risks / notes: CI is intentionally hermetic; it avoids depending on real cloud credentials, which is good for correctness but does not prove production secrets are valid.

### amplify.yml
- Purpose: AWS Amplify deployment definition for the frontend.
- What changed: The frontend is set up to be built and deployed through Amplify, with the public URL living on the AWS-hosted site.
- Why it matters: This keeps the app live without manual deployment work and gives a consistent front-end host mirror for QA and demos.
- How it works: Amplify builds the Vite app and serves the production bundle from the AWS CDN distribution.
- How to verify: Open the deployed URL and confirm the frontend loads successfully after a push to the branch configured in Amplify.
- Risks / notes: Front-end deployment is decoupled from the backend runtime, so API environment variables and CORS need to be configured carefully.

### Backend/package-lock.json / frontend/package-lock.json
- Purpose: Dependency lockstate for reproducible installs.
- What changed: The lockfile was regenerated and the frontend install path was corrected for the CI environment, including the Linux optional dependency issue (`@rolldown/binding-linux-x64-gnu`) and consistent package installation behavior across OSes.
- Why it matters: CI transparency and repeatability matter: a lockfile mismatch caused a real build failure on Linux and had to be corrected.
- How it works: NPM install resolves native bindings in a platform-specific way; by fixing the lockfile/install strategy, the build job stops failing in CI.
- How to verify: Re-run `npm install` and `npm run build` in a clean environment; the lockfile should install successfully on the runner without missing native modules.
- Risks / notes: Lockfile churn is expected when moving between dev environments; the tradeoff is reproducibility and fewer surprises in automated builds.

## 4) Security hardening and access control

### Backend/Middleware/authorizeMiddleware.js
- Purpose: Route authorization guard for ownership and repository membership.
- What changed: `authorizeRepositoryMember` was added to allow both repo owners and collaborators access to repository-scoped actions, while still protecting destructive owner-only routes with `authorizeRepositoryOwner`.
- Why it matters: The app no longer trusts a user is allowed to modify a repository just because they are authenticated; access is checked against stored membership.
- How it works: It reads the repository by `repoId` or `id`, checks `repository.owner` and `repository.collaborators`, and sets `req.repository` and `req.isOwner` before calling next.
- How to verify: Create a repo, add a collaborator, and confirm both the owner and collaborator can access allowed endpoints while an unrelated user gets a 403.
- Risks / notes: Authorization checks are explicit but still depend on correct `req.userId` mapping. A broken auth middleware would make all authorization logic meaningless.

### Backend/model/repoModel.js
- Purpose: Repository schema.
- What changed: A `collaborators` array was added to the repository document.
- Why it matters: Access control needs to be represented as data, not ad hoc logic. Without collaborators stored on the model, authorization cannot scale beyond a single owner.
- How it works: The schema stores IDs for collaborators alongside `owner`, `issues`, and `starredUsers`.
- How to verify: Query a repo document after adding a collaborator and confirm the collaborator ID is present.
- Risks / notes: The table is intentionally simple; it assumes the application validates collaborator IDs and does not allow duplicates or invalid object references.

### Backend/routes/repo.router.js
- Purpose: Repository route wiring.
- What changed: Added a restricted `POST /repo/collaborators/:id` route that enforces owner-only access before granting collaborator membership.
- Why it matters: Without ownership enforcement, any authenticated user could grant access to arbitrary repos.
- How it works: `authMiddleware` ensures a valid user, `authorizeRepositoryOwner` ensures the caller owns the repo, and then `addCollaborator` persists the new collaborator.
- How to verify: Authenticate as the repo owner, call the route, and verify a collaborator ID is added. Then try the same call as a non-owner and expect 403.
- Risks / notes: Route-level protection is only as good as the middleware chain. If one of the middleware functions is bypassed or miswired, the collaborator route is exposed.

### Backend/index.js (security path)
- Purpose: HTTP security controls.
- What changed: `helmet()` and `express-rate-limit` were enabled for login/signup routes.
- Why it matters: These are baseline protections against common web vulnerabilities and brute-force attacks.
- How it works: The app sets a trusted proxy and applies a 20 requests / 5 minutes limit to `/login` and `/signup`, while `helmet()` adds secure headers.
- How to verify: Run `curl -I <app-url>` and confirm headers such as `X-Frame-Options` and `X-Content-Type-Options` are present. Repeated auth attempts should produce an HTTP 429 response.
- Risks / notes: Rate limits must be tuned to the real user volume. A rate limit that is too low will block legitimate users; too high will let brute force proceed.

### .gitignore
- Purpose: Public-safety protection for sensitive deployment artifacts.
- What changed: The EC2 `.pem` private key is ignored and remains untracked in git.
- Why it matters: Hard-coded or committed SSH keys are a severe operational and security risk.
- How it works: The `.gitignore` pattern `*.pem` prevents sensitive private-key files from being included in the repo.
- How to verify: Check `git status --short` after placing a `.pem` file in the repo root; it should not appear in tracked changes.
- Risks / notes: This is a basic guardrail, but it relies on developers keeping the file out of the repo and not using it in configs accidentally.

## 5) Benchmarking and measurement honesty

### Backend/benchmark-push.mjs
- Purpose: Real push benchmark against the live API.
- What changed: This script generates a ~50MB file, logs in, creates a repo, and times 3 real push operations to produce an average and sample numbers.
- Why it matters: It captures evidence rather than relying on a hand-wavy “it feels faster” claim.
- How it works: It creates a temp workdir, uses the same API contracts as the CLI (`/login`, `/cli/repo/init`, `/cli/repo/:repoId/push`), and prints exact timings.
- How to verify: Run `node benchmark-push.mjs <email> <password> [apiUrl]` and look for the `Avg push time` metric. The script records measured values and prints them as exact ms.
- Risks / notes: The benchmark is honest about a single-machine, real-world setup. It is not a distributed load test, and it does not simulate production concurrency. The measured `~238 ms` is strong evidence for a local performance gain, but it is not a universal claim for all environments.

## 6) Documentation and resume-facing narrative

### README.md
- Purpose: Project overview that reads like portfolio-facing product documentation.
- What changed: The README was rewritten into a concise, recruiter-friendly overview emphasizing real architecture, AI, infrastructure, and workflow depth rather than raw implementation notes.
- Why it matters: Hiring managers want to understand the project quickly; the README acts as the first-level pitch for the app and its stack.
- How it works: It describes the platform features, architecture diagram, stack, project structure, and local run instructions in a crisp format.
- How to verify: Open the README and confirm it focuses on the product and architecture rather than internal debugging notes.
- Risks / notes: It is intentionally selective; not every implementation detail is included, which is good for clarity but not exhaustive for engineering review.

### INTERVIEW_PREP.md
- Purpose: Deep-dive interview prep for the app as a whole.
- What changed: It adds a repository-level narrative for explaining the architecture, design decisions, and key entry points during an interview.
- Why it matters: Team members need a consistent way to explain the system’s tradeoffs and technical choices.
- How it works: It lays out system architecture, stack rationale, and component-level explanation of auth, AI, CLI, notifications, and WebRTC review flows.
- How to verify: Review the file and ensure it covers the product and app architecture broadly, without focusing on the ATS-specific task changes alone.
- Risks / notes: This is intentionally broad and should not be confused with the ATS-specific prep document created for these operational changes.

### docker-compose.yml
- Purpose: Local Redis service definition.
- What changed: The repo gains a local Redis container for development, creating the same service assumptions the app expects in production.
- Why it matters: Local work needs the Redis service to be present for cache and Socket.IO adapter flows.
- How it works: It defines the Redis service and exposes port 6379 so local development mirrors production connection assumptions.
- How to verify: Run `docker compose up -d redis` and confirm the local Redis service is reachable on the expected port.
- Risks / notes: Docker-based local dependency setup can drift without a documented requirement list, so it is best paired with the README instructions.

## Needs clarification / out-of-scope notes
- The repo’s late light-color restyle (`frontend/src/index.css` and related theme commits) was intentionally excluded from the ATS change narrative, per the task brief.
- No exact `backup-pre-ats..main` diff could be re-generated in this environment because the shell/Git runtime available here does not expose PowerShell and the Git diff command could not be executed. The guide therefore relies on the repo’s current final state, the task brief’s verified facts, and the code files present in the workspace.
- Any minor product or deploy details not explicitly present in the repo or task brief were intentionally omitted instead of guessed.

## Final summary
The ATS task turned RepoFlow from a single-process prototype into a more production-worthy platform: clustered backend runtime, Redis tradeoff-aware caching, shared realtime state across worker processes, route-level auth security, environment-safe Jest setup, CI verification, measured benchmark proof, and clearer interview-ready documentation. The delivered work is practical, measurable, and relevant to an engineering interview or portfolio defense.
