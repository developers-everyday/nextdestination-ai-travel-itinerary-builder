
interface Coordinates {
    lat: number;
    lng: number;
}

interface WeatherData {
    temp: number;
    condition: string; // "Sunny", "Cloudy", etc.
    icon: string;      // Emoji or icon name
    high: number;
    low: number;
    isForecast: boolean;
    isHistorical?: boolean;
}

// Map WMO Weather Codes to human readable format
const getWeatherCondition = (code: number): { condition: string; icon: string } => {
    switch (true) {
        case code === 0: return { condition: 'Clear Sky', icon: '☀️' };
        case [1, 2, 3].includes(code): return { condition: 'Partly Cloudy', icon: '⛅' };
        case [45, 48].includes(code): return { condition: 'Foggy', icon: '🌫️' };
        case [51, 53, 55, 56, 57].includes(code): return { condition: 'Drizzle', icon: '🌦️' };
        case [61, 63, 65, 66, 67].includes(code): return { condition: 'Rain', icon: '🌧️' };
        case [71, 73, 75, 77].includes(code): return { condition: 'Snow', icon: '🌨️' };
        case [80, 81, 82].includes(code): return { condition: 'Showers', icon: '🌦️' };
        case [95, 96, 99].includes(code): return { condition: 'Thunderstorm', icon: '⛈️' };
        default: return { condition: 'Unknown', icon: 'question_mark' };
    }
};


// Simple in-memory cache
const coordCache: Record<string, Coordinates> = {};
const weatherCache: Record<string, { timestamp: number; data: WeatherData }> = {};

export const getCoordinates = async (destination: string): Promise<Coordinates | null> => {
    // Check cache first
    if (coordCache[destination]) {
        return coordCache[destination];
    }

    try {
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destination)}&count=1&language=en&format=json`);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            const coords = {
                lat: data.results[0].latitude,
                lng: data.results[0].longitude
            };
            // Cache the result
            coordCache[destination] = coords;
            return coords;
        }
        return null; // Not found
    } catch (error) {
        console.error("Failed to fetch coordinates:", error);
        return null;
    }
};

export const getWeather = async (lat: number, lng: number, startDate?: Date, endDate?: Date): Promise<WeatherData | null> => {
    try {
        const today = new Date();
        const daysUntilStart = startDate ? (startDate.getTime() - today.getTime()) / (1000 * 3600 * 24) : 0;

        // 1. Current Weather (Default or near-term)
        // If no dates, or dates are in the past, or start date is very close (within 14 days)
        const isCurrent = !startDate || !endDate || startDate < today;
        const isForecast = !isCurrent && daysUntilStart <= 14;
        const isHistorical = !isCurrent && !isForecast;

        // Generate cache key
        const dateKey = startDate && endDate ? `${startDate.toISOString()}-${endDate.toISOString()}` : 'current';
        const cacheKey = `${lat},${lng}-${dateKey}`;

        // Check cache (TTL 10 minutes)
        if (weatherCache[cacheKey]) {
            const { timestamp, data } = weatherCache[cacheKey];
            if (Date.now() - timestamp < 10 * 60 * 1000) {
                console.log(`[Weather Cache Hit] ${cacheKey}`);
                return data;
            }
        }

        let url = "";

        if (isCurrent) {
            // Fetch current weather
            url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,is_day&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`;
        } else if (isForecast) {
            // Fetch forecast for specific dates (within range)
            const startStr = startDate!.toISOString().split('T')[0];
            const endStr = endDate!.toISOString().split('T')[0];
            url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&start_date=${startStr}&end_date=${endStr}`;
        } else {
            // Fetch Historical (Typical) Weather for previous year
            const lastYearStart = new Date(startDate!);
            lastYearStart.setFullYear(lastYearStart.getFullYear() - 1);
            const lastYearEnd = new Date(endDate!);
            lastYearEnd.setFullYear(lastYearEnd.getFullYear() - 1);

            const startStr = lastYearStart.toISOString().split('T')[0];
            const endStr = lastYearEnd.toISOString().split('T')[0];

            // Note: Using archive-api for historical data
            url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}&start_date=${startStr}&end_date=${endStr}&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`;
        }

        console.log(`Fetching weather from: ${url}`);
        const response = await fetch(url);
        const data = await response.json();

        let result: WeatherData | null = null;

        if (isCurrent) {
            const current = data.current;
            const daily = data.daily;

            if (!current || !daily) return null;

            const { condition, icon } = getWeatherCondition(current.weather_code);
            result = {
                temp: Math.round(current.temperature_2m),
                condition,
                icon,
                high: Math.round(daily.temperature_2m_max[0]),
                low: Math.round(daily.temperature_2m_min[0]),
                isForecast: false
            };
        } else {
            // Both Forecast and Historical return 'daily' arrays
            const daily = data.daily;

            if (!daily || !daily.temperature_2m_max) {
                return null;
            }

            const avgHigh = daily.temperature_2m_max.reduce((a: number, b: number) => a + b, 0) / daily.temperature_2m_max.length;
            const avgLow = daily.temperature_2m_min.reduce((a: number, b: number) => a + b, 0) / daily.temperature_2m_min.length;

            const code = daily.weather_code[0];
            const { condition, icon } = getWeatherCondition(code);

            result = {
                temp: Math.round((avgHigh + avgLow) / 2),
                condition: condition, // Just the condition, UI will handle "Typical" label
                icon,
                high: Math.round(avgHigh),
                low: Math.round(avgLow),
                isForecast: true,
                isHistorical: isHistorical
            };
        }

        if (result) {
            weatherCache[cacheKey] = { timestamp: Date.now(), data: result };
        }

        return result;

    } catch (error) {
        console.error("Failed to fetch weather:", error);
        return null;
    }
};
