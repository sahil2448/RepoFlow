import React from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserDetails {
  _id?:      string;
  username:  string;
  email?:    string;
  bio?:      string;
  location?: string;
  website?:  string;
  avatar?:   string;
  followers?: number;
  following?: number;
}

interface AboutUserProps {
  userDetails: UserDetails;
}

// ─── Icons ───────────────────────────────────────────────────────────────────

const LocationIcon: React.FC = () => (
  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const LinkIcon: React.FC = () => (
  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

const UserCircleIcon: React.FC = () => (
  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────

const AboutUser: React.FC<AboutUserProps> = ({ userDetails }) => {
  const hasBio      = !!userDetails.bio?.trim();
  const hasLocation = !!userDetails.location?.trim();
  const hasWebsite  = !!userDetails.website?.trim();
  const hasAnything = hasBio || hasLocation || hasWebsite;

  // Normalize website URL
  const websiteUrl = userDetails.website?.startsWith("http")
    ? userDetails.website
    : `https://${userDetails.website}`;

  if (!hasAnything) return null;

  return (
    <>
      <style>{`
        .font-plex { font-family: 'IBM Plex Mono', monospace; }
        .font-syne { font-family: 'Syne', sans-serif; }
        .font-dm   { font-family: 'DM Sans', sans-serif; }
      `}</style>


 <div className="flex items-center gap-2 mb-4">
          <span className="block w-1.5 h-4 rounded-full bg-[#A78BFA]" />
                <h3 className="font-syne text-[10px] tracking-[0.22em] uppercase text-gray-500">
            About
          </h3>
        </div>
      <div className="relative rounded-2xl border border-white/[0.07]
                      bg-white/[0.02] p-5 mb-6 overflow-hidden">
        {/* Top shimmer */}
        
        
        <div className="absolute inset-x-0 top-0 h-px
                        bg-gradient-to-r from-transparent via-[#A78BFA]/15 to-transparent" />

        {/* Section label */}
       

        <div className="flex flex-col gap-3">

          {/* Bio */}
          {hasBio && (
            <div className="flex items-start gap-2.5">
              <span className="text-[#A78BFA]/50 mt-0.5">
                <UserCircleIcon />
              </span>
              <p className="font-dm text-sm text-gray-400 leading-relaxed">
                {userDetails.bio}
              </p>
            </div>
          )}

          {/* Divider between bio and meta */}
          {hasBio && (hasLocation || hasWebsite) && (
            <div className="border-t border-white/[0.04]" />
          )}

          {/* Location */}
          {hasLocation && (
            <div className="flex items-center gap-2.5">
              <span className="text-[#A78BFA]/50">
                <LocationIcon />
              </span>
              <span className="font-plex text-[11px] text-gray-500">
                {userDetails.location}
              </span>
            </div>
          )}

          {/* Website */}
          {hasWebsite && (
            <div className="flex items-center gap-2.5">
              <span className="text-[#A78BFA]/50">
                <LinkIcon />
              </span>
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-plex text-[11px] text-[#00FFA3]/70
                           hover:text-[#00FFA3] transition-colors duration-150
                           truncate max-w-[280px]"
              >
                {userDetails.website}
              </a>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default AboutUser;