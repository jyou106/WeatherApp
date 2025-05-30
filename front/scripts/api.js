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

export async function fetchForecast(location) {
  try {
    document.getElementById("loading").classList.remove("hidden");

    // ⇣ simpler URL – no query-params
    const url = `${API_BASE_URL}/weather/forecast/${encodeURIComponent(location)}`;
    console.log("Fetching forecast URL:", url);

    const response = await fetch(url);
    if (!response.ok) {
      let msg;
      try {
        const data = await response.json();
        msg = data.detail || JSON.stringify(data);
      } catch {
        msg = await response.text();
      }
      throw new Error(`API Error: ${msg}`);
    }
    return await response.json();
  } catch (err) {
    console.error("Fetch forecast failed:", err);
    throw err;
  } finally {
    document.getElementById("loading").classList.add("hidden");
  }
}

export async function fetchLocationSuggestions(query) {
  const url = `${API_BASE_URL}/location/suggest?q=${encodeURIComponent(query)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch location suggestions");
  return await response.json();
}

export async function fetchTodayForecast(location) {
  try {
    document.getElementById("loading").classList.remove("hidden");

    const url = `${API_BASE_URL}/weather/forecast/today/${encodeURIComponent(location)}`;
    console.log("Fetching today's forecast:", url);

    const response = await fetch(url);
    if (!response.ok) {
      let msg;
      try {
        const data = await response.json();
        msg = data.detail || JSON.stringify(data);
      } catch {
        msg = await response.text();
      }
      throw new Error(`API Error: ${msg}`);
    }

    return await response.json();
  } catch (err) {
    console.error("Fetch today's forecast failed:", err);
    throw err;
  } finally {
    document.getElementById("loading").classList.add("hidden");
  }
}

