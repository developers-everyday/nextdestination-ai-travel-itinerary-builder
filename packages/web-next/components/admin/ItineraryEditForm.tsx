"use client";

import { useState } from "react";
import {
  Save,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Trash2,
  Plus,
} from "lucide-react";

interface Activity {
  id?: string;
  time: string;
  activity: string;
  location: string;
  description: string;
  type?: string;
  coordinates?: [number, number];
}

interface Day {
  day: number;
  theme: string;
  activities: Activity[];
}

interface ItineraryMetadata {
  destination: string;
  days: Day[];
  tags?: string[];
  category?: string;
  image?: string;
  [key: string]: unknown;
}

interface ItineraryEditFormProps {
  metadata: ItineraryMetadata;
  onSave: (metadata: ItineraryMetadata) => Promise<void>;
  saving?: boolean;
}

export default function ItineraryEditForm({
  metadata: initialMetadata,
  onSave,
  saving,
}: ItineraryEditFormProps) {
  const [metadata, setMetadata] = useState<ItineraryMetadata>(initialMetadata);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([0]));

  const toggleDay = (idx: number) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const updateDestination = (value: string) => {
    setMetadata((prev) => ({ ...prev, destination: value }));
  };

  const updateDayTheme = (dayIdx: number, theme: string) => {
    setMetadata((prev) => {
      const days = [...prev.days];
      days[dayIdx] = { ...days[dayIdx], theme };
      return { ...prev, days };
    });
  };

  const updateActivity = (
    dayIdx: number,
    actIdx: number,
    field: keyof Activity,
    value: string
  ) => {
    setMetadata((prev) => {
      const days = [...prev.days];
      const activities = [...days[dayIdx].activities];
      activities[actIdx] = { ...activities[actIdx], [field]: value };
      days[dayIdx] = { ...days[dayIdx], activities };
      return { ...prev, days };
    });
  };

  const removeActivity = (dayIdx: number, actIdx: number) => {
    setMetadata((prev) => {
      const days = [...prev.days];
      const activities = days[dayIdx].activities.filter(
        (_, i) => i !== actIdx
      );
      days[dayIdx] = { ...days[dayIdx], activities };
      return { ...prev, days };
    });
  };

  const addActivity = (dayIdx: number) => {
    setMetadata((prev) => {
      const days = [...prev.days];
      const activities = [
        ...days[dayIdx].activities,
        {
          id: Math.random().toString(36).slice(2, 11),
          time: "Morning",
          activity: "",
          location: "",
          description: "",
          type: "activity" as const,
        },
      ];
      days[dayIdx] = { ...days[dayIdx], activities };
      return { ...prev, days };
    });
  };

  return (
    <div className="space-y-6">
      {/* Destination */}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Destination
        </label>
        <input
          type="text"
          value={metadata.destination}
          onChange={(e) => updateDestination(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Tags / Category */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Category
          </label>
          <input
            type="text"
            value={metadata.category || metadata.tags?.[0] || ""}
            onChange={(e) =>
              setMetadata((prev) => ({ ...prev, category: e.target.value }))
            }
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            value={(metadata.tags || []).join(", ")}
            onChange={(e) =>
              setMetadata((prev) => ({
                ...prev,
                tags: e.target.value.split(",").map((t) => t.trim()),
              }))
            }
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Days accordion */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-slate-700">
          Itinerary ({metadata.days?.length || 0} days)
        </h3>

        {metadata.days?.map((day, dayIdx) => (
          <div
            key={dayIdx}
            className="overflow-hidden rounded-lg border border-slate-200 bg-white"
          >
            {/* Day header */}
            <button
              onClick={() => toggleDay(dayIdx)}
              className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50"
            >
              <div className="flex items-center gap-2">
                {expandedDays.has(dayIdx) ? (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                )}
                <span className="text-sm font-medium text-slate-900">
                  Day {day.day}
                </span>
                <span className="text-sm text-slate-500">— {day.theme}</span>
              </div>
              <span className="text-xs text-slate-400">
                {day.activities?.length || 0} activities
              </span>
            </button>

            {/* Day content */}
            {expandedDays.has(dayIdx) && (
              <div className="border-t border-slate-100 p-4">
                {/* Theme */}
                <div className="mb-4">
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Theme
                  </label>
                  <input
                    type="text"
                    value={day.theme}
                    onChange={(e) => updateDayTheme(dayIdx, e.target.value)}
                    className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Activities */}
                <div className="space-y-3">
                  {day.activities?.map((act, actIdx) => (
                    <div
                      key={act.id || actIdx}
                      className="rounded-md border border-slate-100 bg-slate-50 p-3"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">
                          Activity {actIdx + 1}
                        </span>
                        <button
                          onClick={() => removeActivity(dayIdx, actIdx)}
                          className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="mb-0.5 block text-xs text-slate-500">
                            Time
                          </label>
                          <input
                            type="text"
                            value={act.time}
                            onChange={(e) =>
                              updateActivity(
                                dayIdx,
                                actIdx,
                                "time",
                                e.target.value
                              )
                            }
                            className="w-full rounded border border-slate-200 px-2 py-1 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="mb-0.5 block text-xs text-slate-500">
                            Activity
                          </label>
                          <input
                            type="text"
                            value={act.activity}
                            onChange={(e) =>
                              updateActivity(
                                dayIdx,
                                actIdx,
                                "activity",
                                e.target.value
                              )
                            }
                            className="w-full rounded border border-slate-200 px-2 py-1 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="mb-0.5 block text-xs text-slate-500">
                            Location
                          </label>
                          <input
                            type="text"
                            value={act.location}
                            onChange={(e) =>
                              updateActivity(
                                dayIdx,
                                actIdx,
                                "location",
                                e.target.value
                              )
                            }
                            className="w-full rounded border border-slate-200 px-2 py-1 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="mb-0.5 block text-xs text-slate-500">
                            Description
                          </label>
                          <textarea
                            value={act.description}
                            onChange={(e) =>
                              updateActivity(
                                dayIdx,
                                actIdx,
                                "description",
                                e.target.value
                              )
                            }
                            rows={2}
                            className="w-full rounded border border-slate-200 px-2 py-1 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => addActivity(dayIdx)}
                  className="mt-3 flex items-center gap-1 rounded-md border border-dashed border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-500 hover:border-indigo-400 hover:text-indigo-600"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Activity
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={() => onSave(metadata)}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
