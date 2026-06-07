import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate }      from "react-router-dom";
import { useNotifications }                    from "../store/useNotifications";
import { notificationStore }                   from "../store/notificationStore";
import api                                     from "../config/api";

interface NotificationItem {
  _id:       string;
  type:      string;
  message:   string;
  link:      string;
  read:      boolean;
  createdAt: string;
  sender?:   { username: string };
}

const BellIcon: React.FC<{ hasUnread: boolean }> = ({ hasUnread }) => (
  <svg
    className={`w-4 h-4 transition-colors
                ${hasUnread ? "text-[#00FFA3]" : "text-gray-500"}`}
    fill="none" viewBox="0 0 24 24" stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const Navbar: React.FC = () => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const userId    = localStorage.getItem("userId");

  // ✅ Reads directly from module store — never resets on navigation
  const { notifications, unreadCount } = useNotifications();

  const [scrolled, setScrolled] = useState<boolean>(false);
  const [bellOpen, setBellOpen] = useState<boolean>(false);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotifClick = async (notif: NotificationItem): Promise<void> => {
    // ✅ Update module store FIRST — synchronous, survives navigation
    if (!notif.read) {
      notificationStore.markOneRead(notif._id);
      // Fire and forget — DB update in background
      api.patch(`/notifications/read-one/${notif._id}`).catch(console.error);
    }
    setBellOpen(false);
    navigate(notif.link);
  };

  const timeAgo = (iso: string): string => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const typeColor = (type: string): string => {
    if (type === "repo_starred")  return "bg-[#00FFA3]";
    if (type === "new_follower")  return "bg-[#A78BFA]";
    if (type === "issue_created") return "bg-[#FF6B4A]";
    if (type === "issue_closed")  return "bg-[#00FFA3]";
    return "bg-gray-600";
  };

  return (
    <>
      <style>{`
        .font-syne { font-family: 'Syne', sans-serif; }
        .font-plex { font-family: 'IBM Plex Mono', monospace; }
        .font-dm   { font-family: 'DM Sans', sans-serif; }
      `}</style>

      <nav className={`font-dm sticky top-0 z-50 w-full flex items-center
                       justify-between px-6 h-14 bg-[#060611] transition-all duration-300
                       ${scrolled
                         ? "border-b border-white/[0.05] shadow-[0_1px_30px_rgba(0,0,0,0.4)]"
                         : "border-b border-transparent"}`}>

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

        <div className="flex items-center gap-1">

          <Link
            to="/repo/create"
            className={`flex items-center gap-1.5 font-plex text-[11px] px-3.5 py-1.5
                        rounded-lg border transition-all duration-200
                        ${location.pathname === "/repo/create"
                          ? "text-[#00FFA3] bg-[#00FFA3]/[0.07] border-[#00FFA3]/20"
                          : "text-gray-500 border-transparent hover:text-gray-200 hover:bg-white/[0.04] hover:border-white/[0.06]"
                        }`}
          >
            <span className="text-base leading-none -mt-px">+</span>
            New Repo
          </Link>

          <span className="mx-1 w-px h-4 bg-white/[0.07]" />

          {/* ── Bell ── */}
          <div ref={bellRef} className="relative">
            <button
              onClick={() => setBellOpen((prev) => !prev)}
              className="relative flex items-center justify-center w-8 h-8
                         rounded-lg border border-transparent
                         hover:bg-white/[0.04] hover:border-white/[0.06]
                         transition-all duration-200"
            >
              <BellIcon hasUnread={unreadCount > 0} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4
                                 rounded-full bg-[#00FFA3] flex items-center justify-center
                                 font-plex text-[8px] text-black font-bold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {bellOpen && (
              <div className="absolute right-0 top-10 w-80 rounded-2xl
                              border border-white/[0.07] bg-[#060611]
                              shadow-[0_8px_32px_rgba(0,0,0,0.6)]
                              overflow-hidden z-50">

                <div className="flex items-center justify-between px-4 py-3
                                border-b border-white/[0.05]">
                  <span className="font-plex text-[11px] uppercase
                                   tracking-widest text-gray-500">
                    Notifications
                  </span>
                  {notifications.length > 0 && (
                    <span className="font-plex text-[10px] text-gray-700">
                      {notifications.length} total
                    </span>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <div className="px-4 py-10 text-center">
                    <p className="font-plex text-[11px] text-gray-700">
                      no notifications yet
                    </p>
                  </div>
                ) : (
                  <ul className="max-h-80 overflow-y-auto
                                 divide-y divide-white/[0.04]">
                    {notifications.map((notif) => (
                      <li key={notif._id}>
                        <button
                          onClick={() => handleNotifClick(notif)}
                          className={`w-full flex items-start gap-3 px-4 py-3
                                      text-left hover:bg-white/[0.03]
                                      transition-colors duration-150
                                      ${!notif.read ? "bg-white/[0.02]" : ""}`}
                        >
                          <span className={`shrink-0 w-2 h-2 rounded-full mt-1.5
                                            ${typeColor(notif.type)}`} />

                          <div className="flex-1 min-w-0">
                            {notif.sender?.username && (
                              <span className="font-plex text-[11px]
                                               text-[#00FFA3]/80 mr-1">
                                {notif.sender.username}
                              </span>
                            )}
                            <span className="font-dm text-xs text-gray-400">
                              {notif.message}
                            </span>
                            <p className="font-plex text-[10px]
                                          text-gray-700 mt-0.5">
                              {timeAgo(notif.createdAt)}
                            </p>
                          </div>

                          {!notif.read && (
                            <span className="shrink-0 w-1.5 h-1.5 rounded-full
                                             bg-[#00FFA3] mt-2" />
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <span className="mx-1 w-px h-4 bg-white/[0.07]" />

          <Link
            to={`/profile/${userId}`}
            className={`flex items-center gap-2.5 font-dm text-sm px-3 py-1.5
                        rounded-lg border transition-all duration-200
                        ${location.pathname.startsWith("/profile")
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