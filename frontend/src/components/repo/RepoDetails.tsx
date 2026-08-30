import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import IssueList from "../issues/IssueList";
import CommitHistory from "./CommitHistory";
import api, { ec2Api } from "../../config/api";


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

type RepoTab = "content" | "issues" | "delete" | "commits";




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

const CommitIcon: React.FC = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
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



const Skeleton: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`rounded-lg bg-white/[0.04] animate-pulse ${className}`} />
);





interface DeleteTabPanelProps {
  repoName: string;
  onDelete: () => void;
}

const DeleteTabPanel: React.FC<DeleteTabPanelProps> = ({ 
  repoName, onDelete }) => {
  const [inputValue, setInputValue] = useState<string>("");
  const matches = inputValue === repoName;

  const handleConfirm = (): void => {
    if (!matches) return;
    onDelete();
  };

  return (
    <div className="relative rounded-2xl border border-[#FF6B4A]/20 bg-[#FF6B4A]/[0.02] overflow-hidden">
      
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FF6B4A]/30 to-transparent" />

      <div className="px-4 sm:px-8 py-8 sm:py-12 flex flex-col items-center gap-6 max-w-md mx-auto">

        
        <div className="w-12 h-12 rounded-xl border border-[#FF6B4A]/20
                        bg-[#FF6B4A]/[0.06] flex items-center justify-center
                        text-[#FF6B4A]/70">
          <TrashIcon />
        </div>

        
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

        
        <div className="w-full rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 space-y-3">
          

          


          
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


const RepositoryDetails: React.FC = () => {


  const { id } = useParams<{ name: string; id: string }>();
  const navigate = useNavigate();

  const [repo, setRepo] = useState<Repository | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<RepoTab>("content");
  const [starred, setStarred] = useState<boolean>(false);
  const [starCount, setStarCount] = useState<number>(0);
  const [starLoading, setStarLoading] = useState<boolean>(false);
  const [copiedLine, setCopiedLine] = useState<number | null>(null);
  
  const [files, setFiles] = useState<{
    name: string;
    content: string | null;
    url?: string;
    source: string;
  }[]>([]);
  const [filesLoading, setFilesLoading] = useState<boolean>(false);
  const [latestCommitMsg, setLatestCommitMsg] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    content: string;
  } | null>(null);

  
  useEffect(() => {
    if (activeTab !== "content") return;
    const fetchFiles = async (): Promise<void> => {
      setFilesLoading(true);
      try {
        const res = await api.get(`/repo/${id}/files`);
        setFiles(res.data.files || []);
        setLatestCommitMsg(res.data.message || "");
      } catch (err) {
        console.error("Failed to fetch files:", err);
      } finally {
        setFilesLoading(false);
      }
    };
    fetchFiles();
  }, [activeTab, id]);


  const userId = localStorage.getItem("userId");

  
  useEffect(() => {
    if (!id) return;
    const fetch = async (): Promise<void> => {
      try {
        const res = await api.get(`/repo/${id}`);
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

  
  const handleStar = async (): Promise<void> => {
    if (!userId || !id || starLoading) return;
    setStarLoading(true);
    try {
      const res = await ec2Api.post(`/repo/star/${id}`, { userId });
      setStarCount(res.data.stars);
      setStarred((prev) => !prev);
    } catch (err) {
      console.error("Star failed:", err);
    } finally {
      setStarLoading(false);
    }
  };
  const handleDeleteRepo = async (): Promise<void> => {
    try {
      await api.delete(`/repo/delete/${id}`);
      navigate("/");
    } catch (error) {
      console.error("Failed to delete repository:", error);
    }
  }

  
  const handleCopyLine = (line: string, index: number): void => {
    navigator.clipboard.writeText(line);
    setCopiedLine(index);
    setTimeout(() => setCopiedLine(null), 1500);
  };

  
  const ownerName =
    typeof repo?.owner === "object" ? repo.owner.username : "unknown";

  
  const openIssues = repo?.issues.filter((i) => i.status !== "closed").length ?? 0;

  const isOwner: boolean = !!(repo && typeof repo.owner === "object" && repo.owner._id === userId);
  
  if (loading) {
    return (
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
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

  
  return (
    <>
      <style>{`
      .scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
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

      
      <div className="glow-teal  pointer-events-none fixed -top-24 left-0      w-[600px] h-[400px] z-0" />
      <div className="glow-coral pointer-events-none fixed bottom-0  right-0   w-[400px] h-[400px] z-0" />

      <div className="font-dm relative z-10 min-h-[calc(100vh-56px)] text-white">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 py-6 sm:py-10">

          
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

          <div className="fade-up mb-8" style={{ animationDelay: "40ms" }}>
  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 sm:gap-6">

    <div className="min-w-0">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="flex items-center gap-1.5 font-plex text-[11px] text-gray-600 shrink-0">
          <UserIcon />
          {ownerName}
        </span>
        <span className="text-gray-700 font-plex text-[11px] shrink-0">/</span>
        <h1 className="font-syne text-xl sm:text-2xl font-bold text-white tracking-tight leading-none break-all">
          {repo.name}
        </h1>
        <span className={`flex items-center gap-1 font-plex text-[9px] px-2 py-0.5
                          rounded border uppercase tracking-widest shrink-0
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
      className={`flex items-center justify-center gap-2.5 px-4 py-2 rounded-xl border
                  font-plex text-[11px] tracking-wider transition-all duration-200
                  disabled:opacity-40 disabled:cursor-not-allowed shrink-0
                  w-full sm:w-auto
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

          
          <div
  className="fade-up grid grid-cols-1 xs:grid-cols-3 sm:grid-cols-3 gap-3 mb-8"
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
  className="relative rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 sm:p-4 overflow-hidden"
>
  <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-xl opacity-20"
    style={{ backgroundColor: accent }} />
  <div className="relative flex items-start justify-between">
    <div className="min-w-0">
      <p className="font-plex text-[9px] sm:text-[10px] uppercase tracking-widest text-gray-600 mb-1.5 sm:mb-2 truncate">
        {label}
      </p>
      <p className="font-syne text-lg sm:text-2xl font-bold" style={{ color: accent }}>
        {value}
      </p>
    </div>
    <span style={{ color: accent }} className="opacity-40 mt-0.5 shrink-0">{icon}</span>
  </div>
</div>
            ))}
          </div>

          
          <div
  className="fade-up border-b border-white/[0.05] mb-6 overflow-x-auto scrollbar-hide"
  style={{ animationDelay: "110ms" }}
>
  <div className="flex items-center whitespace-nowrap">
    {(
      [
        { key: "content" as RepoTab, label: "Content", icon: <TerminalIcon /> },
        { key: "issues" as RepoTab, label: `Issues`, icon: <IssueIcon /> },
        { key: "commits" as RepoTab, label: "Commits", icon: <CommitIcon /> },
        isOwner && { key: "delete" as RepoTab, label: `Delete`, icon: <TrashIcon /> },
      ] as { key: RepoTab; label: string; icon: React.ReactNode }[]
    ).map(({ key, label, icon }) => (
      <button
        key={key}
        onClick={() => setActiveTab(key)}
        className={`relative inline-flex items-center gap-2 font-plex text-[11px]
                    px-3 sm:px-4 py-3 whitespace-nowrap transition-colors duration-200
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
</div>

          
          <div className="fade-up" style={{ animationDelay: "140ms" }}>

            
            {activeTab === "content" && (
              <div className="theme-code-surface relative rounded-2xl border border-white/[0.07]
                  bg-[#060611] overflow-hidden scanlines">

                <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5
    border-b border-white/[0.05] bg-white/[0.02] overflow-x-auto scrollbar-hide">
  <div className="flex items-center gap-1.5 shrink-0">
    {["#FF6B4A", "#F59E0B", "#00FFA3"].map((c) => (
      <span key={c} className="w-2.5 h-2.5 rounded-full opacity-60 shrink-0"
        style={{ backgroundColor: c }} />
    ))}
  </div>
  <span className="font-plex text-[10px] text-gray-700 truncate min-w-0">
    {repo.name}
    {latestCommitMsg && (
      <span className="text-gray-800 ml-2">— {latestCommitMsg}</span>
    )}
  </span>
  {selectedFile ? (
    <button
      onClick={() => setSelectedFile(null)}
      className="font-plex text-[10px] text-[#00FFA3]/60
                 hover:text-[#00FFA3] transition-colors shrink-0"
    >
      ← back
    </button>
  ) : (
    <span className="font-plex text-[10px] text-[#00FFA3]/40 shrink-0">
      {files.length} file{files.length !== 1 ? "s" : ""}
    </span>
  )}
</div>
                {filesLoading ? (
                  <div className="space-y-2 p-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i}
                        className="h-10 rounded-lg bg-white/[0.03] animate-pulse" />
                    ))}
                  </div>
                ) : selectedFile ? (
                  
                  <div>
                    
                    <div className="flex items-center gap-2 px-4 py-2
                        border-b border-white/[0.04] bg-white/[0.02]">
                      <svg className="w-3 h-3 text-[#A78BFA]" fill="none"
                        viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="font-plex text-[11px] text-[#A78BFA]">
                        {selectedFile.name}
                      </span>
                    </div>
                    
                    <div className="divide-y divide-white/[0.03]">
                      {selectedFile.content.split("\n").map((line, i) => (
                        <div key={i}
  className="content-line group flex items-start
     hover:bg-[#00FFA3]/[0.03] transition-colors duration-150">
  <span className="shrink-0 w-8 sm:w-12 py-2.5 text-center font-plex
       text-[10px] sm:text-[11px] text-gray-800 select-none
       border-r border-white/[0.04]">
    {String(i + 1).padStart(2, "0")}
  </span>
  <span className="flex-1 min-w-0 px-3 sm:px-5 py-2.5 font-plex text-[11px] sm:text-[12px]
       text-gray-300 leading-relaxed break-all">
    {line || " "}
  </span>
  <button
    onClick={() => handleCopyLine(line, i)}
    className="copy-btn shrink-0 mr-2 sm:mr-3 mt-2 px-2 py-1 rounded
   font-plex text-[9px] border transition-all duration-150
   border-white/[0.07] text-gray-600 hover:text-[#00FFA3]
   hover:border-[#00FFA3]/20 bg-white/[0.02]
   opacity-60 sm:opacity-0"
  >
    {copiedLine === i ? "copied!" : "copy"}
  </button>
</div>
                      ))}
                    </div>
                  </div>
                ) : files.length === 0 ? (
                  
                   <div className="px-4 sm:px-6 py-12 sm:py-16 flex flex-col items-center gap-4">
    <p className="font-plex text-[11px] text-gray-700">
      no files pushed yet
    </p>
    <Link
        to="/guidelines"
        className="flex items-center gap-1.5 font-plex text-[11px] text-[#A78BFA]/70
                   hover:text-[#A78BFA] transition-colors duration-150"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        View the full CLI guide
      </Link>
                    <div className="theme-code-surface w-full max-w-sm rounded-xl border border-white/[0.06]
                        bg-[#060611] overflow-hidden">
                      <div className="flex items-center gap-1.5 px-4 py-2
                          border-b border-white/[0.05]">
                        {["#FF6B4A", "#F59E0B", "#00FFA3"].map((c) => (
                          <span key={c} className="w-2 h-2 rounded-full opacity-50"
                            style={{ backgroundColor: c }} />
                        ))}
                        <span className="font-plex text-[10px] text-gray-700 ml-1">
                          terminal
                        </span>
                      </div>
                      <div className="px-4 py-3 space-y-1.5 font-plex text-[11px]">
                        {[
                          { cmd: `node index.js init --repoId ${id}`, comment: "# link to this repo" },
                          { cmd: "node index.js add yourfile.js", comment: "# stage a file" },
                          { cmd: 'node index.js commit "message"', comment: "# snapshot" },
                          { cmd: "node index.js push", comment: "# sync here" },
                        ].map(({ cmd, comment }) => (
                          <div key={cmd}>
                            <span className="text-[#00FFA3]/80">{cmd}</span>
                            <span className="text-gray-700 ml-2">{comment}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  
                  <ul className="divide-y divide-white/[0.03]">
                    {files.map((file) => (
                      <li
                        key={file.name}
                        onClick={() => {
                          if (file.content) {
                            setSelectedFile({ name: file.name, content: file.content });
                          } else if (file.url) {
                            window.open(file.url, "_blank");
                          }
                        }}
                        className="group flex items-center gap-4 px-5 py-3.5
                       hover:bg-[#00FFA3]/[0.03] transition-colors
                       duration-150 cursor-pointer"
                      >
                        
                        <svg className="w-3.5 h-3.5 text-[#A78BFA]/60 shrink-0"
                          fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>

                        
                          <span className="flex-1 min-w-0 font-plex text-[12px] text-gray-400
       group-hover:text-white transition-colors truncate">
    {file.name}
  </span>

                        
                        <span className={`shrink-0 font-plex text-[9px] px-1.5 py-0.5 rounded border
        ${file.source === "s3"
      ? "text-[#00FFA3]/50 border-[#00FFA3]/15"
      : "text-[#A78BFA]/50 border-[#A78BFA]/15"
    }`}>
    {file.source}
  </span>

                        
                        <svg className="w-3.5 h-3.5 text-gray-700 shrink-0
                             group-hover:text-[#00FFA3] transition-colors"
                          fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round"
                            strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            
            {activeTab === "issues" && (
              <div className="relative rounded-2xl border border-white/[0.07]
                  bg-white/[0.02] overflow-hidden p-5">
                <div className="absolute inset-x-0 top-0 h-px
                                  bg-gradient-to-r from-transparent via-[#FF6B4A]/20 to-transparent" />
                <IssueList repoId={id!} isOwner={isOwner} />
              </div>
            )}
            {activeTab === "commits" && (
              <div className="relative rounded-2xl border border-white/[0.07]
                  bg-white/[0.02] overflow-hidden p-5">
                <div className="absolute inset-x-0 top-0 h-px
                                  bg-gradient-to-r from-transparent via-[#FF6B4A]/20 to-transparent" />
                <CommitHistory repoId={id!} />
              </div>
            )}


            {
              
              isOwner && activeTab === "delete" && (
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
