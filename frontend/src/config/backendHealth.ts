/**
 * Lightweight backend availability probe for RepoFlow.
 *
 * Used by <BackendGate /> to decide whether to load the normal application
 * (backend reachable) or the recruiter-facing "Live Demo Temporarily
 * Unavailable" fallback (backend stopped / unreachable).
 *
 * Design notes:
 * - Plain `fetch` (no axios instance) so no auth headers are attached and no
 *   global interceptors can turn a probe into a thrown auth error.
 * - Short timeout (default 3.5s) via AbortController — the initial render
 *   never waits indefinitely.
 * - No retries here: the gate performs one initial check plus a manual
 *   "Try Again". No aggressive polling, no infinite loops.
 * - Every failure mode (ECONNREFUSED, DNS, CORS, timeout, offline browser,
 *   HTTP 5xx) resolves to `false`. Never throws — so the caller can never
 *   produce an unhandled rejection / blank screen.
 */
import { BASE_URL } from "./api";

export type BackendStatus = "checking" | "online" | "offline";

/** How long to wait for the backend before treating it as unavailable. */
export const HEALTH_CHECK_TIMEOUT_MS = 3500;

const stripTrailingSlash = (url: string): string => url.replace(/\/$/, "");

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
      credentials: "omit",
    });
  } finally {
    window.clearTimeout(timer);
  }
}

export async function checkBackendHealth(
  timeoutMs: number = HEALTH_CHECK_TIMEOUT_MS,
): Promise<boolean> {
  try {
    // Browser-level offline state: don't even attempt the network call.
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      return false;
    }

    const base = stripTrailingSlash(BASE_URL || "");
    if (!base) return false;

    let res: Response;
    try {
      res = await fetchWithTimeout(`${base}/health`, timeoutMs);
    } catch {
      // Network error / refused / DNS / CORS / timeout / aborted.
      return false;
    }

    if (res.ok) return true;

    if (res.status === 404) {
      // Backend predates the /health endpoint but IS reachable — confirm the
      // root route responds with anything other than a server error.
      try {
        const root = await fetchWithTimeout(`${base}/`, Math.min(timeoutMs, 2500));
        return root.status < 500;
      } catch {
        return false;
      }
    }

    // 5xx from the health endpoint itself: backend reachable but unhealthy —
    // the live demo would be broken, so show the graceful fallback.
    if (res.status >= 500) return false;

    // Any other HTTP response (3xx/4xx) proves a server is listening.
    return true;
  } catch {
    return false;
  }
}
