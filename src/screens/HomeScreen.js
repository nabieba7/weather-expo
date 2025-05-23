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
import { debounce } from "lodash";
import { fetchLocations, fetchWeatherForecast } from "../api/weather";
import { weatherImages, weatherBackgrounds } from "../constants";
import * as Progress from "react-native-progress";

export default function HomeScreen() {
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [locations, setLocations] = useState([]);
  const [weather, setWeather] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      
      setWeather(data);
    } catch (err) {
      setError("Failed to fetch weather data");
      console.error("Location error:", err);
      Alert.alert("Error", "Failed to fetch weather data");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    if (value.length > 2) {
      fetchLocations({ cityName: value })
        .then((data) => setLocations(data))
        .catch((err) => {
          setError("Failed to search locations");
          console.error("Search error:", err);
        });
    }
  };

  const fetchMyWeatherData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchWeatherForecast({
        cityName: "Riyadh",
        days: "7",
      });
      setWeather(data);
    } catch (err) {
      setError("Failed to load weather data");
      console.error("Initial load error:", err);
      Alert.alert("Error", "Failed to load weather data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyWeatherData();
  }, []);

  const handleDebounce = useCallback(debounce(handleSearch, 1000), []);
  const { current, location } = weather;

  // Get appropriate background image
  const backgroundSource = current?.condition?.text 
    ? weatherBackgrounds[current.condition.text] || weatherBackgrounds["other"]
    : weatherBackgrounds["other"];

  return (
    <View className="h-[7] flex-1 relative">
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
                  className="h-12 pl-4 text-xl pb-1 flex-1"
                />
              )}

              <TouchableOpacity
                onPress={() => setShowSearchBar(!showSearchBar)}
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
                  backdropFilter: "blur(6px)",
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
          </View>

          {/* WEATHER DISPLAY SECTION */}
          {error ? (
            <View className="flex-1 justify-center items-center">
              <Text className="text-white text-lg">{error}</Text>
              <TouchableOpacity
                onPress={fetchMyWeatherData}
                className="mt-4 px-4 py-2 bg-blue-500 rounded-full"
              >
                <Text className="text-white">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-1 flex justify-around mx-4 mb-2">
              {/* Location */}
              <View className="flex-row items-center justify-center">
                <Text className="text-white text-3xl font-bold">
                  {location?.name},
                </Text>
                <Text className="text-lg text-white font-semibold ml-1">
                  {location?.country}
                </Text>
              </View>

              {/* Weather Icon */}
              <View className="justify-center flex-row">
                <Image
                  source={weatherImages[current?.condition?.text] || weatherImages["other"]}
                  className="w-52 h-52"
                />
              </View>

              {/* Temperature */}
              <View className="">
                <Text className="text-center text-6xl text-white font-bold">
                  {current?.temp_c}&#176;
                </Text>
                <Text className="text-center text-xl text-white tracking-widest">
                  {current?.condition?.text}
                </Text>
              </View>

              {/* Weather Stats */}
              <View className="flex-row justify-around items-center">
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
              <View className="mt-4">
                <View className="flex-row items-center">
                  <FontAwesome name="calendar" size={25} color="white" />
                  <Text className="text-white font-semibold ml-3 text-lg">
                    Daily Forecast
                  </Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2">
                  {weather?.forecast?.forecastday?.map((days, index) => {
                    const date = new Date(days.date);
                    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
                    return (
                      <View
                        key={index}
                        className="w-28 rounded-3xl py-4 px-3 ml-2"
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
                          {days?.day?.avgtemp_c}&#176;
                        </Text>
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