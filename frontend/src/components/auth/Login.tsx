import React, { useState } from "react";
import { useAuth } from "../../auth";
import logo from "../../assets/RepoFlowLogo2.png";
import { Link } from "react-router-dom";
import api from "../../config/api";

const Login: React.FC = () => {
  const [email, setEmail]       = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading]   = useState<boolean>(false);

  const { setCurrentUser } = useAuth();

  const handleLogin = async (e: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.post("/login", { email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", res.data.userId);
      setCurrentUser({ userId: res.data.userId });
      setLoading(false);
      window.location.href = "/";
    } catch (err) {
      console.error(err);
      alert("Login Failed!");
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .font-syne { font-family: 'Syne', sans-serif; }
        .font-plex { font-family: 'IBM Plex Mono', monospace; }
        .font-dm   { font-family: 'DM Sans', sans-serif; }

        .dot-grid {
          background-color: var(--bg-dot);
          background-image: radial-gradient(var(--dot-color) 1px, transparent 1px);
          background-size: 28px 28px;
        }
        .glow-teal {
          background: radial-gradient(ellipse, rgba(0,255,163,0.07) 0%, transparent 65%);
        }

        /* Input focus ring override */
        .auth-input:focus {
          outline: none;
          border-color: rgba(0, 255, 163, 0.35);
          box-shadow: 0 0 0 3px rgba(0, 255, 163, 0.06);
        }

        @keyframes fade-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fade-up 0.4s ease both; }
      `}</style>

      <div className="font-dm dot-grid min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">

        <div className="glow-teal pointer-events-none absolute top-[-80px] left-1/2 -translate-x-1/2 w-[600px] h-[400px]" />

        <div className="fade-up mb-7 flex flex-col items-center gap-3" style={{ animationDelay: "0ms" }}>
          <div className="w-11 h-11 rounded-full border border-white/[0.08] bg-white/[0.03]
                          flex items-center justify-center">
            <img src={logo} alt="Logo" className="w-10 h-10 object-contain" />
          </div>
          <span className="font-syne text-[13px] font-bold text-gray-400 tracking-widest uppercase">
            RepoFlow
          </span>
        </div>

        <div
          className="fade-up relative w-full max-w-[360px] rounded-2xl
                     border border-white/[0.07] bg-white/[0.02] backdrop-blur-sm p-7"
          style={{ animationDelay: "60ms" }}
        >
          <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-[#00FFA3]/20 to-transparent" />

          <div className="mb-6">
            <h1 className="font-syne text-2xl font-bold text-white tracking-tight">
              Welcome back
            </h1>
            <p className="font-plex text-[11px] text-gray-600 mt-1">
              sign in to continue
            </p>
          </div>

          <div className="flex flex-col gap-4">

            <div className="flex flex-col gap-1.5">
              <label htmlFor="Email" className="font-plex text-[11px] text-gray-500 uppercase tracking-widest">
                Email
              </label>
              <input
                autoComplete="off"
                id="Email"
                name="Email"
                type="email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                className="auth-input w-full px-3.5 py-2.5 rounded-lg
                           bg-white/[0.03] border border-white/[0.07]
                           text-sm text-gray-200 placeholder-gray-700
                           transition-all duration-200"
                placeholder="you@example.com"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="Password" className="font-plex text-[11px] text-gray-500 uppercase tracking-widest">
                Password
              </label>
              <input
                autoComplete="off"
                id="Password"
                name="Password"
                type="password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                className="auth-input w-full px-3.5 py-2.5 rounded-lg
                           bg-white/[0.03] border border-white/[0.07]
                           text-sm text-gray-200 placeholder-gray-700
                           transition-all duration-200"
                placeholder="••••••••"
              />
            </div>

            <button
              disabled={loading}
              onClick={handleLogin}
              className="relative mt-1 w-full py-2.5 rounded-lg font-plex text-[12px] tracking-widest uppercase
                         bg-[#00FFA3]/10 border border-[#00FFA3]/25 text-[#00FFA3]
                         hover:bg-[#00FFA3]/[0.16] hover:border-[#00FFA3]/40
                         disabled:opacity-40 disabled:cursor-not-allowed
                         transition-all duration-200 overflow-hidden group"
            >
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700
                               bg-gradient-to-r from-transparent via-[#00FFA3]/10 to-transparent" />
              <span className="relative">{loading ? "Signing in…" : "Sign In"}</span>
            </button>
          </div>
        </div>

        <p
          className="fade-up font-dm text-xs text-gray-600 mt-5"
          style={{ animationDelay: "120ms" }}
        >
          No account?{" "}
          <Link to="/signup" className="text-[#00FFA3]/70 hover:text-[#00FFA3] transition-colors duration-150">
            Create one →
          </Link>
        </p>

      </div>
    </>
  );
};

export default Login;
