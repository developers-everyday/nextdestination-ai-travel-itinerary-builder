"use client";

import React from "react";
import FollowButton from "./FollowButton";

interface Props {
  userId: string;
  socialLinks?: Record<string, string> | null;
}

const SOCIAL_ICONS: Record<string, { label: string; icon: string }> = {
  youtube: { label: "YouTube", icon: "🎬" },
  instagram: { label: "Instagram", icon: "📸" },
  tiktok: { label: "TikTok", icon: "🎵" },
  twitter: { label: "X / Twitter", icon: "🐦" },
  website: { label: "Website", icon: "🌐" },
};

const CreatorProfileActions: React.FC<Props> = ({ userId, socialLinks }) => {
  return (
    <div className="flex items-center gap-3 justify-center md:justify-start mt-4">
      <FollowButton targetUserId={userId} size="md" />

      {socialLinks &&
        Object.entries(socialLinks).map(([platform, url]) => {
          if (!url) return null;
          const social = SOCIAL_ICONS[platform];
          if (!social) return null;
          return (
            <a
              key={platform}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm hover:bg-white/25 flex items-center justify-center text-lg transition-colors border border-white/10"
              title={social.label}
            >
              {social.icon}
            </a>
          );
        })}
    </div>
  );
};

export default CreatorProfileActions;
