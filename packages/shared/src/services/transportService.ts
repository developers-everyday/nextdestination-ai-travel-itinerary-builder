const API_HOST = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_BASE_URL = `${API_HOST}/api/transport`;

export const getTransportOptions = async (destination: string, dayActivities: any[], userLocation?: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/options`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ destination, dayActivities, userLocation })
        });
        if (!response.ok) throw new Error('Failed to fetch transport options');
        return await response.json();
    } catch (error) {
        console.error("Error fetching transport options:", error);
        throw error;
    }
};

export const getGeneralInfo = async (destination: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/general-info`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ destination })
        });
        if (!response.ok) throw new Error('Failed to fetch general info');
        return await response.json();
    } catch (error) {
        console.error("Error fetching general info:", error);
        throw error;
    }
};

export const getFlightEstimates = async (from: string, to: string, date: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/flight-estimates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ from, to, date })
        });
        if (!response.ok) throw new Error('Failed to fetch flight estimates');
        return await response.json();
    } catch (error) {
        console.error("Error fetching flight estimates:", error);
        throw error;
    }
};
