import { fetchWeather, fetchForecast, fetchWeatherByCoords } from './api.js';
import { displayCurrentWeather, displayForecast, displayError } from './dom.js';

document.addEventListener('DOMContentLoaded', () => {
    const searchBtn = document.getElementById('search-btn');
    const currentLocationBtn = document.getElementById('current-location-btn');
    const locationInput = document.getElementById('location-input');
    
    searchBtn.addEventListener('click', handleSearch);
    currentLocationBtn.addEventListener('click', handleCurrentLocation);
    locationInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    
    // Optional: Load weather for default location on startup
    // loadWeatherData('London');
});

async function handleSearch() {
    const location = document.getElementById('location-input').value.trim();
    if (!location) {
        displayError('Please enter a location');
        return;
    }
    
    try {
        await loadWeatherData(location);
    } catch (error) {
        displayError(error.message);
    }
}

async function handleCurrentLocation() {
    if (!navigator.geolocation) {
        displayError('Geolocation is not supported by your browser');
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            try {
                const { latitude, longitude } = position.coords;
                const data = await fetchWeatherByCoords(latitude, longitude);
                displayCurrentWeather(data);
                const forecast = await fetchForecast(`${latitude},${longitude}`);
                displayForecast(forecast);
            } catch (error) {
                displayError(error.message);
            }
        },
        (error) => {
            displayError('Unable to retrieve your location');
        }
    );
}

async function loadWeatherData(location) {
    try {
        const weatherData = await fetchWeather(location);
        displayCurrentWeather(weatherData);
        
        const forecastData = await fetchForecast(location);
        displayForecast(forecastData);
    } catch (error) {
        // Handle specific error cases from your API
        if (error.message.includes('Location not found')) {
            displayError('Location not found. Please try another city or location.');
        } else if (error.message.includes('API key')) {
            displayError('Weather service is currently unavailable. Please try again later.');
        } else {
            displayError(error.message);
        }
        throw error;
    }
}