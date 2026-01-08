
import { GoogleGenAI, Type } from "@google/genai";

if (!process.env.API_KEY) {
  console.error("API_KEY is missing. Please set GEMINI_API_KEY in your .env file.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateQuickItinerary = async (destination: string, days: number = 3, selectedInterests: string[] = []) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: `Create a detailed ${days}-day luxury travel itinerary for ${destination}. 
      The user is interested in: ${selectedInterests.length > 0 ? selectedInterests.join(", ") : "general highlights"}.
      Ensure these specific interests/attractions are included in the itinerary where appropriate.
      Return the response in JSON format. 
      For each day, provide a theme and 3-4 key activities (Morning, Afternoon, Evening).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            destination: { type: Type.STRING },
            days: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.INTEGER },
                  theme: { type: Type.STRING },
                  activities: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        time: { type: Type.STRING },
                        activity: { type: Type.STRING },
                        location: { type: Type.STRING },
                        description: { type: Type.STRING },
                        type: { type: Type.STRING, enum: ["activity", "flight", "hotel"] }
                      },
                      required: ["time", "activity", "location", "description"]
                    }
                  }
                },
                required: ["day", "theme", "activities"]
              }
            }
          },
          required: ["destination", "days"]
        }
      }
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

export const getDestinationAttractions = async (destination: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: `List 10 top specific tourist attractions, famous places, or must-do activities in ${destination}.
      Return ONLY a raw JSON array of strings. Do not include markdown formatting or backticks.
      Example: ["Eiffel Tower", "Louvre Museum", "Seine Cruise"]`,
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
