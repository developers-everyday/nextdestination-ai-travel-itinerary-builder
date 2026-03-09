"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "./AuthContext";

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
    />
  </svg>
);

interface Props {
  onOpenBuilder?: () => void;
}

const ROLE_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  agent:      { icon: "🏷️", label: "Agent",   color: "bg-amber-50 text-amber-700 border-amber-200" },
  influencer: { icon: "⭐", label: "Creator", color: "bg-purple-50 text-purple-700 border-purple-200" },
  explorer:   { icon: "",    label: "",        color: "" },
};

const PLAN_BADGE: Record<string, { icon: string; color: string }> = {
  custom:   { icon: "💎", color: "text-emerald-600" },
  explorer: { icon: "✨", color: "text-[#FF5A5A]" },
  starter:  { icon: "",   color: "" },
};

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Navbar: React.FC<Props> = ({ onOpenBuilder }) => {
  const { user, loading, userProfile } = useAuth();
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled]     = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [isIOS, setIsIOS]                 = useState(false);
  const [scrolled, setScrolled]           = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) setIsInstalled(true);
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const installedHandler = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };
    window.addEventListener("appinstalled", installedHandler);

    const scrollHandler = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", scrollHandler, { passive: true });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
      window.removeEventListener("scroll", scrollHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (isIOS) { setShowIOSPrompt(true); return; }
    if (installPrompt) {
      installPrompt.prompt();
      const result = await installPrompt.userChoice;
      if (result.outcome === "accepted") setIsInstalled(true);
      setInstallPrompt(null);
    }
  };

  const displayName   = userProfile?.displayName || user?.email?.split("@")[0] || "User";
  const avatarInitial = displayName.charAt(0).toUpperCase();
  const roleConfig    = userProfile ? ROLE_CONFIG[userProfile.role] : null;
  const planBadge     = userProfile ? PLAN_BADGE[userProfile.plan]  : null;
  const showInstallButton = !isInstalled && (isIOS || installPrompt);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-[0_1px_0_0_rgba(0,0,0,0.08)]"
          : "bg-white"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-[68px] flex items-center justify-between gap-4">

        {/* ── Logo ── */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0"
               style={{ background: "linear-gradient(135deg, #FF5A5A 0%, #FF8C00 100%)" }}>
            N
          </div>
          <span className="text-[1.1rem] font-bold tracking-tight text-[#1A1A1A] hidden sm:block">
            Next<span className="text-[#FF5A5A]">Destination</span>
            <span className="text-[#9C9891] font-medium">.ai</span>
          </span>
        </Link>

        {/* ── Centre Nav Links ── */}
        <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {[
            { href: "/community", label: "Community" },
            { href: "/creators",  label: "Creators"  },
            { href: "/blog",      label: "Blog"       },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="px-4 py-2 text-sm font-semibold text-[#6B6863] rounded-full hover:text-[#1A1A1A] hover:bg-[#F0EFED] transition-all duration-150"
            >
              {label}
            </Link>
          ))}
        </div>

        {/* ── Right Side ── */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          {showInstallButton && (
            <button
              onClick={handleInstall}
              className="hidden md:flex items-center gap-1.5 px-4 py-2 bg-[#FFF0F0] text-[#FF5A5A] rounded-full text-sm font-semibold hover:bg-[#FFE4E4] transition-colors"
            >
              <DownloadIcon className="w-4 h-4" />
              Install App
            </button>
          )}

          {loading ? (
            <div className="w-20 h-9 bg-[#F0EFED] rounded-full animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-3">
              {roleConfig?.label && (
                <span className={`hidden md:inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${roleConfig.color}`}>
                  {roleConfig.icon} {roleConfig.label}
                </span>
              )}
              <Link
                href="/profile"
                className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full hover:bg-[#F0EFED] transition-all group"
              >
                <div className="relative">
                  {userProfile?.avatarUrl ? (
                    <img
                      src={userProfile.avatarUrl}
                      alt={displayName}
                      className="w-8 h-8 rounded-full border-2 border-[#EEECE9] group-hover:border-[#FF5A5A]/30 transition-colors object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                         style={{ background: "linear-gradient(135deg, #FF5A5A 0%, #FF8C00 100%)" }}>
                      {avatarInitial}
                    </div>
                  )}
                  {planBadge?.icon && (
                    <span className={`absolute -bottom-0.5 -right-0.5 text-[10px] ${planBadge.color}`}>
                      {planBadge.icon}
                    </span>
                  )}
                </div>
                <span className="font-semibold text-[#1A1A1A] hidden md:inline max-w-[120px] truncate text-sm">
                  {displayName}
                </span>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-4 py-2 rounded-full font-semibold text-[#1A1A1A] hover:bg-[#F0EFED] text-sm transition-all whitespace-nowrap"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="btn-brand px-5 py-2 text-sm whitespace-nowrap"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── iOS Install Modal ── */}
      {showIOSPrompt && (
        <div
          className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 animate-fade-in"
          onClick={() => setShowIOSPrompt(false)}
        >
          <div
            className="bg-white rounded-t-3xl p-6 w-full max-w-md animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-[#EEECE9] rounded-full mx-auto mb-5" />
            <h3 className="text-lg font-bold text-[#1A1A1A] mb-3">Install NextDestination</h3>
            <p className="text-sm text-[#6B6863] mb-4">
              Add to your home screen for quick access and a native app experience.
            </p>
            <ol className="space-y-3 text-sm text-[#6B6863]">
              {[
                <>Tap the <strong className="text-[#1A1A1A]">Share</strong> button in Safari&apos;s toolbar</>,
                <>Scroll down and tap <strong className="text-[#1A1A1A]">&quot;Add to Home Screen&quot;</strong></>,
                <>Tap <strong className="text-[#1A1A1A]">Add</strong> to install</>,
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs text-white"
                        style={{ background: "linear-gradient(135deg, #FF5A5A, #FF8C00)" }}>
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <button
              onClick={() => setShowIOSPrompt(false)}
              className="btn-brand mt-6 w-full py-3 text-sm"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
