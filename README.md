# RepoFlow Interview Prep Guide

RepoFlow is a full-stack GitHub-style developer platform with repository management, a custom version-control CLI, issue tracking, AI duplicate issue detection, realtime notifications, and peer-to-peer code review calls.

This README is written as a project deep-dive guide for a Full-Stack/SDE/Applied AI SDE interview. It focuses on how to explain the system in simple conversational English while still using correct engineering keywords.

---

## 1. Architecture Map And Tech Stack

### Text Architecture Map

```text
Browser / React + TypeScript
  - Login, signup, dashboard, repo details, issues, commits, profile
  - Axios client attaches JWT from localStorage
  - Socket.IO client receives notifications and WebRTC signaling events
  - WebRTC handles actual peer-to-peer audio/video review calls

        HTTP REST + Socket.IO
                |
                v

Node.js / Express backend
  - Auth, users, repositories, issues, commits, CLI API, notifications
  - JWT middleware protects most private routes
  - Authorization middleware checks profile/repo/notification ownership
  - Socket.IO rooms map users to notification rooms and review rooms

        |
        |-- MongoDB + Mongoose
        |     Users, repositories, issues, commits, notifications, contributions
        |
        |-- AWS S3
        |     Stores pushed commit files when S3 is available
        |
        |-- MongoDB fallback
        |     Stores base64 commit file contents if S3 is unavailable
        |
        |-- Google Gemini Embeddings
        |     Generates 768-dimensional issue embeddings
        |
        |-- Pinecone
              Stores/searches issue vectors per repository namespace

Local RepoFlow CLI
  login -> init -> add -> commit -> push -> pull -> revert
  Uses local .repoFlowGit folder and backend CLI APIs
```

### Exact Stack

Frontend:

- React 19 with TypeScript for component-based UI and type safety.
- Vite for fast local development and production builds.
- React Router v7 for routes like `/`, `/repo/:name/:id`, `/profile/:id`, and `/review/:roomId`.
- Axios for API calls through `frontend/src/config/api.ts`.
- Socket.IO Client for notifications and review signaling.
- Tailwind CSS utility classes for styling.
- `@uiw/react-heat-map` for GitHub-style contribution heatmaps.

Backend:

- Node.js with Express 5 for REST APIs.
- MongoDB with Mongoose for core models.
- MongoDB native driver is also used inside `Backend/controllers/userCcontroller.js`.
- JWT for authentication in `Backend/Middleware/authMiddleware.js`.
- bcryptjs for password hashing during signup/login.
- Socket.IO for realtime notifications and review signaling.
- AWS SDK v2 for S3 commit-file storage.
- Google Generative AI SDK for embeddings.
- Pinecone for semantic vector search.
- yargs for the custom CLI command parser.
- uuid for local commit IDs.

Why this stack makes sense:

RepoFlow has normal web CRUD, realtime events, AI search, file storage, and local CLI behavior. React + Express + MongoDB keeps the main app simple and fast to build. Socket.IO gives reliable realtime events without writing raw WebSocket code. Pinecone is a good fit because duplicate issue detection is semantic search, not simple keyword search. S3 is better than MongoDB for storing files, while MongoDB fallback makes the CLI push flow more reliable during cloud-storage failures.

---

## 2. Elevator Pitches

### 30-Second Pitch

RepoFlow is a GitHub-style full-stack platform I built with React, Node.js, Express, MongoDB, Socket.IO, AWS S3, and AI embeddings. It supports repositories, issues, commits through a custom CLI, realtime notifications, AI duplicate issue detection, and WebRTC-based code review calls. The main engineering part is that I did not just build CRUD screens. I built a mini version-control workflow, added realtime collaboration, and used Gemini embeddings with Pinecone to detect semantically similar issues.

### 2-Minute Deep Dive

RepoFlow is a developer collaboration platform inspired by GitHub. A user can sign up, create repositories, star repositories, open issues, view commit history, and manage a profile with a contribution heatmap. I also built a custom CLI using Node.js and yargs. From any local project, the user can run commands like `login`, `init`, `add`, `commit`, `push`, `pull`, and `revert`. The CLI stores local snapshots in a `.repoFlowGit` folder and pushes commit metadata and files to the backend.

On the backend, Express exposes REST APIs for users, repositories, issues, commits, notifications, contributions, and CLI sync. MongoDB stores the main entities. Commit files go to AWS S3 when available, but if S3 fails, the backend stores base64 file contents in MongoDB so push still works.

The AI feature checks duplicate issues. While creating an issue, the frontend waits 600ms after typing and calls the backend. The backend creates a 768-dimensional Gemini embedding, searches Pinecone inside a repository-specific namespace, and warns the user if a similar issue crosses the `0.82` threshold.

The realtime layer uses Socket.IO. Notifications are persisted in MongoDB and also emitted live to the user's socket room. For code review calls, Socket.IO is used only for signaling, and WebRTC handles the actual peer-to-peer media stream.

---

