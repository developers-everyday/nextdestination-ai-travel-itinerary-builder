"use client";

import { useState } from "react";
import { X, Plus, Sparkles } from "lucide-react";

interface AddDestinationsDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (names: string[], enrich: boolean) => void;
  loading?: boolean;
}

export default function AddDestinationsDialog({
  open,
  onClose,
  onAdd,
  loading,
}: AddDestinationsDialogProps) {
  const [text, setText] = useState("");

  if (!open) return null;

  const handleSubmit = (enrich: boolean) => {
    const names = text
      .split(/[,\n]/)
      .map((n) => n.trim())
      .filter(Boolean);
    if (names.length === 0) return;
    onAdd(names, enrich);
    setText("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3
            className="text-lg font-semibold text-slate-900"
            style={{ fontFamily: "var(--font-jakarta), sans-serif" }}
          >
            Add Destinations
          </h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-3 text-sm text-slate-500">
          Enter destination names separated by commas or new lines.
        </p>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder={"Paris, France\nTokyo, Japan\nBali, Indonesia"}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={() => handleSubmit(false)}
            disabled={loading || !text.trim()}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add Only
          </button>
          <button
            onClick={() => handleSubmit(true)}
            disabled={loading || !text.trim()}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            Add & Enrich
          </button>
        </div>
      </div>
    </div>
  );
}
