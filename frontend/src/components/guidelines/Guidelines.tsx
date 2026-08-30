import React, { useState } from "react";
import { Link } from "react-router-dom";

// ─── Types ───────────────────────────────────────────────────────────────────

type OS = "mac" | "windows" | "linux";

interface Step {
  number: string;
  title:  string;
  desc:   string;
  cmds?:  { label?: string; code: string }[];
  note?:  string;
}

// ─── Icons ───────────────────────────────────────────────────────────────────

const CheckIcon: React.FC = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);
const CopyIcon: React.FC = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);
const ArrowRightIcon: React.FC = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
);

// ─── Code Block ──────────────────────────────────────────────────────────────

const CodeBlock: React.FC<{ code: string; label?: string }> = ({ code, label }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="theme-code-surface relative rounded-xl border border-white/[0.07] bg-[#030308] overflow-hidden">
      {/* Terminal top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.05] bg-white/[0.02]">
        <div className="flex items-center gap-1.5">
          {["#FF6B4A","#F59E0B","#00FFA3"].map((c) => (
            <span key={c} className="w-2 h-2 rounded-full opacity-50" style={{ backgroundColor: c }} />
          ))}
          {label && <span className="font-plex text-[10px] text-gray-700 ml-2">{label}</span>}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 font-plex text-[10px] text-gray-600
                     hover:text-[#00FFA3] transition-colors duration-150"
        >
          {copied ? <><CheckIcon /><span>copied</span></> : <><CopyIcon /><span>copy</span></>}
        </button>
      </div>
      <div className="px-4 py-3 overflow-x-auto">
        <pre className="font-plex text-[12px] text-[#00FFA3]/80 leading-relaxed whitespace-pre">{code}</pre>
      </div>
    </div>
  );
};

// ─── Steps ───────────────────────────────────────────────────────────────────

const NODE_CMDS: Record<OS, string> = {
  mac:     "# Install via Homebrew (recommended)\nbrew install node\n\n# Verify\nnode --version",
  windows: "# Download installer from nodejs.org\n# Then verify in Command Prompt or PowerShell\nnode --version",
  linux:   "# Ubuntu / Debian\ncurl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -\nsudo apt-get install -y nodejs\n\n# Verify\nnode --version",
};

const buildSteps = (os: OS): Step[] => [
  {
    number: "01",
    title:  "Install Node.js",
    desc:   "RepoFlow CLI runs on Node.js. If you already have it installed, skip this step.",
    cmds:   [{ label: `terminal (${os})`, code: NODE_CMDS[os] }],
    note:   "Node 18 or higher is required.",
  },
  {
    number: "02",
    title:  "Clone the RepoFlow Backend",
    desc:   "The CLI lives inside the Backend folder. Clone it once to your machine — you will run commands from any project folder after that.",
    cmds:   [
      {
        label: "terminal",
        code:  "git clone https://github.com/sahil2448/RepoFlow.git\ncd RepoFlow/Backend\nnpm install",
      },
    ],
    note: "You only need to clone once. Keep this folder somewhere permanent like ~/tools/RepoFlow.",
  },
  {
    number: "03",
    title:  "Log in to RepoFlow",
    desc:   "Authenticate with your RepoFlow account. Your token is saved to ~/.repoflow/credentials.json — no need to log in again unless you switch accounts.",
    cmds:   [
      {
        label: "terminal",
        code:  "node /path/to/RepoFlow/Backend/index.js login\n# > Email: you@example.com\n# > Password: ••••••••\n# Logged in successfully.",
      },
    ],
  },
  {
    number: "04",
    title:  "Navigate to your project and initialize",
    desc:   "Go to the root of the project you want to track. Run init with your repository name exactly as it appears (or will appear) on RepoFlow.",
    cmds:   [
      {
        label: "terminal",
        code:  "cd ~/your-project\n\nnode /path/to/RepoFlow/Backend/index.js init my-repo-name\n# Repository linked: \"my-repo-name\" (public)",
      },
    ],
    note:   "This creates a .repoFlowGit/ folder in your project. Add it to .gitignore if you do not want it tracked.",
  },
  {
    number: "05",
    title:  "Stage a file",
    desc:   "Mark individual files for the next commit. Only staged files are included when you commit.",
    cmds:   [
      { label: "terminal", code: "node /path/to/RepoFlow/Backend/index.js add src/index.js" },
    ],
  },
  {
    number: "06",
    title:  "Commit",
    desc:   "Snapshot all staged files with a message. This stores a UUID-versioned commit locally inside .repoFlowGit/commits/.",
    cmds:   [
      { label: "terminal", code: 'node /path/to/RepoFlow/Backend/index.js commit "initial commit"' },
    ],
  },
  {
    number: "07",
    title:  "Push to RepoFlow",
    desc:   "Upload your commits to the cloud. Files are stored in AWS S3. If S3 is unavailable, they are saved securely in MongoDB automatically — no action needed from you.",
    cmds:   [
      {
        label: "terminal",
        code:  "node /path/to/RepoFlow/Backend/index.js push\n# ✓ pushed [s3]: \"initial commit\" (abc1234...)\n# Push complete.",
      },
    ],
    note: "After pushing, your commit appears in the Commits tab of your repository on the web.",
  },
  {
    number: "08",
    title:  "Pull the latest commit",
    desc:   "Download the most recent commit from RepoFlow to your current folder. Useful when switching machines.",
    cmds:   [
      {
        label: "terminal",
        code:  "node /path/to/RepoFlow/Backend/index.js pull\n# ↓ index.js\n# Pull complete.",
      },
    ],
  },
  {
    number: "09",
    title:  "Revert to a specific commit",
    desc:   "Restore files from any previous commit. Find the commit ID in the Commits tab on the repo page.",
    cmds:   [
      {
        label: "terminal",
        code:  "node /path/to/RepoFlow/Backend/index.js revert abc1234-...-full-uuid\n# ↻ index.js\n# Reverted successfully.",
      },
    ],
  },
];


// ─── Quick Reference Table ────────────────────────────────────────────────────

const COMMANDS = [
  { cmd: "login",                 desc: "Authenticate with your RepoFlow account" },
  { cmd: "logout",                desc: "Clear saved credentials" },
  { cmd: "whoami",                desc: "Show currently logged-in user" },
  { cmd: "init <name>",           desc: "Link current folder to a RepoFlow repository" },
  { cmd: "add <file>",            desc: "Stage a file for the next commit" },
  { cmd: "commit <message>",      desc: "Snapshot all staged files locally" },
  { cmd: "push",                  desc: "Upload commits to S3 / MongoDB" },
  { cmd: "pull",                  desc: "Download the latest commit from cloud" },
  { cmd: "revert <commitId>",     desc: "Restore files from a specific commit" },
];

// ─── Component ───────────────────────────────────────────────────────────────

const Guidelines: React.FC = () => {
  const [os, setOs]           = useState<OS>("mac");

  const ALIAS_CODE_MAC = `# Add to ~/.zshrc or ~/.bashrc\nalias rflow="node /absolute/path/to/RepoFlow/Backend/index.js"\n\n# Reload shell\nsource ~/.zshrc\n\n# Now use:\nrflow login\nrflow init my-project\nrflow push`;
  const ALIAS_CODE_WIN = `# PowerShell profile ($PROFILE)\nfunction rflow { node C:\\path\\to\\RepoFlow\\Backend\\index.js $args }\n\n# Then:\nrflow login`;

  const steps = buildSteps(os);

  return (
    <>
      <style>{`
        .font-syne { font-family: 'Syne', sans-serif; }
        .font-plex { font-family: 'IBM Plex Mono', monospace; }
        .font-dm   { font-family: 'DM Sans', sans-serif; }
        .glow-teal  { background: radial-gradient(ellipse, rgba(0,255,163,0.055) 0%, transparent 70%); }
        .glow-violet{ background: radial-gradient(ellipse, rgba(167,139,250,0.04) 0%, transparent 70%); }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fade-up 0.35s ease both; }
      `}</style>

      {/* Ambient blobs */}
      <div className="glow-teal   pointer-events-none fixed -top-24 left-1/2 -translate-x-1/2 w-[700px] h-[400px] z-0" />
      <div className="glow-violet pointer-events-none fixed bottom-0 right-0 w-[500px] h-[400px] z-0" />

      <div className="font-dm relative z-10 text-white min-h-[calc(100vh-56px)]">
        <div className="max-w-[820px] mx-auto px-4 sm:px-6 py-10 sm:py-14">

          {/* ── Page header ── */}
          <div className="fade-up mb-10" style={{ animationDelay: "0ms" }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="block w-1.5 h-4 rounded-full bg-[#00FFA3]" />
              <span className="font-plex text-[10px] uppercase tracking-widest text-gray-600">
                CLI Guide
              </span>
            </div>
            <h1 className="font-syne text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">
              How to use RepoFlow CLI
            </h1>
            <p className="font-dm text-sm text-gray-500 max-w-lg leading-relaxed">
              RepoFlow ships a command-line tool for staging, committing, and pushing your code —
              similar to Git, but synced directly to your RepoFlow repositories.
            </p>
          </div>

          {/* ── OS selector ── */}
          <div className="fade-up mb-8" style={{ animationDelay: "40ms" }}>
            <p className="font-plex text-[11px] text-gray-600 mb-2 uppercase tracking-widest">
              Select your OS
            </p>
            <div className="flex gap-1.5">
              {(["mac","windows","linux"] as OS[]).map((o) => (
                <button
                  key={o}
                  onClick={() => setOs(o)}
                  className={`font-plex text-[11px] px-4 py-2 rounded-lg border
                              capitalize transition-all duration-200
                              ${os === o
                                ? "text-[#00FFA3] bg-[#00FFA3]/[0.08] border-[#00FFA3]/25"
                                : "text-gray-600 border-white/[0.06] hover:text-gray-300 hover:border-white/[0.1]"
                              }`}
                >
                  {o === "mac" ? "macOS" : o === "windows" ? "Windows" : "Linux"}
                </button>
              ))}
            </div>
          </div>

          {/* ── Steps ── */}
          <div className="fade-up space-y-6" style={{ animationDelay: "80ms" }}>
            {steps.map((step, i) => (
              <div
                key={step.number}
                className="relative rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden"
                style={{ animationDelay: `${80 + i * 30}ms` }}
              >
                {/* Top shimmer — alternates accent colour for rhythm */}
                <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent
                                 ${i % 3 === 0 ? "via-[#00FFA3]/20" : i % 3 === 1 ? "via-[#A78BFA]/15" : "via-[#FF6B4A]/15"}`} />

                <div className="p-5 sm:p-6">
                  {/* Step header */}
                  <div className="flex items-start gap-4 mb-4">
                    <span className="font-plex text-[11px] text-[#00FFA3]/40 mt-0.5 shrink-0 w-6">
                      {step.number}
                    </span>
                    <div>
                      <h3 className="font-syne text-base font-bold text-white mb-1">
                        {step.title}
                      </h3>
                      <p className="font-dm text-sm text-gray-500 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>

                  {/* Code blocks */}
                  {step.cmds && (
                    <div className="ml-10 space-y-3">
                      {step.cmds.map((c, ci) => (
                        <CodeBlock key={ci} code={c.code} label={c.label} />
                      ))}
                    </div>
                  )}

                  {/* Note */}
                  {step.note && (
                    <div className="ml-10 mt-3 flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-[#A78BFA]/60 mt-1.5 shrink-0" />
                      <p className="font-plex text-[10px] text-gray-700 leading-relaxed">{step.note}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* ── Alias / shortcut tip ── */}
          <div className="fade-up mt-8" style={{ animationDelay: "360ms" }}>
            <div className="relative rounded-2xl border border-[#A78BFA]/20 bg-[#A78BFA]/[0.04] overflow-hidden p-5 sm:p-6">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#A78BFA]/20 to-transparent" />
              <div className="flex items-center gap-2 mb-3">
                <span className="font-plex text-[10px] text-[#A78BFA] uppercase tracking-widest">Pro tip</span>
              </div>
              <p className="font-dm text-sm text-gray-400 leading-relaxed mb-4">
                Typing the full path every time gets old fast. Create a shell alias so you can just type
                <code className="font-plex text-[11px] text-[#A78BFA]/80 mx-1 px-1.5 py-0.5 rounded bg-white/[0.05]">rflow</code>
                anywhere on your machine.
              </p>
              <CodeBlock
                code={os === "windows" ? ALIAS_CODE_WIN : ALIAS_CODE_MAC}
                label={os === "windows" ? "PowerShell profile" : "~/.zshrc or ~/.bashrc"}
              />
            </div>
          </div>

          {/* ── Quick reference ── */}
          <div className="fade-up mt-8" style={{ animationDelay: "400ms" }}>
            <div className="flex items-center gap-2 mb-4">
              <span className="block w-1.5 h-4 rounded-full bg-[#FF6B4A]" />
              <h2 className="font-syne text-[10px] tracking-[0.22em] uppercase text-gray-500">
                Quick Reference
              </h2>
            </div>

            <div className="relative rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FF6B4A]/15 to-transparent" />

              {/* Header row */}
              <div className="grid grid-cols-2 px-5 py-2.5 border-b border-white/[0.05]">
                <span className="font-plex text-[10px] uppercase tracking-widest text-gray-700">Command</span>
                <span className="font-plex text-[10px] uppercase tracking-widest text-gray-700">What it does</span>
              </div>

              <ul className="divide-y divide-white/[0.04]">
                {COMMANDS.map(({ cmd, desc }) => (
                  <li key={cmd} className="grid grid-cols-2 items-center px-5 py-3 hover:bg-white/[0.02]">
                    <code className="font-plex text-[11px] text-[#00FFA3]/70">{cmd}</code>
                    <span className="font-dm text-xs text-gray-500">{desc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ── FAQ ── */}
          <div className="fade-up mt-8 space-y-3" style={{ animationDelay: "440ms" }}>
            <div className="flex items-center gap-2 mb-4">
              <span className="block w-1.5 h-4 rounded-full bg-[#A78BFA]" />
              <h2 className="font-syne text-[10px] tracking-[0.22em] uppercase text-gray-500">FAQ</h2>
            </div>

            {[
              {
                q: "Do I need to clone the RepoFlow repo for every project?",
                a: "No — clone it once anywhere on your machine. You use the full path (or alias) from any project folder.",
              },
              {
                q: "What happens if AWS S3 is unavailable?",
                a: "Nothing breaks. Push automatically falls back to storing your files securely in MongoDB. The frontend serves them as downloadable data URLs — the experience is identical.",
              },
              {
                q: "Can I use this on Windows without Git Bash?",
                a: "Yes. Node.js runs natively in Command Prompt and PowerShell. The commands are identical — only the alias setup differs slightly.",
              },
              {
                q: "Is my token stored securely?",
                a: "It is saved to ~/.repoflow/credentials.json in your home directory. This file is local to your machine and is never committed anywhere. Run `node index.js logout` to clear it.",
              },
              {
                q: "What is the difference between RepoFlow CLI and Git?",
                a: "Git is a full distributed version control system with branches, merges, and a local object store. RepoFlow CLI is a lightweight complement — it syncs file snapshots to your RepoFlow repositories with a simpler command set, focused on code visibility and collaboration within the platform.",
              },
            ].map(({ q, a }) => (
              <details
                key={q}
                className="group rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden"
              >
                <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none">
                  <span className="font-dm text-sm text-gray-300 group-open:text-white transition-colors">
                    {q}
                  </span>
                  <span className="font-plex text-gray-700 group-open:text-[#00FFA3] text-lg leading-none transition-colors shrink-0">
                    +
                  </span>
                </summary>
                <div className="px-5 pb-4 border-t border-white/[0.04]">
                  <p className="font-dm text-sm text-gray-500 leading-relaxed pt-3">{a}</p>
                </div>
              </details>
            ))}
          </div>

          {/* ── CTA ── */}
          <div className="fade-up mt-10 flex flex-col sm:flex-row items-start sm:items-center
                          justify-between gap-4 rounded-2xl border border-white/[0.07]
                          bg-white/[0.02] p-5 sm:p-6"
            style={{ animationDelay: "480ms" }}
          >
            <div>
              <p className="font-syne text-base font-bold text-white mb-1">Ready to push your first commit?</p>
              <p className="font-plex text-[11px] text-gray-600">Create a repository and start tracking your work.</p>
            </div>
            <Link
              to="/repo/create"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-plex text-[11px]
                         tracking-widest uppercase border border-[#00FFA3]/25 bg-[#00FFA3]/[0.08]
                         text-[#00FFA3] hover:bg-[#00FFA3]/[0.15] hover:border-[#00FFA3]/40
                         transition-all duration-200 whitespace-nowrap"
            >
              New Repository <ArrowRightIcon />
            </Link>
          </div>

        </div>
      </div>
    </>
  );
};

export default Guidelines;
