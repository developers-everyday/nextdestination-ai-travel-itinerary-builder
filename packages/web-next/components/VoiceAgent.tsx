"use client";

import { useConversation } from "@elevenlabs/react";
import { useEffect, useCallback, useRef } from "react";
import { useItineraryStore } from "@nextdestination/shared";
import { useSettingsStore } from "@nextdestination/shared";
import { useAuth } from "@/components/AuthContext";

export default function VoiceAgent() {
  const { user } = useAuth();

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
  const setVoiceToggleCallback = useItineraryStore(state => state.setVoiceToggleCallback);
  const setVoiceState = useItineraryStore(state => state.setVoiceState);
  const isVoiceActive = useItineraryStore(state => state.isVoiceActive);
  const isMuted = useItineraryStore(state => state.isMuted);
  const elevenLabsAgentId = useSettingsStore(state => state.elevenLabsAgentId);

  const showToast = useCallback((msg: string) => {
    setVoiceActionToast(msg);
    setTimeout(() => setVoiceActionToast(null), 3000);
  }, [setVoiceActionToast]);

  const conversation = useConversation({
    onConnect: () => {
      setVoiceState(true, "Connected");
    },
    onDisconnect: (...args) => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
      setVoiceState(false, "Disconnected");
    },
    onMessage: (message) => {
      if (message.source === "ai") setVoiceState(true, "Speaking...");
    },
    onError: (e) => {
      const errorMsg = typeof e === "string" ? e : "Error (check console)";
      setVoiceState(false, errorMsg);
    },
    clientTools: {
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
        setFocusedLocation([parameters.lng, parameters.lat]);
        setFocusedPlace({
          name: parameters.name,
          description: parameters.description || "",
          formatted_address: parameters.description || `${parameters.lat}, ${parameters.lng}`,
          rating: parameters.rating || null,
          coordinates: { lat: parameters.lat, lng: parameters.lng },
        });
        const state = useItineraryStore.getState();
        if (state.rightPanelMode !== "ACTIVITY_SEARCH") setRightPanelMode("MAP");
        showToast(`👁️ Previewing ${parameters.name}`);
        return `Showing ${parameters.name} on the map.`;
      },
      search_activities: (parameters: { query: string }) => {
        setVoiceState(true, `Searching: ${parameters.query}...`);
        setRightPanelMode("ACTIVITY_SEARCH");
        window.dispatchEvent(new CustomEvent("voice-search", { detail: { query: parameters.query } }));
        showToast(`🔎 Searching: "${parameters.query}"`);
        return `Searching for "${parameters.query}".`;
      },
      switch_day: (parameters: { day: number }) => {
        const state = useItineraryStore.getState();
        if (!state.itinerary) return "No itinerary loaded.";
        const totalDays = state.itinerary.days.length;
        const targetDay = parameters.day;
        if (targetDay < 1 || targetDay > totalDays) return `Invalid day. The itinerary has ${totalDays} day(s).`;
        setActiveDay(targetDay);
        setVoiceState(true, `Day ${targetDay}`);
        const dayData = state.itinerary.days[targetDay - 1];
        showToast(`📅 Switched to Day ${targetDay}: ${dayData.theme}`);
        return `Switched to Day ${targetDay}: "${dayData.theme}".`;
      },
      add_day: (_parameters: Record<string, never>) => {
        setVoiceState(true, "Adding new day...");
        addDay();
        const state = useItineraryStore.getState();
        const newDayNum = state.itinerary?.days.length || 1;
        showToast(`📅 Day ${newDayNum} added`);
        return `Added Day ${newDayNum} to the itinerary.`;
      },
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
          type: "activity",
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
        const searchName = parameters.name.toLowerCase();
        const activityIndex = day.activities.findIndex(a => a.activity.toLowerCase().includes(searchName));
        if (activityIndex === -1) return `Could not find "${parameters.name}".`;
        const removedName = day.activities[activityIndex].activity;
        removeActivity(targetDayIndex, activityIndex);
        showToast(`🗑️ Removed "${removedName}"`);
        return `Removed "${removedName}".`;
      },
      reorder_activity: (parameters: { activity_name: string; target_name: string; position: string; day?: number }) => {
        const state = useItineraryStore.getState();
        if (!state.itinerary) return "No itinerary loaded.";
        const targetDayIndex = parameters.day ? parameters.day - 1 : (state.activeDay - 1);
        const day = state.itinerary.days[targetDayIndex];
        if (!day) return `Day ${targetDayIndex + 1} not found.`;
        const activities = day.activities;
        const activityIdx = activities.findIndex(a => a.activity.toLowerCase().includes(parameters.activity_name.toLowerCase()));
        const targetIdx = activities.findIndex(a => a.activity.toLowerCase().includes(parameters.target_name.toLowerCase()));
        if (activityIdx === -1 || targetIdx === -1) return `Activity not found.`;
        let newIndex = parameters.position === "before" ? targetIdx : targetIdx + 1;
        if (activityIdx < newIndex) newIndex--;
        reorderActivity(targetDayIndex, activityIdx, newIndex);
        showToast(`↕️ Reordered activities`);
        return `Moved "${activities[activityIdx].activity}" ${parameters.position} "${activities[targetIdx].activity}".`;
      },
      get_itinerary_info: (parameters: { day?: number }) => {
        const state = useItineraryStore.getState();
        if (!state.itinerary) return "No itinerary loaded.";
        const targetDay = parameters.day || state.activeDay;
        const day = state.itinerary.days[targetDay - 1];
        if (!day) return `Day ${targetDay} not found.`;
        if (day.activities.length === 0) return `Day ${targetDay} has no activities yet.`;
        const activityList = day.activities.map((a, i) => `${i + 1}. ${a.time} - ${a.activity}`).join("\n");
        return `Day ${targetDay} ("${day.theme}"): ${activityList}`;
      },
      show_suggestions: (_parameters: Record<string, never>) => {
        setRightPanelMode("ACTIVITY_SEARCH");
        showToast("✨ Suggestions panel opened");
        return "The suggestions panel is now open.";
      },
      show_map: (_parameters: Record<string, never>) => {
        setRightPanelMode("MAP");
        showToast("🗺️ Map view opened");
        return "Switched to the full map view.";
      },
      show_transport: (_parameters: Record<string, never>) => {
        setRightPanelMode("TRANSPORT_INFO");
        showToast("🚆 Transport info opened");
        return "Transport and travel info panel is now open.";
      },
      narrate_day: (_parameters: Record<string, never>) => {
        const state = useItineraryStore.getState();
        if (!state.itinerary) return "No itinerary loaded.";
        const dayIndex = state.activeDay - 1;
        const day = state.itinerary.days[dayIndex];
        if (!day || day.activities.length === 0) return `Day ${state.activeDay} has no activities.`;
        startJourney();
        setVoiceState(true, "Narrating...");
        showToast(`🎙️ Starting Day ${state.activeDay} tour`);
        const stops = day.activities.map((a, i) => `Stop ${i + 1}: ${a.activity} at ${a.time}`).join(". ");
        return `Starting guided tour of Day ${state.activeDay}: "${day.theme}". ${stops}.`;
      },
      next_stop: (_parameters: Record<string, never>) => {
        setVoiceState(true, "Next stop...");
        const result = nextStop();
        if (result.includes("End of")) showToast("🏁 Tour complete!");
        else showToast(`➡️ ${result}`);
        return result;
      },
      previous_stop: (_parameters: Record<string, never>) => {
        setVoiceState(true, "Previous stop...");
        const result = prevStop();
        showToast(`⬅️ ${result}`);
        return result;
      },
      stop_tour: (_parameters: Record<string, never>) => {
        stopJourney();
        showToast("⏹️ Tour stopped");
        return "The guided tour has been stopped.";
      },
      save_trip: (_parameters: Record<string, never>) => {
        window.dispatchEvent(new CustomEvent("voice-save-trip"));
        showToast("💾 Saving trip...");
        return "Saving your trip now.";
      },
      search_hotels: (parameters: { location?: string }) => {
        const state = useItineraryStore.getState();
        const destination = parameters.location || state.itinerary?.destination || "current location";
        setRightPanelMode("HOTEL_DETAILS");
        window.dispatchEvent(new CustomEvent("voice-hotel-search", { detail: { location: destination } }));
        showToast(`🏨 Searching hotels in ${destination}`);
        return `Opening hotel search for ${destination}.`;
      },
    },
  });

  const conversationRef = useRef(conversation);
  useEffect(() => { conversationRef.current = conversation; });

  const isVoiceActiveRef = useRef(isVoiceActive);
  useEffect(() => { isVoiceActiveRef.current = isVoiceActive; }, [isVoiceActive]);

  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted]);

  const handleToggle = useCallback(async () => {
    const currentConv = conversationRef.current;
    const active = isVoiceActiveRef.current;

    if (active) {
      await currentConv.endSession();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
      setVoiceState(false, "Idle");
    } else {
      try {
        const agentId = useSettingsStore.getState().elevenLabsAgentId;
        if (!agentId) throw new Error("Missing Settings");

        setVoiceState(false, "Connecting...");
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        const itinerary = useItineraryStore.getState().itinerary;
        const currentActiveDay = useItineraryStore.getState().activeDay;
        const userName = user?.user_metadata?.full_name
          || user?.user_metadata?.name
          || user?.email?.split("@")[0]
          || "traveler";

        let currentDaySummary = "No activities planned yet.";
        if (itinerary && itinerary.days[currentActiveDay - 1]) {
          const dayPlan = itinerary.days[currentActiveDay - 1];
          if (dayPlan.activities.length > 0) {
            currentDaySummary = dayPlan.activities.map((a, i) => `${i + 1}. ${a.activity}${a.time ? ` at ${a.time}` : ""}`).join("; ");
          }
        }

        // @ts-ignore
        await currentConv.startSession({
          agentId: agentId,
          dynamicVariables: {
            user_name: userName,
            destination: itinerary?.destination || "your trip",
            total_days: String(itinerary?.days?.length || 0),
            current_day: String(currentActiveDay),
            current_day_summary: currentDaySummary,
          },
        });
      } catch (e: any) {
        setVoiceState(false, "Error");
        if (e.message === "Missing Settings") {
          useSettingsStore.getState().setSettingsOpen(true);
        } else {
          alert(`Error starting voice agent: ${e.message || e}`);
        }
      }
    }
  }, [setVoiceState]);

  useEffect(() => {
    setVoiceToggleCallback(handleToggle);
    return () => setVoiceToggleCallback(() => console.warn("Agent unmounted"));
  }, [handleToggle, setVoiceToggleCallback]);

  return null;
}
