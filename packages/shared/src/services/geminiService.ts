
import { GoogleGenAI } from "@google/genai";
import { GEMINI_CONFIG } from "./geminiConfig";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GOOGLE_AI_API_KEY || '';

if (!API_KEY) {
  console.error("API_KEY is missing. Please set VITE_GEMINI_API_KEY in your .env file.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const generateQuickItinerary = async (destination: string, days: number = 3, selectedInterests: string[] = []) => {
  try {
    const config = GEMINI_CONFIG.endpoints.generateItinerary;

    const response = await ai.models.generateContent({
      model: config.model,
      contents: config.buildPrompt(destination, days, selectedInterests),
      config: config.generationConfig
    });

    const data = JSON.parse(response.text);

    // Inject IDs for drag-and-drop
    if (data.days) {
      data.days.forEach((day: any) => {
        if (day.activities) {
          day.activities.forEach((activity: any) => {
            activity.id = Math.random().toString(36).substr(2, 9);
          });
        }
      });
    }

    return data;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const analyzeTravelQuery = async (query: string) => {
  try {
    // System instruction for the travel assistant
    const prompt = `
      You are an expert travel assistant for "NextDestination.ai".
      Your goal is to helpfuly interact with users to understand their travel plans.
      
      User Query: "${query}"
      
      Analyze the query and extract:
      1. Destination (City/Country)
      2. Duration (in days, default to 3 if not specified but implied short trip, or null if unknown)
      3. Interests (list of strings like "Food", "History", "Adventure")
      4. Intent: 
         - "generate_itinerary": User wants a plan now and has provided enough info (at least destination).
         - "explore_suggestions": User is asking for ideas, general browsing, or vague queries better served by community lists.
         - "continue_chat": User context is still unclear, ask for more details.
      5. Response: A natural, friendly, brief reply to the user.
         - If "generate_itinerary": "Great! logic... I can plan that for you." (Don't say "I have generated", say "I can generate")
         - If "continue_chat": Ask for the missing key info (Destination is most important).

      Output strictly JSON:
      {
        "destination": "Paris" | null,
        "days": 3 | null,
        "interests": ["Food", "Museums"] | [],
        "intent": "generate_itinerary" | "explore_suggestions" | "continue_chat",
        "response": "String response to show user"
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });

    const text = response.text || "";

    // Extract JSON block (robust against markdown and preamble)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : text;

    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error analyzing query:", error);
    // Fallback based on simple keyword matching could go here
    return {
      destination: null,
      days: null,
      interests: [],
      intent: "continue_chat",
      response: "I'm having a bit of trouble connecting to my brain right now. Could you try asking that again?"
    };
  }
};

export const generateEmbedding = async (text: string): Promise<number[]> => {
  try {
    const config = GEMINI_CONFIG.models;
    const response = await ai.models.embedContent({
      model: config.embedding,
      contents: text,
      config: {
        outputDimensionality: 768
      }
    });
    return response.embeddings[0].values;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
};

export const getDestinationAttractions = async (destination: string): Promise<string[]> => {
  try {
    const config = GEMINI_CONFIG.endpoints.getAttractions;

    const response = await ai.models.generateContent({
      model: config.model,
      contents: config.buildPrompt(destination),
    });

    const text = response.text.replace(/```json|```/g, '').trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Error fetching attractions:", error);
    // Fallback attractions if API fails
    return [
      `Explore ${destination} Center`,
      "Local Food Tour",
      "Historical Museums",
      "City Park Walk",
      "Shopping District",
      "Iconic Landmarks"
    ];
  }
};

export const searchFlights = async (origin: string, destination: string, date: string) => {
  try {
    const config = GEMINI_CONFIG.endpoints.searchFlights;

    const response = await ai.models.generateContent({
      model: config.model,
      contents: config.buildPrompt(origin, destination, date),
      config: config.generationConfig
    });

    const text = response.text || "[]";
    return JSON.parse(text);
  } catch (error) {
    console.error("Error searching flights:", error);
    // Return empty array on error to allow frontend to handle gracefully
    return [];
  }
};

export const getDemoItinerary = () => {
  return {
    destination: "Paris, France",
    days: [
      {
        day: 1,
        theme: "Arrival & Romance",
        hasHotel: true,
        activities: [
          { id: 'a1', time: "10:00 AM", activity: "Check-in at Ritz Paris", location: "Place Vendôme", description: "Settle into your suite overlooking the square.", type: "hotel" },
          { id: 'a2', time: "02:00 PM", activity: "Eiffel Tower Ascent", location: "Champ de Mars", description: "Skip-the-line access to the summit for panoramic views.", type: "activity" },
          { id: 'a3', time: "07:00 PM", activity: "Seine Dinner Cruise", location: "Port de la Bourdonnais", description: "3-course gourmet dinner while gliding past illuminated monuments.", type: "activity" }
        ]
      },
      {
        day: 2,
        theme: "Art & History",
        hasHotel: true,
        activities: [
          { id: 'b1', time: "09:00 AM", activity: "Louvre Museum Private Tour", location: "Rue de Rivoli", description: "Expert-led tour focusing on the masterpieces.", type: "activity" },
          { id: 'b2', time: "01:00 PM", activity: "Lunch at Le Train Bleu", location: "Gare de Lyon", description: "Iconic Belle Époque restaurant.", type: "activity" },
          { id: 'b3', time: "03:00 PM", activity: "Montmartre Walking Tour", location: "Montmartre", description: "Explore the artistic history and Sacré-Cœur.", type: "activity" }
        ]
      },
      {
        day: 3,
        theme: "Fashion & Departure",
        hasHotel: true,
        activities: [
          { id: 'c1', time: "10:00 AM", activity: "Shopping at Galeries Lafayette", location: "Haussmann", description: "Personal shopper experience.", type: "activity" },
          { id: 'c2', time: "01:00 PM", activity: "Lunch at L'Avenue", location: "Avenue Montaigne", description: "Chic dining spot for fashion week spotting.", type: "activity" }
        ]
      }
    ],
    hasArrivalFlight: true,
    hasDepartureFlight: true
  };
};
