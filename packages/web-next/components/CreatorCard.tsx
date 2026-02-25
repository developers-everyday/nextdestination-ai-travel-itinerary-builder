"use client";

import React from "react";
import Link from "next/link";
import type { CreatorCardData } from "@nextdestination/shared";
import FollowButton from "./FollowButton";

interface CreatorCardProps {
  creator: CreatorCardData;
  onFollowToggle?: (userId: string, isFollowing: boolean) => void;
}

const SOCIAL_ICONS: Record<string, { label: string; icon: string }> = {
  youtube: { label: "YouTube", icon: "🎬" },
  instagram: { label: "Instagram", icon: "📸" },
  tiktok: { label: "TikTok", icon: "🎵" },
  twitter: { label: "X / Twitter", icon: "🐦" },
  website: { label: "Website", icon: "🌐" },
};

const CreatorCard: React.FC<CreatorCardProps> = ({ creator, onFollowToggle }) => {
  return (
    <div className="group relative bg-white border-2 border-slate-100 rounded-3xl overflow-hidden hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50 transition-all duration-300">
      {/* Top gradient accent */}
      <div className="h-24 bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-600 relative">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-2 right-4 w-16 h-16 bg-white rounded-full blur-2xl" />
        </div>
      </div>

      {/* Avatar - overlapping gradient and content */}
      <div className="px-5 -mt-10 relative">
        <div className="flex items-end justify-between">
          <Link href={`/creator/${creator.userId}`}>
            <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-lg overflow-hidden flex items-center justify-center text-3xl font-black text-indigo-600 bg-indigo-50 flex-shrink-0">
              {creator.avatarUrl ? (
                <img
                  src={creator.avatarUrl}
                  alt={creator.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                creator.displayName?.charAt(0)?.toUpperCase() || "?"
              )}
            </div>
          </Link>
          <div className="mb-1">
            <FollowButton
              targetUserId={creator.userId}
              initialIsFollowing={creator.isFollowing}
              onToggle={(isFollowing) => onFollowToggle?.(creator.userId, isFollowing)}
              size="sm"
            />
          </div>
        </div>

        {/* Name & Role */}
        <div className="mt-3">
          <Link href={`/creator/${creator.userId}`} className="group/name">
            <h3 className="font-black text-lg text-slate-900 tracking-tight group-hover/name:text-indigo-600 transition-colors flex items-center gap-1.5">
              {creator.displayName}
              {creator.isVerified && (
                <span className="text-indigo-500 text-sm" title="Verified">
                  ✓
                </span>
              )}
            </h3>
          </Link>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {creator.role === "influencer" ? "Creator" : creator.role === "agent" ? "Agent" : "Traveler"}
          </span>
        </div>

        {/* Bio */}
        {creator.bio && (
          <p className="text-sm text-slate-500 mt-2 line-clamp-2 leading-relaxed">
            {creator.bio}
          </p>
        )}

        {/* Interests */}
        {creator.interests && creator.interests.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {creator.interests.slice(0, 3).map((interest) => (
              <span
                key={interest}
                className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-xs font-bold"
              >
                {interest}
              </span>
            ))}
            {creator.interests.length > 3 && (
              <span className="px-2 py-0.5 bg-slate-50 text-slate-400 rounded-md text-xs font-bold">
                +{creator.interests.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Stats & Social */}
      <div className="px-5 pb-5 mt-4">
        {/* Stats */}
        <div className="flex items-center gap-4 py-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <span className="text-base font-black text-slate-900">
              {creator.followerCount.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 font-medium">followers</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-base font-black text-slate-900">
              {creator.tripCount}
            </span>
            <span className="text-xs text-slate-400 font-medium">trips</span>
          </div>
        </div>

        {/* Social Links */}
        {creator.socialLinks && Object.keys(creator.socialLinks).length > 0 && (
          <div className="flex items-center gap-2 mt-1">
            {Object.entries(creator.socialLinks).map(([platform, url]) => {
              if (!url) return null;
              const social = SOCIAL_ICONS[platform];
              if (!social) return null;
              return (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-indigo-50 flex items-center justify-center text-sm transition-colors"
                  title={social.label}
                >
                  {social.icon}
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatorCard;