## 3. Important Entry Points

- Backend server and CLI entry: `Backend/index.js`
- Main backend route aggregator: `Backend/routes/main.router.js`
- Frontend app bootstrap: `frontend/src/main.tsx`
- Frontend routes: `frontend/src/Routes.tsx`
- Axios clients and JWT interceptor: `frontend/src/config/api.ts`
- Socket client: `frontend/src/config/socket.ts`
- WebRTC ICE config: `frontend/src/config/webrtc.ts`
- Auth context: `frontend/src/authContext.tsx` and `frontend/src/auth.ts`
- Notification store/init: `frontend/src/store/notificationStore.ts`, `frontend/src/store/useNotifications.ts`, `frontend/src/store/NotificationInit.tsx`

Key backend models:

- User: `Backend/model/userModel.js`
- Repository: `Backend/model/repoModel.js`
- Issue: `Backend/model/issueModel.js`
- Commit: `Backend/model/commitModel.js`
- Notification: `Backend/model/notificationModel.js`
- Contribution: `Backend/model/contributionModel.js`

Key business controllers:

- Users/auth: `Backend/controllers/userCcontroller.js`
- Repositories: `Backend/controllers/repoController.js`
- Issues: `Backend/controllers/issueController.js`
- AI duplicate detection: `Backend/controllers/issueAIController.js`
- CLI backend sync: `Backend/controllers/cliController.js`
- Local CLI commands: `Backend/controllers/init.js`, `add.js`, `commit.js`, `push.js`, `pull.js`, `revert.js`
- Commit HTTP APIs: `Backend/controllers/commitHttpController.js`
- Notifications: `Backend/controllers/notificationController.js`
- Review signaling: `Backend/helpers/reviewSignaling.js`

---

## 4. Component-Level Deep Dives

### A. Authentication Flow

Core files:

- `Backend/controllers/userCcontroller.js`
- `Backend/Middleware/authMiddleware.js`
- `Backend/Middleware/authorizeMiddleware.js`
- `frontend/src/components/auth/Login.tsx`
- `frontend/src/components/auth/Signup.tsx`
- `frontend/src/config/api.ts`
- `frontend/src/Routes.tsx`

How it works:

1. Signup receives `username`, `email`, and `password`.
2. Password is hashed with bcrypt before storing in MongoDB.
3. Backend signs a JWT with the inserted user ID and `expiresIn: "1h"`.
4. Frontend stores `token` and `userId` in `localStorage`.
5. Axios interceptor in `frontend/src/config/api.ts` attaches `Authorization: Bearer <token>` to requests.
6. `authMiddleware` verifies the token and puts `req.userId`, `req.user`, and `req.session` on the request.
7. `authorizeUser`, `authorizeRepositoryOwner`, and `authorizeNotificationOwner` prevent users from modifying resources they do not own.

Interview answer:

"I used JWT because the frontend and CLI both need stateless authentication. After login, the token is stored client-side, and every protected request sends it in the Authorization header. On the backend I verify the token in middleware and then use separate authorization middleware for ownership checks. Authentication tells me who the user is, and authorization tells me whether that user can perform the action."

Important improvement to mention:

"For production, I would prefer httpOnly secure cookies or a refresh-token design instead of long-term localStorage tokens, because localStorage is exposed to XSS. I would also add rate limiting and stronger validation on auth routes."

### B. Repository Management Flow

Core files:

- `Backend/model/repoModel.js`
- `Backend/controllers/repoController.js`
- `Backend/routes/repo.router.js`
- `frontend/src/components/dashboard/Dashboard.tsx`
- `frontend/src/components/repo/CreateRepo.tsx`
- `frontend/src/components/repo/RepoDetails.tsx`

How it works:

1. `CreateRepo.tsx` validates the repository name and sends `POST /repo/create`.
2. `createRepository` validates owner ID, checks that the owner exists, saves the repository, pushes the repository ID into the user's repositories array, and logs a `repo_created` contribution.
3. `Dashboard.tsx` loads the current user's repositories with `/repo/user/:userId`.
4. The dashboard also loads `/repo/all` and filters public repositories on the frontend for global discovery.
5. `RepoDetails.tsx` fetches full repository data with `/repo/:id`, shows tabs for content, issues, commits, and owner-only deletion.
6. Star/unstar calls `POST /repo/star/:id`; the backend updates both `Repository.starredUsers` and `User.starredRepositories`.

Engineering principles:

- Repository ownership is modeled with a MongoDB ObjectId reference.
- There is a compound unique index on `{ name: 1, owner: 1 }`, allowing different users to use the same repo name but preventing duplicate names for one owner.
- Owner-only destructive actions are enforced on the backend through `authorizeRepositoryOwner`.

Interview answer:

"I kept repository ownership explicit. Every repo has an `owner` reference, and write operations like update, delete, and visibility toggle go through owner authorization. For stars, I update both sides of the relationship: the repository keeps `starredUsers` and the user keeps `starredRepositories`. That gives fast lookups for both the repository page and the user's starred tab."

