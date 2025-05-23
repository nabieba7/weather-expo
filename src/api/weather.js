import axios from "axios";
import { apiKey, API_CONFIG } from "../constants";

const BASE_URL = "http://api.weatherapi.com/v1";

// API call function
const apiCall = async (endpoint) => {
  try {
    const response = await axios.get(endpoint);
    return response.data;
  } catch (error) {
    console.error("API Error:", error.response?.data || error.message);
    return { error: "Unable to fetch data. Please try again later." };
  }
};

// Forecast Data Fetching
export const fetchWeatherForecast = async (params) => {
  const forecastUrl = `${BASE_URL}/forecast.json?key=${apiKey}&q=${params.cityName}&days=${params.days}&aqi=yes&alerts=yes`;
  return await apiCall(forecastUrl);
};

// Location Search Fetching
export const fetchLocations = async (params) => {
  const locationsUrl = `${BASE_URL}/search.json?key=${apiKey}&q=${params.cityName}`;
  return await apiCall(locationsUrl);
};
