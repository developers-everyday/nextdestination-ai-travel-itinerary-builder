import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MapComponent from './Map';
import { useItineraryStore } from '../store/useItineraryStore';
import { useAuth } from './AuthContext';
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
import { saveItinerary } from '../services/localStorageService';
import FlightSearchPanel from './FlightSearchPanel';
import FlightDetailsPanel from './FlightDetailsPanel';

import ActivitySearchPanel from './ActivitySearchPanel';
import HotelDetailsPanel from './HotelDetailsPanel';
import { saveItineraryToBackend } from '../services/itineraryService';

interface Props {
  data: Itinerary;
  onBackToHome: () => void;
  onAddActivity: (dayIndex: number, activity: any, index?: number) => void;
  onAddDay: () => void;
  onRemoveDay: (day: number) => void;
  onReorderActivity: (dayIndex: number, oldIndex: number, newIndex: number) => void;
  onRemoveActivity: (dayIndex: number, activityIndex: number) => void;
  onUpdateActivity: (dayIndex: number, activityIndex: number, data: any) => void;
  onRemoveArrivalFlight: () => void;
  onRemoveDepartureFlight: () => void;
  onRemoveHotel: (dayIndex: number) => void;
  onUpdateDay: (dayIndex: number, data: any) => void;
  onItineraryChange?: (itinerary: Itinerary) => void;
}

interface SortableItemProps {
  id: string;
  item: ItineraryItem;
  index: number;
  dayIndex: number;
  onRemove: (dayIndex: number, activityIndex: number) => void;
  isScriptLoaded: boolean;
  searchBounds?: google.maps.LatLngBounds | null;
  onFocusMap: (coords: [number, number]) => void;
}