Improvement to mention:

"The `/repo/all` route currently returns all repositories and the frontend filters public ones. In production I would enforce privacy at the backend query level, for example `Repository.find({ visibility: true })`, because security should not depend on frontend filtering."

### C. Custom CLI Version Control Flow

Core files:

- `Backend/index.js`
- `Backend/helpers/cliConfig.js`
- `Backend/controllers/cliAuth.js`
- `Backend/controllers/init.js`
- `Backend/controllers/add.js`
- `Backend/controllers/commit.js`
- `Backend/controllers/push.js`
- `Backend/controllers/pull.js`
- `Backend/controllers/revert.js`
- `Backend/controllers/cliController.js`

CLI commands:

```bash
node index.js login
node index.js logout
node index.js whoami
node index.js init <repoName>
node index.js add <file>
node index.js commit <message>
node index.js push
node index.js pull
node index.js revert <commitId>
```

How it works:

1. `login` calls the backend `/login` route and stores token, user ID, and API URL in `~/.repoflow/credentials.json`.
2. `init <repoName>` creates `.repoFlowGit/commits` and `.repoFlowGit/staging`, then calls `/cli/repo/init`.
3. The backend finds or creates the repository for that user.
4. `add <file>` copies a file into `.repoFlowGit/staging`.
5. `commit <message>` creates a UUID commit folder inside `.repoFlowGit/commits`, copies staged files, writes `commit.json`, and clears staging.
6. `push` reads unpushed local commit folders and sends files as base64 to `/cli/repo/:repoId/push`.
7. The backend tries S3 first. If S3 fails, it stores file contents in MongoDB as fallback.
8. `pull` downloads the latest server commit into `.repoFlowGit/commits/<commitId>`.
9. `revert <commitId>` downloads files from that commit and writes them into the current working directory.

Interview answer:

"I built the CLI as a lightweight version-control workflow, not as a replacement for Git internals. The local `.repoFlowGit` folder is my local object area: staging holds files before commit, and commits are UUID-named snapshots. Push syncs those snapshots to the backend. The design is intentionally simple so the browser can show commit history and file contents without needing to parse Git objects."

Tradeoff answer:

"The current CLI snapshots whole files, not diffs. That makes implementation and restore simple, but it uses more storage. If I scaled this, I would add content hashing and delta storage so unchanged files are not uploaded repeatedly."

### D. Commit Storage With S3 And MongoDB Fallback

Core files:

- `Backend/model/commitModel.js`
- `Backend/config/aws-config.js`
- `Backend/controllers/cliController.js`
- `Backend/controllers/commitHttpController.js`
- `Backend/controllers/commit.js`
- `frontend/src/components/repo/CommitHistory.tsx`
- `frontend/src/components/repo/RepoDetails.tsx`

How it works:

1. `pushCliCommit` validates that the authenticated user owns the repository.
2. It checks if the commit already exists to keep push idempotent.
3. It tries `s3.headBucket` and uploads each file to `commits/<commitId>/<filename>`.
4. If S3 fails, it saves `{ name, content }` in `Commit.fileContents`.
5. `Commit.storageType` records whether storage is `s3`, `mongodb`, or `none`.
6. `getCommitsByRepo` returns commit metadata but excludes `fileContents`.
7. `revertToCommit` returns short-lived S3 signed URLs or MongoDB data URLs depending on storage type.
8. `CommitHistory.tsx` expands a commit and shows downloadable files.

Interview answer:

"I separated metadata from file retrieval. The commit list endpoint returns metadata only, excluding file contents, so the list stays lightweight. File URLs are fetched only when the user expands a commit. For S3 commits, I return signed URLs with a short expiry. For MongoDB fallback commits, I return data URLs from base64 content."

Important bug to mention honestly:

"One issue I found is in `Backend/controllers/commit.js`: `getLatestFiles` uses `s3` and `S3_BUCKET` but does not import them. The fix is simple: import them from `Backend/config/aws-config.js`. I would catch this with an integration test for `/repo/:id/files`."

### E. Issues And AI Duplicate Detection

Core files:

- `frontend/src/components/issues/CreateIssue.tsx`
- `Backend/controllers/issueController.js`
- `Backend/controllers/issueAIController.js`
- `Backend/helpers/embeddings.js`
- `Backend/helpers/vectorStore.js`
- `Backend/config/pinecone-config.js`

How issue creation works:

1. User opens the issue form in `IssueList.tsx`.
2. `CreateIssue.tsx` stores title and description locally.
3. On typing, it debounces for 600ms before checking duplicates.
4. Frontend calls `POST /issue/check-duplicate/:repoId`.
5. Backend checks minimum title/description length.
6. `generateWeightedEmbedding` repeats the title twice and appends the description.
7. Gemini generates a 768-dimensional embedding.
8. Pinecone searches `namespace("repo-<repoId>")` with topK 3.
9. Matches above `0.82` are returned as similar issues.
10. If the user submits, `createIssue` saves the issue in MongoDB, adds it to the repository, logs a contribution, sends a notification, and calls `embedAndIndexIssue` in the background.

