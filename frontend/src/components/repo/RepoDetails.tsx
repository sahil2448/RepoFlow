import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Issue {
  _id: string;
  title: string;
  status?: "open" | "closed";
  createdAt?: string;
}

interface Repository {
  _id: string;
  name: string;
  description: string;
  content: string[];
  visibility: boolean;
  owner: { _id: string; username: string } | string;
  issues: Issue[];
  stars: number;
  starredUsers: string[];
}

type RepoTab = "content" | "issues" | "delete";

// ─── Icons ────────────────────────────────────────────────────────────────────

const StarIcon: React.FC<{ filled?: boolean }> = ({ filled }) => (
  <svg className="w-3.5 h-3.5" fill={filled ? "currentColor" : "none"}
    viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);


const GlobeIcon: React.FC = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const LockIcon: React.FC = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const IssueIcon: React.FC = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const TerminalIcon: React.FC = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);
const TrashIcon: React.FC = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const ArrowLeftIcon: React.FC = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const UserIcon: React.FC = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const Skeleton: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`rounded-lg bg-white/[0.04] animate-pulse ${className}`} />
);



// ─── Delete Tab Panel ─────────────────────────────────────────────────────────

interface DeleteTabPanelProps {
  repoName: string;
  onDelete: () => void;
}

const DeleteTabPanel: React.FC<DeleteTabPanelProps> = ({ repoName, onDelete }) => {
  const [inputValue, setInputValue] = useState<string>("");
  const matches = inputValue === repoName;

  const handleConfirm = (): void => {
    if (!matches) return;
    onDelete();
  };

  return (
    <div className="relative rounded-2xl border border-[#FF6B4A]/20 bg-[#FF6B4A]/[0.02] overflow-hidden">
      {/* Top accent line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FF6B4A]/30 to-transparent" />

      <div className="px-8 py-12 flex flex-col items-center gap-6 max-w-md mx-auto">

        {/* Icon */}
        <div className="w-12 h-12 rounded-xl border border-[#FF6B4A]/20
                        bg-[#FF6B4A]/[0.06] flex items-center justify-center
                        text-[#FF6B4A]/70">
          <TrashIcon />
        </div>

        {/* Warning header */}
        <div className="text-center space-y-1.5">
          <p className="font-syne text-base font-bold text-white">
            Delete this repository?
          </p>
          <p className="font-plex text-[11px] text-gray-600 leading-relaxed">
            This action is <span className="text-[#FF6B4A]">irreversible</span>. All content
            and issues will be permanently removed.
          </p>
           <p className="font-plex text-[10px] text-gray-600 uppercase tracking-widest">
            Type the repository name to confirm :  <span className="text-white lowercase">{repoName}</span>
          </p>
        </div>

        {/* Confirmation box */}
        <div className="w-full rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 space-y-3">
          {/* <p className="font-plex text-[10px] text-gray-600 uppercase tracking-widest">
            Type the repository name to confirm
          </p> */}

          {/* Repo name hint */}
         

          {/* Input */}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="enter repository name…"
            className={`w-full bg-black/30 rounded-lg border px-3 py-2.5
                        font-plex text-[12px] outline-none tracking-wide
                        placeholder:text-gray-800 transition-colors duration-200
                        ${matches
                          ? "border-[#FF6B4A]/50 text-[#FF6B4A] caret-[#FF6B4A]"
                          : inputValue.length > 0
                            ? "border-white/[0.08] text-gray-400 caret-gray-500"
                            : "border-white/[0.06] text-gray-400 caret-gray-500"
                        }`}
          />

         
        </div>

        {/* Delete button */}
        <button
          onClick={handleConfirm}
          disabled={!matches}
          className={`w-full flex items-center justify-center gap-2
                      font-plex text-[11px] tracking-wider py-2.5 rounded-xl
                      border transition-all duration-200
                      disabled:opacity-30 disabled:cursor-not-allowed
                      ${matches
                        ? "text-[#FF6B4A] bg-[#FF6B4A]/[0.10] border-[#FF6B4A]/30 hover:bg-[#FF6B4A]/[0.18] hover:border-[#FF6B4A]/50"
                        : "text-gray-600 bg-white/[0.02] border-white/[0.06]"
                      }`}
        >
          <TrashIcon />
          Delete "{repoName}"
        </button>

      </div>
    </div>
  );
};
// ─── Component ────────────────────────────────────────────────────────────────

const RepositoryDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [repo, setRepo]         = useState<Repository | null>(null);
  const [loading, setLoading]   = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<RepoTab>("content");
  const [starred, setStarred]   = useState<boolean>(false);
  const [starCount, setStarCount] = useState<number>(0);
  const [starLoading, setStarLoading] = useState<boolean>(false);
  const [copiedLine, setCopiedLine]   = useState<number | null>(null);

  const userId = localStorage.getItem("userId");

  // ── Fetch repo ──
  useEffect(() => {
    if (!id) return;
    const fetch = async (): Promise<void> => {
      try {
        const res = await axios.get(`http://localhost:3000/repo/${id}`);
        const data = res.data;
        setRepo(data.repository);
        setStarCount(data.repository.stars);
        setStarred(
          userId ? data.repository.starredUsers.includes(userId) : false
        );
      } catch (err) {
        console.error("Failed to fetch repository:", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, userId]);

  // ── Star toggle ──
  const handleStar = async (): Promise<void> => {
    if (!userId || !id || starLoading) return;
    setStarLoading(true);
    try {
      const res = await axios.post(`http://localhost:3000/repo/star/${id}`, { userId });
      setStarCount(res.data.stars);
      setStarred((prev) => !prev);
    } catch (err) {
      console.error("Star failed:", err);
    } finally {
      setStarLoading(false);
    }
  };
  const handleDeleteRepo = async():Promise<void>=>{
    try {
      await axios.delete(`http://localhost:3000/repo/delete/${id}`);
      navigate("/");
    } catch (error) {
      console.error("Failed to delete repository:", error);
    }
  }

  // ── Copy line to clipboard ──
  const handleCopyLine = (line: string, index: number): void => {
    navigator.clipboard.writeText(line);
    setCopiedLine(index);
    setTimeout(() => setCopiedLine(null), 1500);
  };

  // ── Owner display ──
  const ownerName =
    typeof repo?.owner === "object" ? repo.owner.username : "unknown";

  // ── Open issues count ──
  const openIssues = repo?.issues.filter((i) => i.status !== "closed").length ?? 0;

  // ─── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="font-dm max-w-[1380px] mx-auto px-6 py-10 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <div className="grid grid-cols-3 gap-3 mt-8">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <Skeleton className="h-64 mt-6" />
      </div>
    );
  }

  if (!repo) {
    return (
      <div className="font-dm flex flex-col items-center justify-center min-h-[60vh] gap-4 text-white">
        <p className="font-plex text-xs text-gray-600">repository not found</p>
        <button onClick={() => navigate("/")}
          className="font-plex text-[11px] text-[#00FFA3]/70 hover:text-[#00FFA3] transition-colors">
          ← back to dashboard
        </button>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        .font-syne { font-family: 'Syne', sans-serif; }
        .font-plex { font-family: 'IBM Plex Mono', monospace; }
        .font-dm   { font-family: 'DM Sans', sans-serif; }

        .glow-teal  { background: radial-gradient(ellipse, rgba(0,255,163,0.055) 0%, transparent 70%); }
        .glow-coral { background: radial-gradient(ellipse, rgba(255,107,74,0.04) 0%, transparent 70%); }

        /* Scanline effect on terminal panel */
        .scanlines::after {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0,0,0,0.03) 2px,
            rgba(0,0,0,0.03) 4px
          );
          pointer-events: none;
          border-radius: inherit;
        }

        /* Blinking cursor */
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        .cursor-blink { animation: blink 1.1s step-end infinite; }

        /* Star pop */
        @keyframes star-pop {
          0%   { transform: scale(1); }
          50%  { transform: scale(1.35); }
          100% { transform: scale(1); }
        }
        .star-pop { animation: star-pop 0.25s ease; }

        @keyframes fade-up {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fade-up 0.3s ease both; }

        /* Line hover copy button */
        .content-line:hover .copy-btn { opacity: 1; }
        .copy-btn { opacity: 0; transition: opacity 0.15s; }
      `}</style>

      {/* Ambient blobs */}
      <div className="glow-teal  pointer-events-none fixed -top-24 left-0      w-[600px] h-[400px] z-0" />
      <div className="glow-coral pointer-events-none fixed bottom-0  right-0   w-[400px] h-[400px] z-0" />

      <div className="font-dm relative z-10 min-h-[calc(100vh-56px)] text-white">
        <div className="max-w-[1380px] mx-auto px-6 py-10">

          {/* ── Back breadcrumb ── */}
          <button
            onClick={() => navigate("/")}
            className="fade-up flex items-center gap-2 font-plex text-[11px] text-gray-700
                       hover:text-gray-300 transition-colors mb-8 group"
            style={{ animationDelay: "0ms" }}
          >
            <span className="group-hover:-translate-x-0.5 transition-transform duration-200">
              <ArrowLeftIcon />
            </span>
            dashboard
          </button>

          {/* ── Repo header ── */}
          <div className="fade-up mb-8" style={{ animationDelay: "40ms" }}>
            <div className="flex items-start justify-between gap-6 flex-wrap">

              {/* Left: name + meta */}
              <div>
                {/* Owner / name breadcrumb */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex items-center gap-1.5 font-plex text-[11px] text-gray-600">
                    <UserIcon />
                    {ownerName}
                  </span>
                  <span className="text-gray-700 font-plex text-[11px]">/</span>
                  <h1 className="font-syne text-2xl font-bold text-white tracking-tight leading-none">
                    {repo.name}
                  </h1>
                  {/* Visibility badge */}
                  <span className={`flex items-center gap-1 font-plex text-[9px] px-2 py-0.5
                                    rounded border uppercase tracking-widest
                                    ${repo.visibility
                                      ? "text-[#00FFA3] bg-[#00FFA3]/[0.07] border-[#00FFA3]/20"
                                      : "text-[#A78BFA] bg-[#A78BFA]/[0.07] border-[#A78BFA]/20"
                                    }`}>
                    {repo.visibility ? <GlobeIcon /> : <LockIcon />}
                    {repo.visibility ? "public" : "private"}
                  </span>
                </div>

                {repo.description && (
                  <p className="font-dm text-sm text-gray-500 max-w-lg leading-relaxed">
                    {repo.description}
                  </p>
                )}
              </div>

           
              <button
                onClick={handleStar}
                disabled={!userId || starLoading}
                className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border
                            font-plex text-[11px] tracking-wider transition-all duration-200
                            disabled:opacity-40 disabled:cursor-not-allowed
                            ${starred
                              ? "text-[#00FFA3] bg-[#00FFA3]/[0.08] border-[#00FFA3]/25 hover:bg-[#00FFA3]/[0.14]"
                              : "text-gray-400 bg-white/[0.02] border-white/[0.07] hover:border-white/[0.12] hover:text-white"
                            }`}
              >
                <span className={starred ? "star-pop text-[#00FFA3]" : ""}>
                  <StarIcon filled={starred} />
                </span>
                <span>{starred ? "Starred" : "Star"}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px]
                                  ${starred ? "bg-[#00FFA3]/10" : "bg-white/[0.05]"}`}>
                  {starCount}
                </span>
              </button>
            </div>
          </div>

          {/* ── Stat pills ── */}
          <div
            className="fade-up grid grid-cols-3 gap-3 mb-8"
            style={{ animationDelay: "80ms" }}
          >
            {[
              {
                label: "Stars",
                value: starCount,
                accent: "#00FFA3",
                icon: <StarIcon filled />,
              },
              {
                label: "Content entries",
                value: repo.content.length,
                accent: "#A78BFA",
                icon: <TerminalIcon />,
              },
              {
                label: "Open issues",
                value: openIssues,
                accent: "#FF6B4A",
                icon: <IssueIcon />,
              },
            ].map(({ label, value, accent, icon }) => (
              <div
                key={label}
                className="relative rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 overflow-hidden"
              >
                {/* Faint corner glow */}
                <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-xl opacity-20"
                  style={{ backgroundColor: accent }} />
                <div className="relative flex items-start justify-between">
                  <div>
                    <p className="font-plex text-[10px] uppercase tracking-widest text-gray-600 mb-2">
                      {label}
                    </p>
                    <p className="font-syne text-2xl font-bold" style={{ color: accent }}>
                      {value}
                    </p>
                  </div>
                  <span style={{ color: accent }} className="opacity-40 mt-0.5">{icon}</span>
                </div>
              </div>
            ))}
          </div>

          {/* ── Tab bar ── */}
          <div
            className="fade-up border-b border-white/[0.05] mb-6"
            style={{ animationDelay: "110ms" }}
          >
            {(
              [
                { key: "content" as RepoTab, label: "Content",  icon: <TerminalIcon /> },
                { key: "issues"  as RepoTab, label: `Issues`,   icon: <IssueIcon /> },
                { key: "delete"  as RepoTab, label: `Delete`,   icon: <TrashIcon /> },
              ] as { key: RepoTab; label: string; icon: React.ReactNode }[]
            ).map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`relative inline-flex items-center gap-2 font-plex text-[11px]
                            px-4 py-3 transition-colors duration-200
                            ${activeTab === key ? "text-white" : "text-gray-600 hover:text-gray-300"}`}
              >
                {icon}
                {label}
                {key === "issues" && openIssues > 0 && (
                  <span className="font-plex text-[9px] px-1.5 py-0.5 rounded
                                   bg-[#FF6B4A]/10 border border-[#FF6B4A]/20 text-[#FF6B4A]">
                    {openIssues}
                  </span>
                )}
                {activeTab === key && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[#00FFA3]" />
                )}
              </button>
            ))}
          </div>

          {/* ── Tab panels ── */}
          <div className="fade-up" style={{ animationDelay: "140ms" }}>

            {/* ── CONTENT TAB ── */}
            {activeTab === "content" && (
              <div className="relative rounded-2xl border border-white/[0.07]
                              bg-[#060611] overflow-hidden scanlines">

                {/* Terminal top bar */}
                <div className="flex items-center justify-between px-4 py-2.5
                                border-b border-white/[0.05] bg-white/[0.02]">
                  <div className="flex items-center gap-1.5">
                    {/* Traffic lights */}
                    {["#FF6B4A", "#F59E0B", "#00FFA3"].map((c) => (
                      <span key={c} className="w-2.5 h-2.5 rounded-full opacity-60"
                        style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <span className="font-plex text-[10px] text-gray-700">
                    {repo.name} — {repo.content.length} entries
                  </span>
                  <span className="font-plex text-[10px] text-[#00FFA3]/40">
                    read-only
                  </span>
                </div>

                {/* Content lines */}
                {repo.content.length === 0 ? (
                  <div className="px-6 py-16 flex flex-col items-center gap-3">
                    <p className="font-plex text-[11px] text-gray-700">
                      no content yet
                    </p>
                    <p className="font-plex text-[10px] text-gray-800">
                      push your first entry to see it here
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/[0.03]">
                    {repo.content.map((line, i) => (
                      <div
                        key={i}
                        className="content-line group flex items-start gap-0 px-0
                                   hover:bg-[#00FFA3]/[0.03] transition-colors duration-150"
                      >
                        {/* Line number */}
                        <span className="shrink-0 w-12 py-3 text-center font-plex
                                         text-[11px] text-gray-800 select-none
                                         border-r border-white/[0.04]">
                          {String(i + 1).padStart(2, "0")}
                        </span>

                        {/* Line content */}
                        <span className="flex-1 px-5 py-3 font-plex text-[12px]
                                         text-gray-300 leading-relaxed break-all">
                          {line}
                          {/* Blinking cursor on last line */}
                          {i === repo.content.length - 1 && (
                            <span className="cursor-blink ml-0.5 inline-block
                                             w-[7px] h-[13px] bg-[#00FFA3]/60 align-middle" />
                          )}
                        </span>

                        {/* Copy button */}
                        <button
                          onClick={() => handleCopyLine(line, i)}
                          className="copy-btn shrink-0 mr-3 mt-2.5 px-2 py-1 rounded
                                     font-plex text-[9px] border transition-all duration-150
                                     border-white/[0.07] text-gray-600 hover:text-[#00FFA3]
                                     hover:border-[#00FFA3]/20 bg-white/[0.02]"
                        >
                          {copiedLine === i ? "copied!" : "copy"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── ISSUES TAB ── */}
            {activeTab === "issues" && (
              <div className="relative rounded-2xl border border-white/[0.07]
                              bg-white/[0.02] overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-px
                                bg-gradient-to-r from-transparent via-[#FF6B4A]/20 to-transparent" />

                {repo.issues.length === 0 ? (
                  <div className="px-6 py-16 flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-xl border border-white/[0.07]
                                    bg-white/[0.02] flex items-center justify-center
                                    text-[#00FFA3]/40">
                      <IssueIcon />
                    </div>
                    <p className="font-plex text-[11px] text-gray-700">no issues filed</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-white/[0.04]">
                    {repo.issues.map((issue, i) => {
                      const isOpen = issue.status !== "closed";
                      return (
                        <li
                          key={issue._id}
                          className="group flex items-center gap-4 px-5 py-4
                                     hover:bg-white/[0.02] transition-colors duration-150
                                     cursor-pointer relative"
                          style={{ animationDelay: `${i * 30}ms` }}
                        >
                          {/* Severity rail */}
                          <span className={`absolute left-0 top-0 bottom-0 w-[2px]
                                            ${isOpen ? "bg-[#FF6B4A]/40" : "bg-[#00FFA3]/30"}`} />

                          {/* Status dot */}
                          <span className={`shrink-0 w-2 h-2 rounded-full mt-0.5
                                            ${isOpen ? "bg-[#FF6B4A]" : "bg-[#00FFA3]/50"}`} />

                          {/* Issue info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-dm text-sm text-gray-300
                                          group-hover:text-white transition-colors truncate">
                              {issue.title}
                            </p>
                            {issue.createdAt && (
                              <p className="font-plex text-[10px] text-gray-700 mt-0.5">
                                {new Date(issue.createdAt).toLocaleDateString("en-US", {
                                  month: "short", day: "numeric", year: "numeric",
                                })}
                              </p>
                            )}
                          </div>

                          {/* Status badge */}
                          <span className={`font-plex text-[9px] px-2 py-0.5 rounded border
                                            uppercase tracking-widest shrink-0
                                            ${isOpen
                                              ? "text-[#FF6B4A] bg-[#FF6B4A]/[0.08] border-[#FF6B4A]/20"
                                              : "text-[#00FFA3] bg-[#00FFA3]/[0.08] border-[#00FFA3]/20"
                                            }`}>
                            {isOpen ? "open" : "closed"}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}

          {
      /* ── DELETE TAB ── */
          activeTab === "delete" && (
            <DeleteTabPanel
              repoName={repo.name}
              onDelete={handleDeleteRepo}
            />
          )
        }

          </div>
        </div>
      </div>
    </>
  );
};

export default RepositoryDetails;