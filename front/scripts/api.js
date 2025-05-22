const API_BASE_URL = 'http://localhost:8000';

export async function fetchWeather(location) {
    try {
        document.getElementById('loading').classList.remove('hidden');
        
        const response = await fetch(`${API_BASE_URL}/weather/current/${encodeURIComponent(location)}`);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to fetch weather');
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    } finally {
        document.getElementById('loading').classList.add('hidden');
    }
}

export async function fetchWeatherByCoords(lat, lon) {
    try {
        document.getElementById('loading').classList.remove('hidden');
        const response = await fetch(`${API_BASE_URL}/weather/current/coords/${lat}/${lon}`);
        if (!response.ok) throw new Error('Location not found');
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    } finally {
        document.getElementById('loading').classList.add('hidden');
    }
}
