import { fetchWeather, fetchWeatherByCoords, fetchForecast } from './api.js';
import { displayCurrentWeather, displayError,displayForecast } from './dom.js';

// Debugging - verify script is loading
console.log("Weather app initialized");

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded");
    
    // Set up event listeners with error handling
    try {
        const searchBtn = document.getElementById('search-btn');
        const locationBtn = document.getElementById('current-location-btn');
        
        if (!searchBtn || !locationBtn) {
            throw new Error("Could not find buttons!");
        }
        
        searchBtn.addEventListener('click', handleSearch);
        locationBtn.addEventListener('click', handleCurrentLocation);
        
        // Add Enter key support for search input
        document.getElementById('location-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSearch();
        });
        
        console.log("Event listeners set up successfully");
    } catch (error) {
        console.error("Setup error:", error);
        displayError("Failed to initialize app");
    }
    document.getElementById('forecast-btn').addEventListener('click', handleForecast);
});

async function handleForecast() {
    const location = document.getElementById('location-input').value.trim();
    const start = document.getElementById('start-date').value;
    const end = document.getElementById('end-date').value;

    if (!location) {
        displayError("Please enter a location for forecast");
        return;
    }

    try {
        const forecastData = await fetchForecast(location, start, end);
        displayForecast(forecastData);
    } catch (err) {
        displayError(err.message || "Failed to load forecast");
    }
}


async function handleSearch() {
    console.log("Search initiated");
    const locationInput = document.getElementById('location-input');
    if (!locationInput) {
        displayError("Search input not found");
        return;
    }
    
    const location = locationInput.value.trim();
    if (!location) {
        displayError('Please enter a location');
        return;
    }
    
    try {
        console.log("Fetching weather for:", location);
        const weatherData = await fetchWeather(location);
        console.log("Received weather data:", weatherData);
        displayCurrentWeather(weatherData);
    } catch (error) {
        console.error("Search failed:", error);
        displayError(error.message || 'Failed to get weather data');
    }
}

async function handleCurrentLocation() {
    console.log("Current location requested");
    if (!navigator.geolocation) {
        displayError('Geolocation is not supported by your browser');
        return;
    }
    
    try {
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 10000 // 10 second timeout
            });
        });
        
        const { latitude, longitude } = position.coords;
        console.log("Got coordinates:", latitude, longitude);
        
        const weatherData = await fetchWeatherByCoords(latitude, longitude);
        displayCurrentWeather(weatherData);
        
        // Update search input with approximate location
        document.getElementById('location-input').value = "Near Me";
    } catch (error) {
        console.error("Location error:", error);
        displayError('Unable to retrieve your location');
    }
}