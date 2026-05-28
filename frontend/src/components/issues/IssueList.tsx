import React, { useEffect, useState } from "react";
import axios from "axios";
import CreateIssue from "./createIssue";
import IssueDetail from "./IssueDetail";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Issue {
  _id: string;
  title: string;
  description: string;
  status: "open" | "closed";
  createdAt?: string;
}

interface IssueListProps {
  repoId: string;
  isOwner: boolean;
}

// ─── Icons ───────────────────────────────────────────────────────────────────

const PlusIcon: React.FC = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
  </svg>
);

const OpenDotIcon: React.FC = () => (
  <svg className="w-3.5 h-3.5 text-[#FF6B4A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const ClosedDotIcon: React.FC = () => (
  <svg className="w-3.5 h-3.5 text-[#00FFA3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
  </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────

type IssueFilter = "all" | "open" | "closed";

const IssueList: React.FC<IssueListProps> = ({ repoId, isOwner }) => {
  const [issues, setIssues]           = useState<Issue[]>([]);
  const [loading, setLoading]         = useState<boolean>(true);
  const [filter, setFilter]           = useState<IssueFilter>("open");
  const [showCreate, setShowCreate]   = useState<boolean>(false);
  const [selectedId, setSelectedId]   = useState<string | null>(null);

  const fetchIssues = async (): Promise<void> => {
    try {
      const res = await axios.get(`http://localhost:3000/issue/all/${repoId}`);
      setIssues(res.data.issues || []);
    } catch (err) {
      console.error("Failed to fetch issues:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIssues(); }, [repoId]);

  const filtered = issues.filter((i) => {
    if (filter === "all")    return true;
    if (filter === "open")   return i.status === "open";
    if (filter === "closed") return i.status === "closed";
    return true;
  });

  const openCount   = issues.filter((i) => i.status === "open").length;
  const closedCount = issues.filter((i) => i.status === "closed").length;

  // ── Detail view ──
  if (selectedId) {
    return (
      <IssueDetail
        issueId={selectedId}
        isOwner={isOwner}
        onBack={() => { setSelectedId(null); fetchIssues(); }}
        onDeleted={() => { setSelectedId(null); fetchIssues(); }}
      />
    );
  }

  // ── Create form ──
  if (showCreate) {
    return (
      <CreateIssue
        repoId={repoId}
        onCreated={() => { setShowCreate(false); fetchIssues(); }}
        onCancel={() => setShowCreate(false)}
      />
    );
  }

  return (
    <>
      <style>{`
        .font-plex { font-family: 'IBM Plex Mono', monospace; }
        .font-syne { font-family: 'Syne', sans-serif; }
        .font-dm   { font-family: 'DM Sans', sans-serif; }
      `}</style>

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between mb-4">

        {/* Filter tabs */}
        <div className="flex items-center gap-1">
          {(["open", "closed", "all"] as IssueFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`font-plex text-[11px] px-3 py-1.5 rounded-lg border
                          transition-all duration-200
                          ${filter === f
                            ? "text-white bg-white/[0.06] border-white/[0.09]"
                            : "text-gray-600 border-transparent hover:text-gray-300"
                          }`}
            >
              {f === "open"   && `${openCount} open`}
              {f === "closed" && `${closedCount} closed`}
              {f === "all"    && "all"}
            </button>
          ))}
        </div>

        {/* New issue button */}
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 font-plex text-[11px] px-3.5 py-1.5
                     rounded-lg border border-[#00FFA3]/25 bg-[#00FFA3]/[0.07]
                     text-[#00FFA3] hover:bg-[#00FFA3]/[0.14] hover:border-[#00FFA3]/40
                     transition-all duration-200"
        >
          <PlusIcon />
          New Issue
        </button>
      </div>

      {/* ── List ── */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-white/[0.03] animate-pulse border border-white/[0.04]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-10 h-10 rounded-xl border border-white/[0.07] bg-white/[0.02]
                          flex items-center justify-center text-gray-700">
            <OpenDotIcon />
          </div>
          <p className="font-plex text-[11px] text-gray-700">
            no {filter !== "all" ? filter : ""} issues
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-white/[0.04]">
          {filtered.map((issue, i) => {
            const isOpen = issue.status === "open";
            return (
              <li
                key={issue._id}
                onClick={() => setSelectedId(issue._id)}
                className="group relative flex items-center gap-4 px-5 py-4
                           hover:bg-white/[0.02] transition-colors duration-150
                           cursor-pointer"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                {/* Severity rail */}
                <span className={`absolute left-0 top-0 bottom-0 w-[2px]
                                  ${isOpen ? "bg-[#FF6B4A]/40" : "bg-[#00FFA3]/30"}`} />

                {/* Status icon */}
                <span className="shrink-0 mt-0.5">
                  {isOpen ? <OpenDotIcon /> : <ClosedDotIcon />}
                </span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-dm text-sm text-gray-300 group-hover:text-white
                                transition-colors truncate">
                    {issue.title}
                  </p>
                  <p className="font-plex text-[10px] text-gray-700 mt-0.5 truncate">
                    {issue.description}
                  </p>
                </div>

                {/* Badge + date */}
                <div className="flex items-center gap-3 shrink-0">
                  {issue.createdAt && (
                    <span className="font-plex text-[10px] text-gray-700">
                      {new Date(issue.createdAt).toLocaleDateString("en-US", {
                        month: "short", day: "numeric",
                      })}
                    </span>
                  )}
                  <span className={`font-plex text-[9px] px-2 py-0.5 rounded border
                                    uppercase tracking-widest
                                    ${isOpen
                                      ? "text-[#FF6B4A] bg-[#FF6B4A]/[0.08] border-[#FF6B4A]/20"
                                      : "text-[#00FFA3] bg-[#00FFA3]/[0.08] border-[#00FFA3]/20"
                                    }`}>
                    {issue.status}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
};

export default IssueList;