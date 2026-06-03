import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { useAuth } from "../../authContext";
import HeatMapProfile from "./HeatMap";
import StarredRepo from "./StarredRepo";
import AboutUser from "./AboutUser"
// ─── Types ────────────────────────────────────────────────────────────────────

interface UserDetails {
  _id?: string;
  username: string;
  email?: string;
  followers?: number;
  following?: number;
  bio?: string;
  location?: string;
  website?: string;
  avatar?: string;
}

type ProfileTab = "overview" | "starred";

// ─── Icons ───────────────────────────────────────────────────────────────────

const BookIcon: React.FC = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const StarIcon: React.FC = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const LogoutIcon: React.FC = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────

const Profile: React.FC = () => {
const { id: paramId } = useParams<{ id: string }>();
const currentUserId   = localStorage.getItem("userId");
const id              = paramId ?? currentUserId ?? "";
const isOwnProfile    = currentUserId === id;

  const { setCurrentUser } = useAuth();

  const [userDetails,   setUserDetails]   = useState<UserDetails>({ username: "username" });
  const [activeTab,     setActiveTab]     = useState<ProfileTab>("overview");
  const [isFollowing,   setIsFollowing]   = useState<boolean>(false);
  const [followLoading, setFollowLoading] = useState<boolean>(false);

  const [isEditing, setIsEditing] = useState(false);
const [editData, setEditData] = useState({
  username: "",
  email: "",
  bio: "",
  location: "",
  website: "",
  avatar: "",
});
const [saveLoading, setSaveLoading] = useState(false);

useEffect(() => {
  setEditData({
    username: userDetails.username ?? "",
    email: userDetails.email ?? "",
    bio: userDetails.bio ?? "",
    location: userDetails.location ?? "",
    website: userDetails.website ?? "",
    avatar: userDetails.avatar ?? "",
  });
}, [userDetails]);


const handleEditChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
) => {
  const { name, value } = e.target;
  setEditData((prev) => ({ ...prev, [name]: value }));
};

