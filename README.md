# weather-expo
# Weather App

A simple React Native weather application that shows current conditions and forecasts.

## Features

- Current weather (temperature, conditions, wind, humidity)
- 5-day forecast
- Search for any city
- Recently viewed locations
- Works offline
- Switch between Celsius/Fahrenheit

## Setup

1. Clone the repo:
   ```bash
   git clone https://github.com/yourname/weather-app.git
Install dependencies:
bash
cd weather-app
npm install
Get a free API key from WeatherAPI.com and add it to a .env file:
WEATHER_API_KEY=your_key_here
Start the app:
bash
npm start
How to Use

Tap the search icon to find weather for any city
Your recent searches will appear below
Toggle temperature units in the settings
Pull down to refresh weather data
Project Structure

/src/api - Weather API service
/src/components - Reusable UI elements
/src/screens - Main app screens
/assets - Images and icons
Dependencies

React Native
Axios (for API calls)
AsyncStorage (for caching)
React Navigation (if using multiple screens)
