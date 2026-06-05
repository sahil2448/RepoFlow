import React, { useEffect, useState } from "react";
import api from "../../config/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CommitFile {
  file: string;
  url: string;
}

interface Commit {
  _id: string;
  commitId: string;
  message: string;
  files: string[];
  s3Synced: boolean;
  author?: { username: string };
  createdAt: string;
}

interface CommitHistoryProps {
  repoId: string;
}

// ─── Icons ───────────────────────────────────────────────────────────────────

const CommitIcon: React.FC = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
    />
  </svg>
);

const FileIcon: React.FC = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

const DownloadIcon: React.FC = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
    />
  </svg>
);

const ChevronIcon: React.FC<{ open: boolean }> = ({ open }) => (
  <svg
    className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────

const CommitHistory: React.FC<CommitHistoryProps> = ({ repoId }) => {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [revertData, setRevertData] = useState<Record<string, CommitFile[]>>({});
  const [revertLoading, setRevertLoading] = useState<string | null>(null);

  useEffect(() => {
    const fetchCommits = async (): Promise<void> => {
      try {
        const res = await api.get(`/repo/${repoId}/commits`);
        setCommits(res.data.commits || []);
      } catch (err) {
        console.error("Failed to fetch commits:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCommits();
  }, [repoId]);

  const handleExpand = async (commit: Commit): Promise<void> => {
    // Toggle collapse
    if (expandedId === commit.commitId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(commit.commitId);

    // Already fetched
    if (revertData[commit.commitId]) return;

    setRevertLoading(commit.commitId);
    try {
      const res = await api.post(`/repo/${repoId}/revert/${commit.commitId}`);
      setRevertData((prev) => ({
        ...prev,
        [commit.commitId]: res.data.fileUrls || [],
      }));
    } catch (err) {
      console.error("Failed to fetch commit files:", err);
    } finally {
      setRevertLoading(null);
    }
  };

  const formatDate = (iso: string): string =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  // ── Loading ──
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 rounded-xl bg-white/[0.03] animate-pulse border border-white/[0.04]" />
        ))}
      </div>
    );
  }

  // ── Empty ──
  if (commits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4">
        <div
          className="w-10 h-10 rounded-xl border border-white/[0.07] bg-white/[0.02]
                        flex items-center justify-center text-gray-700"
        >
          <CommitIcon />
        </div>
        <div className="text-center">
          <p className="font-plex text-[11px] text-gray-700">no commits pushed yet</p>
          <p className="font-plex text-[10px] text-gray-800 mt-1">run these commands locally:</p>
        </div>

        {/* CLI cheatsheet */}
        <div className="w-full max-w-sm rounded-xl border border-white/[0.06] bg-[#060611] overflow-hidden">
          <div className="flex items-center gap-1.5 px-4 py-2 border-b border-white/[0.05]">
            {["#FF6B4A", "#F59E0B", "#00FFA3"].map((c) => (
              <span
                key={c}
                className="w-2 h-2 rounded-full opacity-50"
                style={{ backgroundColor: c }}
              />
            ))}
            <span className="font-plex text-[10px] text-gray-700 ml-1">terminal</span>
          </div>
          <div className="px-4 py-3 space-y-1.5 font-plex text-[11px]">
            {[
              { cmd: `node index.js init --repoId ${repoId}`, comment: "# link to this repo" },
              { cmd: "node index.js add yourfile.js", comment: "# stage a file" },
              { cmd: 'node index.js commit "your message"', comment: "# snapshot" },
              { cmd: "node index.js push", comment: "# sync to S3 + DB" },
            ].map(({ cmd, comment }) => (
              <div key={cmd}>
                <span className="text-[#00FFA3]/80">{cmd}</span>
                <span className="text-gray-700 ml-2">{comment}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Commit list ──
  return (
    <>
      <style>{`
        .font-plex { font-family: 'IBM Plex Mono', monospace; }
        .font-syne { font-family: 'Syne', sans-serif; }
        .font-dm   { font-family: 'DM Sans', sans-serif; }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="block w-1 h-3 rounded-full bg-[#A78BFA]/60" />
          <span className="font-plex text-[10px] uppercase tracking-widest text-gray-600">
            {commits.length} commit{commits.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Timeline list */}
      <div className="relative">
        {/* Vertical timeline line */}
        <div className="absolute left-[19px] top-4 bottom-4 w-px bg-white/[0.05]" />

        <ul className="space-y-2">
          {commits.map((commit) => {
            const isExpanded = expandedId === commit.commitId;
            const files = revertData[commit.commitId] || [];
            const isLoading = revertLoading === commit.commitId;

            return (
              <li key={commit._id}>
                {/* ── Commit row ── */}
                <div
                  onClick={() => handleExpand(commit)}
                  className="group relative flex items-start gap-4 cursor-pointer"
                >
                  {/* Timeline dot */}
                  <div
                    className={`shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center z-10
                                   transition-all duration-200
                                   ${
                                     isExpanded
                                       ? "border-[#A78BFA]/40 bg-[#A78BFA]/[0.08] text-[#A78BFA]"
                                       : "border-white/[0.07] bg-[#060611] text-gray-600 group-hover:border-white/[0.12] group-hover:text-gray-400"
                                   }`}
                  >
                    <CommitIcon />
                  </div>

                  {/* Content */}
                  <div
                    className={`flex-1 min-w-0 p-4 rounded-xl border transition-all duration-200
                                   ${
                                     isExpanded
                                       ? "border-[#A78BFA]/20 bg-[#A78BFA]/[0.04]"
                                       : "border-white/[0.05] bg-white/[0.02] group-hover:border-white/[0.09]"
                                   }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-dm text-sm text-gray-200 truncate group-hover:text-white transition-colors">
                          {commit.message}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5">
                          {/* Short hash */}
                          <span className="font-plex text-[10px] text-[#A78BFA]/60">
                            {commit.commitId.slice(0, 7)}
                          </span>
                          {commit.author && (
                            <span className="font-plex text-[10px] text-gray-700">
                              {commit.author.username}
                            </span>
                          )}
                          <span className="font-plex text-[10px] text-gray-700">
                            {formatDate(commit.createdAt)}
                          </span>
                          {/* Files count */}
                          <span className="flex items-center gap-1 font-plex text-[10px] text-gray-700">
                            <FileIcon />
                            {commit.files.length} file{commit.files.length !== 1 ? "s" : ""}
                          </span>
                          {/* S3 badge */}
                          {commit.s3Synced && (
                            <span className="font-plex text-[9px] px-1.5 py-0.5 rounded border text-[#00FFA3]/60 border-[#00FFA3]/15 bg-[#00FFA3]/[0.05]">
                              S3
                            </span>
                          )}
                        </div>
                      </div>

                      <span
                        className={`shrink-0 transition-colors ${
                          isExpanded ? "text-[#A78BFA]" : "text-gray-700"
                        }`}
                      >
                        <ChevronIcon open={isExpanded} />
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── Expanded: file download panel ── */}
                {isExpanded && (
                  <div className="ml-14 mt-1.5 rounded-xl border border-white/[0.05] bg-[#060611] overflow-hidden">
                    {/* Terminal bar */}
                    <div className="flex items-center gap-1.5 px-4 py-2 border-b border-white/[0.04]">
                      {["#FF6B4A", "#F59E0B", "#00FFA3"].map((c) => (
                        <span
                          key={c}
                          className="w-1.5 h-1.5 rounded-full opacity-50"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                      <span className="font-plex text-[10px] text-gray-700 ml-1">
                        {commit.commitId}
                      </span>
                    </div>

                    {/* Files */}
                    {isLoading ? (
                      <div className="px-4 py-4 space-y-2">
                        {[1, 2].map((n) => (
                          <div key={n} className="h-8 rounded bg-white/[0.03] animate-pulse" />
                        ))}
                      </div>
                    ) : files.length > 0 ? (
                      <ul className="divide-y divide-white/[0.03]">
                        {files.map(({ file, url }) => (
                          <li key={file} className="flex items-center justify-between px-4 py-2.5">
                            <span className="flex items-center gap-2 font-plex text-[11px] text-gray-400">
                              <span className="text-[#A78BFA]/50">
                                <FileIcon />
                              </span>
                              {file}
                            </span>

                            <a
                              href={url}
                              download={file}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1.5 font-plex text-[10px] text-gray-700 hover:text-[#00FFA3] transition-colors"
                            >
                              <DownloadIcon />
                              download
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="px-4 py-4 font-plex text-[11px] text-gray-700">
                        no files found in S3 for this commit
                      </p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
};

export default CommitHistory;
