import {
  View,
  Text,
  SafeAreaView,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  LayoutAnimation,
  UIManager,
  useWindowDimensions,
  RefreshControl, // Import RefreshControl
} from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { theme } from "../theme";
import { useAppTheme } from '../themes';

// Icon Imports
import { MagnifyingGlassIcon as SearchIcon } from "react-native-heroicons/outline";
import { MapPinIcon as MapIcon } from "react-native-heroicons/solid";
import { Feather } from "@expo/vector-icons";
import { Entypo } from "@expo/vector-icons";
import { FontAwesome } from "@expo/vector-icons";
import { MaterialIcons } from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo";

import { debounce } from "lodash";
import { fetchLocations, fetchWeatherForecast, getWeatherDataFromCache } from "../api/weather";
import { weatherImages, weatherBackgrounds } from "../constants";
import * as Progress from "react-native-progress";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental &&
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function HomeScreen() {
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [locations, setLocations] = useState([]);
  const [weather, setWeather] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unit, setUnit] = useState("celsius");
  const [searchHistory, setSearchHistory] = useState([]);
  const [isConnected, setIsConnected] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // New state for pull-to-refresh

  const { colors, scheme } = useAppTheme();
  const { width, height } = useWindowDimensions();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
      if (!state.isConnected) {
        // Only show alert if it's a transition to offline, not on initial load if already offline
        // This prevents multiple "No Internet" alerts on app start
        if (isConnected) { // Check previous state to ensure it's a new disconnect
           Alert.alert("No Internet", "You are currently offline. Displaying cached data if available.");
        }
      }
    });

    return () => unsubscribe();
  }, [isConnected]); // Added isConnected to dependency array to properly track state change

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
    Alert.alert(
      "Clear History",
      "Are you sure you want to clear your search history?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem("searchHistory");
              setSearchHistory([]);
              Alert.alert("Success", "Search history cleared.");
            } catch (e) {
              console.error("Failed to clear search history", e);
              Alert.alert("Error", "Failed to clear search history.");
            }
          },
        },
      ]
    );
  };

  const handleLocation = async (loc) => {
    try {
      setLocations([]);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setShowSearchBar(false);
      setLoading(true);
      setError(null);

      if (!isConnected) {
        const cachedData = await getWeatherDataFromCache(loc.name);
        if (cachedData) {
          setWeather(cachedData);
          setLoading(false);
          Alert.alert("Offline Mode", "Displaying cached data for " + loc.name + ". Connect to internet for live updates.");
          return;
        } else {
          setError("You are offline and no cached data available for this city.");
          setLoading(false);
          return;
        }
      }

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
        setError("Failed to fetch weather data for this location. Please try another city.");
      }
    } catch (err) {
      setError(err.message || "Failed to fetch weather data. Please check your connection or try again.");
      console.error("Location error:", err);
      Alert.alert("Error", err.message || "Failed to fetch weather data.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (value) => {
    if (!isConnected) {
      setLocations([]);
      setError("You are offline. Cannot perform live searches.");
      return;
    }

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
        setError(err.message || "Failed to search locations. Please try again.");
        console.error("Search error:", err);
      }
    } else {
      setLocations([]);
      setError(null);
    }
  };

  const fetchMyWeatherData = async () => {
    try {
      // Don't set loading to true if refreshing, as refreshing will handle its own indicator
      if (!refreshing) {
        setLoading(true);
      }
      setError(null);
      const lastCity = searchHistory.length > 0 ? searchHistory[0].name : "Riyadh"; // Default to Riyadh if no history

      if (!isConnected) {
        const cachedData = await getWeatherDataFromCache(lastCity);
        if (cachedData) {
          setWeather(cachedData);
          Alert.alert("Offline Mode", "Displaying cached data for " + lastCity + ". Connect to internet for live updates.");
        } else {
          setError("You are offline and no cached data available for your last city.");
        }
        setLoading(false); // Ensure loading is false when offline
        setRefreshing(false); // Ensure refreshing is false
        return;
      }

      const data = await fetchWeatherForecast({
        cityName: lastCity,
        days: "7",
      });

      if (data && data.current && data.location && data.forecast) {
        setWeather(data);
      } else {
        setError("Failed to load initial weather data. Please check your network or try another city.");
      }
    } catch (err) {
      setError(err.message || "Failed to load initial weather data. Please check your network.");
      console.error("Initial load error:", err);
      Alert.alert("Error", err.message || "Failed to load initial weather data.");
    } finally {
      setLoading(false);
      setRefreshing(false); // Always set refreshing to false when done
    }
  };

  useEffect(() => {
    loadSearchHistory();
    fetchMyWeatherData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMyWeatherData();
  }, [searchHistory, isConnected]); // Added dependencies for onRefresh

  const handleDebounce = useCallback(debounce(handleSearch, 1000), [isConnected]);
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
    <View className="flex-1 relative" style={{ backgroundColor: colors.background }}>
      <StatusBar style={scheme === 'dark' ? "light" : "dark"} />
      <Image
        blurRadius={13}
        source={backgroundSource}
        className="h-full w-full absolute"
        defaultSource={weatherBackgrounds["other"]}
        accessibilityLabel="Current weather background image"
      />

      {/* Offline Banner */}
      {!isConnected && (
        <View className="absolute top-0 left-0 right-0 p-2 items-center z-50" style={{ backgroundColor: colors.errorText, paddingTop: Platform.OS === 'android' ? 30 : 0 }}>
          <Text className="font-semibold" style={{ color: colors.text }}>No Internet Connection</Text>
        </View>
      )}

      {loading && !refreshing ? ( // Show initial loading only, not during refresh
        <View className="flex-1 flex-row justify-center items-center">
          <Progress.CircleSnail thickness={10} size={140} color={colors.text} />
        </View>
      ) : (
        <SafeAreaView className="flex flex-1" style={!isConnected ? { paddingTop: Platform.OS === 'android' ? 40 : 20 } : null}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }} // Ensure content can grow to fill the screen
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.text} // Color of the refresh indicator
                colors={[colors.text]} // For Android
                progressBackgroundColor={colors.cardBackground} // For Android
              />
            }
          >
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
                    placeholderTextColor={colors.inputPlaceholder}
                    className="h-12 pl-4 text-xl pb-1 flex-1"
                    style={{
                      color: colors.inputTextColor,
                      backgroundColor: colors.searchBarBackground, // Apply distinct background
                      borderRadius: 25, // Make it rounded like the parent container
                      paddingHorizontal: 15,
                    }}
                    accessibilityLabel="City search input"
                    accessibilityHint="Type city name to search for weather"
                  />
                )}

                <TouchableOpacity
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setShowSearchBar(!showSearchBar);
                    setLocations([]);
                    setError(null);
                  }}
                  style={{ backgroundColor: theme.bgWhite(0.3) }}
                  className="p-3 rounded-full m-1"
                  accessibilityLabel={showSearchBar ? "Hide search bar" : "Show search bar"}
                >
                  <SearchIcon size={25} color={colors.text} />
                </TouchableOpacity>
              </View>

              {locations.length > 0 && showSearchBar && (
                <View
                  className="absolute w-full top-16 rounded-3xl"
                  style={{ 
                    maxHeight: 200,
                    backgroundColor: colors.cardBackground,
                  }}
                >
                <ScrollView
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled
                  >
                    {locations.map((loc, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => handleLocation(loc)}
                        className="p-3 border-b border-neutral-300 dark:border-neutral-600"
                        style={{
                          backgroundColor: colors.cardBackground,
                        }}
                        accessibilityLabel={`Select ${loc.name}, ${loc.country}`}
                      >
                        <Text style={{ color: colors.text }} className="text-base">
                          {loc.name}, {loc.country}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {locations.map((loc, index) => {
                    const showBorder = index + 1 !== locations.length;
                    return (
                      <TouchableOpacity
                        onPress={() => handleLocation(loc)}
                        key={index}
                        className={`flex-row items-center m-1 p-3 px-4`}
                        style={{ borderBottomColor: showBorder ? colors.border : 'transparent', borderBottomWidth: showBorder ? 1 : 0 }}
                        accessibilityLabel={`Select ${loc?.name}, ${loc?.country}`}
                      >
                        <MapIcon size={20} color={colors.text} />
                        <Text className="font-bold text-lg ml-2" style={{ color: colors.text }}>
                          {loc?.name}, {loc?.country}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Search History Display (Always visible below search bar when not searching) */}
            {!showSearchBar && searchHistory.length > 0 && (
              <View className="mx-4 mt-4">
                <Text className="text-lg font-semibold mb-2" style={{ color: colors.text }}>Recent Searches:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
                    {searchHistory.map((loc, index) => (
                    <TouchableOpacity
                        key={index}
                        onPress={() => handleLocation(loc)}
                        className="flex-row items-center rounded-full px-4 py-2 mr-2"
                        style={{ backgroundColor: colors.cardBackground }}
                        accessibilityLabel={`View weather for ${loc?.name}`}
                    >
                        <MapIcon size={18} color={colors.text} />
                        <Text className="ml-2" style={{ color: colors.text }}>{loc?.name}</Text>
                    </TouchableOpacity>
                    ))}
                </ScrollView>
                <TouchableOpacity
                  onPress={clearSearchHistory}
                  className="flex-row items-center rounded-full px-4 py-2 mt-2 self-start"
                  style={{ backgroundColor: colors.primary }}
                  accessibilityLabel="Clear all search history"
                >
                  <MaterialIcons name="clear-all" size={20} color={colors.text} />
                  <Text className="ml-2" style={{ color: colors.text }}>Clear History</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* WEATHER DISPLAY SECTION */}
            {error ? (
              <View className="flex-1 justify-center items-center p-4">
                <Text className="text-lg text-center font-semibold mb-4" style={{ color: colors.errorText }}>{error}</Text>
                {!isConnected && !loading && (
                  <Text className="text-sm text-center" style={{ color: colors.subText }}>
                    Connect to internet to refresh data.
                  </Text>
                )}
                {isConnected && (
                  <TouchableOpacity
                    onPress={fetchMyWeatherData}
                    className="mt-4 px-6 py-3 rounded-full"
                    style={{ backgroundColor: colors.primary }}
                    accessibilityLabel="Retry fetching weather data"
                  >
                    <Text className="text-lg font-bold" style={{ color: colors.text }}>Retry</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View className="flex-1 flex justify-around mx-4 mb-2">
                {/* Location */}
                <View className="flex-row items-center justify-center mt-4">
                  <Text className="text-3xl font-bold" style={{ color: colors.text }}>
                    {location?.name},
                  </Text>
                  <Text className="text-lg font-semibold ml-1" style={{ color: colors.subText }}>
                    {location?.country}
                  </Text>
                </View>
                {/* Current Date and Time */}
                <Text className="text-center text-sm mt-1" style={{ color: colors.subText }}>
                  {currentDateTime}
                </Text>

                {/* Weather Icon */}
                <View className="justify-center flex-row mt-4">
                  <Image
                    source={weatherImages[current?.condition?.text] || weatherImages["other"]}
                    style={{ width: width * 0.5, height: width * 0.5 }}
                    accessibilityLabel={`Current weather: ${current?.condition?.text}`}
                  />
                </View>

                {/* Temperature */}
                <View className="mt-4">
                  <Text className="text-center text-6xl font-bold" style={{ color: colors.text }}>
                    {unit === "celsius" ? current?.temp_c : current?.temp_f}&#176;
                  </Text>
                  <Text className="text-center text-xl tracking-widest mt-1" style={{ color: colors.subText }}>
                    {current?.condition?.text}
                  </Text>
                  {/* Temperature Toggle */}
                  <TouchableOpacity
                    onPress={() => setUnit(unit === "celsius" ? "fahrenheit" : "celsius")}
                    className="mt-2 p-2 rounded-full self-center"
                    style={{ backgroundColor: colors.cardBackground }}
                    accessibilityLabel={`Switch to ${unit === "celsius" ? "Fahrenheit" : "Celsius"}`}
                  >
                    <Text className="text-sm" style={{ color: colors.text }}>
                      Show in {unit === "celsius" ? "Fahrenheit" : "Celsius"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Weather Stats */}
                <View className="flex-row justify-around items-center mt-6">
                  <View className="flex-row items-center">
                    <Feather name="wind" size={25} color={colors.text} />
                    <Text className="text-lg font-semibold ml-2" style={{ color: colors.text }}>
                      {current?.wind_kph} km/h
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Entypo name="drop" size={25} color={colors.text} />
                    <Text className="text-lg font-semibold ml-2" style={{ color: colors.text }}>
                      {current?.humidity}%
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Feather name="eye" size={25} color={colors.text} />
                    <Text className="text-lg font-semibold ml-2" style={{ color: colors.text }}>
                      {current?.vis_km || '--'} km
                    </Text>
                  </View>
                </View>

                {/* Daily Forecast */}
                <View className="mt-8 mb-4">
                  <View className="flex-row items-center">
                    <FontAwesome name="calendar" size={25} color={colors.text} />
                    <Text className="font-semibold ml-3 text-lg" style={{ color: colors.text }}>
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
                          style={{ backgroundColor: colors.cardBackground }}
                        >
                          <Image
                            source={weatherImages[days?.day?.condition?.text] || weatherImages["other"]}
                            className="w-10 h-10 mx-auto"
                            accessibilityLabel={`Forecast for ${dayName}: ${days?.day?.condition?.text}`}
                          />
                          <Text className="font-semibold text-center py-1" style={{ color: colors.subText }}>
                            {dayName}
                          </Text>
                          <Text className="font-semibold text-lg text-center" style={{ color: colors.text }}>
                            {unit === "celsius" ? days?.day?.avgtemp_c : days?.day?.avgtemp_f}&#176;
                          </Text>
                          <View className="flex-row justify-center items-center mt-1">
                              <Text className="text-xs mr-1" style={{ color: colors.subText }}>H:</Text>
                              <Text className="text-xs font-semibold" style={{ color: colors.text }}>
                                  {unit === "celsius" ? days?.day?.maxtemp_c : days?.day?.maxtemp_f}&#176;
                              </Text>
                          </View>
                          <View className="flex-row justify-center items-center">
                              <Text className="text-xs mr-1" style={{ color: colors.subText }}>L:</Text>
                              <Text className="text-xs font-semibold" style={{ color: colors.text }}>
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
          </ScrollView>
        </SafeAreaView>
      )}
    </View>
  );
}