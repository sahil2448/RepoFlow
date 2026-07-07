import React, { useEffect, useState } from "react";
import { ec2Api } from "../../config/api";
import { useNavigate } from "react-router-dom";



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



const CommitIcon: React.FC = () => (
  <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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



const CommitHistory: React.FC<CommitHistoryProps> = ({ repoId }) => {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [revertData, setRevertData] = useState<Record<string, CommitFile[]>>({});
  const [revertLoading, setRevertLoading] = useState<string | null>(null);

  useEffect(() => {
    const fetchCommits = async (): Promise<void> => {
      try {
        const res = await ec2Api.get(`/repo/${repoId}/commits`);
        setCommits(res.data.commits || []);
      } catch (err) {
        console.error("Failed to fetch commits:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCommits();
  }, [repoId]);

  const navigate = useNavigate();
const handleStartReview = (commit: Commit): void => {
  const roomId = crypto.randomUUID();
  const params = new URLSearchParams({
    repoId:    repoId,          // must be the actual Mongo _id in scope
    commitId:  commit.commitId,
    commitMsg: commit.message,
  }).toString();
  navigate(`/review/${roomId}?${params}`);
};
  const handleExpand = async (commit: Commit): Promise<void> => {
    
    if (expandedId === commit.commitId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(commit.commitId);

    
    if (revertData[commit.commitId]) return;

    setRevertLoading(commit.commitId);
    try {
      const res = await ec2Api.post(`/repo/${repoId}/revert/${commit.commitId}`);
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

  
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 rounded-xl bg-white/[0.03] animate-pulse border border-white/[0.04]" />
        ))}
      </div>
    );
  }

  
  if (commits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-4">
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
          <div className="px-4 py-3 space-y-1.5 font-plex text-[11px] overflow-x-auto">
            {[
              { cmd: `node index.js init --repoId ${repoId}`, comment: "# link to this repo" },
              { cmd: "node index.js add yourfile.js", comment: "# stage a file" },
              { cmd: 'node index.js commit "your message"', comment: "# snapshot" },
              { cmd: "node index.js push", comment: "# sync to S3 + DB" },
            ].map(({ cmd, comment }) => (
              <div key={cmd} className="whitespace-nowrap">
                <span className="text-[#00FFA3]/80">{cmd}</span>
                <span className="text-gray-700 ml-2">{comment}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  
  return (
    <>
      <style>{`
        .font-plex { font-family: 'IBM Plex Mono', monospace; }
        .font-syne { font-family: 'Syne', sans-serif; }
        .font-dm   { font-family: 'DM Sans', sans-serif; }

        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="block w-1 h-3 rounded-full bg-[#A78BFA]/60" />
          <span className="font-plex text-[10px] uppercase tracking-widest text-gray-600">
            {commits.length} commit{commits.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      
      <div className="relative">
        
        <div className="absolute left-[15px] sm:left-[19px] top-4 bottom-4 w-px bg-white/[0.05]" />

        <ul className="space-y-2">
          {commits.map((commit) => {
            const isExpanded = expandedId === commit.commitId;
            const files = revertData[commit.commitId] || [];
            const isLoading = revertLoading === commit.commitId;

            return (
              <li key={commit._id}>
                
                <div
                  onClick={() => handleExpand(commit)}
                  className="group relative flex items-start gap-3 sm:gap-4 cursor-pointer"
                >
                  
                  <div
                    className={`shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center z-10
                                   transition-all duration-200
                                   ${
                                     isExpanded
                                       ? "border-[#A78BFA]/40 bg-[#A78BFA]/[0.08] text-[#A78BFA]"
                                       : "border-white/[0.07] bg-[#060611] text-gray-600 group-hover:border-white/[0.12] group-hover:text-gray-400"
                                   }`}
                  >
                    <CommitIcon />
                  </div>

                  
                  <div
                    className={`flex-1 min-w-0 p-3 sm:p-4 rounded-xl border transition-all duration-200
                                   ${
                                     isExpanded
                                       ? "border-[#A78BFA]/20 bg-[#A78BFA]/[0.04]"
                                       : "border-white/[0.05] bg-white/[0.02] group-hover:border-white/[0.09]"
                                   }`}
                  >
                  
                    <div className="flex items-start justify-between gap-2 sm:gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-dm text-sm text-gray-200 truncate group-hover:text-white transition-colors">
                          {commit.message}
                        </p>
                        <div className="flex items-center gap-2 sm:gap-3 mt-1.5 overflow-x-auto scrollbar-hide whitespace-nowrap">
                          
                          <span className="font-plex text-[10px] text-[#A78BFA]/60 shrink-0">
                            {commit.commitId.slice(0, 7)}
                          </span>
                          
                          {commit.author && (
                            <span className="font-plex text-[10px] text-gray-700 shrink-0">
                              {commit.author.username}
                            </span>
                          )}
                          <span className="font-plex text-[10px] text-gray-700 shrink-0">
                            {formatDate(commit.createdAt)}
                          </span>
                          
                          <span className="flex items-center gap-1 font-plex text-[10px] text-gray-700 shrink-0">
                            <FileIcon />
                            {commit.files.length} file{commit.files.length !== 1 ? "s" : ""}
                          </span>
                          
                          {commit.s3Synced && (
                            <span className="font-plex text-[9px] px-1.5 py-0.5 rounded border text-[#00FFA3]/60 border-[#00FFA3]/15 bg-[#00FFA3]/[0.05] shrink-0">
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

                
                {isExpanded && (
                  <div className="ml-11 sm:ml-14 mt-1.5 rounded-xl border border-white/[0.05] bg-[#060611] overflow-hidden">
                    
                    <div className="flex items-center gap-2 flex-wrap px-3 sm:px-4 py-2 border-b border-white/[0.04]">
                      <div className="flex items-center gap-1.5 shrink-0">
                        {["#FF6B4A", "#F59E0B", "#00FFA3"].map((c) => (
                          <span
                            key={c}
                            className="w-1.5 h-1.5 rounded-full opacity-50"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                      <span className="font-plex text-[10px] text-gray-700 truncate min-w-0 flex-1">
                        {commit.commitId}
                      </span>
                      <button
                            onClick={() => handleStartReview(commit)}
                            className="font-plex text-[10px] px-2.5 py-1 rounded border shrink-0
                                      border-[#A78BFA]/25 bg-[#A78BFA]/[0.08] text-[#A78BFA]
                                      hover:bg-[#A78BFA]/[0.15] transition-all duration-150
                                      whitespace-nowrap"
                          >
                            🎥 Start Review Call
                          </button>
                    </div>

                    
                    {isLoading ? (
                      <div className="px-3 sm:px-4 py-4 space-y-2">
                        {[1, 2].map((n) => (
                          <div key={n} className="h-8 rounded bg-white/[0.03] animate-pulse" />
                        ))}
                      </div>
                    ) : files.length > 0 ? (
                      <ul className="divide-y divide-white/[0.03]">
                        {files.map(({ file, url }) => (
                          <li key={file} className="flex items-center justify-between gap-3 px-3 sm:px-4 py-2.5">
                            <span className="flex items-center gap-2 font-plex text-[11px] text-gray-400 min-w-0">
                              <span className="text-[#A78BFA]/50 shrink-0">
                                <FileIcon />
                              </span>
                              <span className="truncate">{file}</span>
                            </span>
                            <a                            
                              href={url}
                              download={file}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1.5 font-plex text-[10px] text-gray-700 hover:text-[#00FFA3] transition-colors shrink-0"
                            >
                              <DownloadIcon />
                              <span className="hidden sm:inline">download</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="px-3 sm:px-4 py-4 font-plex text-[11px] text-gray-700">
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