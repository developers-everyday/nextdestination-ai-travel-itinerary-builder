import { useConversation } from "@elevenlabs/react";
import { useEffect, useCallback, useRef } from "react";
import { useItineraryStore } from "../store/useItineraryStore";
import { useSettingsStore } from "../store/useSettingsStore";

export default function VoiceAgent() {
    // Individual selectors to optimize renders
    const setFocusedLocation = useItineraryStore(state => state.setFocusedLocation);
    const addActivity = useItineraryStore(state => state.addActivity);
    const startJourney = useItineraryStore(state => state.startJourney);
    const nextStop = useItineraryStore(state => state.nextStop);
    const prevStop = useItineraryStore(state => state.prevStop);
    const addDay = useItineraryStore(state => state.addDay);

    // Voice specific actions
    const setVoiceToggleCallback = useItineraryStore(state => state.setVoiceToggleCallback);
    const setVoiceState = useItineraryStore(state => state.setVoiceState);
    const isVoiceActive = useItineraryStore(state => state.isVoiceActive);
    const isMuted = useItineraryStore(state => state.isMuted);

    // We only need the ID, not the whole store
    const elevenLabsAgentId = useSettingsStore(state => state.elevenLabsAgentId);

    // Single conversation hook with client tools
    const conversation = useConversation({
        onConnect: () => {
            console.log("Connected to ElevenLabs");
            setVoiceState(true, "Connected");
        },
        onDisconnect: (...args) => {
            console.warn("Disconnected from ElevenLabs", args);
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
            move_map: (parameters: { lat: number; lng: number }) => {
                setVoiceState(true, "Moving map...");
                setFocusedLocation([parameters.lng, parameters.lat]);
                return "Map moved.";
            },
            add_place: (parameters: { name: string; lat: number; lng: number; day?: number }) => {
                setVoiceState(true, `Adding ${parameters.name}...`);
                setFocusedLocation([parameters.lng, parameters.lat]);
                addActivity(parameters.day ? parameters.day - 1 : 0, {
                    activity: parameters.name,
                    description: "Added by Voice Agent",
                    location: `${parameters.lat}, ${parameters.lng}`,
                    time: "10:00",
                    coordinates: [parameters.lng, parameters.lat],
                    type: 'activity'
                });
                return `Added ${parameters.name} to itinerary.`;
            },
            add_day: (parameters: {}) => {
                setVoiceState(true, "Adding new day...");
                addDay();
                return "Added a new day to the itinerary.";
            },
            start_journey: (parameters: {}) => {
                setVoiceState(true, "Starting journey...");
                startJourney();
                return "Starting the journey simulation now.";
            },
            next_stop: (parameters: {}) => {
                setVoiceState(true, "Next stop...");
                nextStop();
                return "Moved to the next stop.";
            },
            previous_stop: (parameters: {}) => {
                setVoiceState(true, "Previous stop...");
                prevStop();
                return "Moved to the previous stop.";
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

                // @ts-ignore - agentId is correct for public agents despite type definition
                await currentConv.startSession({
                    agentId: agentId,
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
