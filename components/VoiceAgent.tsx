
import { useConversation } from "@elevenlabs/react";
import { Mic, MicOff } from "lucide-react";
import { useState } from "react";
import { useItineraryStore } from "../store/useItineraryStore";
import { useSettingsStore } from "../store/useSettingsStore";

export default function VoiceAgent() {
    const { setFocusedLocation, addActivity, startJourney, nextStop, prevStop, addDay } = useItineraryStore();
    const { elevenLabsAgentId } = useSettingsStore();
    const [isActive, setIsActive] = useState(false);
    const [status, setStatus] = useState("Idle");

    // Single conversation hook with client tools
    const conversation = useConversation({
        onConnect: () => {
            console.log("Connected to ElevenLabs");
            setIsActive(true);
            setStatus("Connected");
        },
        onDisconnect: (...args) => {
            console.warn("Disconnected from ElevenLabs", args);
            setIsActive(false);
            setStatus("Disconnected");
        },
        onMessage: (message) => {
            console.log("Message:", message);
            if (message.source === "ai") {
                setStatus("Agent speaking...");
            }
        },
        onError: (e) => {
            console.error("Voice Agent Error:", e);
            setStatus(`Error: ${typeof e === 'string' ? e : "Check console"}`);
            // alert(`Voice Agent Error: ${typeof e === 'string' ? e : JSON.stringify(e)}`);
            setIsActive(false);
        },
        clientTools: {
            move_map: (parameters: { lat: number; lng: number }) => {
                console.log("Tool Call: move_map", parameters);
                setStatus("Moving map...");
                setFocusedLocation([parameters.lng, parameters.lat]);
                return "Map moved.";
            },
            add_place: (parameters: { name: string; lat: number; lng: number; day?: number }) => {
                console.log("Tool Call: add_place", parameters);
                setStatus(`Adding ${parameters.name}...`);
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
                console.log("Tool Call: add_day");
                setStatus("Adding a new day...");
                addDay();
                return "Added a new day to the itinerary.";
            },
            start_journey: (parameters: {}) => {
                console.log("Tool Call: start_journey");
                setStatus("Starting journey...");
                startJourney();
                return "Starting the journey simulation now.";
            },
            next_stop: (parameters: {}) => {
                console.log("Tool Call: next_stop");
                setStatus("Moving to next stop...");
                nextStop();
                return "Moved to the next stop.";
            },
            previous_stop: (parameters: {}) => {
                console.log("Tool Call: previous_stop");
                setStatus("Moving to previous stop...");
                prevStop();
                return "Moved to the previous stop.";
            }
        }
    });

    const handleToggle = async () => {
        if (isActive) {
            await conversation.endSession();
        } else {
            try {
                setStatus("Requesting microphone...");

                if (!elevenLabsAgentId || elevenLabsAgentId === "") {
                    throw new Error("Missing ElevenLabs Agent ID. Please configure it in Settings.");
                }

                await navigator.mediaDevices.getUserMedia({ audio: true });
                setStatus("Connecting...");

                console.log("Starting session with Agent ID:", elevenLabsAgentId);

                await conversation.startSession({
                    agentId: elevenLabsAgentId,
                });
            } catch (e: any) {
                console.error("Failed to start conversation:", e);
                setStatus("Connection failed");
                alert(`Error starting voice agent: ${e.message || e}`);
            }
        }
    };


    return (
        <div className="fixed bottom-6 right-6 flex flex-col items-end gap-4 pointer-events-auto z-[1000]">
            {/* Status Indicator */}
            <div
                className={`transition-all duration-300 transform ${isActive || status !== 'Idle' ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}
            >
                <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-2xl shadow-xl border border-white/20 text-xs font-bold text-slate-600 flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-red-500 animate-pulse' : 'bg-slate-400'}`} />
                    {status}
                </div>
            </div>

            <div className="flex items-center gap-3">
                {/* Settings Button */}
                <button
                    onClick={() => useSettingsStore.getState().setSettingsOpen(true)}
                    className="w-10 h-10 bg-white hover:bg-slate-50 rounded-full shadow-lg text-slate-600 hover:text-indigo-600 flex items-center justify-center transition-all hover:scale-110 active:scale-95 group"
                    title="AI Settings"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-90 transition-transform duration-500">
                        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                        <circle cx="12" cy="12" r="3" />
                    </svg>
                </button>

                {/* Mic Button */}
                <button
                    onClick={handleToggle}
                    className={`relative w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 ${isActive
                            ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/40"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/40"
                        }`}
                    title={isActive ? "Stop Voice Agent" : "Start Voice Agent"}
                >
                    {isActive && (
                        <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75"></span>
                    )}
                    <div className="relative z-10">
                        {isActive ? <MicOff size={24} /> : <Mic size={24} />}
                    </div>
                </button>
            </div>
        </div>
    );

}
