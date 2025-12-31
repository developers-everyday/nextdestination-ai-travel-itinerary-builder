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
import FlightSearchPanel from './FlightSearchPanel';
import FlightDetailsPanel from './FlightDetailsPanel';
import HotelSearchPanel from './HotelSearchPanel';
import ActivitySearchPanel from './ActivitySearchPanel';
import HotelDetailsPanel from './HotelDetailsPanel';

interface Props {
  data: Itinerary;
  onBackToHome: () => void;
  onAddActivity: (dayIndex: number, initialData?: any) => void;
  onAddDay: () => void;
  onRemoveDay: (day: number) => void;
  onReorderActivity: (dayIndex: number, oldIndex: number, newIndex: number) => void;
  onRemoveActivity: (dayIndex: number, activityIndex: number) => void;
  onUpdateActivity: (dayIndex: number, activityIndex: number, data: any) => void;
  onRemoveArrivalFlight: () => void;
  onRemoveDepartureFlight: () => void;
  onRemoveHotel: (dayIndex: number) => void;
  onUpdateDay: (dayIndex: number, data: any) => void;
}

interface SortableItemProps {
  id: string;
  item: ItineraryItem;
  index: number;
  dayIndex: number;
  onRemove: (dayIndex: number, activityIndex: number) => void;
}

