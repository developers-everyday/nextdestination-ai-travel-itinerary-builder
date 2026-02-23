"use client";

import { useState } from "react";
import {
  CheckCircle,
  XCircle,
  MoreVertical,
  Sparkles,
  Trash2,
  Eye,
  Search,
} from "lucide-react";

export interface DestinationRow {
  id: string;
  name: string;
  hasGeneralInfo: boolean;
  hasAttractions: boolean;
  generalInfo: unknown;
  attractions: unknown;
  updatedAt: string;
}

interface DestinationsTableProps {
  data: DestinationRow[];
  onEnrich: (name: string) => void;
  onDelete: (id: string) => void;
  onView: (dest: DestinationRow) => void;
  enrichingName: string | null;
}

export default function DestinationsTable({
  data,
  onEnrich,
  onDelete,
  onView,
  enrichingName,
}: DestinationsTableProps) {
  const [search, setSearch] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const filtered = data.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search destinations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-4 py-3 font-medium text-slate-600">Name</th>
              <th className="px-4 py-3 font-medium text-slate-600">
                General Info
              </th>
              <th className="px-4 py-3 font-medium text-slate-600">
                Attractions
              </th>
              <th className="px-4 py-3 font-medium text-slate-600">
                Last Updated
              </th>
              <th className="px-4 py-3 font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((dest) => (
              <tr key={dest.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">
                  {dest.name}
                </td>
                <td className="px-4 py-3">
                  {dest.hasGeneralInfo ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                      <CheckCircle className="h-3 w-3" /> Yes
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                      <XCircle className="h-3 w-3" /> Missing
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {dest.hasAttractions ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                      <CheckCircle className="h-3 w-3" /> Yes
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                      <XCircle className="h-3 w-3" /> Missing
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {dest.updatedAt
                    ? new Date(dest.updatedAt).toLocaleDateString()
                    : "—"}
                </td>
                <td className="relative px-4 py-3">
                  <button
                    onClick={() =>
                      setOpenMenu(openMenu === dest.id ? null : dest.id)
                    }
                    className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>

                  {openMenu === dest.id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpenMenu(null)}
                      />
                      <div className="absolute right-4 top-10 z-20 w-40 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                        <button
                          onClick={() => {
                            setOpenMenu(null);
                            onView(dest);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <Eye className="h-4 w-4" />
                          View Data
                        </button>
                        <button
                          onClick={() => {
                            setOpenMenu(null);
                            onEnrich(dest.name);
                          }}
                          disabled={enrichingName === dest.name}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          <Sparkles className="h-4 w-4" />
                          {enrichingName === dest.name
                            ? "Enriching..."
                            : "Re-enrich"}
                        </button>
                        <button
                          onClick={() => {
                            setOpenMenu(null);
                            onDelete(dest.id);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-slate-400"
                >
                  No destinations found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
