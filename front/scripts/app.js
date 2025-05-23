// app.js (updated for "always next‑5‑days" forecast)
import { fetchWeather, fetchWeatherByCoords, fetchForecast } from "./api.js";
import {
  displayCurrentWeather,
  displayError,
  displayForecast,
} from "./dom.js";

console.log("Weather app initialized");

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded");

  try {
    const searchBtn = document.getElementById("search-btn");
    const locationBtn = document.getElementById("current-location-btn");

    if (!searchBtn || !locationBtn) {
      throw new Error("Could not find required buttons!");
    }

    searchBtn.addEventListener("click", handleSearch);
    locationBtn.addEventListener("click", handleCurrentLocation);

    // Enter key triggers search
    document
      .getElementById("location-input")
      .addEventListener("keypress", (e) => {
        if (e.key === "Enter") handleSearch();
      });

    console.log("Event listeners set up successfully");
  } catch (error) {
    console.error("Setup error:", error);
    displayError("Failed to initialize app");
  }
});

async function handleSearch() {
  const input = document.getElementById("location-input");
  if (!input) return displayError("Search input not found");

  const location = input.value.trim();
  if (!location) return displayError("Please enter a location");

  try {
    // Current conditions
    const weatherData = await fetchWeather(location);
    displayCurrentWeather(weatherData);

    // 5‑day forecast (auto)
    const forecastData = await fetchForecast(location);
    displayForecast(forecastData);
  } catch (err) {
    console.error(err);
    displayError(err.message || "Unable to fetch weather data");
  }
}

async function handleCurrentLocation() {
  if (!navigator.geolocation)
    return displayError("Geolocation is not supported by your browser");

  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 10000,
      });
    });

    const { latitude, longitude } = position.coords;
    const weatherData = await fetchWeatherByCoords(latitude, longitude);
    displayCurrentWeather(weatherData);

    const forecastData = await fetchForecast(`${latitude},${longitude}`);
    displayForecast(forecastData);

    document.getElementById("location-input").value = "Near Me";
  } catch (err) {
    console.error(err);
    displayError("Unable to retrieve your location");
  }
}
