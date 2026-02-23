"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthContext";
import Link from "next/link";
import {
  MapPin,
  Route,
  CheckCircle,
  XCircle,
  Globe,
  Lock,
  Hash,
  Image,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface Stats {
  destinations: {
    total: number;
    enriched: number;
    missingInfo: number;
    missingAttractions: number;
  };
  itineraries: {
    total: number;
    public: number;
    private: number;
    withEmbeddings: number;
    missingEmbeddings: number;
    withImages: number;
    missingImages: number;
  };
}

export default function AdminOverviewPage() {
  const { session } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const token = session?.access_token;

  const fetchStats = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Stats fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="py-20 text-center text-slate-400">
        Failed to load dashboard stats.
      </div>
    );
  }

  const cards = [
    {
      section: "Destinations",
      icon: MapPin,
      href: "/admin/destinations",
      items: [
        {
          label: "Total",
          value: stats.destinations.total,
          icon: MapPin,
          color: "text-indigo-600 bg-indigo-50",
        },
        {
          label: "Enriched",
          value: stats.destinations.enriched,
          icon: CheckCircle,
          color: "text-green-600 bg-green-50",
        },
        {
          label: "Missing Info",
          value: stats.destinations.missingInfo,
          icon: XCircle,
          color: "text-red-600 bg-red-50",
        },
        {
          label: "Missing Attractions",
          value: stats.destinations.missingAttractions,
          icon: XCircle,
          color: "text-amber-600 bg-amber-50",
        },
      ],
    },
    {
      section: "Itineraries",
      icon: Route,
      href: "/admin/itineraries",
      items: [
        {
          label: "Total",
          value: stats.itineraries.total,
          icon: Route,
          color: "text-indigo-600 bg-indigo-50",
        },
        {
          label: "Public",
          value: stats.itineraries.public,
          icon: Globe,
          color: "text-blue-600 bg-blue-50",
        },
        {
          label: "Private",
          value: stats.itineraries.private,
          icon: Lock,
          color: "text-slate-600 bg-slate-100",
        },
        {
          label: "Missing Embeddings",
          value: stats.itineraries.missingEmbeddings,
          icon: Hash,
          color: "text-amber-600 bg-amber-50",
        },
        {
          label: "Missing Images",
          value: stats.itineraries.missingImages,
          icon: Image,
          color: "text-red-600 bg-red-50",
        },
      ],
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1
          className="text-2xl font-bold text-slate-900"
          style={{ fontFamily: "var(--font-jakarta), sans-serif" }}
        >
          Admin Dashboard
        </h1>
        <p className="text-sm text-slate-500">
          Overview of destination and itinerary enrichment status.
        </p>
      </div>

      {/* Stats sections */}
      {cards.map(({ section, icon: SectionIcon, href, items }) => (
        <div key={section} className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SectionIcon className="h-5 w-5 text-slate-400" />
              <h2
                className="text-lg font-semibold text-slate-900"
                style={{ fontFamily: "var(--font-jakarta), sans-serif" }}
              >
                {section}
              </h2>
            </div>
            <Link
              href={href}
              className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Manage <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            {items.map(({ label, value, icon: Icon, color }) => (
              <div
                key={label}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{value}</p>
                    <p className="text-xs text-slate-500">{label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Quick actions */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3
          className="mb-4 text-lg font-semibold text-slate-900"
          style={{ fontFamily: "var(--font-jakarta), sans-serif" }}
        >
          Quick Actions
        </h3>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/destinations"
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Sparkles className="h-4 w-4" />
            Manage Destinations
          </Link>
          <Link
            href="/admin/itineraries"
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Route className="h-4 w-4" />
            Manage Itineraries
          </Link>
        </div>
      </div>
    </div>
  );
}
