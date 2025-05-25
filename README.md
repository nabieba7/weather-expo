# Weather App



---

## Features

✔ **Real-time weather data** from WeatherAPI
✔ **5-day forecast** (with potential for hourly breakdowns as a future improvement)
✔ **City search** with autocomplete and debouncing
✔ **Offline caching** using AsyncStorage
✔ **Error handling** for network issues and invalid data
✔ **Responsive UI** for mobile devices
✔ **Unit Toggle:** Switch between Celsius and Fahrenheit.
✔ **Pull to Refresh:** Simply pull down on the screen to get the latest weather data.
✔ **Dynamic Backgrounds:** Visually appealing backgrounds that change based on current weather conditions.
✔ **Theming:** Supports dynamic light and dark modes based on system preferences, with improved contrast for readability.
✔ **Accessibility:** Includes `accessibilityLabel` and `accessibilityHint` for improved screen reader support.

---

## Technologies Used

* **React Native:** For building native mobile applications using JavaScript.
* **Expo:** A framework and platform for universal React applications, simplifying development and deployment.
* **WeatherAPI.com:** The external API used for fetching weather data.
* **@react-native-async-storage/async-storage:** For local data persistence (search history, cached weather).
* **@react-native-community/netinfo:** To monitor network connectivity status.
* **lodash (debounce):** For optimizing search input by limiting API calls.
* **react-native-heroicons & @expo/vector-icons:** For a wide range of customizable icons.
* **react-native-progress:** For displaying a circular loading indicator.
* **react-native-dotenv:** (Implied for `.env` usage) For managing environment variables like API keys.
* **Tailwind CSS (via NativeWind or similar):** For utility-first styling.

---

## Setup & Run

Follow these steps to get the project up and running on your local machine:

### Prerequisites

* **Node.js:** (LTS version recommended)
* **npm or Yarn:** (Yarn recommended for React Native)
* **Expo CLI:** Install globally if you haven't already:
    ```bash
    npm install -g expo-cli
    ```
* A physical device with the **Expo Go** app installed, or an Android emulator/iOS simulator.

### API Key Setup

1.  **Obtain an API Key:** This application uses [WeatherAPI.com](https://www.weatherapi.com/) for weather data.
    * Go to [WeatherAPI.com](https://www.weatherapi.com/) and sign up for a free developer account.
    * Obtain your unique API key from your dashboard.

2.  **Create `.env` file:** In the root directory of your project (same level as `package.json`), create a file named `.env`.

3.  **Add your API Key:** Inside the `.env` file, add the following line, replacing `YOUR_WEATHERAPI_KEY_HERE` with your actual key:
    ```
    WEATHER_API_KEY=YOUR_WEATHERAPI_KEY_HERE
    ```
    * **Important:** To prevent your API key from being committed to public version control, ensure you have `.env` listed in your `.gitignore` file. If not, add `/.env` to `.gitignore`.

### Installation Steps

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/nabieba7/weather-expo.git](https://github.com/nabieba7/weather-expo.git) 
    cd weather-expo
    ```

2.  **Install dependencies:**
    ```bash
    npm install # or yarn install
    ```

3.  **Run the application:**
    ```bash
    npx expo start
    ```
    This command will start the Expo development server and open a new tab in your web browser (Expo Dev Tools). You can then:
    * Scan the QR code with the **Expo Go** app on your physical mobile device.
    * Press `a` in the terminal to open on an Android emulator.
    * Press `i` in the terminal to open on an iOS simulator (macOS only, requires Xcode).

---

## Project Structure
React Navigation (if using multiple screens)
