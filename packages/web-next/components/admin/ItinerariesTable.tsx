"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle,
  XCircle,
  MoreVertical,
  Eye,
  Sparkles,
  Image,
  Hash,
  Globe,
  Lock,
  Trash2,
  Search,
} from "lucide-react";

export interface ItineraryRow {
  id: string;
  destination: string;
  duration: number;
  category: string;
  creator: string;
  hasEmbedding: boolean;
  hasImage: boolean;
  isPublic: boolean;
  createdAt?: string;
}

interface ItinerariesTableProps {
  data: ItineraryRow[];
  onGenerateEmbedding: (id: string) => void;
  onGenerateImage: (id: string) => void;
  onTogglePrivacy: (id: string, isPublic: boolean) => void;
  onDelete: (id: string) => void;
  onRegenerate: (id: string) => void;
  processingId: string | null;
}

export default function ItinerariesTable({
  data,
  onGenerateEmbedding,
  onGenerateImage,
  onTogglePrivacy,
  onDelete,
  onRegenerate,
  processingId,
}: ItinerariesTableProps) {
  const [search, setSearch] = useState("");
  const [filterPublic, setFilterPublic] = useState<string>("all");
  const [filterMissing, setFilterMissing] = useState<string>("all");
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  let filtered = data.filter((i) =>
    i.destination.toLowerCase().includes(search.toLowerCase())
  );

  if (filterPublic === "public") filtered = filtered.filter((i) => i.isPublic);
  if (filterPublic === "private")
    filtered = filtered.filter((i) => !i.isPublic);

  if (filterMissing === "embeddings")
    filtered = filtered.filter((i) => !i.hasEmbedding);
  if (filterMissing === "images")
    filtered = filtered.filter((i) => !i.hasImage);

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by destination..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <select
          value={filterPublic}
          onChange={(e) => setFilterPublic(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
        >
          <option value="all">All Privacy</option>
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>
        <select
          value={filterMissing}
          onChange={(e) => setFilterMissing(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
        >
          <option value="all">All Data</option>
          <option value="embeddings">Missing Embeddings</option>
          <option value="images">Missing Images</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-600">
                  Destination
                </th>
                <th className="px-4 py-3 font-medium text-slate-600">Days</th>
                <th className="px-4 py-3 font-medium text-slate-600">
                  Category
                </th>
                <th className="px-4 py-3 font-medium text-slate-600">
                  Embedding
                </th>
                <th className="px-4 py-3 font-medium text-slate-600">Image</th>
                <th className="px-4 py-3 font-medium text-slate-600">
                  Privacy
                </th>
                <th className="px-4 py-3 font-medium text-slate-600">
                  Created
                </th>
                <th className="px-4 py-3 font-medium text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((itin) => (
                <tr key={itin.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {itin.destination}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{itin.duration}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {itin.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {itin.hasEmbedding ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {itin.hasImage ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {itin.isPublic ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        <Globe className="h-3 w-3" /> Public
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        <Lock className="h-3 w-3" /> Private
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {itin.createdAt
                      ? new Date(itin.createdAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="relative px-4 py-3">
                    <button
                      onClick={() =>
                        setOpenMenu(openMenu === itin.id ? null : itin.id)
                      }
                      className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {openMenu === itin.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setOpenMenu(null)}
                        />
                        <div className="absolute right-4 top-10 z-20 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                          <Link
                            href={`/admin/itineraries/${itin.id}`}
                            onClick={() => setOpenMenu(null)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <Eye className="h-4 w-4" />
                            View / Edit
                          </Link>
                          <button
                            onClick={() => {
                              setOpenMenu(null);
                              onRegenerate(itin.id);
                            }}
                            disabled={processingId === itin.id}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                          >
                            <Sparkles className="h-4 w-4" />
                            Regenerate AI
                          </button>
                          <button
                            onClick={() => {
                              setOpenMenu(null);
                              onGenerateEmbedding(itin.id);
                            }}
                            disabled={processingId === itin.id}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                          >
                            <Hash className="h-4 w-4" />
                            Gen Embedding
                          </button>
                          <button
                            onClick={() => {
                              setOpenMenu(null);
                              onGenerateImage(itin.id);
                            }}
                            disabled={processingId === itin.id}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                          >
                            <Image className="h-4 w-4" />
                            Gen Image
                          </button>
                          <button
                            onClick={() => {
                              setOpenMenu(null);
                              onTogglePrivacy(itin.id, !itin.isPublic);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            {itin.isPublic ? (
                              <Lock className="h-4 w-4" />
                            ) : (
                              <Globe className="h-4 w-4" />
                            )}
                            {itin.isPublic ? "Make Private" : "Make Public"}
                          </button>
                          <div className="my-1 border-t border-slate-100" />
                          <button
                            onClick={() => {
                              setOpenMenu(null);
                              onDelete(itin.id);
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
                    colSpan={8}
                    className="px-4 py-8 text-center text-slate-400"
                  >
                    No itineraries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
