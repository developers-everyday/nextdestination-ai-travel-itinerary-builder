"use client";

import { CheckCircle, XCircle, SkipForward } from "lucide-react";

export interface ProgressEvent {
  current?: number;
  total?: number;
  name?: string;
  id?: string;
  destination?: string;
  status?: "seeded" | "skipped" | "failed" | "completed";
  error?: string;
  done?: boolean;
  seeded?: number;
  completed?: number;
  failed?: number;
}

interface EnrichmentProgressProps {
  events: ProgressEvent[];
  label?: string;
}

export default function EnrichmentProgress({
  events,
  label = "Enrichment",
}: EnrichmentProgressProps) {
  const latest = events[events.length - 1];
  const isDone = latest?.done;
  const current = latest?.current || 0;
  const total = latest?.total || 0;
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between text-sm font-medium text-slate-700">
        <span>{label}</span>
        <span>
          {isDone
            ? "Complete"
            : `${current} / ${total}`}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-indigo-600 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Log */}
      <div className="max-h-48 space-y-1 overflow-y-auto text-xs">
        {events.filter(e => !e.done).map((e, i) => (
          <div key={i} className="flex items-center gap-2">
            {e.status === "seeded" || e.status === "completed" ? (
              <CheckCircle className="h-3.5 w-3.5 shrink-0 text-green-500" />
            ) : e.status === "skipped" ? (
              <SkipForward className="h-3.5 w-3.5 shrink-0 text-amber-500" />
            ) : (
              <XCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />
            )}
            <span className="text-slate-600">
              {e.name || e.destination || e.id} — {e.status}
              {e.error && <span className="text-red-500"> ({e.error})</span>}
            </span>
          </div>
        ))}
      </div>

      {isDone && (
        <div className="mt-3 rounded-md bg-slate-50 p-2 text-xs text-slate-600">
          Done! Succeeded: {latest.seeded ?? latest.completed ?? 0} | Failed:{" "}
          {latest.failed ?? 0}
        </div>
      )}
    </div>
  );
}
