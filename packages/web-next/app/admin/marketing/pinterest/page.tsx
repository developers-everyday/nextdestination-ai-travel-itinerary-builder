"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import Link from "next/link";
import EnrichmentProgress, {
  type ProgressEvent,
} from "@/components/admin/EnrichmentProgress";
import {
  ArrowLeft,
  CheckCircle,
  ExternalLink,
  Globe,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface Board {
  id: string;
  name: string;
  description: string;
  pinCount: number;
  imageUrl: string | null;
}

interface PinData {
  pinId: string;
  pinUrl: string;
  boardId: string;
  boardName: string;
  publishedAt: string;
}

interface Itinerary {
  id: string;
  destination: string;
  duration: number;
  category: string;
  hasImage: boolean;
  imageUrl: string | null;
  isPublic: boolean;
  pinterestPins: number;
}

export default function PinterestMarketingPage() {
  const { session } = useAuth();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");

  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoards, setSelectedBoards] = useState<Set<string>>(new Set());
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [selectedItineraries, setSelectedItineraries] = useState<Set<string>>(
    new Set()
  );
  const [loading, setLoading] = useState(true);
  const [boardsLoading, setBoardsLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<ProgressEvent[]>([]);
  const [publishedSection, setPublishedSection] = useState(false);
  const [unpinning, setUnpinning] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pinnedDetails, setPinnedDetails] = useState<
    Map<string, { destination: string; pins: PinData[] }>
  >(new Map());

  const token = session?.access_token;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchBoards = useCallback(async () => {
    if (!token) return;
    setBoardsLoading(true);
    try {
      const res = await fetch("/api/admin/pinterest/boards", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setBoards(await res.json());
      }
    } catch (err) {
      console.error("Fetch boards error:", err);
    } finally {
      setBoardsLoading(false);
    }
  }, [token]);

  const fetchItineraries = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/admin/itineraries", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data: Itinerary[] = await res.json();
      setItineraries(data);

      // Build pinned details by fetching detail for pinned itineraries
      const pinned = data.filter((i) => i.pinterestPins > 0);
      const details = new Map<
        string,
        { destination: string; pins: PinData[] }
      >();
      for (const itin of pinned) {
        try {
          const detailRes = await fetch(`/api/admin/itineraries/${itin.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (detailRes.ok) {
            const detail = await detailRes.json();
            if (detail.pinterest?.pins?.length) {
              details.set(itin.id, {
                destination: itin.destination,
                pins: detail.pinterest.pins,
              });
            }
          }
        } catch {
          /* skip */
        }
      }
      setPinnedDetails(details);

      // Auto-select highlighted itinerary
      if (highlightId) {
        setSelectedItineraries(new Set([highlightId]));
      }
    } catch (err) {
      console.error("Fetch itineraries error:", err);
    } finally {
      setLoading(false);
    }
  }, [token, highlightId]);

  useEffect(() => {
    fetchBoards();
    fetchItineraries();
  }, [fetchBoards, fetchItineraries]);

  // Filter to publishable itineraries (has image + public)
  const publishable = itineraries.filter((i) => i.hasImage && i.isPublic);
  const unpinned = publishable.filter((i) => i.pinterestPins === 0);

  const toggleBoard = (id: string) => {
    setSelectedBoards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleItinerary = (id: string) => {
    setSelectedItineraries((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllUnpinned = () => {
    setSelectedItineraries(new Set(unpinned.map((i) => i.id)));
  };

  const deselectAll = () => {
    setSelectedItineraries(new Set());
  };

  const handlePublish = async () => {
    if (!token || selectedBoards.size === 0 || selectedItineraries.size === 0)
      return;

    // If single itinerary, use direct endpoint
    if (selectedItineraries.size === 1) {
      setPublishing(true);
      const id = Array.from(selectedItineraries)[0];
      try {
        const res = await fetch(`/api/admin/itineraries/${id}/pinterest`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ boardIds: Array.from(selectedBoards) }),
        });
        const result = await res.json();
        if (result.success) {
          showToast(
            `Published ${result.pins.length} pin(s)${result.errors?.length ? ` (${result.errors.length} failed)` : ""}`
          );
        } else {
          showToast(`Error: ${result.error}`);
        }
        await fetchItineraries();
      } catch (err) {
        console.error("Publish error:", err);
        showToast("Publish failed");
      } finally {
        setPublishing(false);
        setSelectedItineraries(new Set());
      }
      return;
    }

    // Bulk publish via SSE
    setPublishing(true);
    setBulkProgress([]);

    try {
      const res = await fetch("/api/admin/itineraries/bulk-pinterest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ boardIds: Array.from(selectedBoards) }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const read = async (): Promise<void> => {
        const result = await reader?.read();
        if (!result || result.done) {
          setPublishing(false);
          fetchItineraries();
          return;
        }
        buffer += decoder.decode(result.value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event: ProgressEvent = JSON.parse(line.slice(6));
              setBulkProgress((prev) => [...prev, event]);
            } catch {
              /* skip */
            }
          }
        }
        return read();
      };
      await read();
    } catch (err) {
      console.error("Bulk publish error:", err);
      setPublishing(false);
    }
  };

  const handleUnpin = async (itineraryId: string, pinId: string) => {
    if (!token) return;
    if (!confirm("Remove this pin from Pinterest?")) return;

    setUnpinning(pinId);
    try {
      await fetch(
        `/api/admin/itineraries/${itineraryId}/pinterest/${pinId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      showToast("Pin removed");
      await fetchItineraries();
    } catch (err) {
      console.error("Unpin error:", err);
      showToast("Failed to remove pin");
    } finally {
      setUnpinning(null);
    }
  };

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className="fixed right-6 top-6 z-50 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/admin/marketing"
          className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1
            className="text-2xl font-bold text-slate-900"
            style={{ fontFamily: "var(--font-jakarta), sans-serif" }}
          >
            Pinterest
          </h1>
          <p className="text-sm text-slate-500">
            Publish itinerary infographics as pins to your boards.
          </p>
        </div>
      </div>

      {/* Section A — Boards */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
        <h2
          className="mb-3 text-sm font-semibold text-slate-900"
          style={{ fontFamily: "var(--font-jakarta), sans-serif" }}
        >
          Select Boards
        </h2>
        {boardsLoading ? (
          <div className="flex justify-center py-6">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
          </div>
        ) : boards.length === 0 ? (
          <p className="text-sm text-slate-400">
            No boards found. Create boards on Pinterest first.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {boards.map((board) => (
              <button
                key={board.id}
                onClick={() => toggleBoard(board.id)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  selectedBoards.has(board.id)
                    ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {board.name}
                <span className="ml-1.5 text-xs text-slate-400">
                  ({board.pinCount})
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Section B — Publish */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2
            className="text-sm font-semibold text-slate-900"
            style={{ fontFamily: "var(--font-jakarta), sans-serif" }}
          >
            Itineraries to Publish
          </h2>
          <div className="flex gap-2">
            <button
              onClick={selectAllUnpinned}
              className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Select All Unpinned
            </button>
            <button
              onClick={deselectAll}
              className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Deselect All
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
          </div>
        ) : publishable.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-400">
            No public itineraries with images available. Generate images and
            make itineraries public first.
          </p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {publishable.map((itin) => (
                <button
                  key={itin.id}
                  onClick={() => toggleItinerary(itin.id)}
                  className={`group relative overflow-hidden rounded-lg border text-left transition-all ${
                    selectedItineraries.has(itin.id)
                      ? "border-indigo-300 ring-2 ring-indigo-200"
                      : "border-slate-200 hover:border-slate-300"
                  } ${highlightId === itin.id ? "ring-2 ring-amber-300" : ""}`}
                >
                  {itin.imageUrl && (
                    <img
                      src={itin.imageUrl}
                      alt={itin.destination}
                      className="aspect-[3/4] w-full object-cover"
                    />
                  )}
                  <div className="p-2.5">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {itin.destination}
                    </p>
                    <p className="text-xs text-slate-500">
                      {itin.duration} days
                    </p>
                    {itin.pinterestPins > 0 && (
                      <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                        <CheckCircle className="h-3 w-3" />
                        Pinned ({itin.pinterestPins})
                      </span>
                    )}
                  </div>

                  {/* Selection indicator */}
                  {selectedItineraries.has(itin.id) && (
                    <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Publish button */}
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={handlePublish}
                disabled={
                  publishing ||
                  selectedBoards.size === 0 ||
                  selectedItineraries.size === 0
                }
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {publishing ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Globe className="h-4 w-4" />
                    Publish {selectedItineraries.size} to{" "}
                    {selectedBoards.size} Board
                    {selectedBoards.size !== 1 ? "s" : ""}
                  </>
                )}
              </button>
              {selectedBoards.size === 0 && (
                <p className="text-xs text-amber-600">
                  Select at least one board above
                </p>
              )}
            </div>
          </>
        )}

        {/* Bulk progress */}
        {bulkProgress.length > 0 && (
          <div className="mt-4">
            <EnrichmentProgress
              events={bulkProgress}
              label="Pinterest Bulk Publish"
            />
          </div>
        )}
      </div>

      {/* Section C — Published Pins */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <button
          onClick={() => setPublishedSection(!publishedSection)}
          className="flex w-full items-center justify-between p-5 text-left"
        >
          <h2
            className="text-sm font-semibold text-slate-900"
            style={{ fontFamily: "var(--font-jakarta), sans-serif" }}
          >
            Published Pins ({pinnedDetails.size} itineraries)
          </h2>
          {publishedSection ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </button>

        {publishedSection && (
          <div className="border-t border-slate-100 p-5">
            {pinnedDetails.size === 0 ? (
              <p className="text-sm text-slate-400">No pins published yet.</p>
            ) : (
              <div className="space-y-4">
                {Array.from(pinnedDetails.entries()).map(
                  ([itinId, { destination, pins }]) => (
                    <div
                      key={itinId}
                      className="rounded-lg border border-slate-100 p-3"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <Link
                          href={`/admin/itineraries/${itinId}`}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                        >
                          {destination}
                        </Link>
                        <span className="text-xs text-slate-400">
                          {pins.length} pin{pins.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {pins.map((pin) => (
                          <div
                            key={pin.pinId}
                            className="flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2 text-slate-600">
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium">
                                {pin.boardName}
                              </span>
                              <a
                                href={pin.pinUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-indigo-500 hover:text-indigo-600"
                              >
                                View Pin
                                <ExternalLink className="h-3 w-3" />
                              </a>
                              <span className="text-slate-400">
                                {new Date(
                                  pin.publishedAt
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            <button
                              onClick={() => handleUnpin(itinId, pin.pinId)}
                              disabled={unpinning === pin.pinId}
                              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-red-500 hover:bg-red-50 disabled:opacity-50"
                            >
                              <Trash2 className="h-3 w-3" />
                              {unpinning === pin.pinId
                                ? "Removing..."
                                : "Remove"}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
