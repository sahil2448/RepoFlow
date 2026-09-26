import React, { useState } from "react";
import { useAuth } from "../../auth";
import logo from "../../assets/RepoFlowLogo2.png";
import { Link } from "react-router-dom";
import api from "../../config/api";

const Signup: React.FC = () => {
  const [email, setEmail]       = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading]   = useState<boolean>(false);

  const { setCurrentUser } = useAuth();

  const handleSignup = async (e: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.post("/signup", { email, password, username });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", res.data.userId);
      localStorage.setItem("username", res.data.username || username);
      localStorage.setItem("avatar", "");
      setCurrentUser({ userId: res.data.userId });
      setLoading(false);
      window.location.href = "/";
    } catch (err) {
      console.error(err);
      alert("Signup Failed!");
      setLoading(false);
    }
  };

  return (
    <div
      className="rf-fade-up font-dm dot-grid relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-10"
      style={{ animationDelay: "0ms" }}
    >
      {/* Static ambient washes — colors from the active theme's --auth-glow-* variables */}
      <div
        className="auth-glow"
        style={{ background: "var(--auth-glow-mint)", width: 520, height: 400, top: -160, left: "50%", transform: "translateX(-50%)" }}
      />
      <div
        className="auth-glow"
        style={{ background: "var(--auth-glow-violet)", width: 380, height: 380, bottom: -190, left: -140 }}
      />
      <div
        className="auth-glow"
        style={{ background: "var(--auth-glow-coral)", width: 320, height: 320, bottom: -150, right: -120 }}
      />

      {/* Brand mark */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full border"
          style={{ borderColor: "var(--auth-logo-border)", backgroundColor: "var(--auth-logo-bg)" }}
        >
          <img src={logo} alt="RepoFlow logo" className="h-10 w-10 object-contain" />
        </div>
        <span
          className="font-syne text-[13px] font-bold uppercase tracking-[0.3em]"
          style={{ color: "var(--auth-wordmark)" }}
        >
          RepoFlow
        </span>
      </div>

      {/* Auth card */}
      <div
        className="rf-card rf-card-topline w-full max-w-[380px] rounded-2xl p-7 sm:p-8"
        style={{ animationDelay: "60ms" }}
      >
        <div className="mb-6">
          <h1
            className="font-syne text-[26px] font-bold leading-tight tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Create account
          </h1>
          <p className="font-plex mt-1.5 text-[11px] tracking-wide" style={{ color: "var(--text-muted)" }}>
            join the devhub
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {/* Username field */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="Username" className="rf-label">
              Username
            </label>
            <div className="relative">
              <svg
                className="rf-icon pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a8.25 8.25 0 0116.5 0"
                />
              </svg>
              <input
                autoComplete="off"
                id="Username"
                name="Username"
                type="text"
                value={username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                className="rf-input py-2.5 pl-9 pr-3.5"
                placeholder="cooldevname"
              />
            </div>
          </div>
          {/* Email field */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="Email" className="rf-label">
              Email
            </label>
            <div className="relative">
              <svg
                className="rf-icon pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                />
              </svg>
              <input
                autoComplete="off"
                id="Email"
                name="Email"
                type="email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                className="rf-input py-2.5 pl-9 pr-3.5"
                placeholder="you@example.com"
              />
            </div>
          </div>
          {/* Password field */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="Password" className="rf-label">
              Password
            </label>
            <div className="relative">
              <svg
                className="rf-icon pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                />
              </svg>
              <input
                autoComplete="off"
                id="Password"
                name="Password"
                type="password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                className="rf-input py-2.5 pl-9 pr-3.5"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={handleSignup}
            className="rf-btn mt-1 w-full rounded-xl py-3 font-plex text-[12px] font-medium uppercase tracking-widest"
          >
            {loading ? "Creating…" : "Create Account"}
          </button>
        </div>
      </div>

      {/* Footer cross-link */}
      <p className="font-dm mt-6 text-xs" style={{ color: "var(--text-muted)" }}>
        Already have an account?{" "}
        <Link to="/login" className="rf-link font-plex text-[12px] font-medium">
          Sign in →
        </Link>
      </p>
    </div>
  );
};

export default Signup;
