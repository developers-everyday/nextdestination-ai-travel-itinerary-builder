"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthContext";
import { toggleFollow } from "@nextdestination/shared";

interface FollowButtonProps {
  targetUserId: string;
  initialIsFollowing?: boolean;
  onToggle?: (isFollowing: boolean) => void;
  size?: "sm" | "md";
}

const FollowButton: React.FC<FollowButtonProps> = ({
  targetUserId,
  initialIsFollowing = false,
  onToggle,
  size = "md",
}) => {
  const { user, session } = useAuth();
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!user || !session?.access_token) {
      router.push("/login");
      return;
    }

    if (user.id === targetUserId) return;

    // Optimistic update
    const newState = !isFollowing;
    setIsFollowing(newState);
    onToggle?.(newState);

    try {
      setIsLoading(true);
      const result = await toggleFollow(session.access_token, targetUserId);
      setIsFollowing(result.isFollowing);
      onToggle?.(result.isFollowing);
    } catch {
      // Revert on error
      setIsFollowing(!newState);
      onToggle?.(!newState);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show follow button for own profile
  if (user?.id === targetUserId) return null;

  const sizeClasses =
    size === "sm"
      ? "px-3 py-1.5 text-xs"
      : "px-5 py-2 text-sm";

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`${sizeClasses} rounded-full font-bold transition-all duration-200 disabled:opacity-50 ${
        isFollowing
          ? "bg-white border-2 border-slate-200 text-slate-700 hover:border-red-200 hover:text-red-600 hover:bg-red-50"
          : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200"
      }`}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
        </span>
      ) : isFollowing ? (
        "Following"
      ) : (
        "Follow"
      )}
    </button>
  );
};

export default FollowButton;