const handleSaveProfile = async () => {
  if (!id) return;

  setSaveLoading(true);
  try {
    const response = await axios.put(`http://localhost:3000/updateProfile/${id}`, editData);
    setUserDetails((prev) => ({
  ...prev,
  ...response.data,
  username: response.data.username ?? prev.username,
  email:    response.data.email    ?? prev.email,
}));
    setIsEditing(false);
  } catch (error: any) {
    console.error("Profile update failed:", error?.response?.data?.error ?? error);
  } finally {
    setSaveLoading(false);
  }
};

  // ── Fetch profile of the user whose id is in the URL ──
  useEffect(() => {
    if (!id) return;
    const fetchUserDetails = async (): Promise<void> => {
      try {
        const response = await axios.get(`http://localhost:3000/userProfile/${id}`);
        setUserDetails(response.data);
      } catch (err) {
        console.error("Cannot fetch user details:", err);
      }
    };
    fetchUserDetails();
  }, [id]);

  // ── Follow / Unfollow ──
  const handleFollowUser = async (): Promise<void> => {
    if (!currentUserId || !id || followLoading) return;

    setFollowLoading(true);
    try {
     await axios.post(`http://localhost:3000/followUser/${id}`, { currentUserId });
      setIsFollowing((prev) => !prev);
      const nextFollowing = !isFollowing;
setIsFollowing(nextFollowing);

setUserDetails((prev) => ({
  ...prev,
  followers: nextFollowing
    ? (prev.followers ?? 0) + 1
    : (prev.followers ?? 0) - 1,
}));
    } catch (error: any) {
      console.error("Follow failed:", error?.response?.data?.error ?? error);
    } finally {
      setFollowLoading(false);
    }
  };

  // ── Logout ──
  const handleLogout = (): void => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    setCurrentUser(null);
    window.location.href = "/login";
  };

  const tabs: { key: ProfileTab; label: string; icon: React.FC }[] = [
    { key: "overview", label: "Overview",             icon: BookIcon },
    { key: "starred",  label: "Starred Repositories", icon: StarIcon },
  ];

  return (
    <>
      <style>{`
        .font-syne { font-family: 'Syne', sans-serif; }
        .font-plex { font-family: 'IBM Plex Mono', monospace; }
        .font-dm   { font-family: 'DM Sans', sans-serif; }
        .glow-teal {
          background: radial-gradient(ellipse, rgba(0,255,163,0.055) 0%, transparent 70%);
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fade-up 0.35s ease both; }
      `}</style>

      <div className="glow-teal pointer-events-none fixed -top-24 left-1/2
                      -translate-x-1/2 w-[700px] h-[400px] z-0" />

      <div className="font-dm relative z-10 min-h-[calc(100vh-56px)] text-white">

        {/* ── Tab bar ── */}
        <div className="border-b border-white/[0.05] px-6">
          <div className="max-w-[1380px] mx-auto flex items-center gap-1">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`relative flex items-center gap-2 font-plex text-[11px] px-4 py-3.5
                            transition-colors duration-200
                            ${activeTab === key
                              ? "text-white"
                              : "text-gray-600 hover:text-gray-300"
                            }`}
              >
                <Icon />
                {label}
                {activeTab === key && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px]
                                   bg-[#00FFA3] rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Page body ── */}
        <div className="max-w-[1380px] mx-auto px-6 py-10">
          <div className="flex justify-between gap-10">

            {/* ── Left: User card ── */}
            <aside className="w-[260px] shrink-0 fade-up" style={{ animationDelay: "0ms" }}>

              {/* Avatar */}
              <div className="w-full aspect-square max-w-[260px] rounded-2xl
                              bg-gradient-to-br from-[#00FFA3]/10 to-[#A78BFA]/10
                              border border-white/[0.07] flex items-center justify-center mb-5
                              relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-px
                                bg-gradient-to-r from-transparent via-[#00FFA3]/20 to-transparent" />
                <span className="font-syne text-6xl font-bold text-white/10 select-none">
                  {userDetails.username?.[0]?.toUpperCase() ?? "U"}
                </span>
              </div>
              <div className="flex flex-col px-2">

              <h2 className="font-syne text-xl font-bold text-white tracking-tight mb-0.5">
                {userDetails.username}
              </h2>
              {userDetails.email && (
                <p className="font-plex text-[11px] text-gray-600 mb-4">
                  {userDetails.email}
                </p>
              )}

              {isOwnProfile && (
                <button
                  onClick={() => setIsEditing((prev) => !prev)}
                  className="w-full py-2 mb-4 rounded-lg font-plex text-[11px] tracking-widest uppercase
                            border transition-all duration-200 bg-white/[0.03] border-white/[0.07]
                            text-gray-400 hover:bg-[#00FFA3]/[0.07] hover:border-[#00FFA3]/25 hover:text-[#00FFA3]"
                >
                  {isEditing ? "Close Edit" : "Edit Profile"}
                </button>
              )}

              {/* Follow button — only shown on OTHER people's profiles */}
              {!isOwnProfile && (
                <button
                  onClick={handleFollowUser}
                  disabled={followLoading}
                  className={`w-full py-2 mb-5 rounded-lg font-plex text-[11px] tracking-widest uppercase
                              border transition-all duration-200
                              disabled:opacity-40 disabled:cursor-not-allowed
                              ${isFollowing
                                ? "bg-[#00FFA3]/[0.08] border-[#00FFA3]/25 text-[#00FFA3] hover:bg-[#00FFA3]/[0.04]"
                                : "bg-white/[0.03] border-white/[0.07] text-gray-400 hover:bg-[#00FFA3]/[0.07] hover:border-[#00FFA3]/25 hover:text-[#00FFA3]"
                              }`}
                >
                  {followLoading ? "..." : isFollowing ? "Following" : "Follow"}
                </button>
              )}

              {/* Stats */}
              <div className="flex gap-4 mb-6">
                <div className="flex flex-col">
                  <span className="font-syne text-sm font-bold text-white">
                    {userDetails.followers ?? 0}
                  </span>
                  <span className="font-plex text-[10px] text-gray-600">followers</span>
                </div>
                <span className="w-px bg-white/[0.05]" />
                <div className="flex flex-col">
                  <span className="font-syne text-sm font-bold text-white">
                    {userDetails.following ?? 0}
                  </span>
                  <span className="font-plex text-[10px] text-gray-600">following</span>
                </div>
              </div>

              {/* Sign out — only on your own profile */}
              {isOwnProfile && (
                <div className="border-t border-white/[0.05] pt-5">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 font-plex text-[11px] text-gray-700
                               hover:text-[#FF6B4A] transition-colors duration-200"
                  >
                    <LogoutIcon />
                    <span>Sign out</span>
                  </button>
                </div>
              )}
              </div>

              {/* Name + email */}

            </aside>

            {/* ── Right: Content ── */}
            {isOwnProfile && isEditing && (
  <div className="relative rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 mb-6 overflow-hidden fade-up">
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00FFA3]/15 to-transparent" />

    <p className="font-plex text-[10px] uppercase tracking-widest text-gray-600 mb-4">
      Edit Profile
    </p>

    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="mb-2 block text-[11px] text-gray-500">Username</label>
        <input
          name="username"
          value={editData.username}
          onChange={handleEditChange}
          className="w-full rounded-xl border border-white/[0.08] bg-black/20 px-4 py-3
                     text-sm text-white outline-none focus:border-[#00FFA3]/40"
        />
      </div>

      <div>
        <label className="mb-2 block text-[11px] text-gray-500">Email</label>
        <input
          name="email"
          value={editData.email}
          onChange={handleEditChange}
          className="w-full rounded-xl border border-white/[0.08] bg-black/20 px-4 py-3
                     text-sm text-white outline-none focus:border-[#00FFA3]/40"
        />
      </div>

      <div className="sm:col-span-2">
        <label className="mb-2 block text-[11px] text-gray-500">Bio</label>
        <textarea
          name="bio"
          rows={4}
          value={editData.bio}
          onChange={handleEditChange}
          className="w-full rounded-xl border border-white/[0.08] bg-black/20 px-4 py-3
                     text-sm text-white outline-none focus:border-[#00FFA3]/40"
        />
      </div>

      <div>
        <label className="mb-2 block text-[11px] text-gray-500">Location</label>
        <input
          name="location"
          value={editData.location}
          onChange={handleEditChange}
          className="w-full rounded-xl border border-white/[0.08] bg-black/20 px-4 py-3
                     text-sm text-white outline-none focus:border-[#00FFA3]/40"
        />
      </div>

      <div>
        <label className="mb-2 block text-[11px] text-gray-500">Website</label>
        <input
          name="website"
          value={editData.website}
          onChange={handleEditChange}
          className="w-full rounded-xl border border-white/[0.08] bg-black/20 px-4 py-3
                     text-sm text-white outline-none focus:border-[#00FFA3]/40"
        />
      </div>

      <div className="sm:col-span-2">
        <label className="mb-2 block text-[11px] text-gray-500">Avatar URL</label>
        <input
          name="avatar"
          value={editData.avatar}
          onChange={handleEditChange}
          className="w-full rounded-xl border border-white/[0.08] bg-black/20 px-4 py-3
                     text-sm text-white outline-none focus:border-[#00FFA3]/40"
        />
      </div>
    </div>

    <div className="flex gap-3 mt-5">
      <button
        onClick={handleSaveProfile}
        disabled={saveLoading}
        className="rounded-lg border border-[#00FFA3]/25 bg-[#00FFA3]/[0.08] px-4 py-2
                   text-[11px] uppercase tracking-widest text-[#00FFA3] hover:bg-[#00FFA3]/[0.12]
                   disabled:opacity-50"
      >
        {saveLoading ? "Saving..." : "Save Changes"}
      </button>

      <button
        onClick={() => setIsEditing(false)}
        className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-4 py-2
                   text-[11px] uppercase tracking-widest text-gray-400 hover:text-white"
      >
        Cancel
      </button>
    </div>
  </div>
)}
            <main className="flex-1 min-w-0 fade-up" style={{ animationDelay: "60ms" }}>
              
              <AboutUser userDetails={userDetails} />

              <div className="flex items-center gap-2 mb-6">
                <span className="block w-1.5 h-4 rounded-full bg-[#00FFA3]" />
                <h3 className="font-syne text-[10px] tracking-[0.22em] uppercase text-gray-500">
                  {activeTab === "overview" ? "Activity" : "Starred"}
                </h3>
              </div>

              {activeTab === "overview" ? (
                <div className="relative rounded-2xl border border-white/[0.07]
                                bg-white/[0.02] p-5 overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-px
                                  bg-gradient-to-r from-transparent via-[#00FFA3]/15 to-transparent" />
                  <p className="font-plex text-[10px] uppercase tracking-widest text-gray-600 mb-4">
                    Contributions
                  </p>
                  <HeatMapProfile />
                </div>
              ) : (
                <div className="relative rounded-2xl border border-white/[0.07]
                                bg-white/[0.02] p-5 overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-px
                                  bg-gradient-to-r from-transparent via-[#00FFA3]/15 to-transparent" />
                  <p className="font-plex text-[10px] uppercase tracking-widest text-gray-600 mb-4">
                    Starred Repositories
                  </p>
                  <StarredRepo />
                </div>
              )}

            </main>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;