const SortableActivityItem = ({ id, item, index, dayIndex, onRemove, onUpdate, isScriptLoaded, searchBounds, onFocusMap }: SortableItemProps & { onUpdate: (dayIndex: number, activityIndex: number, data: any) => void }) => {
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
  const [editCoordinates, setEditCoordinates] = useState<[number, number] | undefined>(item.coordinates);
  const [editLocation, setEditLocation] = useState(item.location);

  // Search State
  const [searchValue, setSearchValue] = useState("");
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [autocompleteService, setAutocompleteService] = useState<google.maps.places.AutocompleteService | null>(null);
  const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null);

  React.useEffect(() => {
    if (isScriptLoaded && !autocompleteService && window.google) {
      setAutocompleteService(new window.google.maps.places.AutocompleteService());
      // Create a dummy element for PlacesService as it requires a map or HTMLDivElement
      const dummyElement = document.createElement('div');
      setPlacesService(new window.google.maps.places.PlacesService(dummyElement));
    }
  }, [isScriptLoaded, autocompleteService]);

  React.useEffect(() => {
    if (!searchValue || !autocompleteService) {
      setSuggestions([]);
      return;
    }

    if (searchValue.length > 2) {
      const timer = setTimeout(() => {
        const request: google.maps.places.AutocompletionRequest = {
          input: searchValue,
        };

        if (searchBounds) {
          request.locationRestriction = searchBounds;
        }

        autocompleteService.getPlacePredictions(
          request,
          (predictions, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
              setSuggestions(predictions);
              setShowSuggestions(true);
            } else {
              setSuggestions([]);
            }
          }
        );
      }, 300); // Debounce
      return () => clearTimeout(timer);
    }
  }, [searchValue, autocompleteService, searchBounds]);

  const handleSave = () => {
    onUpdate(dayIndex, index, {
      activity: editTitle,
      description: editDesc,
      time: editTime,
      coordinates: editCoordinates,
      location: editLocation
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(item.activity);
    setEditDesc(item.description);
    setEditTime(item.time);
    setEditCoordinates(item.coordinates);
    setEditLocation(item.location);
    setIsEditing(false);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Only handle enter if we have suggestions? Or maybe just let the user type?
    // Using Autocomplete, Enter usually selects the first suggestion or just the text.
    // implementation handled by click for now.
  };

  const handleSelectSuggestion = (place: google.maps.places.AutocompletePrediction) => {
    // We update description with the place description
    const newDesc = editDesc ? `${editDesc} \nLocation: ${place.description}` : `Location: ${place.description}`;
    setEditDesc(newDesc);

    // Optionally update title if empty
    if (!editTitle) {
      setEditTitle(place.structured_formatting.main_text);
    }

    // Default update without coordinates first
    const updates: any = {
      description: newDesc,
      activity: editTitle || place.structured_formatting.main_text
    };

    // Fetch details to get coordinates using PlacesService
    if (placesService && place.place_id) {
      placesService.getDetails({
        placeId: place.place_id,
        fields: ['geometry', 'formatted_address']
      }, (placeDetails, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && placeDetails?.geometry?.location) {
          const coords: [number, number] = [
            placeDetails.geometry.location.lng(),
            placeDetails.geometry.location.lat()
          ];
          const loc = placeDetails.formatted_address || updates.location;

          setEditCoordinates(coords);
          setEditLocation(loc);

          // We don't call onUpdate here for everything, just local state until save.
          // However, if we want immediate map feedback while editing?
          // For now, let's keep local state as the source of truth for the edit form.
        }
      });
    }

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
      <div
        onClick={(e) => {
          if (!isEditing && item.coordinates) {
            onFocusMap(item.coordinates);
          }
        }}
        className={`border rounded-xl p-5 bg-white transition-all group shadow-sm hover:shadow-md relative ${isEditing ? 'border-indigo-500 ring-4 ring-indigo-500/10' : 'border-slate-200 hover:border-indigo-300'} ${!isEditing && item.coordinates ? 'cursor-pointer hover:bg-slate-50' : ''}`}
      >

        {/* Delete Button (X) - Only show when not editing */}
        {!isEditing && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(dayIndex, index);
            }}
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
                  placeholder={item.type === 'flight' ? "Flight No. / Route" : item.type === 'hotel' ? "Hotel Name" : "Activity Name"}
                  autoFocus
                />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 max-w-[240px]">
                  {item.type === 'flight' && (
                    <span className="p-1 rounded bg-blue-50 text-blue-500 shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 transform rotate-45" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                      </svg>
                    </span>
                  )}
                  {item.type === 'hotel' && (
                    <span className="p-1 rounded bg-rose-50 text-rose-500 shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                      </svg>
                    </span>
                  )}
                  <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-black text-slate-500 shrink-0">{item.time}</span>
                  <h3 className="font-bold text-slate-800 text-sm truncate">{item.activity}</h3>
                </div>
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
                placeholder={searchBounds ? "Search Local..." : "Search..."}
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
                      key={place.place_id || idx}
                      className="px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition-colors font-medium border-b border-slate-50 last:border-none"
                      onClick={() => handleSelectSuggestion(place)}
                    >
                      <div className="font-bold">{place.structured_formatting.main_text}</div>
                      <div className="text-[10px] text-slate-400 truncate">{place.structured_formatting.secondary_text}</div>
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
                <button onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }} className="py-1 px-3 rounded-lg border border-slate-200 font-semibold text-slate-600 text-[10px] hover:bg-slate-50 transition-all">Edit</button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    item.coordinates && onFocusMap(item.coordinates);
                  }}
                  disabled={!item.coordinates}
                  className={`py-1 px-3 rounded-lg border border-slate-200 font-semibold text-[10px] transition-all flex items-center gap-1 ${item.coordinates ? 'text-indigo-600 bg-indigo-50 border-indigo-200 hover:bg-indigo-100' : 'text-slate-400 cursor-not-allowed'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {item.coordinates ? 'Show on Map' : 'No Location'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ItineraryBuilder: React.FC<Props & { isScriptLoaded: boolean }> = ({
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
  onUpdateDay,
  onItineraryChange,
  isScriptLoaded
}) => {
  const navigate = useNavigate();
  // In Component Props
  const { user } = useAuth();
  const [activeDay, setActiveDay] = useState(1);
  const [leftPanelMode, setLeftPanelMode] = useState<'LIST' | 'Map'>('LIST');
  const [rightPanelMode, setRightPanelMode] = useState<'MAP' | 'FLIGHT_SEARCH' | 'ACTIVITY_SEARCH' | 'FLIGHT_DETAILS' | 'HOTEL_DETAILS'>('ACTIVITY_SEARCH');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  // useJsApiLoader removed - passed from parent
  const isLoaded = isScriptLoaded;

  const { setFocusedLocation, focusedLocation } = useItineraryStore(); // Use global store for map focus

  const handleFocusMap = (coords: [number, number]) => {
    setFocusedLocation(coords);

    // Only switch to MAP mode if we aren't in a mode that already displays the map nicely (like ACTIVITY_SEARCH)
    // The user wants to keep the "Search Activities" panel intact when clicking "Show on Map"
    if (rightPanelMode !== 'ACTIVITY_SEARCH') {
      setRightPanelMode('MAP');
    }

    if (window.innerWidth < 768) {
      setMobileView('MAP');
    }
  };

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [shareStatus, setShareStatus] = useState<'idle' | 'sharing' | 'shared' | 'error'>('idle');
  const [searchBounds, setSearchBounds] = useState<google.maps.LatLngBounds | null>(null);
  const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  // Initialize PlacesService for ItineraryBuilder
  React.useEffect(() => {
    if (isScriptLoaded && window.google && !placesService) {
      const dummy = document.createElement('div');
      setPlacesService(new window.google.maps.places.PlacesService(dummy));
    }
  }, [isScriptLoaded, placesService]);

  // Geocode destination for bounds (using PlacesService fallback)
  React.useEffect(() => {
    if (placesService && data.destination && window.google) {
      const request = {
        query: data.destination,
        fields: ['geometry']
      };

      placesService.findPlaceFromQuery(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
          if (results[0].geometry?.viewport) {
            setSearchBounds(results[0].geometry.viewport);
            setFocusedLocation([results[0].geometry.location.lng(), results[0].geometry.location.lat()]);
          } else if (results[0].geometry?.location) {
            // Fallback for point location
            const loc = results[0].geometry.location;
            const offset = 0.1;
            const sw = new google.maps.LatLng(loc.lat() - offset, loc.lng() - offset);
            const ne = new google.maps.LatLng(loc.lat() + offset, loc.lng() + offset);
            setSearchBounds(new google.maps.LatLngBounds(sw, ne));
            setFocusedLocation([loc.lng(), loc.lat()]);
          }
        }
      });
    }
  }, [placesService, data.destination]);



  const handleSaveTrip = () => {
    if (!user) {
      alert("Please log in to save your trip!");
      navigate('/login');
      return;
    }
    setSaveStatus('saving');
    try {
      // Create a default name if none exists
      const tripName = `Trip to ${data.destination}`;
      const saved = saveItinerary(data, tripName);
      setSaveStatus('saved');

      // Update the parent state with the new ID if it was a new save
      if (onItineraryChange && !data.id) {
        onItineraryChange(saved);
        // Also update data reference locally if needed, though react handles props
      }

      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (e) {
      console.error("Failed to save", e);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleShare = async () => {
    setShareStatus('sharing');
    try {
      const id = await saveItineraryToBackend(data);
      const link = `${window.location.origin}/share/${id}`;
      await navigator.clipboard.writeText(link);
      setShareStatus('shared');
      setTimeout(() => setShareStatus('idle'), 3000);
    } catch (err) {
      console.error("Share failed", err);
      setShareStatus('error');
      setTimeout(() => setShareStatus('idle'), 3000);
    }
  };

  const [searchData, setSearchData] = useState<any>(null);

  // Inline Search State
  const [arrivalFrom, setArrivalFrom] = useState("");
  const [arrivalTo, setArrivalTo] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [departureFrom, setDepartureFrom] = useState("");
  const [departureTo, setDepartureTo] = useState("");
  const [departureDate, setDepartureDate] = useState("");

  const [selectedArrivalFlight, setSelectedArrivalFlight] = useState<any>(null);
  const [selectedDepartureFlight, setSelectedDepartureFlight] = useState<any>(null);

  // Hotel Search State

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
    // console.log("Selected flight:", flight);

    const context = searchData?.context || 'activity'; // 'arrival', 'departure', or 'activity'

    // Construct the activity object
    const newItem = {
      type: 'flight' as 'flight', // Type assertion
      activity: `${flight.airline} ${flight.flightNumber}`,
      description: `Departure: ${flight.departure} (${searchData?.from}) \nArrival: ${flight.arrival} (${searchData?.to}) \nDuration: ${flight.duration} \nPrice: ${flight.price}`,
      time: flight.departure,
      location: `${searchData?.from || 'Origin'} -> ${searchData?.to || 'Destination'}`,
      coordinates: null, // Flights don't have a single coordinate
      ...flight // Keep raw data
    };

    console.log("Adding flight for context:", context);

    if (context === 'arrival') {
      onAddActivity(0, newItem); // Add to Day 1
    } else if (context === 'departure') {
      onAddActivity(totalDays - 1, newItem); // Add to Last Day
    } else {
      onAddActivity(safeDayIndex, newItem); // Add to Current Day
    }

    setRightPanelMode('MAP');
  };

  const handleSelectHotel = (hotel: any) => {
    console.log("Selected hotel:", hotel);

    // Create itinerary item from hotel data
    const newItem = {
      type: 'hotel' as 'hotel',
      activity: hotel.name || "Selected Hotel",
      description: hotel.formatted_address || hotel.location || "Hotel Stay",
      time: "14:00", // Standard check-in time
      location: hotel.formatted_address || hotel.location,
      coordinates: [
        (hotel.geometry?.location?.lng && typeof hotel.geometry.location.lng === 'function') ? hotel.geometry.location.lng() : (hotel.coordinates?.lng || 0),
        (hotel.geometry?.location?.lat && typeof hotel.geometry.location.lat === 'function') ? hotel.geometry.location.lat() : (hotel.coordinates?.lat || 0)
      ],
      price: hotel.price_level ? '💰'.repeat(hotel.price_level) : undefined,
      rating: hotel.rating,
      image: hotel.photos && hotel.photos.length > 0 && typeof hotel.photos[0].getUrl === 'function' ? hotel.photos[0].getUrl() : undefined,
      ...hotel
    };

    // Add to all days or specific day? Usually hotels are for the trip duration.
    // For now, let's add it to the current day or ask user?
    // The current flow implies adding to the itinerary. Let's add to the first day or current active day.
    // Given it's a "Stay", maybe add to Day 1?
    // Insert at the beginning of the list (index 0) to replace "Where to stay?" position
    onAddActivity(safeDayIndex, newItem, 0);

    // Do not switch to MAP mode, keep the hotel panel open for more browsing
    // setRightPanelMode('MAP');
    alert("Hotel added to your itinerary!"); // Simple feedback for now
  };

  const handleActivitySearch = (data: any) => {
    console.log("Searching activities:", data);
  };

  const handleAddActivityFromPanel = (activity: any) => {
    // activity object from panel: { id, text, type, duration, price, image }
    // Map to ItineraryItem format
    // Map to ItineraryItem format
    const newItem = {
      activity: activity.name || activity.activity || activity.text, // Handle different property names
      description: activity.description || `Duration: ${activity.duration || 'N/A'}, Price: ${activity.price || 'N/A'}`,
      type: 'activity',
      time: '10:00', // Default time for suggestion
      location: activity.location,
      coordinates: activity.coordinates,
      ...activity // Spread rest to keep metadata
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

  // Auto-focus on the first activity of the day when switching days
  React.useEffect(() => {
    if (currentDay && currentDay.activities && currentDay.activities.length > 0) {
      const firstActivityWithCoords = currentDay.activities.find(act => act.coordinates && act.coordinates.length === 2);
      if (firstActivityWithCoords && firstActivityWithCoords.coordinates) {
        setFocusedLocation(firstActivityWithCoords.coordinates);
      } else if (searchBounds) {
        // Fallback to destination center if no specific activity coordinates
        const center = searchBounds.getCenter();
        setFocusedLocation([center.lng(), center.lat()]);
      }
    }
  }, [activeDay, currentDay, setFocusedLocation, searchBounds]);

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
      <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-20 relative">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`hidden md:block text-slate-500 hover:text-slate-800 transition-colors p-2 hover:bg-slate-100 rounded-lg ${!isSidebarOpen ? 'bg-slate-100 text-slate-900' : ''}`}
            title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-slate-900 leading-tight hidden md:block">
              {data.destination ? `Trip to ${data.destination}` : 'New Trip'}
            </h1>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Start Date:</span>
              <input
                type="date"
                value={data.startDate || ''}
                onChange={(e) => {
                  if (onItineraryChange) {
                    onItineraryChange({ ...data, startDate: e.target.value });
                  }
                }}
                className="text-[10px] bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 outline-none font-bold text-slate-600 transition-all w-24"
              />
            </div>
          </div>

          <button
            onClick={onBackToHome}
            className="text-slate-500 hover:text-indigo-600 transition-colors p-2 hover:bg-slate-100 rounded-lg flex items-center gap-2 group"
            title="Back to Home"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            <span className="text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity -ml-2 group-hover:ml-0 duration-300 hidden md:inline">Home</span>
          </button>
        </div>

        {user ? (
          <div className="flex items-center gap-3 relative" ref={node => {
            // Close dropdown when clicking outside
            if (node) {
              const handleClickOutside = (e: MouseEvent) => {
                if (!node.contains(e.target as Node)) {
                  setIsProfileOpen(false);
                }
              };
              document.addEventListener('mousedown', handleClickOutside);
              return () => document.removeEventListener('mousedown', handleClickOutside);
            }
          }}>
            {/* Share Button */}
            <button
              onClick={handleShare}
              disabled={shareStatus === 'sharing'}
              className={`
                  flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all
                  ${shareStatus === 'shared'
                  ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                  : 'bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50'}
                `}
            >
              {shareStatus === 'sharing' ? (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : shareStatus === 'shared' ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Link Copied
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share
                </>
              )}
            </button>

            <button
              onClick={handleSaveTrip}
              disabled={saveStatus === 'saving'}
              className={`
                  flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all
                  ${saveStatus === 'saved'
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg shadow-indigo-200'}
                `}
            >
              {saveStatus === 'saving' ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Saving...</span>
                </>
              ) : saveStatus === 'saved' ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Saved</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  <span>Save Trip</span>
                </>
              )}
            </button>

            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 border border-slate-200 rounded-full p-1 pl-3 hover:shadow-md transition-shadow bg-white"
            >
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-700">{user.email?.split('@')[0] || 'Traveler'}</p>
              </div>
              <div className="w-8 h-8 bg-slate-500 rounded-full flex items-center justify-center text-white overflow-hidden">
                <span className="font-bold text-xs">{user.email?.[0].toUpperCase() || 'T'}</span>
              </div>
            </button>

            {/* Profile Dropdown */}
            {isProfileOpen && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-fade-in-down">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-bold text-slate-800">My Account</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
                <div className="py-2">
                  <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                  </button>
                  <button
                    onClick={() => navigate('/saved-trips')}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    My Itineraries
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </button>
                </div>
                <div className="border-t border-slate-100 py-1">
                  <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-slate-50 transition-colors flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveTrip}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Save Trip
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 rounded-full font-bold text-sm text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Log In
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="px-4 py-2 rounded-full font-bold text-sm bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
            >
              Sign Up
            </button>
          </div>
        )}
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

                    {selectedArrivalFlight ? (
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h5 className="font-bold text-slate-800">{selectedArrivalFlight.airline} <span className="text-xs font-normal text-slate-500">({selectedArrivalFlight.flightNumber})</span></h5>
                            <p className="text-xs text-slate-500">{selectedArrivalFlight.departure} - {selectedArrivalFlight.arrival}</p>
                          </div>
                          <span className="text-sm font-bold text-slate-900">{selectedArrivalFlight.price}</span>
                        </div>
                        <button
                          onClick={() => setSelectedArrivalFlight(null)}
                          className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline mt-2"
                        >
                          Change Flight
                        </button>
                      </div>
                    ) : (
                      <>
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

                          <div className="grid grid-cols-1 gap-3">
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
                          onClick={() => handleFlightSearch({ from: arrivalFrom, to: arrivalTo, date: arrivalDate, context: 'arrival' })}
                          className="w-full bg-[#eff6ff] hover:bg-blue-50 transition-colors rounded-lg py-2.5 text-center group/btn"
                        >
                          <span className="text-[#3b82f6] font-mono text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 group-hover/btn:scale-105 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            Search Flights
                          </span>
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* Daily Hotel Integration (Airbnb Style) - Show only if no hotel added */}
                {currentDay.hasHotel !== false && !currentDay.activities.some(a => a.type === 'hotel') && (
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
                      <button
                        onClick={() => {
                          // Best effort to get coordinates for the search
                          let coordinates = undefined;
                          if (searchBounds) {
                            const center = searchBounds.getCenter();
                            coordinates = [center.lng(), center.lat()];
                          } else if (focusedLocation) {
                            coordinates = focusedLocation;
                          }

                          handleHotelSearch({
                            location: data.destination, // Default to trip destination
                            coordinates: coordinates
                          });
                        }}
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
                        isScriptLoaded={isLoaded}
                        searchBounds={searchBounds}
                        onFocusMap={handleFocusMap}
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

                    {selectedDepartureFlight ? (
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h5 className="font-bold text-slate-800">{selectedDepartureFlight.airline} <span className="text-xs font-normal text-slate-500">({selectedDepartureFlight.flightNumber})</span></h5>
                            <p className="text-xs text-slate-500">{selectedDepartureFlight.departure} - {selectedDepartureFlight.arrival}</p>
                          </div>
                          <span className="text-sm font-bold text-slate-900">{selectedDepartureFlight.price}</span>
                        </div>
                        <button
                          onClick={() => setSelectedDepartureFlight(null)}
                          className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline mt-2"
                        >
                          Change Flight
                        </button>
                      </div>
                    ) : (
                      <>
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

                          <div className="grid grid-cols-1 gap-3">
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
                          onClick={() => handleFlightSearch({ from: departureFrom, to: departureTo, date: departureDate, context: 'departure' })}
                          className="w-full bg-[#eff6ff] hover:bg-blue-50 transition-colors rounded-lg py-2.5 text-center group/btn"
                        >
                          <span className="text-[#3b82f6] font-mono text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 group-hover/btn:scale-105 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            Search Flights
                          </span>
                        </button>
                      </>
                    )}
                  </div>
                )}


                {/* Manual Add Button Dropdown */}
                <div className="flex gap-3 mt-4">
                  <div className="flex-1 relative">
                    <button
                      onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                      className="w-full h-full py-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-bold text-sm hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
                    >
                      + Add Manual Item
                    </button>
                    {isAddMenuOpen && (
                      <div className="absolute bottom-full left-0 mb-2 w-full bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-fade-in-up">
                        <button
                          onClick={() => {
                            setIsAddMenuOpen(false);
                            onAddActivity(safeDayIndex, {});
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors flex items-center gap-3"
                        >
                          <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </span>
                          Activity
                        </button>
                      </div>
                    )}
                  </div>
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

          {/* Always render Map if mode is MAP, or hidden but mounted for state preservation if desired, 
              but typically we switch. Let's simplifiy: if MAP, show MapComponent. */}
          {rightPanelMode === 'MAP' && (
            <MapComponent
              activeDay={currentDay.day}
              onAddActivity={(item) => onAddActivity(safeDayIndex, item)}
            />
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



          {rightPanelMode === 'ACTIVITY_SEARCH' && (
            <ActivitySearchPanel
              onSearch={handleActivitySearch}
              onAddActivity={handleAddActivityFromPanel}
              isScriptLoaded={isLoaded}
              destination={data.destination}
              activeDay={currentDay.day}
            />
          )}

          {rightPanelMode === 'HOTEL_DETAILS' && (
            <HotelDetailsPanel
              searchData={searchData}
              onBack={() => setRightPanelMode('MAP')}
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
