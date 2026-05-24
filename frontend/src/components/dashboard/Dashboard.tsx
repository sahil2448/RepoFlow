import { useState, useEffect } from "react";
import Navbar from "../Navbar";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Repository {
  _id: string;
  name: string;
  description: string;
  language?: string;
  stars?: number;
  updatedAt?: string;
}

interface UpcomingEvent {
  id: number;
  title: string;
  date: string;
  type: "conference" | "meetup" | "summit";
}

// ─── Constants ────────────────────────────────────────────────────────────────

const UPCOMING_EVENTS: UpcomingEvent[] = [
  { id: 1, title: "Tech Conference", date: "Dec 15", type: "conference" },
  { id: 2, title: "Developer Meetup", date: "Dec 25", type: "meetup" },
  { id: 3, title: "React Summit", date: "Jan 5", type: "summit" },
];

const EVENT_COLORS: Record<UpcomingEvent["type"], string> = {
  conference: "text-[#00FFA3] bg-[#00FFA3]/10 border-[#00FFA3]/25",
  meetup:     "text-[#FF6B4A] bg-[#FF6B4A]/10 border-[#FF6B4A]/25",
  summit:     "text-[#A78BFA] bg-[#A78BFA]/10 border-[#A78BFA]/25",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const FolderIcon = () => (
  <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

const ChevronIcon = () => (
  <svg className="w-3.5 h-3.5 text-gray-700 group-hover:text-[#00FFA3] group-hover:translate-x-0.5 transition-all duration-200"
    fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const Dashboard = () => {
  const [repositories, setRepositories]               = useState<Repository[]>([]);
  const [searchQuery, setSearchQuery]                 = useState<string>("");
  const [suggestedRepositories, setSuggestedRepositories] = useState<Repository[]>([]);
  const [searchResults, setSearchResults]             = useState<Repository[]>([]);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) { console.error("No userId found in localStorage"); return; }

    const fetchRepositories = async (): Promise<void> => {
      try {
        const response = await fetch(`http://localhost:3000/repo/user/${userId}`);
        const data = await response.json();
        if (!response.ok) { console.error(data); return; }
        setRepositories(data.repositories || []);
      } catch (error) { console.error("Error fetching repositories:", error); }
    };

    const fetchSuggestedRepositories = async (): Promise<void> => {
      try {
        const response = await fetch(`http://localhost:3000/repo/all`);
        const data = await response.json();
        if (!response.ok) { console.error(data); return; }
        setSuggestedRepositories(data.repositories || []);
      } catch (error) { console.error("Error fetching suggested repositories:", error); }
    };

    fetchRepositories();
    fetchSuggestedRepositories();
  }, []);

  useEffect(() => {
    if (searchQuery === "") {
      setSearchResults(repositories);
    } else {
      setSearchResults(
        repositories.filter((repo) =>
          repo.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [searchQuery, repositories]);

  return (
    <>
      {/* ── Global font injection ── */}
      <style>{`
        .font-syne    { font-family: 'Syne', sans-serif; }
        .font-plex    { font-family: 'IBM Plex Mono', monospace; }
        .font-dm      { font-family: 'DM Sans', sans-serif; }

        /* Dot grid background */
        .dot-grid {
          background-color: #060611;
          background-image: radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px);
          background-size: 28px 28px;
        }

        /* Ambient glow blobs */
        .glow-teal   { background: radial-gradient(ellipse, rgba(0,255,163,0.06) 0%, transparent 70%); }
        .glow-coral  { background: radial-gradient(ellipse, rgba(255,107,74,0.05) 0%, transparent 70%); }

        /* Animated border on repo card hover */
        @keyframes border-pulse {
          0%, 100% { opacity: 0.3; }
          50%       { opacity: 1; }
        }
        .repo-card:hover .accent-bar {
          animation: border-pulse 1.8s ease-in-out infinite;
        }

        /* Subtle scrollbar */
        ::-webkit-scrollbar       { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e1e2e; border-radius: 4px; }
      `}</style>

      {/* <Navbar /> */}
      <section
        id="dashboard"
        className="dot-grid font-dm min-h-screen text-white relative overflow-hidden"
      >
        {/* Ambient glow blobs */}
        <div className="glow-teal  pointer-events-none absolute -top-32 -left-32 w-[500px] h-[500px]" />
        <div className="glow-coral pointer-events-none absolute bottom-0 right-0 w-[400px] h-[400px]" />

        <div className="relative z-10 max-w-[1380px] mx-auto px-6 py-10 flex gap-6">

          {/* ── Left Sidebar: Suggested Repos ── */}
          <aside className="w-[240px] shrink-0">
            <div className="flex items-center gap-2 mb-6">
              <span className="block w-1.5 h-4 rounded-full bg-[#00FFA3]" />
              <h3 className="font-syne text-[10px] tracking-[0.22em] uppercase text-gray-500">
                Suggested
              </h3>
            </div>

            <ul className="space-y-2">
              {suggestedRepositories.map((repo) => (
                <li
                  key={repo._id}
                  className="group p-3.5 rounded-lg border border-white/[0.05] bg-white/[0.02]
                             hover:bg-[#00FFA3]/[0.04] hover:border-[#00FFA3]/20
                             transition-all duration-250 cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <FolderIcon />
                    <span className="font-plex text-[11px] text-gray-300 truncate group-hover:text-white transition-colors">
                      {repo.name}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed line-clamp-2 pl-[1.35rem]">
                    {repo.description}
                  </p>
                </li>
              ))}
            </ul>
          </aside>

          {/* ── Main: Your Repos ── */}
          <main className="flex-1 min-w-0">

            {/* Header */}
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="font-syne text-3xl font-bold text-white tracking-tight leading-none">
                  Repositories
                </h2>
                <p className="mt-1.5 font-plex text-xs text-gray-600">
                  {repositories.length} total &nbsp;·&nbsp; {searchResults.length} shown
                </p>
              </div>
              <div className="font-plex text-[10px] text-gray-700 border border-white/[0.06] rounded-md px-3 py-1.5 bg-white/[0.02]">
                updated just now
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-5 group">
              {/* Focus glow */}
              <div className="absolute -inset-px rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"
                style={{ background: "linear-gradient(135deg, #00FFA320, transparent, #00FFA308)", borderRadius: "12px" }} />

              <div className="relative flex items-center gap-3 px-4 py-3 rounded-xl
                              border border-white/[0.07] bg-white/[0.03]
                              focus-within:border-[#00FFA3]/30 transition-colors duration-300">
                <SearchIcon />
                <input
                  type="text"
                  value={searchQuery}
                  placeholder="Search repositories…"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent font-dm text-sm text-gray-200 placeholder-gray-700 outline-none"
                />
                {searchQuery && (
                  <span className="font-plex text-[10px] text-[#00FFA3]/60">
                    {searchResults.length} found
                  </span>
                )}
              </div>
            </div>

            {/* Repo List */}
            <ul className="space-y-2">
              {searchResults.map((repo, i) => (
                <li
                  key={repo._id}
                  className="repo-card group relative flex items-center gap-4 px-5 py-4 rounded-xl
                             border border-white/[0.05] bg-white/[0.02]
                             hover:bg-white/[0.04] hover:border-white/[0.09]
                             transition-all duration-200 cursor-pointer"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  {/* Left accent bar */}
                  <span
                    className="accent-bar absolute left-0 top-1/2 -translate-y-1/2 -translate-x-px
                               w-[3px] h-0 group-hover:h-7 rounded-full bg-[#00FFA3]
                               transition-all duration-300"
                  />

                  {/* Repo icon */}
                  <div className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center
                                  bg-gradient-to-br from-[#00FFA3]/8 to-[#A78BFA]/8
                                  border border-white/[0.06] group-hover:border-[#00FFA3]/20 transition-colors">
                    <FolderIcon />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-plex text-sm font-medium text-gray-300 group-hover:text-white transition-colors truncate">
                      {repo.name}
                    </h4>
                    <p className="font-dm text-xs text-gray-600 mt-0.5 truncate">
                      {repo.description}
                    </p>
                  </div>

                  <ChevronIcon />
                </li>
              ))}
            </ul>

            {/* Empty state */}
            {searchResults.length === 0 && searchQuery !== "" && (
              <div className="py-20 text-center">
                <p className="font-plex text-xs text-gray-700">
                  no match for{" "}
                  <span className="text-[#00FFA3]/60">"{searchQuery}"</span>
                </p>
              </div>
            )}
          </main>

          {/* ── Right Sidebar: Events ── */}
          <aside className="w-[210px] shrink-0">
            <div className="flex items-center gap-2 mb-6">
              <span className="block w-1.5 h-4 rounded-full bg-[#FF6B4A]" />
              <h3 className="font-syne text-[10px] tracking-[0.22em] uppercase text-gray-500">
                Upcoming
              </h3>
            </div>

            <ul className="space-y-2.5">
              {UPCOMING_EVENTS.map((event) => (
                <li
                  key={event.id}
                  className="group p-4 rounded-xl border border-white/[0.05] bg-white/[0.02]
                             hover:bg-white/[0.04] hover:border-white/[0.09]
                             transition-all duration-200 cursor-pointer"
                >
                  <p className="font-dm text-sm font-medium text-gray-300 group-hover:text-white transition-colors leading-snug">
                    {event.title}
                  </p>

                  <div className="mt-2.5 flex items-center justify-between">
                    <span className="font-plex text-[10px] text-gray-600">{event.date}</span>
                    <span className={`font-plex text-[9px] px-1.5 py-0.5 rounded border font-medium uppercase tracking-wider ${EVENT_COLORS[event.type]}`}>
                      {event.type}
                    </span>
                  </div>
                </li>
              ))}
            </ul>

            {/* Decorative divider */}
            <div className="mt-8 pt-6 border-t border-white/[0.04]">
              <p className="font-plex text-[10px] text-gray-700 leading-relaxed">
                3 events this month
              </p>
            </div>
          </aside>

        </div>
      </section>
    </>
  );
};

export default Dashboard;