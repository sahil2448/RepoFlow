import type React from "react";

/**
 * Static content for the recruiter fallback page.
 * Zero backend dependency — pure data + inline styles.
 */

export const GITHUB_URL = "https://github.com/sahil2448/RepoFlow";

export type DemoUnavailableProps = {
  onRetry: () => void;
  retrying: boolean;
};

export const STATUS_DOT_STYLE: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: 9999,
  backgroundColor: "#F59E0B",
  boxShadow: "0 0 0 4px rgba(245, 158, 11, 0.18)",
  flexShrink: 0,
};

export const stackCards: Array<{ title: string; body: string }> = [
  {
    title: "Full-stack architecture",
    body: "React 19 + TypeScript SPA (Vite, Tailwind, React Router 7) backed by a Node.js + Express 5 REST API with JWT auth.",
  },
  {
    title: "Custom Git-like CLI",
    body: "login, init, add, commit, push, pull and revert from any local folder, syncing commits to the backend.",
  },
  {
    title: "MongoDB + AWS S3 storage",
    body: "Mongoose models for users, repos, issues and commits; commit files stored in S3 with automatic MongoDB fallback.",
  },
  {
    title: "Realtime + WebRTC reviews",
    body: "Socket.IO notifications and signalling for 1-on-1 peer-to-peer audio/video code-review rooms with side-by-side diffs.",
  },
  {
    title: "AI duplicate-issue detection",
    body: "Gemini embeddings + Pinecone semantic search ground a generative verdict that flags duplicate issues per repository.",
  },
  {
    title: "Cloud deployment",
    body: "Frontend on AWS Amplify; backend as a PM2 cluster on EC2 with Redis caching, Docker Compose locally and CI on push.",
  },
];

export const cardStyle: React.CSSProperties = {
  background: "var(--bg-card)",
  border: "1px solid var(--border-card)",
  borderRadius: 16,
  padding: "20px 20px 18px",
  textAlign: "left",
};

export const ARCH_DIAGRAM = "React SPA (Vite, TypeScript)\n      |  REST (Axios, JWT) + Socket.IO + WebRTC\n      v\nExpress API + Socket.IO server\n  |-- MongoDB .. users, repos, issues, commits\n  |-- AWS S3 .... commit files (MongoDB fallback)\n  |-- Redis ..... best-effort API caching\n  |-- Pinecone .. per-repo issue vectors (Gemini)";
