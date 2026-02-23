"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthContext";
import DestinationsTable, {
  type DestinationRow,
} from "@/components/admin/DestinationsTable";
import AddDestinationsDialog from "@/components/admin/AddDestinationsDialog";
import EnrichmentProgress, {
  type ProgressEvent,
} from "@/components/admin/EnrichmentProgress";
import {
  MapPin,
  CheckCircle,
  XCircle,
  Plus,
  Sparkles,
  X,
} from "lucide-react";

export default function AdminDestinationsPage() {
  const { session } = useAuth();
  const [destinations, setDestinations] = useState<DestinationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [enrichingName, setEnrichingName] = useState<string | null>(null);
  const [bulkProgress, setBulkProgress] = useState<ProgressEvent[]>([]);
  const [isBulkRunning, setIsBulkRunning] = useState(false);
  const [viewDest, setViewDest] = useState<DestinationRow | null>(null);

  const token = session?.access_token;

  const fetchDestinations = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/admin/destinations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setDestinations(data);
    } catch (err) {
      console.error("Fetch destinations error:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDestinations();
  }, [fetchDestinations]);

  const handleAdd = async (names: string[], enrich: boolean) => {
    if (!token) return;
    setAddLoading(true);
    try {
      // First add them
      await fetch("/api/admin/destinations/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ names }),
      });

      setAddDialogOpen(false);

      if (enrich) {
        // Trigger bulk enrichment
        startBulkEnrichment(names);
      }

      await fetchDestinations();
    } catch (err) {
      console.error("Add destinations error:", err);
    } finally {
      setAddLoading(false);
    }
  };

  const handleEnrich = async (name: string) => {
    if (!token) return;
    setEnrichingName(name);
    try {
      await fetch("/api/admin/destinations/enrich", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });
      await fetchDestinations();
    } catch (err) {
      console.error("Enrich error:", err);
    } finally {
      setEnrichingName(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token || !confirm("Delete this destination?")) return;
    try {
      await fetch(`/api/admin/destinations/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setDestinations((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const startBulkEnrichment = (names: string[]) => {
    if (!token) return;
    setIsBulkRunning(true);
    setBulkProgress([]);

    fetch("/api/admin/destinations/enrich-bulk", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ names }),
    }).then((res) => {
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const read = (): Promise<void> | undefined => {
        return reader?.read().then(({ done, value }) => {
          if (done) {
            setIsBulkRunning(false);
            fetchDestinations();
            return;
          }
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const event: ProgressEvent = JSON.parse(line.slice(6));
                setBulkProgress((prev) => [...prev, event]);
              } catch {}
            }
          }
          return read();
        });
      };
      read();
    });
  };

  const handleEnrichAllMissing = () => {
    const missing = destinations
      .filter((d) => !d.hasGeneralInfo || !d.hasAttractions)
      .map((d) => d.name);
    if (missing.length === 0) return alert("All destinations are enriched!");
    startBulkEnrichment(missing);
  };

  // Stats
  const total = destinations.length;
  const enriched = destinations.filter((d) => d.hasGeneralInfo).length;
  const missingInfo = total - enriched;
  const missingAttractions = destinations.filter(
    (d) => !d.hasAttractions
  ).length;

  return (
    <div>
      <div className="mb-6">
        <h1
          className="text-2xl font-bold text-slate-900"
          style={{ fontFamily: "var(--font-jakarta), sans-serif" }}
        >
          Destinations
        </h1>
        <p className="text-sm text-slate-500">
          Manage and enrich destination data with AI-generated content.
        </p>
      </div>

      {/* Stats bar */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: "Total",
            value: total,
            icon: MapPin,
            color: "text-indigo-600 bg-indigo-50",
          },
          {
            label: "Enriched",
            value: enriched,
            icon: CheckCircle,
            color: "text-green-600 bg-green-50",
          },
          {
            label: "Missing Info",
            value: missingInfo,
            icon: XCircle,
            color: "text-red-600 bg-red-50",
          },
          {
            label: "Missing Attractions",
            value: missingAttractions,
            icon: XCircle,
            color: "text-amber-600 bg-amber-50",
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

      {/* Actions bar */}
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={() => setAddDialogOpen(true)}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <Plus className="h-4 w-4" />
          Add Destinations
        </button>
        <button
          onClick={handleEnrichAllMissing}
          disabled={isBulkRunning}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" />
          {isBulkRunning ? "Enriching..." : "Enrich All Missing"}
        </button>
      </div>

      {/* Bulk progress */}
      {bulkProgress.length > 0 && (
        <div className="mb-6">
          <EnrichmentProgress
            events={bulkProgress}
            label="Bulk Enrichment"
          />
        </div>
      )}

      {/* Data table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
        </div>
      ) : (
        <DestinationsTable
          data={destinations}
          onEnrich={handleEnrich}
          onDelete={handleDelete}
          onView={setViewDest}
          enrichingName={enrichingName}
        />
      )}

      {/* Add Dialog */}
      <AddDestinationsDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onAdd={handleAdd}
        loading={addLoading}
      />

      {/* View Dialog */}
      {viewDest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="max-h-[80vh] w-full max-w-2xl overflow-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3
                className="text-lg font-semibold text-slate-900"
                style={{ fontFamily: "var(--font-jakarta), sans-serif" }}
              >
                {viewDest.name}
              </h3>
              <button
                onClick={() => setViewDest(null)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {viewDest.hasGeneralInfo && (
              <div className="mb-4">
                <h4 className="mb-2 text-sm font-medium text-slate-700">
                  General Info
                </h4>
                <pre className="max-h-60 overflow-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
                  {JSON.stringify(viewDest.generalInfo, null, 2)}
                </pre>
              </div>
            )}

            {viewDest.hasAttractions && (
              <div>
                <h4 className="mb-2 text-sm font-medium text-slate-700">
                  Attractions
                </h4>
                <pre className="max-h-60 overflow-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
                  {JSON.stringify(viewDest.attractions, null, 2)}
                </pre>
              </div>
            )}

            {!viewDest.hasGeneralInfo && !viewDest.hasAttractions && (
              <p className="text-sm text-slate-400">
                No enrichment data yet. Click &quot;Re-enrich&quot; to generate.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
