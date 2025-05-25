import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage

const apiKey = '4d98b984bb1f47eca38153016241912'; 
const forecastEndpoint = params => `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${params.cityName}&days=${params.days}&aqi=no&alerts=no`;
const searchEndpoint = params => `https://api.weatherapi.com/v1/search.json?key=${apiKey}&q=${params.cityName}`;

// Cache duration (e.g., 30 minutes)
const WEATHER_CACHE_DURATION = 30 * 60 * 1000; // milliseconds

// Generic API call function with enhanced error handling
const apiCall = async (endpoint) => {
    try {
        const response = await axios.get(endpoint);

        // Check for specific API error response (e.g., from WeatherAPI)
        if (response.data && response.data.error) {
            const apiError = response.data.error;
            const error = new Error(apiError.message || "API error occurred.");
            error.statusCode = response.status;
            error.code = apiError.code; // Specific API error code
            throw error;
        }

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            // Network error (no internet, DNS error, etc.)
            if (!error.response) {
                const networkError = new Error("Network error. Please check your internet connection.");
                networkError.isNetworkError = true;
                throw networkError;
            }
            // HTTP error response from API (e.g., 400, 401, 403, 404, 500)
            const apiError = new Error(error.response.data?.error?.message || `HTTP error: ${error.response.status}`);
            apiError.statusCode = error.response.status;
            apiError.code = error.response.data?.error?.code; // Specific API error code
            throw apiError;
        } else {
            // Other unexpected errors
            console.error('Unexpected API Call Error:', error);
            throw new Error("An unexpected error occurred.");
        }
    }
}

// Function to save weather data to cache
export const saveWeatherDataToCache = async (cityName, data) => {
    try {
        const cacheData = {
            data: data,
            timestamp: Date.now()
        };
        await AsyncStorage.setItem(`WEATHER_CACHE_KEY_${cityName.toLowerCase()}`, JSON.stringify(cacheData));
    } catch (e) {
        console.error("Error saving weather data to cache:", e);
    }
};

// Function to get weather data from cache
export const getWeatherDataFromCache = async (cityName) => {
    try {
        const cachedItem = await AsyncStorage.getItem(`WEATHER_CACHE_KEY_${cityName.toLowerCase()}`);
        if (cachedItem) {
            const { data, timestamp } = JSON.parse(cachedItem);
            if (Date.now() - timestamp < WEATHER_CACHE_DURATION) {
                console.log(`Using cached data for ${cityName}`);
                return data; // Return fresh cached data
            } else {
                console.log(`Cached data for ${cityName} is stale.`);
                return null; // Data is stale
            }
        }
    } catch (e) {
        console.error("Error retrieving weather data from cache:", e);
    }
    return null; // No cached data or error
};


export const fetchWeatherForecast = async (params) => {
    const cityName = params.cityName;
    // Try to get from cache first
    const cachedData = await getWeatherDataFromCache(cityName);
    if (cachedData) {
        return cachedData;
    }

    // If not in cache or stale, fetch from API
    const data = await apiCall(forecastEndpoint(params));
    // If successful, save to cache
    if (data) {
        await saveWeatherDataToCache(cityName, data);
    }
    return data;
}

export const fetchLocations = (params) => {
    // Location search is less critical for caching, as results change dynamically
    // and debounce handles rapid typing.
    return apiCall(searchEndpoint(params));
}