Why title weighting is used:

"For duplicate issue detection, the title usually carries the strongest intent. If someone writes 'Login fails after token expiry', that title is more important than a long description. I repeat the title in the text before embedding, which gives it more influence without needing a custom ML model."

Why Pinecone namespace per repo:

"Duplicate issues should be checked within the same repository, not globally. A login bug in one repo should not match a login bug in another repo. So I use a namespace like `repo-<repoId>` to isolate the vector space."

Improvement to mention:

"When an issue is edited or closed, the vector metadata is not currently re-indexed. I would call `embedAndIndexIssue` on title/description updates and update status metadata on status change. Also, issue schema does not use timestamps, while the UI optionally reads `createdAt`, so I would add `{ timestamps: true }`."

### F. Realtime Notifications

Core files:

- `Backend/index.js`
- `Backend/helpers/socketInstance.js`
- `Backend/helpers/notifyUser.js`
- `Backend/controllers/notificationController.js`
- `Backend/model/notificationModel.js`
- `frontend/src/store/NotificationInit.tsx`
- `frontend/src/store/notificationStore.ts`
- `frontend/src/store/useNotifications.ts`
- `frontend/src/components/Navbar.tsx`

How it works:

1. Backend creates one Socket.IO server on the same HTTP server as Express.
2. `setIO(io)` stores the Socket.IO instance for helpers.
3. When frontend loads the layout, `NotificationInit` fetches previous notifications through REST.
4. Socket connects and emits `join` with the logged-in user ID.
5. Backend joins that socket to a room named after the user ID.
6. Business actions call `notifyUser(getIO(), payload)`.
7. `notifyUser` saves the notification in MongoDB and emits a `notification` event to the recipient room.
8. The frontend store deduplicates notifications by `_id`, sorts by `createdAt`, and updates the unread count.
9. Navbar shows the bell count and marks notifications as read when clicked.

Interview answer:

"I designed notifications as both realtime and persistent. Socket.IO gives instant delivery when the user is online, but every notification is also saved in MongoDB. So if the user is offline, they still see missed notifications when they return."

Optimization point:

"The notification query uses an index on `{ recipient: 1, read: 1, createdAt: -1 }`, which helps fetch recent notifications and unread counts efficiently."

### G. WebRTC Code Review Room

Core files:

- `frontend/src/components/review/ReviewRoom.tsx`
- `frontend/src/config/webrtc.ts`
- `Backend/helpers/reviewSignaling.js`
- `frontend/src/components/repo/CommitHistory.tsx`

How it works:

1. User clicks "Start Review Call" from a commit in `CommitHistory.tsx`.
2. Frontend creates a random room ID and navigates to `/review/:roomId?repoId=...&commitId=...`.
3. `ReviewRoom.tsx` loads the commit files through `/repo/:id/revert/:commitId`.
4. User joins the review room through Socket.IO event `review:join`.
5. Backend stores room membership in in-memory Maps.
6. Room is capped at two participants.
7. Socket.IO relays offer, answer, and ICE candidates through `review:signal`.
8. Browser creates an `RTCPeerConnection` with STUN/TURN servers from `frontend/src/config/webrtc.ts`.
9. Audio/video flows through WebRTC peer-to-peer, not through the Express server.
10. Code is displayed beside the video call so both reviewers see the same commit content.

Interview answer:

"Socket.IO is only the signaling layer. It helps both browsers exchange SDP offers, answers, and ICE candidates. After the connection is established, WebRTC carries the media stream directly between peers. That is better because the server does not carry heavy video traffic."

Important limitation:

"The review room state is in memory, so if the backend restarts, rooms are lost. That is okay for a portfolio demo, but at scale I would use Redis adapter for Socket.IO and store room metadata if I need multi-instance support."

Important bug to mention:

"There is a backend `POST /repo/:id/review/:commitId` route that calls `startReviewCall`, but the route does not attach `authMiddleware` even though `startReviewCall` reads `req.userId`. Also the current frontend navigates directly to the review room instead of calling this notification endpoint. I would either wire the API call from the frontend or remove/fix the unused route."

### H. Profile And Contribution Heatmap

Core files:

- `frontend/src/components/user/Profile.tsx`
- `frontend/src/components/user/HeatMap.tsx`
- `frontend/src/components/user/StarredRepo.tsx`
- `Backend/model/contributionModel.js`
- `Backend/controllers/contributionController.js`
- `Backend/helpers/logContribution.js`

How it works:

1. Contributions are logged for actions such as repo creation, starring, issue creation, issue closing, and repo updates.
2. `logContribution` stores user ID, contribution type, and date in `YYYY-MM-DD` format.
3. Contribution API fetches current year entries and groups them by date.
4. Frontend renders the grouped data with `@uiw/react-heat-map`.
5. Profile supports overview and starred repository tabs.

