const API_BASE_URL = 'http://localhost:8000'; // Update with your backend URL

export async function fetchWeather(location) {
    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/weather/current/${encodeURIComponent(location)}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Location not found');
        }
        return await response.json();
    } catch (error) {
        throw error;
    } finally {
        hideLoading();
    }
}

export async function fetchForecast(location) {
    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/weather/forecast/${encodeURIComponent(location)}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Forecast not available');
        }
        return await response.json();
    } catch (error) {
        throw error;
    } finally {
        hideLoading();
    }
}

export async function fetchWeatherByCoords(lat, lon) {
    try {
        showLoading();
        // Convert coords to location string for your API
        const response = await fetch(`${API_BASE_URL}/weather/current/${lat},${lon}`);
        if (!response.ok) throw new Error('Location not found');
        return await response.json();
    } catch (error) {
        throw error;
    } finally {
        hideLoading();
    }
}

function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('current-weather').classList.add('hidden');
    document.getElementById('forecast').classList.add('hidden');
}

function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
}