"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  Unplug,
  Shield,
  ShieldAlert,
  ShieldOff,
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

interface ConnectionStatus {
  connected: boolean;
  source: "oauth" | "env" | null;
  hasWriteAccess: boolean;
  accountName: string | null;
  scopes: string[];
  tokenExpired: boolean;
  tokenExpiresAt: string | null;
  connectedAt: string | null;
}

export default function PinterestMarketingPage() {
  const { session } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const highlightId = searchParams.get("highlight");
  const oauthResult = searchParams.get("oauth");
  const oauthReason = searchParams.get("reason");

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
  const [connection, setConnection] = useState<ConnectionStatus | null>(null);
  const [connectionLoading, setConnectionLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const token = session?.access_token;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const fetchConnection = useCallback(async () => {
    if (!token) return;
    setConnectionLoading(true);
    try {
      const res = await fetch("/api/admin/pinterest/connection", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setConnection(await res.json());
      }
    } catch (err) {
      console.error("Connection status error:", err);
    } finally {
      setConnectionLoading(false);
    }
  }, [token]);

  // Handle OAuth result from query params
  useEffect(() => {
    if (oauthResult) {
      if (oauthResult === "success") {
        showToast("Pinterest connected with write access!");
        fetchConnection();
      } else if (oauthResult === "error") {
        const reasons: Record<string, string> = {
          denied: "Authorization was denied on Pinterest",
          missing_params: "Missing parameters in callback",
          invalid_state: "Invalid or expired session — please try again",
          exchange_failed: "Token exchange failed — check server logs",
        };
        showToast(reasons[oauthReason || ""] || "Pinterest connection failed");
      }
      router.replace("/admin/marketing/pinterest", { scroll: false });
    }
  }, [oauthResult, oauthReason, router, fetchConnection]);

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
    fetchConnection();
    fetchBoards();
    fetchItineraries();
  }, [fetchConnection, fetchBoards, fetchItineraries]);

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

  const handleConnect = async () => {
    if (!token) return;
    setConnecting(true);
    try {
      const res = await fetch("/api/admin/pinterest/oauth/start", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to get OAuth URL");
      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      console.error("Connect error:", err);
      showToast("Failed to start Pinterest connection");
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!token) return;
    if (!confirm("Disconnect Pinterest OAuth? You'll revert to read-only env token access.")) return;
    setDisconnecting(true);
    try {
      const res = await fetch("/api/admin/pinterest/disconnect", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showToast("Pinterest disconnected");
        await fetchConnection();
      } else {
        showToast("Failed to disconnect");
      }
    } catch (err) {
      console.error("Disconnect error:", err);
      showToast("Failed to disconnect");
    } finally {
      setDisconnecting(false);
    }
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

  const canPublish = connection?.hasWriteAccess ?? false;

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

      {/* Connection Status Banner */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
        <h2
          className="mb-3 text-sm font-semibold text-slate-900"
          style={{ fontFamily: "var(--font-jakarta), sans-serif" }}
        >
          Connection
        </h2>
        {connectionLoading ? (
          <div className="flex justify-center py-4">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
          </div>
        ) : connection?.connected && connection.source === "oauth" ? (
          /* Connected via OAuth — full write access */
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-50">
                <Shield className="h-4.5 w-4.5 text-green-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900">
                    {connection.accountName || "Pinterest Account"}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                    <CheckCircle className="h-3 w-3" />
                    Write Access
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Connected via OAuth
                  {connection.connectedAt &&
                    ` on ${new Date(connection.connectedAt).toLocaleDateString()}`}
                </p>
              </div>
            </div>
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              <Unplug className="h-3.5 w-3.5" />
              {disconnecting ? "Disconnecting..." : "Disconnect"}
            </button>
          </div>
        ) : connection?.connected && connection.source === "env" ? (
          /* Connected via env token — read only */
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-50">
                <ShieldAlert className="h-4.5 w-4.5 text-amber-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900">
                    Environment Token
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                    Read Only
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Can read boards but cannot publish pins. Connect via OAuth for
                  write access.
                </p>
              </div>
            </div>
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {connecting ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Connecting...
                </>
              ) : (
                "Upgrade to Write Access"
              )}
            </button>
          </div>
        ) : (
          /* Not connected */
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
                <ShieldOff className="h-4.5 w-4.5 text-slate-400" />
              </div>
              <div>
                <span className="text-sm font-medium text-slate-900">
                  Not Connected
                </span>
                <p className="text-xs text-slate-500">
                  Connect your Pinterest account to start publishing pins.
                </p>
              </div>
            </div>
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {connecting ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Connecting...
                </>
              ) : (
                "Connect Pinterest"
              )}
            </button>
          </div>
        )}
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

        {!canPublish && connection && !connectionLoading && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
            Publishing requires write access. Connect your Pinterest account via OAuth above to enable pin creation.
          </div>
        )}

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
                  !canPublish ||
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
              {!canPublish && selectedItineraries.size > 0 && selectedBoards.size > 0 && (
                <p className="text-xs text-amber-600">
                  Write access required — connect via OAuth above
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