Interview answer:

"I modeled contributions as separate event records instead of storing counters directly on the user. That makes the heatmap easy because I can group by date, and later I can add analytics by contribution type."

---

## 5. System Optimization And Performance Tuning

### Current Good Choices

- Axios interceptor centralizes JWT attachment.
- Notification list fetch and unread count use `Promise.all`.
- Commit list excludes `fileContents`, avoiding large payloads.
- Commit schema has `{ repoId: 1, createdAt: -1 }` index for fast commit history.
- Notification schema has `{ recipient: 1, read: 1, createdAt: -1 }` index.
- Contribution schema has `{ userId: 1, date: 1 }` index.
- Pinecone namespaces isolate issue search by repo.
- Frontend duplicate checks are debounced by 600ms, reducing AI calls.

### Bottlenecks Or Risks

- `/repo/all` fetches all repositories, then frontend filters public repositories.
- No pagination on repositories, issues, or commits.
- `getAllRepositories` populates owner and issues for all repositories, which can become expensive.
- Issue duplicate check calls Gemini and Pinecone on each debounced check; this should be rate-limited and cached.
- Commit file storage stores whole-file snapshots, not diffs.
- MongoDB fallback stores base64 content, which increases storage size by around one third.
- Socket.IO room maps are in memory, so multi-server deployment needs Redis adapter.
- `getLatestFiles` has a missing S3 import bug.
- Private repository access needs stricter backend enforcement in read endpoints.
- There are no automated tests in the current project structure.

### How To Answer "How Would You Scale This?"

Model answer:

"I would scale it in layers. First I would fix backend data access: filter public repositories in the database, add pagination, and avoid unnecessary populate calls. For commit history, I would keep returning metadata first and fetch files on demand, which the app already does. For file storage, I would move completely to S3 or object storage and keep MongoDB only for metadata. For the CLI, I would add content hashing and upload only changed files.

For realtime, I would use Redis adapter for Socket.IO so multiple Node instances can share room events. For AI duplicate detection, I would keep Pinecone namespaces per repo, add rate limiting, cache embeddings for repeated drafts, and reindex asynchronously using a job queue. For deployment, I would put the API behind a load balancer, use environment-specific CORS, and add monitoring for latency, failed embeddings, S3 failures, and socket disconnects."

---

## 6. Full-Stack Interview Questions And Model Answers

### Frontend Questions

#### Q1. How do you manage authentication state on the frontend?

Answer:

"I use a simple React Context in `authContext.tsx`. When the app starts, it reads `userId` from localStorage and sets `currentUser`. In `Routes.tsx`, protected pages redirect to `/login` if there is no stored user ID. For API calls, I use an Axios interceptor in `config/api.ts` to attach the JWT token automatically. This keeps components cleaner because each component does not need to manually add the token."

#### Q2. Why did you use React Context instead of Redux?

Answer:

"The app only needs global auth state and a small notification store. Redux would work, but it would be extra complexity for this size. I used Context for auth because it is simple and built into React. For notifications, I made a lightweight external store with subscribe/rerender behavior because notifications are shared by Navbar and socket initialization."

#### Q3. How does the duplicate issue UI avoid too many API calls?

Answer:

"In `CreateIssue.tsx`, I use a `setTimeout` debounce of 600ms. Every time the title or description changes, I clear the previous timer and start a new one. So the backend is called only after the user pauses typing. I also check minimum input length before calling the API."

#### Q4. How do you handle loading and empty states?

Answer:

"Most screens maintain local `loading` state. For example, `RepoDetails.tsx`, `IssueList.tsx`, `CommitHistory.tsx`, and `HeatMap.tsx` show skeletons or empty states. This improves UX because the user gets feedback instead of a blank screen."

#### Q5. How does the repo details page organize complex UI?

Answer:

"`RepoDetails.tsx` uses tab state: content, issues, commits, and delete. Each complex area is delegated to a component: `IssueList` for issues and `CommitHistory` for commits. That keeps the page readable and allows each feature to manage its own loading and interactions."

#### Q6. What rendering optimization would you add?

Answer:

"For small data this is fine, but for many repos, issues, or commits I would add pagination and possibly virtualization. I would also memoize expensive filtered lists if the arrays become large. Right now client-side filtering is simple, but server-side search would be better at scale."

### Backend And Database Questions

#### Q7. Explain your backend architecture.

Answer:

"The backend follows a route-controller-model style. `main.router.js` combines routers. Each router maps endpoints to controller functions, and controllers use Mongoose models for database operations. Middleware handles authentication and authorization before controllers run."

#### Q8. What is the difference between authentication and authorization in your project?

Answer:

"Authentication verifies the token and identifies the user. That happens in `authMiddleware`. Authorization checks whether that user is allowed to perform a specific action. For example, `authorizeRepositoryOwner` checks if `repository.owner` matches `req.userId` before update/delete."

#### Q9. Why do you have indexes in MongoDB?

Answer:

