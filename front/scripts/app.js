import {fetchWeather, fetchWeatherByCoords, fetchForecast, fetchLocationSuggestions} from "./api.js";
import {displayCurrentWeather, displayError, displayForecast} from "./dom.js";

console.log("Weather app initialized");

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded");

  try {
    const searchBtn = document.getElementById("search-btn");
    const locationBtn = document.getElementById("current-location-btn");
    const locationInput = document.getElementById("location-input");

    if (!searchBtn || !locationBtn || !locationInput) {
      throw new Error("Could not find required buttons or inputs!");
    }

    searchBtn.addEventListener("click", handleSearch);
    locationBtn.addEventListener("click", handleCurrentLocation);

    // Enter key triggers search
    locationInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") handleSearch();
    });

    // Autocomplete suggestions
    locationInput.addEventListener("input", handleSuggestions);

    console.log("Event listeners set up successfully");
  } catch (error) {
    console.error("Setup error:", error);
    displayError("Failed to initialize app");
  }
});

async function handleSearch() {
  const input = document.getElementById("location-input");
  if (!input) return displayError("Search input not found");

  const rawLocation = input.value.trim();
  if (!rawLocation) return displayError("Please enter a location");

  const location = toTitleCase(rawLocation);
  input.value = location;

  try {
    const weatherData = await fetchWeather(location);
    displayCurrentWeather(weatherData);

    const forecastData = await fetchForecast(location);
    displayForecast(forecastData);

    // Reveal forecast heading if hidden
    document.querySelector("h2").classList.remove("hidden");
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

    // Reveal forecast heading
    document.querySelector("h2").classList.remove("hidden");
  } catch (err) {
    console.error(err);
    displayError("Unable to retrieve your location");
  }
}

function toTitleCase(str) {
  return str.replace(/\w\S*/g, (word) => {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
}

async function handleSuggestions(event) {
  const query = event.target.value.trim();
  const suggestionBox = document.getElementById("suggestions");
  if (!suggestionBox) return;

  suggestionBox.innerHTML = "";

  if (query.length < 2) return;

  try {
    const suggestions = await fetchLocationSuggestions(query);
    suggestions.forEach((loc) => {
      const option = document.createElement("option");
      option.value = `${loc.name}${loc.state ? ', ' + loc.state : ''}, ${loc.country}`;
      suggestionBox.appendChild(option);
    });
  } catch (err) {
    console.warn("Failed to fetch suggestions:", err);
  }
}
