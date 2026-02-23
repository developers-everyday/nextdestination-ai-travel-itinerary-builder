"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import ItineraryEditForm from "@/components/admin/ItineraryEditForm";
import {
  ArrowLeft,
  Sparkles,
  Hash,
  Image,
  Globe,
  Lock,
  Trash2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";

interface ItineraryDetail {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  hasEmbedding: boolean;
  isPublic: boolean;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function AdminItineraryEditPage() {
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<ItineraryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const token = session?.access_token;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchItinerary = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/itineraries/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Not found");
      const detail = await res.json();
      setData(detail);
    } catch (err) {
      console.error("Fetch itinerary error:", err);
    } finally {
      setLoading(false);
    }
  }, [token, id]);

  useEffect(() => {
    fetchItinerary();
  }, [fetchItinerary]);

  const apiAction = async (
    url: string,
    method: string = "POST",
    body?: unknown
  ) => {
    if (!token) return;
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return res.json();
  };

  const handleSave = async (metadata: Record<string, unknown>) => {
    setSaving(true);
    try {
      await apiAction(`/api/admin/itineraries/${id}`, "PATCH", { metadata });
      showToast("Saved successfully");
      await fetchItinerary();
    } catch (err) {
      console.error("Save error:", err);
      showToast("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async () => {
    setProcessing("regenerate");
    try {
      await apiAction(`/api/admin/itineraries/${id}/regenerate`);
      showToast("AI content regenerated");
      await fetchItinerary();
    } catch (err) {
      console.error("Regenerate error:", err);
    } finally {
      setProcessing(null);
    }
  };

  const handleEmbedding = async () => {
    setProcessing("embedding");
    try {
      await apiAction(`/api/admin/itineraries/${id}/embedding`);
      showToast("Embedding generated");
      await fetchItinerary();
    } catch (err) {
      console.error("Embedding error:", err);
    } finally {
      setProcessing(null);
    }
  };

  const handleImage = async () => {
    setProcessing("image");
    try {
      const result = await apiAction(`/api/admin/itineraries/${id}/image`);
      showToast(result?.imageUrl ? "Image generated" : "Image generation failed");
      await fetchItinerary();
    } catch (err) {
      console.error("Image error:", err);
    } finally {
      setProcessing(null);
    }
  };

  const handleTogglePrivacy = async () => {
    if (!data) return;
    try {
      await apiAction(`/api/admin/itineraries/${id}/privacy`, "PATCH", {
        isPublic: !data.isPublic,
      });
      setData((prev) => (prev ? { ...prev, isPublic: !prev.isPublic } : prev));
      showToast(`Set to ${data.isPublic ? "private" : "public"}`);
    } catch (err) {
      console.error("Privacy toggle error:", err);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this itinerary permanently?")) return;
    try {
      await apiAction(`/api/admin/itineraries/${id}`, "DELETE");
      router.push("/admin/itineraries");
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-20 text-center text-slate-400">
        Itinerary not found.
      </div>
    );
  }

  const meta = data.metadata as {
    destination: string;
    days: {
      day: number;
      theme: string;
      activities: {
        id?: string;
        time: string;
        activity: string;
        location: string;
        description: string;
        type?: string;
        coordinates?: [number, number];
      }[];
    }[];
    tags?: string[];
    category?: string;
    image?: string;
  };

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className="fixed right-6 top-6 z-50 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-lg animate-fade-in">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/admin/itineraries"
          className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1
            className="text-2xl font-bold text-slate-900"
            style={{ fontFamily: "var(--font-jakarta), sans-serif" }}
          >
            {meta.destination || "Itinerary"}
          </h1>
          <p className="text-sm text-slate-500">
            {meta.days?.length || 0} days &middot; ID: {data.id.slice(0, 8)}...
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Edit form — spans 2 cols */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <ItineraryEditForm
              metadata={meta}
              onSave={handleSave}
              saving={saving}
            />
          </div>
        </div>

        {/* Sidebar — metadata panel */}
        <div className="space-y-4">
          {/* Status card */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3
              className="mb-3 text-sm font-semibold text-slate-900"
              style={{ fontFamily: "var(--font-jakarta), sans-serif" }}
            >
              Status
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Embedding</span>
                {data.hasEmbedding ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" /> Yes
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-500">
                    <XCircle className="h-4 w-4" /> Missing
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Image</span>
                {meta.image ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" /> Yes
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-500">
                    <XCircle className="h-4 w-4" /> Missing
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Privacy</span>
                {data.isPublic ? (
                  <span className="flex items-center gap-1 text-blue-600">
                    <Globe className="h-4 w-4" /> Public
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-slate-500">
                    <Lock className="h-4 w-4" /> Private
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Creator</span>
                <span className="text-slate-700">
                  {data.userId ? data.userId.slice(0, 8) + "..." : "anonymous"}
                </span>
              </div>
            </div>
          </div>

          {/* Image preview */}
          {meta.image && (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <img
                src={meta.image}
                alt="Itinerary"
                className="aspect-[3/4] w-full object-cover"
              />
            </div>
          )}

          {/* AI Actions */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3
              className="mb-3 text-sm font-semibold text-slate-900"
              style={{ fontFamily: "var(--font-jakarta), sans-serif" }}
            >
              AI Actions
            </h3>
            <div className="space-y-2">
              <button
                onClick={handleRegenerate}
                disabled={!!processing}
                className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4 text-purple-500" />
                {processing === "regenerate"
                  ? "Regenerating..."
                  : "Regenerate AI Content"}
              </button>
              <button
                onClick={handleEmbedding}
                disabled={!!processing}
                className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <Hash className="h-4 w-4 text-amber-500" />
                {processing === "embedding"
                  ? "Generating..."
                  : "Generate Embedding"}
              </button>
              <button
                onClick={handleImage}
                disabled={!!processing}
                className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <Image className="h-4 w-4 text-blue-500" />
                {processing === "image"
                  ? "Generating..."
                  : "Generate Image"}
              </button>
            </div>
          </div>

          {/* Privacy + Delete */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="space-y-2">
              <button
                onClick={handleTogglePrivacy}
                className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                {data.isPublic ? (
                  <>
                    <Lock className="h-4 w-4" /> Make Private
                  </>
                ) : (
                  <>
                    <Globe className="h-4 w-4" /> Make Public
                  </>
                )}
              </button>
              <button
                onClick={handleDelete}
                className="flex w-full items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete Itinerary
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