const SortableActivityItem = ({ id, item, index, dayIndex, onRemove, onUpdate }: SortableItemProps & { onUpdate: (dayIndex: number, activityIndex: number, data: any) => void }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const [isEditing, setIsEditing] = useState(item.activity === "");
  const [editTitle, setEditTitle] = useState(item.activity);
  const [editDesc, setEditDesc] = useState(item.description);
  const [editTime, setEditTime] = useState(item.time);

  // Search State
  const [searchValue, setSearchValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSave = () => {
    onUpdate(dayIndex, index, {
      activity: editTitle,
      description: editDesc,
      time: editTime
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(item.activity);
    setEditDesc(item.description);
    setEditTime(item.time);
    setIsEditing(false);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Mock suggestions based on input (or random if empty)
      const mockPlaces = [
        "Eiffel Tower, Paris",
        "Louvre Museum, Paris",
        "Notre-Dame Cathedral, Paris",
        "Arc de Triomphe, Paris",
        "Sacré-Cœur, Paris"
      ];
      // Filter if needed, or just show all for demo
      setSuggestions(mockPlaces);
      setShowSuggestions(true);
    }
  };

  const handleSelectSuggestion = (place: string) => {
    // Update the item description or adding it as location if we had a field. 
    // For now, let's append to description or just log it. 
    // Actually, updating the activity title might be what the user expects if it's empty, or description.
    // Let's append to description to show effect.
    const newDesc = editDesc ? `${editDesc} \nLocation: ${place}` : `Location: ${place}`;
    setEditDesc(newDesc);

    // Also likely want to save this update immediately or just rely on the user clicking save?
    // User is in "view" mode (not editing) usually when clicking this search icon (since it's parallel to Edit button).
    // So we should probably trigger an update immediately.
    onUpdate(dayIndex, index, {
      description: newDesc
    });

    setSearchValue("");
    setShowSuggestions(false);
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.3 : 1,
    position: 'relative' as 'relative',
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-4">
      <div className={`border rounded-xl p-5 bg-white transition-all group shadow-sm hover:shadow-md relative ${isEditing ? 'border-indigo-500 ring-4 ring-indigo-500/10' : 'border-slate-200 hover:border-indigo-300'}`}>

        {/* Delete Button (X) - Only show when not editing */}
        {!isEditing && (
          <button
            onClick={() => onRemove(dayIndex, index)}
            className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 z-20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2 w-full">

            {/* Drag Handle - Hide when editing */}
            {!isEditing && (
              <div {...listeners} {...attributes} className="cursor-grab touch-none text-slate-300 hover:text-indigo-600 mr-1 p-1 rounded hover:bg-slate-100 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M10 3a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM10 8.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM11.5 15.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}

            {isEditing ? (
              <div className="flex-1 flex gap-2">
                <input
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[10px] font-black text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded font-bold text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="Activity Name"
                  autoFocus
                />
              </div>
            ) : (
              <>
                <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-black text-slate-500">{item.time}</span>
                <h3 className="font-bold text-slate-800 text-sm max-w-[240px] truncate">{item.activity}</h3>
              </>
            )}
          </div>
        </div>

        {isEditing ? (
          <textarea
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-h-[60px] mb-3 ml-8"
            placeholder="Description"
          />
        ) : (
          <p className="text-xs text-slate-500 leading-relaxed mb-4 font-medium line-clamp-2 pl-8">{item.description}</p>
        )}

        <div className={`flex items-center justify-between ${isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
          <div className="flex items-center gap-2 relative">
            {/* Search Input Container */}
            <div className="flex items-center group/search bg-transparent hover:bg-slate-100 transition-all rounded-lg p-1 relative">
              <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={(e) => {
                  /* Ensure clicking icon focuses input if not already doing so */
                  const input = (e.currentTarget.nextElementSibling as HTMLInputElement);
                  input?.focus();
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400 group-hover/search:text-indigo-600 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <input
                type="text"
                placeholder="Find location..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="w-0 group-hover/search:w-40 focus:w-40 bg-transparent border-none outline-none text-xs text-slate-600 font-medium placeholder:text-slate-400 transition-all px-0 group-hover/search:px-2 focus:px-2"
                onKeyDown={handleSearchKeyDown}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} // Delay to allow click on suggestion
              />

              {/* Suggestions Dropdown */}
              {showSuggestions && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-[60] overflow-hidden">
                  {suggestions.map((place, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition-colors font-medium"
                      onClick={() => handleSelectSuggestion(place)}
                    >
                      {place}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button onClick={handleCancel} className="py-1 px-3 rounded-lg border border-slate-200 font-semibold text-slate-500 text-[10px] hover:bg-slate-50 transition-all">Cancel</button>
                <button onClick={handleSave} className="py-1 px-3 rounded-lg bg-indigo-600 font-semibold text-white text-[10px] hover:bg-indigo-700 transition-all shadow-sm">Save Changes</button>
              </>
            ) : (
              <>
                <button onClick={() => setIsEditing(true)} className="py-1 px-3 rounded-lg border border-slate-200 font-semibold text-slate-600 text-[10px] hover:bg-slate-50 transition-all">Edit</button>
                <button className="py-1 px-3 rounded-lg border border-slate-200 font-semibold text-slate-600 text-[10px] hover:bg-slate-50 transition-all">Map Pin</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ItineraryBuilder: React.FC<Props> = ({
  data,
  onBackToHome,
  onAddActivity,
  onAddDay,
  onRemoveDay,
  onReorderActivity,
  onRemoveActivity,
  onUpdateActivity,
  onRemoveArrivalFlight,
  onRemoveDepartureFlight,
  onRemoveHotel,
  onUpdateDay
}) => {
  // In Component Props
  const [activeDay, setActiveDay] = useState(1);
  const [rightPanelMode, setRightPanelMode] = useState<'MAP' | 'FLIGHT_SEARCH' | 'HOTEL_SEARCH' | 'ACTIVITY_SEARCH' | 'FLIGHT_DETAILS' | 'HOTEL_DETAILS'>('MAP');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [searchData, setSearchData] = useState<any>(null);

  // Inline Search State
  const [arrivalFrom, setArrivalFrom] = useState("");
  const [arrivalTo, setArrivalTo] = useState("");
  const [arrivalTravelers, setArrivalTravelers] = useState(1);
  const [arrivalDate, setArrivalDate] = useState("");
  const [departureFrom, setDepartureFrom] = useState("");
  const [departureTo, setDepartureTo] = useState("");
  const [departureTravelers, setDepartureTravelers] = useState(1);
  const [departureDate, setDepartureDate] = useState("");

  // Hotel Search State
  const [hotelLocation, setHotelLocation] = useState("");
  const [hotelCheckIn, setHotelCheckIn] = useState("");
  const [hotelCheckOut, setHotelCheckOut] = useState("");
  const [hotelGuests, setHotelGuests] = useState(1);

  const handleFlightSearch = (data: any) => {
    setSearchData(data);
    setRightPanelMode('FLIGHT_DETAILS');
  };

  const handleHotelSearch = (data: any) => {
    setSearchData(data);
    setRightPanelMode('HOTEL_DETAILS');
  };

  const handleSelectFlight = (flight: any) => {
    console.log("Selected flight:", flight);
    // Ideally update state here
    setRightPanelMode('MAP');
  };

  const handleSelectHotel = (hotel: any) => {
    console.log("Selected hotel:", hotel);
    // Ideally update state here
    setRightPanelMode('MAP');
  };

  const handleActivitySearch = (data: any) => {
    console.log("Searching activities:", data);
  };

  const handleAddActivityFromPanel = (activity: any) => {
    // activity object from panel: { id, text, type, duration, price, image }
    // Map to ItineraryItem format
    const newItem = {
      activity: activity.text,
      description: `Duration: ${activity.duration}, Price: ${activity.price}`,
      type: 'activity',
      time: '10:00' // Default time for suggestion
    };
    onAddActivity(safeDayIndex, newItem);
    // setRightPanelMode('MAP'); // Optional: keep open to add more?
  };

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

  const [mobileView, setMobileView] = useState<'LIST' | 'MAP'>('LIST');

  return (
    <div className="fixed inset-0 z-[60] bg-[#f8fafc] flex flex-col overflow-hidden animate-fade-in font-sans">
      {/* Top Header Bar */}
      <div className="h-14 bg-[#1e293b] flex items-center justify-between px-6 shrink-0 shadow-sm z-20 relative">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`hidden md:block text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700/50 rounded-lg ${!isSidebarOpen ? 'bg-slate-700/50 text-white' : ''}`}
            title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <button
            onClick={onBackToHome}
            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700/50 rounded-lg flex items-center gap-2 group"
            title="Back to Home"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            <span className="text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity -ml-2 group-hover:ml-0 duration-300 hidden md:inline">Home</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search / Planning"
              className="bg-[#2d3748] text-slate-200 text-sm font-medium pl-9 pr-4 py-1.5 rounded-lg border-none outline-none focus:ring-1 focus:ring-indigo-500 transition-all w-32 md:w-60 focus:w-40 md:focus:w-64"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden relative">
        {/* Sidebar Container */}
        {isSidebarOpen && (
          <>
            {/* Leftmost Sidebar Navigation - Responsive */}
            <div className={`
              bg-white border-r border-slate-200
              flex md:flex-col items-center
              shrink-0 overflow-auto scrollbar-hide
              order-1 md:order-none
              w-full h-14 border-b md:border-b-0 md:w-[72px] md:h-full md:py-6 gap-2 md:gap-4 px-4 md:px-0
              ${mobileView === 'MAP' ? 'hidden md:flex' : 'flex'}
            `}>
              {data.days.map((dayPlan, index) => (
                <div key={dayPlan.day} className="flex flex-col items-center group/day shrink-0">
                  <button
                    onClick={() => setActiveDay(dayPlan.day)}
                    className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all relative ${activeDay === dayPlan.day
                      ? 'bg-[#10b981] text-white shadow-md'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                  >
                    {dayPlan.day}
                  </button>
                </div>
              ))}
              <div className="md:mt-2 shrink-0">
                <button
                  onClick={onAddDay}
                  className="w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200"
                  title="Add Day"
                >
                  +
                </button>
              </div>
              <div className="ml-auto md:ml-0 md:mt-auto md:mb-2 shrink-0">
                <button className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 hover:bg-indigo-100 transition-all border border-indigo-100 relative group">
                  <span className="text-xl">🤖</span>
                  <div className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity hidden md:block">
                    AI Assistant
                  </div>
                </button>
              </div>
            </div>

            {/* Itinerary Column - Responsive Visibility */}
            <div className={`
              bg-white flex flex-col shrink-0 border-r border-slate-200
              w-full md:w-[420px] order-2 md:order-none
              ${mobileView === 'MAP' ? 'hidden md:flex' : 'flex'}
              flex-1 md:flex-none h-full overflow-hidden
            `}>
              <div className="px-6 py-5 flex items-center justify-between shrink-0">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 group/theme">
                      <h2 className="text-xl font-bold text-slate-800 tracking-tight whitespace-nowrap shrink-0">Day {currentDay.day}:</h2>
                      <input
                        type="text"
                        value={currentDay.theme}
                        onChange={(e) => onUpdateDay(safeDayIndex, { theme: e.target.value })}
                        className="text-xl font-bold text-slate-800 tracking-tight bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 outline-none transition-all flex-1 min-w-0 max-w-sm"
                      />
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-300 group-hover/theme:text-slate-400 opacity-0 group-hover/theme:opacity-100 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </div>
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
                  <span className="hidden sm:inline">✨</span> Magic Build
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-2 space-y-4 scrollbar-hide pb-24 md:pb-20">

                {/* Day 1: Arrival Flight Integration */}
                {activeDay === 1 && data.hasArrivalFlight !== false && (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 relative group mb-4 hover:shadow-md transition-shadow">
                    {/* Delete Button */}
                    <button
                      onClick={onRemoveArrivalFlight}
                      className="absolute top-3 right-3 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 z-10"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>

                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform rotate-45" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                        </svg>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">Flight</h4>
                    </div>

                    <div className="flex flex-col gap-3 mb-4">
                      {/* From */}
                      <div className="relative">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider absolute -top-1.5 left-2 bg-white px-1">From</label>
                        <input
                          type="text"
                          value={arrivalFrom}
                          onChange={(e) => setArrivalFrom(e.target.value)}
                          placeholder="Origin City or Airport"
                          className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:font-normal placeholder:text-slate-400"
                        />
                      </div>
                      {/* To */}
                      <div className="relative">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider absolute -top-1.5 left-2 bg-white px-1">To</label>
                        <input
                          type="text"
                          value={arrivalTo}
                          onChange={(e) => setArrivalTo(e.target.value)}
                          placeholder="Destination City or Airport"
                          className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:font-normal placeholder:text-slate-400"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {/* Pax */}
                        <div className="relative">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider absolute -top-1.5 left-2 bg-white px-1">Pax</label>
                          <input
                            type="number"
                            min="1"
                            value={arrivalTravelers}
                            onChange={(e) => setArrivalTravelers(parseInt(e.target.value))}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                          />
                        </div>
                        {/* Date */}
                        <div className="relative">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider absolute -top-1.5 left-2 bg-white px-1">Date</label>
                          <input
                            type="date"
                            value={arrivalDate}
                            onChange={(e) => setArrivalDate(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                          />
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleFlightSearch({ from: arrivalFrom, to: arrivalTo, passengers: arrivalTravelers, date: arrivalDate })}
                      className="w-full bg-[#eff6ff] hover:bg-blue-50 transition-colors rounded-lg py-2.5 text-center group/btn"
                    >
                      <span className="text-[#3b82f6] font-mono text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 group-hover/btn:scale-105 transition-transform">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Search Flights
                      </span>
                    </button>
                  </div>
                )}

                {/* Daily Hotel Integration (Airbnb Style) */}
                {currentDay.hasHotel !== false && (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 relative group mb-4 hover:shadow-md transition-shadow">
                    {/* Delete Button */}
                    <button
                      onClick={() => onRemoveHotel(safeDayIndex)}
                      className="absolute top-3 right-3 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 z-10"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>

                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-full bg-[#ff385c]/10 flex items-center justify-center text-[#ff385c]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                        </svg>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">Where to stay?</h4>
                    </div>

                    <div className="flex flex-col gap-3">
                      {/* Where */}
                      <div className="relative">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider absolute -top-1.5 left-2 bg-white px-1">Where</label>
                        <input
                          type="text"
                          placeholder="City, Hotel, etc."
                          value={hotelLocation}
                          onChange={(e) => setHotelLocation(e.target.value)}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-[#ff385c] focus:ring-1 focus:ring-[#ff385c] transition-all placeholder:font-normal placeholder:text-slate-400"
                        />
                      </div>

                      <div className="flex gap-3">
                        {/* When */}
                        <div className="relative flex-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider absolute -top-1.5 left-2 bg-white px-1">Check-in</label>
                          <input
                            type="date"
                            value={hotelCheckIn}
                            onChange={(e) => setHotelCheckIn(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-[#ff385c] focus:ring-1 focus:ring-[#ff385c] transition-all"
                          />
                        </div>
                        <div className="relative flex-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider absolute -top-1.5 left-2 bg-white px-1">Check-out</label>
                          <input
                            type="date"
                            value={hotelCheckOut}
                            onChange={(e) => setHotelCheckOut(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-[#ff385c] focus:ring-1 focus:ring-[#ff385c] transition-all"
                          />
                        </div>
                      </div>

                      {/* Who */}
                      <div className="relative">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider absolute -top-1.5 left-2 bg-white px-1">Who</label>
                        <input
                          type="number"
                          min="1"
                          value={hotelGuests}
                          onChange={(e) => setHotelGuests(parseInt(e.target.value))}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-[#ff385c] focus:ring-1 focus:ring-[#ff385c] transition-all"
                        />
                        <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium pointer-events-none">Guests</span>
                      </div>

                      <button
                        onClick={() => handleHotelSearch({ location: hotelLocation, checkIn: hotelCheckIn, checkOut: hotelCheckOut, guests: hotelGuests })}
                        className="w-full mt-2 bg-gradient-to-r from-[#ff385c] to-[#bd1e59] hover:from-[#d93250] hover:to-[#a0184a] text-white font-bold py-3 rounded-lg shadow-md shadow-rose-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Search Hotels
                      </button>
                    </div>
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
                        onUpdate={onUpdateActivity}
                      />
                    ))}
                  </SortableContext>
                </DndContext>

                {/* Last Day: Departure Flight Integration */}
                {activeDay === totalDays && data.hasDepartureFlight !== false && (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 relative group mt-8 hover:shadow-md transition-shadow">
                    {/* Delete Button */}
                    <button
                      onClick={onRemoveDepartureFlight}
                      className="absolute top-3 right-3 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 z-10"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>

                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform rotate-45" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                        </svg>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">Flight</h4>
                    </div>

                    <div className="flex flex-col gap-3 mb-4">
                      {/* From */}
                      <div className="relative">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider absolute -top-1.5 left-2 bg-white px-1">From</label>
                        <input
                          type="text"
                          value={departureFrom}
                          onChange={(e) => setDepartureFrom(e.target.value)}
                          placeholder="Origin City or Airport"
                          className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:font-normal placeholder:text-slate-400"
                        />
                      </div>
                      {/* To */}
                      <div className="relative">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider absolute -top-1.5 left-2 bg-white px-1">To</label>
                        <input
                          type="text"
                          value={departureTo}
                          onChange={(e) => setDepartureTo(e.target.value)}
                          placeholder="Destination City or Airport"
                          className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:font-normal placeholder:text-slate-400"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {/* Pax */}
                        <div className="relative">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider absolute -top-1.5 left-2 bg-white px-1">Pax</label>
                          <input
                            type="number"
                            min="1"
                            value={departureTravelers}
                            onChange={(e) => setDepartureTravelers(parseInt(e.target.value))}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                          />
                        </div>
                        {/* Date */}
                        <div className="relative">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider absolute -top-1.5 left-2 bg-white px-1">Date</label>
                          <input
                            type="date"
                            value={departureDate}
                            onChange={(e) => setDepartureDate(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                          />
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleFlightSearch({ from: departureFrom, to: departureTo, passengers: departureTravelers, date: departureDate })}
                      className="w-full bg-[#eff6ff] hover:bg-blue-50 transition-colors rounded-lg py-2.5 text-center group/btn"
                    >
                      <span className="text-[#3b82f6] font-mono text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 group-hover/btn:scale-105 transition-transform">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Search Flights
                      </span>
                    </button>
                  </div>
                )}


                {/* Manual Add Button */}
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => onAddActivity(safeDayIndex)}
                    className="flex-1 py-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-bold text-sm hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
                  >
                    + Add Manual Item
                  </button>
                  <button
                    onClick={() => setRightPanelMode('ACTIVITY_SEARCH')}
                    className="flex-1 py-4 bg-indigo-50 border-2 border-indigo-100 rounded-xl text-indigo-600 font-bold text-sm hover:bg-indigo-100 transition-all flex items-center justify-center gap-2"
                  >
                    ✨ Suggestions
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Right Panel Area: Map or Search - Responsive Visibility */}
        <div className={`
          bg-[#e2e8f0] relative flex-col
          ${mobileView === 'LIST' ? 'hidden md:flex' : 'flex'}
          flex-1 h-full overflow-hidden
        `}>
          {rightPanelMode === 'MAP' && (
            <>
              {/* Map Text Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <h1 className="text-7xl font-black text-slate-400/30 tracking-tight leading-none text-center uppercase">
                  Integrated Map View
                </h1>
              </div>

              {/* Search Box */}
              <div className="absolute top-6 left-8 right-8 z-20">
                <div className="bg-white/95 backdrop-blur-md p-1.5 rounded-xl shadow-xl shadow-slate-300/40 flex items-center gap-3 border border-slate-200">
                  <button
                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
                    onClick={() => console.log("Start voice search")}
                    title="Voice Search"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                    </svg>
                  </button>
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
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                  <span className="font-bold text-indigo-600 text-sm tracking-tight">Simulate Trip</span>
                </button>
              </div>
            </>
          )}

          {rightPanelMode === 'FLIGHT_SEARCH' && (
            <FlightSearchPanel
              onSearch={handleFlightSearch}
              onCancel={() => setRightPanelMode('MAP')}
            />
          )}

          {rightPanelMode === 'FLIGHT_DETAILS' && (
            <FlightDetailsPanel
              searchData={searchData}
              onBack={() => setRightPanelMode('MAP')}
              onSelect={handleSelectFlight}
            />
          )}

          {rightPanelMode === 'HOTEL_SEARCH' && (
            <HotelSearchPanel
              onSearch={handleHotelSearch}
              onCancel={() => setRightPanelMode('MAP')}
            />
          )}

          {rightPanelMode === 'ACTIVITY_SEARCH' && (
            <ActivitySearchPanel
              onSearch={handleActivitySearch}
              onCancel={() => setRightPanelMode('MAP')}
              onAddActivity={handleAddActivityFromPanel}
            />
          )}

          {rightPanelMode === 'HOTEL_DETAILS' && (
            <HotelDetailsPanel
              searchData={searchData}
              onBack={() => setRightPanelMode('HOTEL_SEARCH')}
              onSelect={handleSelectHotel}
            />
          )}
        </div>
      </div>

      {/* Mobile Toggle Button (FAB) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:hidden z-[70]">
        <button
          onClick={() => setMobileView(prev => prev === 'LIST' ? 'MAP' : 'LIST')}
          className="bg-[#1e293b] text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 font-bold text-sm hover:scale-105 transition-transform active:scale-95 border border-slate-600"
        >
          {mobileView === 'LIST' ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              View Map
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              View List
            </>
          )}
        </button>
      </div>

    </div >
  );
};

export default ItineraryBuilder;
