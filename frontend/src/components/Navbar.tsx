import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

const Navbar: React.FC = () => {
  const location = useLocation();
  const [scrolled, setScrolled] = useState<boolean>(false);

  const isActive = (path: string): boolean => location.pathname === path;

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    const onScroll = (): void => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <style>{`
        .font-syne { font-family: 'Syne', sans-serif; }
        .font-plex { font-family: 'IBM Plex Mono', monospace; }
        .font-dm   { font-family: 'DM Sans', sans-serif; }
      `}</style>

      <nav
        className={`font-dm sticky top-0 z-50 w-full
                    flex items-center justify-between px-6 h-14
                    bg-[#060611] transition-all duration-300
                    ${scrolled
                      ? "border-b border-white/[0.05] shadow-[0_1px_30px_rgba(0,0,0,0.4)]"
                      : "border-b border-transparent"
                    }`}
      >
        {/* ── Brand ── */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-7 h-7 rounded-lg border border-white/[0.08] bg-white/[0.03]
                          flex items-center justify-center
                          group-hover:border-[#00FFA3]/30 group-hover:bg-[#00FFA3]/[0.06]
                          transition-all duration-200">
            <span className="font-plex text-[11px] font-medium text-[#00FFA3]">//</span>
          </div>
          <span className="font-syne text-[15px] font-bold text-gray-200
                           group-hover:text-white transition-colors duration-200 tracking-tight">
            RepoFlow
          </span>
        </Link>

        {/* ── Nav links ── */}
        <div className="flex items-center gap-1">

          <Link
            to="/repo/create"
            className={`flex items-center gap-1.5 font-plex text-[11px] px-3.5 py-1.5
                        rounded-lg border transition-all duration-200
                        ${isActive("/repo/create")
                          ? "text-[#00FFA3] bg-[#00FFA3]/[0.07] border-[#00FFA3]/20"
                          : "text-gray-500 border-transparent hover:text-gray-200 hover:bg-white/[0.04] hover:border-white/[0.06]"
                        }`}
          >
            <span className="text-base leading-none -mt-px">+</span>
            New Repo
          </Link>

          <span className="mx-1 w-px h-4 bg-white/[0.07]" />

          <Link
            to={`/profile/${userId}`}
            className={`flex items-center gap-2.5 font-dm text-sm px-3 py-1.5
                        rounded-lg border transition-all duration-200
                        ${isActive(`/profile/${userId}`)
                          ? "text-white bg-white/[0.05] border-white/[0.09]"
                          : "text-gray-500 border-transparent hover:text-gray-200 hover:bg-white/[0.04] hover:border-white/[0.06]"
                        }`}
          >
            <span className="w-5 h-5 rounded-full flex items-center justify-center
                             bg-gradient-to-br from-[#00FFA3]/20 to-[#A78BFA]/20
                             border border-white/[0.08] font-plex text-[9px] text-gray-300">
              U
            </span>
            <span>Profile</span>
          </Link>

        </div>
      </nav>
    </>
  );
};

export default Navbar;