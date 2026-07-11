# RepoFlow - AI Powered Version Control System (Real Time)

A full-stack GitHub alternative(Version Control System) built from scratch with a custom CLI version control system, AI-powered semantic duplicate issue detection, realtime code review feature with WebRTC & WebSockets.

---

## Table of Contents

- [Overview](#overview)
- [Live Demo](#live-demo)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [CLI Usage](#cli-usage)
- [AI Duplicate Detection](#ai-duplicate-detection)
- [Real-time Notifications](#real-time-notifications)
- [API Reference](#api-reference)
- [Screenshots](#screenshots)
- [Known Limitations](#known-limitations)
- [Future Improvements](#future-improvements)

---

## Overview

RepoFlow is a developer platform built to replicate and extend core GitHub functionality. It goes beyond a simple clone by implementing three original systems:

1. A custom CLI tool for version control with local staging, commits, and cloud push to AWS S3 with automatic MongoDB fallback
2. A RAG-based AI layer that detects semantically duplicate issues in real time as a user types
3. A WebSocket notification system that delivers alerts instantly across browser sessions

The project was built to demonstrate full-stack engineering depth across frontend, backend, database, cloud storage, AI integration, and real-time communication.

---

## Live Demo

- Frontend: https://main.d1zjk4pi7u9tt9.amplifyapp.com/
---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 19 + TypeScript | UI framework with type safety |
| Vite | Build tool and dev server |
| TailwindCSS | Utility-first styling |
| React Router v7 | Client-side routing |
| Axios | HTTP client with centralized instance |
| Socket.IO Client | Real-time WebSocket connection |
| @uiw/react-heat-map | GitHub-style contribution heatmap |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express 5 | REST API server |
| MongoDB + Mongoose | Primary database |
| MongoDB Native Driver | Used in user controller for fine-grained queries |
| JSON Web Token | Authentication |
| bcryptjs | Password hashing |
| Socket.IO | Real-time bidirectional communication |
| AWS SDK v2 | S3 file storage for CLI commits |
| Google Generative AI | Text embeddings for duplicate detection |
| Pinecone | Vector database for semantic search |
| dotenv | Environment variable management |
| yargs | CLI command parsing |
| uuid | Unique commit ID generation |

---

## Features

### Authentication
- User signup and login with bcrypt password hashing
- JWT token issued on auth, stored in localStorage
- Protected routes redirect unauthenticated users automatically
- Auth context persists login state across the app

### Repository Management
- Create repositories with name, description, and public/private visibility
- View all repositories on the dashboard with live client-side search
- Repository detail page with Content, Issues, and Commits tabs
- Star and unstar repositories with live count update
- Delete repository with owner-only restriction enforced on frontend
- Suggested repositories from all users shown on dashboard sidebar

### Custom CLI Version Control
- `init` — initializes a `.repoFlowGit` folder and links it to a MongoDB repository via `--repoId` and `--userId` flags
- `add` — stages a file into `.repoFlowGit/staging/`
- `commit` — snapshots staged files into a UUID-named commit folder with metadata
- `push` — uploads commit files to AWS S3 and saves commit record to MongoDB. If S3 is unavailable, file contents are stored as base64 in MongoDB automatically
- `pull` — downloads commit files from S3 back to local machine
- `revert` — copies files from a specific commit back to the working directory
- Commits are visible in the frontend Commits tab with file download support

### Issues System
- Create issues with title and description
- Filter issues by open, closed, or all
- Edit issue title, description, and status inline
- Close and reopen issues with one click
- Delete issues with confirmation
- Issue creation automatically pushes a reference into the repository's issues array

### AI-Powered Semantic Duplicate Detection
- As a user types a new issue title and description, the frontend debounces 600ms then calls the backend
- Backend generates a 768-dimensional embedding using Google Gemini `gemini-embedding-2` model
- Title is weighted 2x by repeating it in the text before embedding, improving match accuracy
- Embedding is queried against a Pinecone vector database scoped to the specific repository's namespace
- Results above 0.82 cosine similarity score trigger a warning with matched issue titles and percentage scores
- When an issue is created, it is asynchronously indexed into Pinecone for future comparisons
- When an issue is deleted, its vector is removed from Pinecone

### Real-time Notifications
- Socket.IO server runs alongside the Express API
- Every user joins a private socket room named after their userId on login
- Notifications are triggered for: repository starred, new follower, issue created, issue closed
- Each notification is saved to MongoDB for persistence so offline users see them on next login
- Bell icon in navbar shows unread count badge
- Clicking the bell marks all notifications as read and shows a dropdown with full history

### User Profiles
- View any user's profile by navigating to `/profile/:id`
- Own profile shows Edit Profile button, other profiles show Follow button
- Edit username, email, bio, location, website inline
- Follow and unfollow other users with live follower count update
- Contribution heatmap showing real activity across the current year, fetched from a dedicated Contributions collection
- Starred repositories tab showing all repos the user has starred

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (React)                           │
│  Dashboard  │  Repo Details  │  Issues  │  Profile  │  Navbar  │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP (Axios) + WebSocket (Socket.IO)
┌──────────────────────────▼──────────────────────────────────────┐
│                    SERVER (Express + Socket.IO)                  │
│  Auth  │  Repos  │  Issues  │  Commits  │  Notifications  │ AI  │
└──────┬────────────────────────────────────────────────┬─────────┘
       │                                                │
┌──────▼──────┐   ┌──────────────┐   ┌─────────────────▼────────┐
│   MongoDB   │   │   AWS S3     │   │  Google Gemini + Pinecone │
│  (primary)  │   │ (CLI commits)│   │  (semantic search)        │
└─────────────┘   └──────────────┘   └──────────────────────────┘

CLI (Local Machine)
  init → add → commit → push → MongoDB + S3
```

---

## Project Structure

```
RepoFlow/
│
├── Backend/
│   ├── commands/
│   │   ├── init.js
│   │   └── push.js
│   ├── config/
│   │   ├── aws-config.js
│   │   └── pinecone-config.js
│   ├── controllers/
│   │   ├── add.js
│   │   ├── commit.js
│   │   ├── commitController.js
│   │   ├── contributionController.js
│   │   ├── init.js
│   │   ├── issueAIController.js
│   │   ├── issueController.js
│   │   ├── notificationController.js
│   │   ├── pull.js
│   │   ├── push.js
│   │   ├── repoController.js
│   │   ├── revert.js
│   │   └── userCcontroller.js
│   ├── helpers/
│   │   ├── embeddings.js
│   │   ├── logContribution.js
│   │   ├── notifyUser.js
│   │   ├── socketInstance.js
│   │   └── vectorStore.js
│   ├── Middleware/
│   │   ├── authMiddleware.js
│   │   └── authorizeMiddleware.js
│   ├── model/
│   │   ├── commitModel.js
│   │   ├── contributionModel.js
│   │   ├── issueModel.js
│   │   ├── notificationModel.js
│   │   ├── repoModel.js
│   │   └── userModel.js
│   ├── routes/
│   │   ├── commit.router.js
│   │   ├── contributions.router.js
│   │   ├── issue.router.js
│   │   ├── main.router.js
│   │   ├── notification.router.js
│   │   ├── repo.router.js
│   │   └── user.router.js
│   ├── .env
│   ├── index.js
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── assets/
    │   ├── components/
    │   │   ├── auth/
    │   │   │   ├── Login.tsx
    │   │   │   └── Signup.tsx
    │   │   ├── dashboard/
    │   │   │   └── Dashboard.tsx
    │   │   ├── issues/
    │   │   │   ├── CreateIssue.tsx
    │   │   │   ├── IssueDetail.tsx
    │   │   │   └── IssueList.tsx
    │   │   ├── repo/
    │   │   │   ├── CommitHistory.tsx
    │   │   │   ├── CreateRepo.tsx
    │   │   │   └── RepoDetails.tsx
    │   │   └── user/
    │   │       ├── AboutUser.tsx
    │   │       ├── HeatMap.tsx
    │   │       ├── Profile.tsx
    │   │       └── StarredRepo.tsx
    │   ├── config/
    │   │   ├── api.ts
    │   │   └── socket.ts
    │   ├── Navbar.tsx
    │   ├── Layout.tsx
    │   ├── Routes.tsx
    │   ├── authContext.tsx
    │   ├── App.tsx
    │   └── main.tsx
    ├── .env
    ├── .env.production
    └── package.json
```

---

## Getting Started

### Prerequisites

- Node.js v18 or above
- MongoDB Atlas account (free tier works)
- Google AI Studio account (free API key)
- Pinecone account (free serverless index)
- AWS account with S3 bucket (optional — MongoDB fallback works without it)

### Backend Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/repoflow.git
cd repoflow/Backend

# Install dependencies
npm install

# Create .env file (see Environment Variables section)
cp .env.example .env

# Start the server
node index.js start
```

### Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start development server
npm run dev
```

### Pinecone Index Setup

1. Go to [pinecone.io](https://pinecone.io) and create a free account
2. Create a new index with these settings:
   - Name: `repoflow-issues`
   - Dimensions: `768`
   - Metric: `cosine`
   - Type: `Dense`
   - Plan: `Serverless`
3. Copy your API key into `.env`

---

## Environment Variables

### Backend `.env`

```bash
# MongoDB
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net
DB_NAME=repoflow

# JWT
JWT_SECRET=your_jwt_secret_key

# AWS S3 (optional — system falls back to MongoDB if unavailable)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=ap-south-1
S3_bucket=repoflowbucket

# Google Generative AI
GOOGLE_API_KEY=your_google_ai_key

# Pinecone
PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX=repoflow-issues

# Server
PORT=3000
```

### Frontend `.env`

```bash
# Development
VITE_API_URL=http://localhost:3000
```

### Frontend `.env.production`

```bash
# Production
VITE_API_URL=https://your-backend-url.onrender.com
```

---

## CLI Usage

The CLI must be run from the Backend directory.

### Initialize a repository

Links your local folder to a MongoDB repository. Get the repo ID from the URL when viewing a repository in the browser (`/repo/<ID>`).

```bash
node index.js init --repoId <MONGO_REPO_ID> --userId <YOUR_USER_ID>
```

### Stage a file

```bash
node index.js add yourfile.js
```

### Commit staged files

```bash
node index.js commit "your commit message"
```

### Push to cloud

Uploads to AWS S3. If S3 is unavailable, automatically stores file contents in MongoDB.

```bash
node index.js push
```

### Pull from S3

```bash
node index.js pull
```

### Revert to a previous commit

Get the commit ID from the Commits tab in the browser.

```bash
node index.js revert <COMMIT_ID>
```

### Full example workflow

```bash
# 1. Go to any project folder
cd ~/my-project

# 2. Initialize and link to RepoFlow repo
node ~/RepoFlow/Backend/index.js init --repoId 6650f3a2c89b4d001e123abc --userId 6650f200c89b4d001e123aaa

# 3. Stage a file
node ~/RepoFlow/Backend/index.js add index.js

# 4. Commit
node ~/RepoFlow/Backend/index.js commit "initial commit"

# 5. Push — appears in browser Commits tab instantly
node ~/RepoFlow/Backend/index.js push
```

---

## AI Duplicate Detection

### How it works

When a user types a new issue title and description, the following happens:

1. Frontend waits 600ms after the user stops typing (debounce)
2. If title is at least 10 characters and description is at least 20 characters, the frontend calls `POST /issue/check-duplicate/:repoId`
3. Backend constructs a weighted text: `"${title}. ${title}. ${description}"` — title repeated twice gives it 2x importance in the embedding
4. Google Gemini `gemini-embedding-2` converts this text into a 768-dimensional vector
5. Pinecone receives this vector and searches within the repository's namespace using cosine similarity
6. If any existing issue scores above 0.82 similarity, the frontend displays a warning with the matched issue, its status, and the similarity percentage
7. The user can still submit the issue if they believe it is different

### When an issue is created

After the issue is saved to MongoDB, `embedAndIndexIssue` is called asynchronously — it generates the embedding and upserts the vector into Pinecone under the repo's namespace. This runs in the background and does not delay the API response.

### When an issue is deleted

The vector is removed from Pinecone using `deleteIssueVector`, keeping the index clean and accurate.

### Similarity threshold

```
Below 0.82  →  no warning shown
Above 0.82  →  warning shown with matched issues
Above 0.90  →  very likely exact duplicate
```

---

## Real-time Notifications

### How it works

1. When a user logs in, the frontend connects to Socket.IO and emits a `join` event with their userId
2. The server adds that socket to a room named after the userId
3. When any notification-triggering action occurs (star, follow, issue created), the backend calls `notifyUser(io, payload)`
4. `notifyUser` saves the notification to MongoDB and emits it to the recipient's socket room
5. The frontend receives the event, increments the bell counter, and prepends the notification to the dropdown
6. On page load, existing notifications are fetched via REST API so nothing is missed

### Notification types

| Type | Trigger | Color |
|---|---|---|
| `repo_starred` | Someone stars your repository | Mint green |
| `new_follower` | Someone follows you | Violet |
| `issue_created` | Someone opens an issue on your repo | Coral |
| `issue_closed` | An issue on your repo is closed | Mint green |

---

## API Reference

### Auth
```
POST /signup          Create a new user account
POST /login           Login and receive JWT token
```

### Users
```
GET    /allUsers              Get all users
GET    /userProfile/:id       Get user profile by ID
PUT    /updateProfile/:id     Update user profile fields
DELETE /deleteProfile/:id     Delete user account
GET    /getStarredRepos/:id   Get starred repositories for a user
POST   /followUser/:id        Follow or unfollow a user
```

### Repositories
```
POST   /repo/create           Create a new repository
GET    /repo/all              Get all public repositories
GET    /repo/:id              Get repository by ID
GET    /repo/user/:userId     Get repositories owned by a user
GET    /repo/name/:name       Get repository by name
PUT    /repo/update/:id       Update repository details
PATCH  /repo/toggle/:id       Toggle repository visibility
DELETE /repo/delete/:id       Delete a repository
POST   /repo/star/:id         Star or unstar a repository
```

### Issues
```
POST   /issue/create/:id              Create an issue on a repository
GET    /issue/all/:id                 Get all issues for a repository
GET    /issue/:id                     Get a single issue by ID
PUT    /issue/update/:id              Update issue title, description, or status
DELETE /issue/delete/:id              Delete an issue
POST   /issue/check-duplicate/:repoId AI duplicate check before creating
```

### Commits (CLI)
```
GET    /repo/:id/commits              Get all commits for a repository
POST   /repo/:id/revert/:commitId     Get file download links for a commit
GET    /repo/:id/files                Get files from the latest commit
```

### Contributions
```
GET    /contributions/:userId         Get contribution data for the current year
```

### Notifications
```
GET    /notifications/:userId         Get all notifications with unread count
PATCH  /notifications/read/:userId    Mark all notifications as read
PATCH  /notifications/read-one/:id    Mark a single notification as read
```

---

## Known Limitations

- JWT tokens are issued but not verified on protected backend routes — middleware exists but is not yet enforced
- User field names are inconsistent between the Mongoose schema (`followingUsers`, `starredRepositories`) and the native MongoDB driver signup (`followedUsers`, `starRepositories`)
- The frontend hardcodes `http://localhost:3000` in a few places that were not yet migrated to the centralized `api.ts` client
- AWS SDK v2 is used which has reached end-of-support — migration to v3 is pending
- Repository and Issue schemas do not use `timestamps: true`, so `createdAt` is unavailable on some documents unless added manually
- Socket.IO is configured with `origin: "*"` which is not suitable for production

---

## Future Improvements

- Add JWT middleware to enforce authentication on all protected routes
- Migrate AWS SDK from v2 to v3
- Add AI code review on CLI push — send file contents to Gemini and store the review alongside the commit
- Add issue comments and threaded discussions
- Add repository forking
- Add organization and team support
- Replace hardcoded localhost URLs with environment-based config everywhere
- Add unit and integration tests
- Normalize user field names between Mongoose schema and native driver

---

## Author

Built by Sahil Kamble as a portfolio project demonstrating full-stack engineering across REST APIs, CLI tooling, AI/ML integration, real-time systems, and cloud storage.

---

## License

MIT