"Indexes support the most common query patterns. Repository has a unique compound index on name and owner to prevent duplicate repo names per user. Commit has repoId and createdAt index for commit history sorting. Notifications have recipient/read/createdAt index because I often fetch recent notifications and unread counts. Contributions have userId/date index for heatmap queries."

#### Q10. How do you maintain data consistency when starring a repo?

Answer:

"When a user stars a repository, I update both the repository and user documents. The repository keeps star count and starred users. The user keeps starred repositories. This is denormalized, but it supports fast reads in both directions. In production, I would use a transaction to guarantee both updates succeed together."

#### Q11. How does commit push handle cloud failure?

Answer:

"The backend tries S3 first. If S3 bucket access or upload fails, it does not reject the whole push. It switches `storageType` to MongoDB and stores the file contents as base64 in the commit document. That makes push more fault-tolerant. The frontend does not need to care because the revert endpoint returns either signed URLs or data URLs."

#### Q12. Why is `storageType` useful?

Answer:

"It tells the read path where to fetch files from. If it is `s3`, the backend creates signed URLs. If it is `mongodb`, it returns base64 data URLs. Without this field, the backend would have to guess or attempt both storage systems every time."

#### Q13. How would you prevent duplicate pushes?

Answer:

"The CLI tracks pushed commit IDs in local config, and the backend also checks if a commit already exists by `commitId`. So even if the CLI retries, the backend can return an 'already pushed' response instead of creating duplicates."

#### Q14. What are your biggest backend improvements?

Answer:

"I would add request validation, pagination, stronger private repo authorization, transactions for multi-document writes, centralized error handling, and automated tests. I would also stop mixing native MongoDB driver and Mongoose in the user controller, because one data access style is easier to maintain."

### AI Integration Questions

#### Q15. How does AI duplicate issue detection work?

Answer:

"When the user types an issue title and description, the frontend debounces and calls the duplicate check API. The backend creates weighted text by repeating the title, generates a 768-dimensional Gemini embedding, and searches Pinecone in the namespace for that repository. If similarity is above `0.82`, it returns similar issues and the frontend shows a warning."

#### Q16. Why use embeddings instead of keyword matching?

Answer:

"Keyword matching misses semantic duplicates. For example, 'login fails after token expiry' and 'user gets logged out when session expires' may use different words but mean the same thing. Embeddings compare meaning, so they are better for duplicate detection."

#### Q17. Why use Pinecone?

Answer:

"Pinecone is built for vector search. MongoDB is good for document queries, but similarity search over 768-dimensional vectors is a different problem. Pinecone gives efficient topK nearest-neighbor search and supports namespaces, which I use per repository."

#### Q18. What happens if the AI provider fails?

Answer:

"In `generateEmbedding`, errors return `null`. The duplicate-check controller then returns a normal response saying AI is unavailable and allows the user to proceed. I designed it so issue creation is not blocked by AI failure."

#### Q19. What is one issue in the AI pipeline?

Answer:

"Currently, created issues are indexed, and deleted issues are removed from Pinecone, but edits are not re-indexed. If the title or description changes, the vector can become stale. I would re-index after issue updates and update metadata when status changes."

### Realtime And WebRTC Questions

#### Q20. How do realtime notifications work?

Answer:

"Each user joins a Socket.IO room named by user ID. When an action creates a notification, the backend saves it in MongoDB and emits it to that user room. The frontend also fetches persisted notifications on load, so online and offline delivery both work."

#### Q21. Why did you use Socket.IO instead of raw WebSocket?

Answer:

"Socket.IO handles reconnection, event-based messaging, and fallback transports. For a full-stack project where realtime reliability matters more than low-level control, Socket.IO is practical and faster to implement correctly."

#### Q22. How does the WebRTC review call work?

Answer:

"The review room uses Socket.IO for signaling only. When two users join the same room, they exchange SDP offer/answer and ICE candidates through the server. Then the browser establishes a peer-to-peer WebRTC connection for audio and video. The server does not stream the video."

#### Q23. Why do you need STUN and TURN servers?

Answer:

"STUN helps peers discover their public network address for NAT traversal. TURN is a relay fallback when direct peer-to-peer connection fails, for example on strict networks. My `webrtc.ts` has Google STUN servers and open relay TURN servers for demo scale."

#### Q24. How would you scale Socket.IO?

Answer:

"Right now rooms are in memory, so one server instance is assumed. To scale horizontally, I would use the Socket.IO Redis adapter. That lets multiple backend instances publish events across shared Redis, so a user connected to instance A can still receive an event generated on instance B."

### DevOps And Infrastructure Questions

#### Q25. How is the app configured for environments?

Answer:

"Backend uses dotenv for `MONGO_URI`, `DB_NAME`, JWT secret, Google API key, Pinecone key, and port. Frontend uses Vite environment variables like `VITE_API_URL`. The Axios client reads `VITE_API_URL` and falls back to localhost."

#### Q26. What deployment clues are in the code?

