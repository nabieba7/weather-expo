import {
  View,
  Text,
  SafeAreaView,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { theme } from "../theme";
import { MagnifyingGlassIcon as SearchIcon } from "react-native-heroicons/outline";
import { MapPinIcon as MapIcon } from "react-native-heroicons/solid";
import { Feather } from "@expo/vector-icons";
import { Entypo } from "@expo/vector-icons";
import { FontAwesome } from "@expo/vector-icons";
import { MaterialIcons } from "@expo/vector-icons";
import { debounce } from "lodash";
import { fetchLocations, fetchWeatherForecast } from "../api/weather";
import { weatherImages, weatherBackgrounds } from "../constants";
import * as Progress from "react-native-progress";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function HomeScreen() {
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [locations, setLocations] = useState([]);
  const [weather, setWeather] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unit, setUnit] = useState("celsius");
  const [searchHistory, setSearchHistory] = useState([]);

  const saveSearchHistory = async (history) => {
    try {
      await AsyncStorage.setItem("searchHistory", JSON.stringify(history));
    } catch (e) {
      console.error("Failed to save search history", e);
    }
  };

  const loadSearchHistory = async () => {
    try {
      const history = await AsyncStorage.getItem("searchHistory");
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
    } catch (e) {
      console.error("Failed to load search history", e);
    }
  };

  const clearSearchHistory = async () => {
    try {
      await AsyncStorage.removeItem("searchHistory");
      setSearchHistory([]);
      Alert.alert("Success", "Search history cleared.");
    } catch (e) {
      console.error("Failed to clear search history", e);
      Alert.alert("Error", "Failed to clear search history.");
    }
  };

  const handleLocation = async (loc) => {
    try {
      setLocations([]);
      setShowSearchBar(false);
      setLoading(true);
      setError(null);

      const data = await fetchWeatherForecast({
        cityName: loc.name,
        days: "7",
      });

      if (data && data.current && data.location && data.forecast) {
        setWeather(data);
        const newHistory = [
          loc,
          ...searchHistory.filter((item) => item.name !== loc.name),
        ].slice(0, 5);
        setSearchHistory(newHistory);
        saveSearchHistory(newHistory);
      } else {
        setError("Failed to fetch weather data for this location.");
        Alert.alert("Error", "Could not retrieve weather data. Please try another city.");
      }
    } catch (err) {
      setError("Failed to fetch weather data. Please check your connection or try again.");
      console.error("Location error:", err);
      Alert.alert("Error", "Failed to fetch weather data.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (value) => {
    if (value && value.length > 2) {
      try {
        const data = await fetchLocations({ cityName: value });
        if (data && data.length > 0) {
          setLocations(data);
          setError(null);
        } else {
          setLocations([]);
          setError("No locations found for this search.");
        }
      } catch (err) {
        setLocations([]);
        setError("Failed to search locations. Please try again.");
        console.error("Search error:", err);
      }
    } else {
      setLocations([]);
      setError(null);
    }
  };

  const fetchMyWeatherData = async () => {
    try {
      setLoading(true);
      setError(null);
      const lastCity = searchHistory.length > 0 ? searchHistory[0].name : "Riyadh";
      const data = await fetchWeatherForecast({
        cityName: lastCity,
        days: "7",
      });
      if (data && data.current && data.location && data.forecast) {
        setWeather(data);
      } else {
        setError("Failed to load initial weather data. Please check your network.");
        Alert.alert("Error", "Failed to load initial weather data.");
      }
    } catch (err) {
      setError("Failed to load initial weather data. Please check your network.");
      console.error("Initial load error:", err);
      Alert.alert("Error", "Failed to load initial weather data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSearchHistory();
    fetchMyWeatherData();
  }, []);

  const handleDebounce = useCallback(debounce(handleSearch, 1000), []);
  const { current, location, forecast } = weather;

  const backgroundSource = current?.condition?.text
    ? weatherBackgrounds[current.condition.text] || weatherBackgrounds["other"]
    : weatherBackgrounds["other"];

  const now = new Date();
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  };
  const currentDateTime = now.toLocaleDateString("en-US", options);

  return (
    <View className="flex-1 relative">
      <StatusBar style="light" />
      <Image
        blurRadius={13}
        source={backgroundSource}
        className="h-full w-full absolute"
        defaultSource={weatherBackgrounds["other"]}
      />

      {loading ? (
        <View className="flex-1 flex-row justify-center items-center">
          <Progress.CircleSnail thickness={10} size={140} color="white" />
        </View>
      ) : (
        <SafeAreaView className="flex flex-1">
          {/* SEARCH BAR SECTION */}
          <View className="mx-4 relative z-50">
            <View
              className="flex-row justify-end items-center rounded-full"
              style={{
                backgroundColor: showSearchBar
                  ? theme.bgWhite(0.2)
                  : "transparent",
              }}
            >
              {showSearchBar && (
                <TextInput
                  onChangeText={handleDebounce}
                  placeholder="Search City"
                  placeholderTextColor={"white"}
                  className="h-12 pl-4 text-xl pb-1 flex-1 text-white"
                />
              )}

              <TouchableOpacity
                onPress={() => {
                  setShowSearchBar(!showSearchBar);
                  setLocations([]);
                  setError(null);
                }}
                style={{ backgroundColor: theme.bgWhite(0.3) }}
                className="p-3 rounded-full m-1"
              >
                <SearchIcon size={25} color="white" />
              </TouchableOpacity>
            </View>

            {locations.length > 0 && showSearchBar && (
              <View
                className="absolute w-full top-16 rounded-3xl"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.6)",
                  borderBottomColor: "#f0f0f0",
                }}
              >
                {locations.map((loc, index) => {
                  const showBorder = index + 1 !== locations.length;
                  const borderClass = showBorder
                    ? "border-b-2 border-b-gray-400"
                    : "";
                  return (
                    <TouchableOpacity
                      onPress={() => handleLocation(loc)}
                      key={index}
                      className={`flex-row items-center m-1 p-3 px-4 ${borderClass}`}
                    >
                      <MapIcon size={20} color={"black"} />
                      <Text className="text-black font-bold text-lg ml-2">
                        {loc?.name}, {loc?.country}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Search History Display */}
            {!showSearchBar && searchHistory.length > 0 && (
              <View className="mt-4">
                <Text className="text-white text-lg font-semibold mb-2">Recent Searches:</Text>
                {searchHistory.map((loc, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleLocation(loc)}
                    className="flex-row items-center bg-gray-700/50 rounded-full px-4 py-2 mb-2"
                  >
                    <MapIcon size={18} color={"white"} />
                    <Text className="text-white ml-2">{loc?.name}, {loc?.country}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  onPress={clearSearchHistory}
                  className="flex-row items-center bg-red-500/80 rounded-full px-4 py-2 mt-2 self-start"
                >
                  <MaterialIcons name="clear-all" size={20} color="white" />
                  <Text className="text-white ml-2">Clear History</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* WEATHER DISPLAY SECTION */}
          {error ? (
            <View className="flex-1 justify-center items-center p-4">
              <Text className="text-white text-lg text-center font-semibold mb-4">{error}</Text>
              <TouchableOpacity
                onPress={fetchMyWeatherData}
                className="mt-4 px-6 py-3 bg-blue-500 rounded-full"
              >
                <Text className="text-white text-lg font-bold">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-1 flex justify-around mx-4 mb-2">
              {/* Location */}
              <View className="flex-row items-center justify-center mt-4">
                <Text className="text-white text-3xl font-bold">
                  {location?.name},
                </Text>
                <Text className="text-lg text-white font-semibold ml-1">
                  {location?.country}
                </Text>
              </View>
              {/* Current Date and Time */}
              <Text className="text-center text-sm text-white-400 mt-1">
                {currentDateTime}
              </Text>

              {/* Weather Icon */}
              <View className="justify-center flex-row mt-4">
                <Image
                  source={weatherImages[current?.condition?.text] || weatherImages["other"]}
                  className="w-52 h-52"
                />
              </View>

              {/* Temperature */}
              <View className="mt-4">
                <Text className="text-center text-6xl text-white font-bold">
                  {unit === "celsius" ? current?.temp_c : current?.temp_f}&#176;
                </Text>
                <Text className="text-center text-xl text-white tracking-widest mt-1">
                  {current?.condition?.text}
                </Text>
                {/* Temperature Toggle */}
                <TouchableOpacity
                  onPress={() => setUnit(unit === "celsius" ? "fahrenheit" : "celsius")}
                  className="mt-2 p-2 rounded-full self-center"
                  style={{ backgroundColor: theme.bgWhite(0.3) }}
                >
                  <Text className="text-white text-sm">
                    Show in {unit === "celsius" ? "Fahrenheit" : "Celsius"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Weather Stats */}
              <View className="flex-row justify-around items-center mt-6">
                <View className="flex-row items-center">
                  <Feather name="wind" size={25} color="white" />
                  <Text className="text-white text-lg font-semibold ml-2">
                    {current?.wind_kph} km/h
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Entypo name="drop" size={25} color="white" />
                  <Text className="text-white text-lg font-semibold ml-2">
                    {current?.humidity}%
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Feather name="eye" size={25} color="white" />
                  <Text className="text-white text-lg font-semibold ml-2">
                    {current?.vis_km || '--'} km
                  </Text>
                </View>
              </View>

              {/* Daily Forecast */}
              <View className="mt-8 mb-4">
                <View className="flex-row items-center">
                  <FontAwesome name="calendar" size={25} color="white" />
                  <Text className="text-white font-semibold ml-3 text-lg">
                    Daily Forecast
                  </Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
                  {forecast?.forecastday?.map((days, index) => {
                    const date = new Date(days.date);
                    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
                    return (
                      <View
                        key={index}
                        className="w-28 rounded-3xl py-4 px-3 ml-2 justify-center items-center"
                        style={{ backgroundColor: theme.bgWhite(0.3) }}
                      >
                        <Image
                          source={weatherImages[days?.day?.condition?.text] || weatherImages["other"]}
                          className="w-10 h-10 mx-auto"
                        />
                        <Text className="text-slate-300 font-semibold text-center py-1">
                          {dayName}
                        </Text>
                        <Text className="text-white font-semibold text-lg text-center">
                          {unit === "celsius" ? days?.day?.avgtemp_c : days?.day?.avgtemp_f}&#176;
                        </Text>
                        <View className="flex-row justify-center items-center mt-1">
                            <Text className="text-white text-xs mr-1">H:</Text>
                            <Text className="text-white text-xs font-semibold">
                                {unit === "celsius" ? days?.day?.maxtemp_c : days?.day?.maxtemp_f}&#176;
                            </Text>
                        </View>
                        <View className="flex-row justify-center items-center">
                            <Text className="text-white text-xs mr-1">L:</Text>
                            <Text className="text-white text-xs font-semibold">
                                {unit === "celsius" ? days?.day?.mintemp_c : days?.day?.mintemp_f}&#176;
                            </Text>
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          )}
        </SafeAreaView>
      )}
    </View>
  );
}