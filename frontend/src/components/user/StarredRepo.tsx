import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// ─── Types ────────────────────────────────────────────────────────────────────

// ✅ Updated interface to match your repo schema more closely
interface StarredRepository {
  _id: string;
  name: string;
  description: string;
  language?: string;
  stars?: number;
  owner?: string;        // display name — populate from userId if needed
  userId?: string;       // raw creator ID from DB
  createdAt?: string;    // useful for sorting later
}
// ─── Icons ────────────────────────────────────────────────────────────────────

const FolderIcon: React.FC = () => (
  <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

const StarIcon: React.FC = () => (
  <svg className="w-3 h-3 text-[#00FFA3]/60" fill="currentColor" viewBox="0 0 24 24">
    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const ChevronIcon: React.FC = () => (
  <svg className="w-3.5 h-3.5 text-gray-700 group-hover:text-[#00FFA3] group-hover:translate-x-0.5 transition-all duration-200"
    fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

// ─── Language color dots ──────────────────────────────────────────────────────

const LANG_COLORS: Record<string, string> = {
  TypeScript:  "#3178c6",
  JavaScript:  "#f1e05a",
  Python:      "#3572A5",
  Rust:        "#dea584",
  Go:          "#00ADD8",
  CSS:         "#563d7c",
  HTML:        "#e34c26",
};

// ─── Component ────────────────────────────────────────────────────────────────

const StarredRepo: React.FC = () => {
  const [starred, setStarred]   = useState<StarredRepository[]>([]);
  const [loading, setLoading]   = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStarred = async (): Promise<void> => {
      const userId = localStorage.getItem("userId");
      if (!userId) { setLoading(false); return; }
      try {
        // TODO: replace with your real endpoint
        const response = await axios.get(`http://localhost:3000/getStarredRepos/${userId}`);
        setStarred(response.data.repositories);
      } catch (err) {
        console.error("Failed to fetch starred repos:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStarred();
  }, []);

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-[68px] rounded-xl border border-white/[0.05] bg-white/[0.02] animate-pulse"
          />
        ))}
      </div>
    );
  }

  // ── Empty state ──
  if (starred.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-12 h-12 rounded-xl border border-white/[0.07] bg-white/[0.02]
                        flex items-center justify-center">
          <StarIcon />
        </div>
        <p className="font-plex text-[11px] text-gray-700">no starred repositories yet</p>
      </div>
    );
  }

  // ── List ──
  return (
    <ul className="space-y-2">
      {starred.map((repo, i) => (
        <li
          key={repo._id}
          onClick={() => navigate(`/repo/${repo._id}`)}
          className="group relative flex items-center gap-4 px-5 py-4 rounded-xl
                     border border-white/[0.05] bg-white/[0.02]
                     hover:bg-white/[0.04] hover:border-white/[0.09]
                     transition-all duration-200 cursor-pointer"
          style={{ animationDelay: `${i * 40}ms` }}
        >
          {/* Left accent bar */}
          <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-px
                           w-[3px] h-0 group-hover:h-7 rounded-full bg-[#00FFA3]
                           transition-all duration-300" />

          {/* Icon */}
          <div className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center
                          bg-gradient-to-br from-[#00FFA3]/8 to-[#A78BFA]/8
                          border border-white/[0.06] group-hover:border-[#00FFA3]/20
                          transition-colors">
            <FolderIcon />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              {repo.owner && (
                <span className="font-plex text-[10px] text-gray-700 truncate">
                  {repo.owner} /
                </span>
              )}
              <h4 className="font-plex text-sm font-medium text-gray-300
                             group-hover:text-white transition-colors truncate">
                {repo.name}
              </h4>
            </div>
            <p className="font-dm text-xs text-gray-600 truncate">
              {repo.description}
            </p>

            {/* Meta row */}
            {(repo.language || repo.stars !== undefined) && (
              <div className="flex items-center gap-3 mt-1.5">
                {repo.language && (
                  <span className="flex items-center gap-1">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: LANG_COLORS[repo.language] ?? "#888" }}
                    />
                    <span className="font-plex text-[10px] text-gray-600">
                      {repo.language}
                    </span>
                  </span>
                )}
                {repo.stars !== undefined && (
                  <span className="flex items-center gap-1">
                    <StarIcon />
                    <span className="font-plex text-[10px] text-gray-600">
                      {repo.stars}
                    </span>
                  </span>
                )}
              </div>
            )}
          </div>

          <ChevronIcon />
        </li>
      ))}
    </ul>
  );
};

export default StarredRepo;