Answer:

"CORS allows localhost plus deployed Amplify and CloudFront URLs. The frontend deploys as a static Vite build via AWS Amplify (`amplify.yml` in the repo root), and the backend runs as a Node server on EC2 under PM2 in cluster mode, behind CloudFront. CI/CD is implemented with GitHub Actions: every push to `main` runs the Jest + Supertest + mongodb-memory-server test suite and a production frontend build before the app is deployed to Amplify and the backend is pulled + reloaded on EC2."

#### Q27. How would you deploy this cleanly?

Answer:

"I would deploy frontend static assets on Amplify/S3+CloudFront. Backend would run as a Node service on EC2, ECS, Render, or similar behind HTTPS. MongoDB Atlas would be used for database. S3 would store commit files. Secrets would be environment variables, not committed files. I would also add CI that runs lint and build on every pull request."

#### Q28. What monitoring would you add?

Answer:

"I would monitor API latency, error rate, MongoDB query time, S3 upload failures, embedding failures, Pinecone query failures, socket connection count, and WebRTC room creation failures. These metrics map directly to the most important user flows."

---

## 7. Aggressive Cross-Examination And Defense Strategies

### "Why did you choose MongoDB instead of PostgreSQL?"

Defense:

"The project data is document-heavy and flexible: users have arrays of repos, repos have issue references, commits have arrays of files, and notifications are event documents. MongoDB made iteration fast. That said, PostgreSQL would also be valid, especially if I wanted stronger relational constraints and transactions by default. For this project, MongoDB was a good fit for speed and schema flexibility."

### "Why not just use Git instead of building your own CLI?"

Defense:

"The goal was not to beat Git. The goal was to understand and demonstrate the version-control workflow: staging, snapshotting, pushing, pulling, and reverting. I intentionally built a simplified file-snapshot model so it could integrate directly with my platform and browser UI. In production I might integrate real Git storage, but this project shows that I understand the core flow."

### "Your CLI stores whole files. Isn't that inefficient?"

Defense:

"Yes, whole-file snapshots are less storage efficient than Git-style object hashing and deltas. I chose it because it makes commit creation, upload, and restore simple and reliable for a portfolio version. The next step would be content-addressed storage, hashing each file, deduplicating unchanged content, and storing commit manifests."

### "What fails first if 100,000 users hit the app tomorrow?"

Defense:

"The first failures would likely be unpaginated queries, `/repo/all`, large populate calls, and Socket.IO memory state on one server. The fixes are database-level filtering and pagination, indexes, Redis adapter for Socket.IO, horizontal backend instances, and object storage for commit files. AI duplicate checks would also need rate limiting and job queues."

### "How do you protect private repositories?"

Defense:

"Some write routes already use owner authorization, but read privacy needs to be stricter. Right now I would improve routes like repo fetch and global repo listing so private repos are filtered at the backend. For private commit file access, I would require login and verify either owner or collaborator access before returning signed URLs."

### "Why is the frontend filtering public repositories instead of backend?"

Defense:

"That is a good catch. It works for UI display, but it is not secure. The correct production design is to filter in the backend query. I would change `getAllRepositories` to return only `visibility: true` for public discovery, and create a separate authorized route for private repos."

### "How does your auth handle token expiration?"

Defense:

"JWTs are signed with a one-hour expiry, and `authMiddleware` rejects invalid or expired tokens. The current frontend does not have a refresh-token flow; it would redirect or fail the request. For production, I would add refresh tokens with rotation, httpOnly cookies, and a centralized 401 handler in Axios."

### "Can someone hijack a token from localStorage?"

Defense:

"If the app has an XSS vulnerability, localStorage tokens can be stolen. That is why I would move to httpOnly secure cookies for production, add CSP headers, sanitize user content, and avoid injecting HTML. For this project, localStorage made CLI/browser integration simple, but I understand the security tradeoff."

### "Why mix Mongoose and MongoDB native driver?"

Defense:

"That is technical debt. Most of the project uses Mongoose models, but the user controller uses the native MongoDB driver. It works, but it creates consistency risk, especially around schema field names and defaults. I would refactor user operations to Mongoose for one consistent data access pattern."

### "What are the hardest problems you faced?"

Answer:

"The hardest parts were the custom CLI sync flow, AI duplicate detection, and WebRTC signaling. For the CLI, I had to design local state, pushed commit tracking, and backend idempotency. For AI, I had to tune the flow so it warns users without blocking issue creation, and I used repo-specific Pinecone namespaces to avoid false matches across projects. For WebRTC, the tricky part was understanding that Socket.IO is only for signaling; the media stream is handled by browser peer connections."

### "How would you test this project?"

Answer:

"I would add backend integration tests first because the API flows are the core. I would test auth, repo create/delete authorization, issue create/update/delete, AI fallback behavior, CLI push idempotency, and commit retrieval from both S3 and MongoDB fallback. On frontend, I would test route guards, issue duplicate debounce, notification rendering, and commit expansion. For WebRTC, I would at least test signaling events and room capacity logic separately."

