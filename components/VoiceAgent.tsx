import { useConversation } from "@elevenlabs/react";
import { useEffect, useCallback, useRef } from "react";
import { useItineraryStore } from "../store/useItineraryStore";
import { useSettingsStore } from "../store/useSettingsStore";
import { useAuth } from "./AuthContext";

export default function VoiceAgent() {
    const { user } = useAuth();

    // Individual selectors to optimize renders
    const setFocusedLocation = useItineraryStore(state => state.setFocusedLocation);
    const setFocusedPlace = useItineraryStore(state => state.setFocusedPlace);
    const setZoomLevel = useItineraryStore(state => state.setZoomLevel);
    const addActivity = useItineraryStore(state => state.addActivity);
    const removeActivity = useItineraryStore(state => state.removeActivity);
    const reorderActivity = useItineraryStore(state => state.reorderActivity);
    const startJourney = useItineraryStore(state => state.startJourney);
    const stopJourney = useItineraryStore(state => state.stopJourney);
    const nextStop = useItineraryStore(state => state.nextStop);
    const prevStop = useItineraryStore(state => state.prevStop);
    const addDay = useItineraryStore(state => state.addDay);
    const setActiveDay = useItineraryStore(state => state.setActiveDay);
    const setRightPanelMode = useItineraryStore(state => state.setRightPanelMode);
    const setVoiceActionToast = useItineraryStore(state => state.setVoiceActionToast);

    // Voice specific actions
    const setVoiceToggleCallback = useItineraryStore(state => state.setVoiceToggleCallback);
    const setVoiceState = useItineraryStore(state => state.setVoiceState);
    const isVoiceActive = useItineraryStore(state => state.isVoiceActive);
    const isMuted = useItineraryStore(state => state.isMuted);

    // We only need the ID, not the whole store
    const elevenLabsAgentId = useSettingsStore(state => state.elevenLabsAgentId);

    // Helper to show a toast that auto-dismisses
    const showToast = useCallback((msg: string) => {
        setVoiceActionToast(msg);
        setTimeout(() => setVoiceActionToast(null), 3000);
    }, [setVoiceActionToast]);

    // Single conversation hook with client tools
    const conversation = useConversation({
        onConnect: () => {
            console.log("Connected to ElevenLabs");
            setVoiceState(true, "Connected");
        },
        onDisconnect: (...args) => {
            console.warn("Disconnected from ElevenLabs", args);
            // Stop all microphone tracks to release the mic
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(track => track.stop());
                mediaStreamRef.current = null;
            }
            setVoiceState(false, "Disconnected");
        },
        onMessage: (message) => {
            if (message.source === "ai") {
                setVoiceState(true, "Speaking...");
            }
        },
        onError: (e) => {
            console.error("Voice Agent Error:", e);
            const errorMsg = typeof e === 'string' ? e : "Error (check console)";
            setVoiceState(false, errorMsg);
        },
        clientTools: {
            // ========== MAP TOOLS ==========
            move_map: (parameters: { lat: number; lng: number }) => {
                setVoiceState(true, "Moving map...");
                setFocusedLocation([parameters.lng, parameters.lat]);
                showToast("📍 Map moved");
                return "Map moved.";
            },

            zoom_map: (parameters: { lat: number; lng: number; zoom?: number }) => {
                const zoomVal = parameters.zoom || 16;
                setVoiceState(true, "Zooming in...");
                setFocusedLocation([parameters.lng, parameters.lat]);
                setZoomLevel(zoomVal);
                showToast(`🔍 Zoomed to location (${zoomVal}x)`);
                return `Map zoomed to location at zoom level ${zoomVal}.`;
            },

            preview_place: (parameters: { name: string; lat: number; lng: number; description?: string; rating?: number }) => {
                setVoiceState(true, `Showing ${parameters.name}...`);

                // Focus the map on the location
                setFocusedLocation([parameters.lng, parameters.lat]);

                // Set the focused place — Map.tsx shows an InfoWindow with "Add to Day" button
                setFocusedPlace({
                    name: parameters.name,
                    description: parameters.description || '',
                    formatted_address: parameters.description || `${parameters.lat}, ${parameters.lng}`,
                    rating: parameters.rating || null,
                    coordinates: { lat: parameters.lat, lng: parameters.lng },
                });

                // Make sure the map is visible
                const state = useItineraryStore.getState();
                if (state.rightPanelMode !== 'ACTIVITY_SEARCH') {
                    setRightPanelMode('MAP');
                }

                showToast(`👁️ Previewing ${parameters.name}`);
                return `Showing ${parameters.name} on the map. The user can see it and click "Add to Day" to add it to their itinerary.`;
            },

            search_activities: (parameters: { query: string }) => {
                setVoiceState(true, `Searching: ${parameters.query}...`);

                // Open the suggestions panel so the user sees results
                setRightPanelMode('ACTIVITY_SEARCH');

                // Fire a custom event so ActivitySearchPanel can pick up the voice search query
                window.dispatchEvent(new CustomEvent('voice-search', { detail: { query: parameters.query } }));

                showToast(`🔎 Searching: "${parameters.query}"`);
                return `Searching for "${parameters.query}". The results will appear in the suggestions panel. You can use preview_place to show a specific result on the map, or the user can click on results directly.`;
            },

            // ========== DAY MANAGEMENT ==========
            switch_day: (parameters: { day: number }) => {
                const state = useItineraryStore.getState();
                if (!state.itinerary) return "No itinerary loaded.";

                const totalDays = state.itinerary.days.length;
                const targetDay = parameters.day;

                if (targetDay < 1 || targetDay > totalDays) {
                    return `Invalid day. The itinerary has ${totalDays} day(s). Please choose between 1 and ${totalDays}.`;
                }

                setActiveDay(targetDay);
                setVoiceState(true, `Day ${targetDay}`);
                const dayData = state.itinerary.days[targetDay - 1];
                showToast(`📅 Switched to Day ${targetDay}: ${dayData.theme}`);
                return `Switched to Day ${targetDay}: "${dayData.theme}". It has ${dayData.activities.length} activit${dayData.activities.length === 1 ? 'y' : 'ies'}.`;
            },

            add_day: (parameters: {}) => {
                setVoiceState(true, "Adding new day...");
                addDay();
                const state = useItineraryStore.getState();
                const newDayNum = state.itinerary?.days.length || 1;
                showToast(`📅 Day ${newDayNum} added`);
                return `Added Day ${newDayNum} to the itinerary.`;
            },

            // ========== ACTIVITY MANAGEMENT ==========
            add_place: (parameters: { name: string; lat: number; lng: number; description?: string; time?: string; day?: number }) => {
                const state = useItineraryStore.getState();
                const targetDayIndex = parameters.day ? parameters.day - 1 : (state.activeDay - 1);
                const dayLabel = parameters.day || state.activeDay;

                setVoiceState(true, `Adding ${parameters.name}...`);
                setFocusedLocation([parameters.lng, parameters.lat]);

                addActivity(targetDayIndex, {
                    activity: parameters.name,
                    description: parameters.description || "Added by Voice Agent",
                    location: `${parameters.lat}, ${parameters.lng}`,
                    time: parameters.time || "10:00",
                    coordinates: [parameters.lng, parameters.lat],
                    type: 'activity'
                });

                showToast(`✅ Added "${parameters.name}" to Day ${dayLabel}`);
                return `Added ${parameters.name} to Day ${dayLabel}.`;
            },

            remove_activity: (parameters: { name: string; day?: number }) => {
                const state = useItineraryStore.getState();
                if (!state.itinerary) return "No itinerary loaded.";

                const targetDayIndex = parameters.day ? parameters.day - 1 : (state.activeDay - 1);
                const day = state.itinerary.days[targetDayIndex];
                if (!day) return `Day ${targetDayIndex + 1} not found.`;

                // Find activity by name (case-insensitive partial match)
                const searchName = parameters.name.toLowerCase();
                const activityIndex = day.activities.findIndex(
                    a => a.activity.toLowerCase().includes(searchName)
                );

                if (activityIndex === -1) {
                    return `Could not find an activity matching "${parameters.name}" on Day ${targetDayIndex + 1}. Available activities: ${day.activities.map(a => a.activity).join(', ')}.`;
                }

                const removedName = day.activities[activityIndex].activity;
                removeActivity(targetDayIndex, activityIndex);
                showToast(`🗑️ Removed "${removedName}" from Day ${targetDayIndex + 1}`);
                return `Removed "${removedName}" from Day ${targetDayIndex + 1}.`;
            },

            reorder_activity: (parameters: { activity_name: string; target_name: string; position: string; day?: number }) => {
                const state = useItineraryStore.getState();
                if (!state.itinerary) return "No itinerary loaded.";

                const targetDayIndex = parameters.day ? parameters.day - 1 : (state.activeDay - 1);
                const day = state.itinerary.days[targetDayIndex];
                if (!day) return `Day ${targetDayIndex + 1} not found.`;

                const activities = day.activities;
                const searchActivity = parameters.activity_name.toLowerCase();
                const searchTarget = parameters.target_name.toLowerCase();

                const activityIdx = activities.findIndex(a => a.activity.toLowerCase().includes(searchActivity));
                if (activityIdx === -1) {
                    return `Could not find activity "${parameters.activity_name}" on Day ${targetDayIndex + 1}. Activities: ${activities.map(a => a.activity).join(', ')}.`;
                }

                const targetIdx = activities.findIndex(a => a.activity.toLowerCase().includes(searchTarget));
                if (targetIdx === -1) {
                    return `Could not find target activity "${parameters.target_name}" on Day ${targetDayIndex + 1}. Activities: ${activities.map(a => a.activity).join(', ')}.`;
                }

                if (activityIdx === targetIdx) {
                    return `"${activities[activityIdx].activity}" is the same as the target. Nothing to reorder.`;
                }

                // Calculate new index: "before" = target's position, "after" = target + 1
                let newIndex = parameters.position === 'before' ? targetIdx : targetIdx + 1;
                // Adjust if source is before target (removal shifts indices down)
                if (activityIdx < newIndex) newIndex--;

                const movedName = activities[activityIdx].activity;
                const anchorName = activities[targetIdx].activity;
                reorderActivity(targetDayIndex, activityIdx, newIndex);
                showToast(`↕️ Moved "${movedName}" ${parameters.position} "${anchorName}"`);
                return `Moved "${movedName}" ${parameters.position} "${anchorName}" on Day ${targetDayIndex + 1}.`;
            },

            // ========== ITINERARY READING ==========
            get_itinerary_info: (parameters: { day?: number }) => {
                const state = useItineraryStore.getState();
                if (!state.itinerary) return "No itinerary loaded.";

                const targetDay = parameters.day || state.activeDay;
                const dayIndex = targetDay - 1;
                const day = state.itinerary.days[dayIndex];

                if (!day) return `Day ${targetDay} not found.`;

                const destination = state.itinerary.destination;
                const totalDays = state.itinerary.days.length;

                if (day.activities.length === 0) {
                    return `Day ${targetDay} ("${day.theme}") of your ${destination} trip has no activities yet. The trip has ${totalDays} day(s) total.`;
                }

                const activityList = day.activities.map((a, i) =>
                    `${i + 1}. ${a.time} - ${a.activity}${a.description ? `: ${a.description}` : ''}`
                ).join('\n');

                return `Day ${targetDay} ("${day.theme}") of your ${destination} trip (${totalDays} days total):\n${activityList}`;
            },

            // ========== PANEL CONTROL ==========
            show_suggestions: (parameters: {}) => {
                setRightPanelMode('ACTIVITY_SEARCH');
                setVoiceState(true, "Opening suggestions...");
                showToast("✨ Suggestions panel opened");
                return "The suggestions and activities panel is now open. You can browse and add activities.";
            },

            show_map: (parameters: {}) => {
                setRightPanelMode('MAP');
                setVoiceState(true, "Opening map...");
                showToast("🗺️ Map view opened");
                return "Switched to the full map view.";
            },

            show_transport: (parameters: {}) => {
                setRightPanelMode('TRANSPORT_INFO');
                setVoiceState(true, "Opening transport info...");
                showToast("🚆 Transport info opened");
                return "Transport and travel info panel is now open.";
            },

            // ========== JOURNEY / NARRATION MODE ==========
            narrate_day: (parameters: {}) => {
                const state = useItineraryStore.getState();
                if (!state.itinerary) return "No itinerary loaded.";

                const dayIndex = state.activeDay - 1;
                const day = state.itinerary.days[dayIndex];
                if (!day || day.activities.length === 0) {
                    return `Day ${state.activeDay} has no activities to narrate.`;
                }

                startJourney();
                setVoiceState(true, "Narrating...");
                showToast(`🎙️ Starting Day ${state.activeDay} tour`);

                // Build narration text for the agent to speak
                const stops = day.activities.map((a, i) =>
                    `Stop ${i + 1}: ${a.activity} at ${a.time}${a.description ? ' - ' + a.description : ''}`
                ).join('. ');

                return `Starting guided tour of Day ${state.activeDay}: "${day.theme}". ${stops}. Say "next stop" to fly to each location, or "stop tour" to end.`;
            },

            next_stop: (parameters: {}) => {
                setVoiceState(true, "Next stop...");
                const result = nextStop();
                if (result.includes("End of")) {
                    showToast("🏁 Tour complete!");
                } else {
                    showToast(`➡️ ${result}`);
                }
                return result;
            },

            previous_stop: (parameters: {}) => {
                setVoiceState(true, "Previous stop...");
                const result = prevStop();
                showToast(`⬅️ ${result}`);
                return result;
            },

            stop_tour: (parameters: {}) => {
                stopJourney();
                setVoiceState(true, "Tour ended");
                showToast("⏹️ Tour stopped");
                return "The guided tour has been stopped.";
            },

            // ========== SAVE TRIP ==========
            save_trip: (parameters: {}) => {
                window.dispatchEvent(new CustomEvent('voice-save-trip'));
                setVoiceState(true, "Saving...");
                showToast("💾 Saving trip...");
                return "Saving your trip now.";
            },

            // ========== HOTEL SEARCH ==========
            search_hotels: (parameters: { location?: string }) => {
                const state = useItineraryStore.getState();
                const destination = parameters.location || state.itinerary?.destination || 'current location';

                // Switch to hotel panel
                setRightPanelMode('HOTEL_DETAILS');

                // Fire a custom event so ItineraryDisplay can set the searchData for HotelDetailsPanel
                window.dispatchEvent(new CustomEvent('voice-hotel-search', { detail: { location: destination } }));

                showToast(`🏨 Searching hotels in ${destination}`);
                return `Opening the hotel search panel for ${destination}. The user can browse and select hotels from the results.`;
            }
        }
    });

    // Use refs to stabilize the callback to prevent infinite loops in the store
    const conversationRef = useRef(conversation);
    useEffect(() => {
        conversationRef.current = conversation;
    });

    const isVoiceActiveRef = useRef(isVoiceActive);
    useEffect(() => {
        isVoiceActiveRef.current = isVoiceActive;
    }, [isVoiceActive]);

    const mediaStreamRef = useRef<MediaStream | null>(null);

    // Eject/Inject media stream based on Muted state
    useEffect(() => {
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getAudioTracks().forEach(track => {
                track.enabled = !isMuted;
            });
        }
    }, [isMuted]);


    // Helper to toggle session
    const handleToggle = useCallback(async () => {
        const currentConv = conversationRef.current;
        const active = isVoiceActiveRef.current;

        if (active) {
            await currentConv.endSession();

            // Clean up stream
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(track => track.stop());
                mediaStreamRef.current = null;
            }

            setVoiceState(false, "Idle");
        } else {
            try {
                const agentId = useSettingsStore.getState().elevenLabsAgentId;
                if (!agentId) {
                    throw new Error("Missing Settings");
                }

                setVoiceState(false, "Connecting...");
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaStreamRef.current = stream;

                // Build dynamic context for the agent's greeting
                const itinerary = useItineraryStore.getState().itinerary;
                const currentActiveDay = useItineraryStore.getState().activeDay;
                const userName = user?.user_metadata?.full_name
                    || user?.user_metadata?.name
                    || user?.email?.split('@')[0]
                    || 'traveler';

                // Build a summary of the current day's activities for context
                let currentDaySummary = 'No activities planned yet.';
                if (itinerary && itinerary.days[currentActiveDay - 1]) {
                    const dayPlan = itinerary.days[currentActiveDay - 1];
                    const activities = dayPlan.activities;
                    if (activities.length > 0) {
                        currentDaySummary = activities.map((a, i) => `${i + 1}. ${a.activity}${a.time ? ` at ${a.time}` : ''}`).join('; ');
                    }
                }

                // @ts-ignore - agentId is correct for public agents despite type definition
                await currentConv.startSession({
                    agentId: agentId,
                    dynamicVariables: {
                        user_name: userName,
                        destination: itinerary?.destination || 'your trip',
                        total_days: String(itinerary?.days?.length || 0),
                        current_day: String(currentActiveDay),
                        current_day_summary: currentDaySummary,
                    },
                });
            } catch (e: any) {
                console.error("Failed to start:", e);
                setVoiceState(false, "Error");

                if (e.message === "Missing Settings") {
                    useSettingsStore.getState().setSettingsOpen(true);
                } else {
                    alert(`Error starting voice agent: ${e.message || e}`);
                }
            }
        }
    }, [setVoiceState]);

    // Register callback on mount
    useEffect(() => {
        setVoiceToggleCallback(handleToggle);
        return () => setVoiceToggleCallback(() => console.warn("Agent unmounted"));
    }, [handleToggle, setVoiceToggleCallback]);

    // Headless - no UI
    return null;
}
