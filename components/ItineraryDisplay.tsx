import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Itinerary, ItineraryItem } from '../types';

interface Props {
  data: Itinerary;
  onAddDay: () => void;
  onRemoveDay: (day: number) => void;
  onReorderActivity: (dayIndex: number, oldIndex: number, newIndex: number) => void;
  onRemoveActivity: (dayIndex: number, activityIndex: number) => void;
  onRemoveArrivalFlight: () => void;
  onRemoveDepartureFlight: () => void;
  onRemoveHotel: (dayIndex: number) => void;
}

interface SortableItemProps {
  id: string;
  item: ItineraryItem;
  index: number;
  dayIndex: number;
  onRemove: (dayIndex: number, activityIndex: number) => void;
}

const SortableActivityItem = ({ id, item, index, dayIndex, onRemove }: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.3 : 1,
    position: 'relative' as 'relative',
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-4">
      <div className="border border-slate-200 rounded-xl p-5 bg-white hover:border-indigo-300 transition-all group shadow-sm hover:shadow-md relative">
        {/* Delete Button (X) */}
        <button
          onClick={() => onRemove(dayIndex, index)}
          className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 z-20"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">

            {/* Drag Handle */}
            <div {...listeners} {...attributes} className="cursor-grab touch-none text-slate-300 hover:text-indigo-600 mr-1 p-1 rounded hover:bg-slate-100 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M10 3a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM10 8.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM11.5 15.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" clipRule="evenodd" />
              </svg>
            </div>

            <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-black text-slate-500">{item.time}</span>
            <h3 className="font-bold text-slate-800 text-sm max-w-[240px] truncate">{item.activity}</h3>
          </div>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed mb-4 font-medium line-clamp-2 pl-8">{item.description}</p>

        <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity pl-8">
          <div className="flex items-center gap-2">
            {/* Extra controls placeholer */}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button className="py-1 px-3 rounded-lg border border-slate-200 font-semibold text-slate-600 text-[10px] hover:bg-slate-50 transition-all">Edit</button>
            <button className="py-1 px-3 rounded-lg border border-slate-200 font-semibold text-slate-600 text-[10px] hover:bg-slate-50 transition-all">Map Pin</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ItineraryBuilder: React.FC<Props> = ({
  data,
  onAddDay,
  onRemoveDay,
  onReorderActivity,
  onRemoveActivity,
  onRemoveArrivalFlight,
  onRemoveDepartureFlight,
  onRemoveHotel
}) => {
  const [activeDay, setActiveDay] = useState(1);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Helper to get current day's data
  const currentDayIndex = data.days.findIndex(d => d.day === activeDay);
  // Fallback if activeDay is out of sync (e.g. deleted)
  const safeDayIndex = currentDayIndex >= 0 ? currentDayIndex : 0;
  const currentDay = data.days[safeDayIndex] || data.days[0];
  const totalDays = data.days.length;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      if (!currentDay) return;

      const oldIndex = currentDay.activities.findIndex((item, idx) => (item.id || `item-${idx}`) === active.id);
      const newIndex = currentDay.activities.findIndex((item, idx) => (item.id || `item-${idx}`) === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        onReorderActivity(safeDayIndex, oldIndex, newIndex);
      }
    }
  };

  // Handle day selection safety when deleting
  React.useEffect(() => {
    if (activeDay > totalDays && totalDays > 0) {
      setActiveDay(totalDays);
    }
  }, [totalDays, activeDay]);

  if (!currentDay) return null; // Edge case safety

  // Ensure unique IDs
  const activityIds = currentDay.activities.map((item, idx) => item.id || `item-${idx}`);

  return (
    <div className="fixed inset-0 z-[60] bg-[#f8fafc] flex flex-col overflow-hidden animate-fade-in font-sans">
      {/* Top Header Bar */}
      <div className="h-14 bg-[#1e293b] flex items-center justify-end px-6 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search / Start Planning"
              className="bg-[#2d3748] text-slate-200 text-sm font-medium pl-9 pr-4 py-1.5 rounded-lg border-none outline-none focus:ring-1 focus:ring-indigo-500 transition-all w-60"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Leftmost Sidebar Navigation */}
        <div className="w-[72px] bg-white border-r border-slate-200 flex flex-col items-center py-6 gap-4 shrink-0 overflow-y-auto scrollbar-hide">
          {data.days.map((dayPlan, index) => (
            <div key={dayPlan.day} className="flex flex-col items-center group/day">
              <button
                onClick={() => setActiveDay(dayPlan.day)}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all relative ${activeDay === dayPlan.day
                  ? 'bg-[#10b981] text-white shadow-md'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
              >
                {dayPlan.day}
              </button>
            </div>
          ))}
          <div className="mt-2">
            <button
              onClick={onAddDay}
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200"
              title="Add Day"
            >
              +
            </button>
          </div>
          <div className="mt-auto mb-2">
            <button className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 hover:bg-indigo-100 transition-all border border-indigo-100 relative group">
              <span className="text-xl">🤖</span>
              <div className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                AI Assistant
              </div>
            </button>
          </div>
        </div>

        {/* Itinerary Column */}
        <div className="w-[420px] bg-white flex flex-col shrink-0 border-r border-slate-200">
          <div className="px-6 py-5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Day {currentDay.day}: {currentDay.theme}</h2>
                {totalDays > 1 && (
                  <button
                    onClick={() => onRemoveDay(currentDay.day)}
                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                    title="Remove this day"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">{data.destination}</p>
            </div>
            <button className="bg-[#4f46e5] hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95">
              <span>✨</span> Magic Build
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-2 space-y-4 scrollbar-hide pb-20">

            {/* Day 1: Arrival Flight Integration */}
            {activeDay === 1 && data.hasArrivalFlight !== false && (
              <div className="border-2 border-dashed border-[#4f46e5]/40 rounded-xl p-5 bg-white relative animate-fade-in-up group mb-4">
                {/* Delete Button */}
                <button
                  onClick={onRemoveArrivalFlight}
                  className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 z-10"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="flex justify-between mb-3">
                  <div className="h-4 w-24 bg-slate-100 rounded" />
                  <div className="h-4 w-14 bg-slate-100 rounded" />
                </div>
                <div className="h-4 w-40 bg-slate-100 rounded mb-6" />
                <div className="bg-[#eff6ff] rounded-lg py-2.5 text-center">
                  <span className="text-[#3b82f6] font-mono text-[11px] font-bold uppercase tracking-wider">Flight Arrival</span>
                </div>
              </div>
            )}

            {/* Daily Hotel Integration (Start of Day) */}
            {currentDay.hasHotel !== false && (
              <div className="border-2 border-dashed border-orange-200 rounded-xl p-4 bg-orange-50/50 relative group mb-4">
                {/* Delete Button */}
                <button
                  onClick={() => onRemoveHotel(safeDayIndex)}
                  className="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 z-10"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h-5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Hotel Integration</h4>
                    <p className="text-[10px] text-slate-500 font-semibold"> Check-in / Baggage Drop</p>
                  </div>
                </div>
                <button className="w-full py-1.5 rounded-lg border border-orange-200 font-bold text-orange-600 text-[10px] hover:bg-orange-100 transition-all bg-white">
                  View Booking Details
                </button>
              </div>
            )}

            {/* AI Generated Activities (Drag & Drop Context) */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={activityIds}
                strategy={verticalListSortingStrategy}
              >
                {currentDay.activities.map((item, idx) => (
                  <SortableActivityItem
                    key={item.id || `item-${idx}`}
                    id={item.id || `item-${idx}`}
                    item={item}
                    index={idx}
                    dayIndex={safeDayIndex}
                    onRemove={onRemoveActivity}
                  />
                ))}
              </SortableContext>
            </DndContext>

            {/* Last Day: Departure Flight Integration */}
            {activeDay === totalDays && data.hasDepartureFlight !== false && (
              <div className="border-2 border-dashed border-[#4f46e5]/40 rounded-xl p-5 bg-white relative animate-fade-in-up mt-8 group">
                {/* Delete Button */}
                <button
                  onClick={onRemoveDepartureFlight}
                  className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 z-10"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="flex justify-between mb-3">
                  <div className="h-4 w-24 bg-slate-100 rounded" />
                  <div className="h-4 w-14 bg-slate-100 rounded" />
                </div>
                <div className="h-4 w-40 bg-slate-100 rounded mb-6" />
                <div className="bg-[#eff6ff] rounded-lg py-2.5 text-center">
                  <span className="text-[#3b82f6] font-mono text-[11px] font-bold uppercase tracking-wider">Flight Departure</span>
                </div>
              </div>
            )}

            {/* Manual Add Button */}
            <button className="w-full py-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-bold text-sm hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center justify-center gap-2 mt-4">
              + Add Manual Item
            </button>
          </div>
        </div>

        {/* Map View Area */}
        <div className="flex-1 bg-[#e2e8f0] relative overflow-hidden">
          {/* Map Text Overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <h1 className="text-7xl font-black text-slate-400/30 tracking-tight leading-none text-center uppercase">
              Integrated Map View
            </h1>
          </div>

          {/* Search Box */}
          <div className="absolute top-6 left-8 right-8 z-20">
            <div className="bg-white/95 backdrop-blur-md p-1.5 rounded-xl shadow-xl shadow-slate-300/40 flex items-center gap-3 border border-slate-200">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <div className="w-5 h-5 bg-slate-300 rounded-sm" />
              </div>
              <input
                type="text"
                placeholder="Search places..."
                className="flex-1 bg-transparent border-none outline-none px-2 text-base font-medium text-slate-700 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Bottom Toolbar & Action */}
          <div className="absolute bottom-6 right-6 flex flex-col items-end gap-3 z-20">
            {/* Mini Toolbar */}
            <div className="bg-[#1e293b] w-10 h-28 rounded-2xl flex flex-col items-center justify-between py-3 shadow-xl">
              <button className="text-slate-400 hover:text-white flex flex-col gap-0.5">
                <div className="w-1 h-1 bg-current rounded-full" />
                <div className="w-1 h-1 bg-current rounded-full" />
              </button>
              <button className="text-slate-400 hover:text-white transition-colors">✨</button>
              <button className="text-slate-400 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
            </div>

            {/* Smart Pack CTA */}
            <button className="bg-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-2 border border-slate-200 group hover:shadow-indigo-100 transition-all active:scale-95">
              <span className="text-lg">✨</span>
              <span className="font-bold text-indigo-600 text-sm tracking-tight">Smart Pack</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItineraryBuilder;
