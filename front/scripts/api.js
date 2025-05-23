const API_BASE_URL = window.location.origin;  // This still works

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

export async function fetchForecast(location, start = null, end = null) {
    try {
        document.getElementById('loading').classList.remove('hidden');

        let url = `${API_BASE_URL}/weather/forecast/${encodeURIComponent(location)}`;
        const params = new URLSearchParams();
        if (start) params.append("start", start);
        if (end) params.append("end", end);
        if ([...params].length > 0) url += `?${params.toString()}`;

        console.log("Fetching forecast URL:", url);

        const response = await fetch(url);
        if (!response.ok) {
            let errorMessage = '';
            try {
                const errorData = await response.json();
                errorMessage = errorData.detail || JSON.stringify(errorData);
            } catch {
                errorMessage = await response.text();
            }
            throw new Error(`API Error: ${errorMessage}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Fetch forecast failed:", error);
        throw error;
    } finally {
        document.getElementById('loading').classList.add('hidden');
    }
}
