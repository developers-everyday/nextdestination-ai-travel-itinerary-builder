"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthContext";
import ItinerariesTable, {
  type ItineraryRow,
} from "@/components/admin/ItinerariesTable";
import EnrichmentProgress, {
  type ProgressEvent,
} from "@/components/admin/EnrichmentProgress";
import {
  Route,
  Globe,
  Lock,
  Hash,
  Image,
} from "lucide-react";

export default function AdminItinerariesPage() {
  const { session } = useAuth();
  const [itineraries, setItineraries] = useState<ItineraryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [bulkEmbeddingProgress, setBulkEmbeddingProgress] = useState<
    ProgressEvent[]
  >([]);
  const [bulkImageProgress, setBulkImageProgress] = useState<ProgressEvent[]>(
    []
  );
  const [isBulkEmbedding, setIsBulkEmbedding] = useState(false);
  const [isBulkImage, setIsBulkImage] = useState(false);

  const token = session?.access_token;

  const fetchItineraries = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/admin/itineraries", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setItineraries(data);
    } catch (err) {
      console.error("Fetch itineraries error:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchItineraries();
  }, [fetchItineraries]);

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

  const handleRegenerate = async (id: string) => {
    setProcessingId(id);
    try {
      await apiAction(`/api/admin/itineraries/${id}/regenerate`);
      await fetchItineraries();
    } catch (err) {
      console.error("Regenerate error:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleGenerateEmbedding = async (id: string) => {
    setProcessingId(id);
    try {
      await apiAction(`/api/admin/itineraries/${id}/embedding`);
      await fetchItineraries();
    } catch (err) {
      console.error("Embedding error:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleGenerateImage = async (id: string) => {
    setProcessingId(id);
    try {
      await apiAction(`/api/admin/itineraries/${id}/image`);
      await fetchItineraries();
    } catch (err) {
      console.error("Image error:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleTogglePrivacy = async (id: string, isPublic: boolean) => {
    try {
      await apiAction(`/api/admin/itineraries/${id}/privacy`, "PATCH", {
        isPublic,
      });
      setItineraries((prev) =>
        prev.map((i) => (i.id === id ? { ...i, isPublic } : i))
      );
    } catch (err) {
      console.error("Privacy toggle error:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this itinerary? This cannot be undone.")) return;
    try {
      await apiAction(`/api/admin/itineraries/${id}`, "DELETE");
      setItineraries((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const startBulkSSE = (
    url: string,
    setProgress: React.Dispatch<React.SetStateAction<ProgressEvent[]>>,
    setRunning: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    if (!token) return;
    setRunning(true);
    setProgress([]);

    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }).then((res) => {
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const read = (): Promise<void> | undefined => {
        return reader?.read().then(({ done, value }) => {
          if (done) {
            setRunning(false);
            fetchItineraries();
            return;
          }
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const event: ProgressEvent = JSON.parse(line.slice(6));
                setProgress((prev) => [...prev, event]);
              } catch {}
            }
          }
          return read();
        });
      };
      read();
    });
  };

  // Stats
  const total = itineraries.length;
  const publicCount = itineraries.filter((i) => i.isPublic).length;
  const privateCount = total - publicCount;
  const missingEmbed = itineraries.filter((i) => !i.hasEmbedding).length;
  const missingImg = itineraries.filter((i) => !i.hasImage).length;

  return (
    <div>
      <div className="mb-6">
        <h1
          className="text-2xl font-bold text-slate-900"
          style={{ fontFamily: "var(--font-jakarta), sans-serif" }}
        >
          Itineraries
        </h1>
        <p className="text-sm text-slate-500">
          Manage itineraries, generate AI content, embeddings, and images.
        </p>
      </div>

      {/* Stats bar */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[
          {
            label: "Total",
            value: total,
            icon: Route,
            color: "text-indigo-600 bg-indigo-50",
          },
          {
            label: "Public",
            value: publicCount,
            icon: Globe,
            color: "text-blue-600 bg-blue-50",
          },
          {
            label: "Private",
            value: privateCount,
            icon: Lock,
            color: "text-slate-600 bg-slate-100",
          },
          {
            label: "Missing Embeddings",
            value: missingEmbed,
            icon: Hash,
            color: "text-amber-600 bg-amber-50",
          },
          {
            label: "Missing Images",
            value: missingImg,
            icon: Image,
            color: "text-red-600 bg-red-50",
          },
        ].map(({ label, value, icon: Icon, color }) => (
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

      {/* Bulk actions */}
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={() =>
            startBulkSSE(
              "/api/admin/itineraries/bulk-embeddings",
              setBulkEmbeddingProgress,
              setIsBulkEmbedding
            )
          }
          disabled={isBulkEmbedding}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
        >
          <Hash className="h-4 w-4" />
          {isBulkEmbedding ? "Generating..." : "Generate Missing Embeddings"}
        </button>
        <button
          onClick={() =>
            startBulkSSE(
              "/api/admin/itineraries/bulk-images",
              setBulkImageProgress,
              setIsBulkImage
            )
          }
          disabled={isBulkImage}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
        >
          <Image className="h-4 w-4" />
          {isBulkImage ? "Generating..." : "Generate Missing Images"}
        </button>
      </div>

      {/* Bulk progress */}
      {bulkEmbeddingProgress.length > 0 && (
        <div className="mb-4">
          <EnrichmentProgress
            events={bulkEmbeddingProgress}
            label="Bulk Embeddings"
          />
        </div>
      )}
      {bulkImageProgress.length > 0 && (
        <div className="mb-4">
          <EnrichmentProgress
            events={bulkImageProgress}
            label="Bulk Images"
          />
        </div>
      )}

      {/* Data table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
        </div>
      ) : (
        <ItinerariesTable
          data={itineraries}
          onGenerateEmbedding={handleGenerateEmbedding}
          onGenerateImage={handleGenerateImage}
          onTogglePrivacy={handleTogglePrivacy}
          onDelete={handleDelete}
          onRegenerate={handleRegenerate}
          processingId={processingId}
        />
      )}
    </div>
  );
}
