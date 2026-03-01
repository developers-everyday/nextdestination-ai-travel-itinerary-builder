"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthContext";
import Link from "next/link";
import {
  Megaphone,
  ArrowRight,
  CheckCircle,
  XCircle,
  Instagram,
  Twitter,
} from "lucide-react";

interface PinterestStatus {
  configured: boolean;
  pinCount: number;
  hasWriteAccess: boolean;
  source: "oauth" | "env" | null;
}

export default function MarketingHubPage() {
  const { session } = useAuth();
  const [pinterestStatus, setPinterestStatus] =
    useState<PinterestStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const token = session?.access_token;

  const fetchStatus = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/admin/pinterest/status", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setPinterestStatus(await res.json());
      }
    } catch (err) {
      console.error("Pinterest status error:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return (
    <div>
      <div className="mb-6">
        <h1
          className="text-2xl font-bold text-slate-900"
          style={{ fontFamily: "var(--font-jakarta), sans-serif" }}
        >
          Marketing Tools
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Publish and manage your itineraries across social platforms.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Pinterest card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
              <svg
                className="h-5 w-5 text-red-600"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3
                className="text-sm font-semibold text-slate-900"
                style={{ fontFamily: "var(--font-jakarta), sans-serif" }}
              >
                Pinterest
              </h3>
              <p className="text-xs text-slate-500">
                Publish infographic pins
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-4">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
            </div>
          ) : (
            <div className="mb-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Status</span>
                {pinterestStatus?.configured ? (
                  <div className="flex items-center gap-1.5">
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-3.5 w-3.5" /> Connected
                    </span>
                    {pinterestStatus.hasWriteAccess ? (
                      <span className="rounded-full bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-700">
                        Write
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                        Read Only
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="flex items-center gap-1 text-red-500">
                    <XCircle className="h-3.5 w-3.5" /> Not configured
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Total Pins</span>
                <span className="font-medium text-slate-700">
                  {pinterestStatus?.pinCount || 0}
                </span>
              </div>
            </div>
          )}

          <Link
            href="/admin/marketing/pinterest"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            {pinterestStatus?.configured ? "Manage Pins" : "Connect Pinterest"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Instagram — Coming Soon */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 opacity-60">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-50">
              <Instagram className="h-5 w-5 text-pink-600" />
            </div>
            <div className="flex-1">
              <h3
                className="text-sm font-semibold text-slate-900"
                style={{ fontFamily: "var(--font-jakarta), sans-serif" }}
              >
                Instagram
              </h3>
              <p className="text-xs text-slate-500">
                Auto-post infographics
              </p>
            </div>
          </div>
          <div className="mb-4 rounded-lg bg-slate-50 py-4 text-center text-xs font-medium text-slate-400">
            Coming Soon
          </div>
          <button
            disabled
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-400 cursor-not-allowed"
          >
            Configure
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Twitter/X — Coming Soon */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 opacity-60">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50">
              <Twitter className="h-5 w-5 text-sky-600" />
            </div>
            <div className="flex-1">
              <h3
                className="text-sm font-semibold text-slate-900"
                style={{ fontFamily: "var(--font-jakarta), sans-serif" }}
              >
                Twitter / X
              </h3>
              <p className="text-xs text-slate-500">
                Share with OG previews
              </p>
            </div>
          </div>
          <div className="mb-4 rounded-lg bg-slate-50 py-4 text-center text-xs font-medium text-slate-400">
            Coming Soon
          </div>
          <button
            disabled
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-400 cursor-not-allowed"
          >
            Configure
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