---

## 8. STAR Answers For Common Interview Prompts

### "Tell me about a complex feature you built."

Situation:

"I wanted RepoFlow to go beyond a basic GitHub clone."

Task:

"I needed a feature that showed backend, CLI, storage, and frontend integration."

Action:

"I built a custom CLI with `login`, `init`, `add`, `commit`, `push`, `pull`, and `revert`. The CLI snapshots staged files locally and syncs them through backend APIs. The backend stores commit metadata in MongoDB and files in S3, with MongoDB fallback if S3 fails."

Result:

"The user can push code from terminal and immediately see commit history and file downloads in the web app."

### "Tell me about an AI feature you implemented."

Situation:

"Issue trackers often get duplicate issues with different wording."

Task:

"I wanted to warn users before they create a duplicate issue."

Action:

"I debounced the frontend input, generated Gemini embeddings on the backend, stored vectors in Pinecone per repository namespace, and used a `0.82` threshold for warnings."

Result:

"The system can detect semantic similarity, not just exact keyword overlap, and the user can still submit if the issue is actually different."

### "Tell me about a realtime feature."

Situation:

"Users should know instantly when someone stars their repo, follows them, or opens an issue."

Task:

"I needed realtime delivery but also persistence for offline users."

Action:

"I used Socket.IO rooms per user ID. The backend saves every notification in MongoDB and emits it live to the user's room."

Result:

"Online users get instant notifications, and offline users see missed notifications after login."

---

## 9. Known Issues To Be Honest About

Use these as strengths in interviews. Senior interviewers like honest engineers who can identify tradeoffs.

- `Backend/controllers/commit.js` uses `s3` and `S3_BUCKET` inside `getLatestFiles` without importing them.
- `Backend/routes/commit.router.js` has `POST /repo/:id/review/:commitId` without `authMiddleware`, but `startReviewCall` expects `req.userId`.
- `CommitHistory.tsx` currently starts review by navigation only; it does not call the backend review notification route.
- `/repo/all` returns all repositories and frontend filters public ones. Backend should enforce visibility.
- Private repo read authorization should be stricter.
- Issue vectors are not re-indexed after title/description edits.
- Issue schema does not use timestamps, but UI optionally displays `createdAt`.
- Some notification types exist, like `issue_closed`, but not every related flow emits them yet.
- `followUser` adds followers, but the frontend treats follow as a toggle; an unfollow branch should be added.
- User controller mixes native MongoDB driver with Mongoose models.
- S3 bucket name is hardcoded in `Backend/config/aws-config.js`; it should come from environment config.
- The test suite covers auth, repo CRUD, CLI push, and collaborator flows (13 tests); WebRTC signaling, the AI/Pinecone duplicate check, and Socket.IO notification forwarding are not covered by automated tests yet.

Best interview phrasing:

"I am aware of these limitations. For a portfolio project I prioritized feature breadth and learning across CLI, realtime, AI, and cloud storage. If I were productionizing it, these are exactly the items I would address first."

---

## 10. Quick Final Revision Sheet

Say this if asked "What is RepoFlow technically?"

"RepoFlow is a MERN-style developer collaboration platform with a custom Node CLI, MongoDB persistence, S3-backed commit storage with fallback, Socket.IO notifications, WebRTC review calls, and Gemini/Pinecone semantic duplicate issue detection."

Say this if asked "What is your strongest feature?"

"The strongest feature is the custom CLI plus commit storage pipeline, because it connects local filesystem operations, authenticated backend APIs, MongoDB metadata, S3 object storage, fallback handling, and frontend commit browsing."

Say this if asked "What would you improve first?"

"I would first improve production safety: backend privacy filtering, tests, pagination, the missing S3 import, review route authentication, and consistent Mongoose usage."

Say this if asked "What did you learn?"

"I learned how different layers work together: browser routing and state, REST APIs, JWT auth, database modeling, file storage, vector search, realtime sockets, WebRTC signaling, and CLI design."

---

## 11. Setup Commands

Backend:

```bash
cd Backend
npm install
node index.js start
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Backend environment variables:

```bash
MONGO_URI=<mongodb-uri>
DB_NAME=<database-name>
JWT_SECRET=<jwt-secret>
AWS_ACCESS_KEY_ID=<aws-access-key>
AWS_SECRET_ACCESS_KEY=<aws-secret>
AWS_REGION=<aws-region>
GOOGLE_API_KEY=<google-ai-key>
PINECONE_API_KEY=<pinecone-key>
PINECONE_INDEX=<pinecone-index>
PORT=3000
```

Frontend environment variables:

```bash
VITE_API_URL=http://localhost:3000
```

---

## 12. Project Defense In One Line

RepoFlow is a strong final-year full-stack project because it combines normal product engineering with systems thinking: custom CLI, authenticated APIs, database relationships, cloud file storage, AI vector search, realtime notifications, and WebRTC collaboration.
