import React, { useCallback, useEffect, useRef, useState } from "react";
import { checkBackendHealth, type BackendStatus } from "../../config/backendHealth";
import DemoUnavailable from "./DemoUnavailable";

/**
 * Gates the whole SPA behind one lightweight backend probe.
 * - "checking": elegant loader, no app API calls can fire yet.
 * - "online": renders the normal application untouched.
 * - "offline": renders the static recruiter fallback (zero API calls).
 * Retry re-probes and transitions into the app without a page refresh.
 */
const BackendGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<BackendStatus>("checking");
  const [retrying, setRetrying] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const probe = useCallback(async (isRetry: boolean) => {
    if (isRetry) setRetrying(true);
    const ok = await checkBackendHealth();
    if (!mountedRef.current) return;
    setStatus(ok ? "online" : "offline");
    if (isRetry) setRetrying(false);
  }, []);

  useEffect(() => {
    void probe(false);
  }, [probe]);

  const handleRetry = useCallback(() => {
    void probe(true);
  }, [probe]);

  if (status === "online") return <>{children}</>;

  if (status === "offline") {
    return <DemoUnavailable onRetry={handleRetry} retrying={retrying} />;
  }

  return (
    <div className="dot-grid flex min-h-screen flex-col items-center justify-center px-4" role="status" aria-live="polite" style={{ color: "var(--text-primary)" }}>
      <img src="/favicon.svg" alt="" width={40} height={40} aria-hidden="true" />
      <p className="mt-5 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
        Checking live demo availability…
      </p>
      <span className="mt-4 block h-1 w-40 overflow-hidden rounded-full" style={{ background: "var(--bg-skeleton, var(--border-card))" }} aria-hidden="true">
        <span className="block h-full w-1/2 animate-pulse rounded-full" style={{ background: "var(--accent-mint)" }} />
      </span>
    </div>
  );
};

export default BackendGate;
