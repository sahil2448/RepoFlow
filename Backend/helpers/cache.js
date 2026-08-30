// Backend/helpers/cache.js
//
// Minimal Redis cache used as the "performance layer" on read-heavy endpoints.
//
// Design rule: Redis must NEVER be able to take the app down.
//   - REDIS_URL not set            -> every cache call is a silent no-op.
//   - Redis unreachable            -> bounded retries (fast failure), then a
//     30s back-off; cache calls no-op while Redis is down.
//   - Writes that touch cached     -> must call cacheDelete so stale data does
//     data (repo/user/issue)          not outlive the short TTL.
//
// Cached endpoints:
//   GET /repo/all          (repo:all)          TTL 60s
//   GET /repo/:id          (repo:id:<id>)      TTL 60s
//   GET /repo/name/:name   (repo:name:<name>)  TTL 60s
//   GET /userProfile/:id   (user:profile:<id>) TTL 30s

import { createClient } from "redis";

const REDIS_URL = process.env.REDIS_URL;
const DEFAULT_TTL_SECONDS = 60;
const FAIL_COOLDOWN_MS = 30_000;

let client = null;
let connectPromise = null;
let lastFailTs = 0;
let lastErrLogTs = 0;

export const cacheKeys = {
  repoAll: "repo:all",
  repoById: (id) => `repo:id:${id}`,
  repoByName: (name) => `repo:name:${String(name).toLowerCase()}`,
  userProfile: (id) => `user:profile:${id}`,
};

// Bounded connection behaviour shared by the cache + the Socket.IO adapter.
// Without these limits, node-redis would retry forever and `await connect()`
// would hang — which would hang every cached request (or server boot).
export function createRedisClient(url) {
  return createClient({
    url,
    socket: {
      connectTimeout: 2000, // fail the initial connect after 2s unresponsive
      reconnectStrategy: (retries) => {
        // A few quick attempts, then give up so `connect()` rejects instead
        // of hanging forever.
        if (retries > 3) {
          return new Error("Redis connection failed after retries");
        }
        return Math.min(retries * 200, 1000);
      },
    },
  });
}

async function getClient() {
  if (client) return client;
  if (!REDIS_URL) return null;

  // Back-off: after a failure, skip connection attempts for 30s so a Redis
  // outage costs ~nothing per request instead of a slow connect() each time.
  if (lastFailTs !== 0 && Date.now() - lastFailTs < FAIL_COOLDOWN_MS) {
    return null;
  }

  if (!connectPromise) {
    connectPromise = (async () => {
      const c = createRedisClient(REDIS_URL);
      c.on("error", () => {
        const now = Date.now();
        if (now - lastErrLogTs > 60_000) {
          lastErrLogTs = now;
          console.warn("[cache] Redis client error (will keep trying)");
        }
      });
      await c.connect();
      console.log("[cache] Redis connected");
      return c;
    })().catch((err) => {
      lastFailTs = Date.now();
      connectPromise = null; // allow a retry after the back-off window
      console.warn("[cache] Redis unavailable — cache disabled for 30s:", err.message);
      return null;
    });
  }

  client = await connectPromise;
  return client;
}

export async function cacheGet(key) {
  try {
    const c = await getClient();
    if (!c) return null;
    const raw = await c.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key, value, ttlSeconds = DEFAULT_TTL_SECONDS) {
  try {
    const c = await getClient();
    if (!c) return;
    await c.set(key, JSON.stringify(value), { EX: ttlSeconds });
  } catch {
    // no-op on failure
  }
}

export async function cacheDelete(...keys) {
  const realKeys = keys.filter(Boolean);
  if (realKeys.length === 0) return;
  try {
    const c = await getClient();
    if (!c) return;
    await c.del(realKeys.map(String));
  } catch {
    // no-op on failure
  }
}

// Invalidates every repo cache entry touched by a single repository.
export async function invalidateRepoCache(id, name) {
  await cacheDelete(
    cacheKeys.repoAll,
    id ? cacheKeys.repoById(id) : null,
    name ? cacheKeys.repoByName(name) : null,
  );
}