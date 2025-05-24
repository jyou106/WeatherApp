function getWeatherIcon(condition) {
    const icons = {
        'Clear': '☀️',
        'Clouds': '☁️',
        'Rain': '🌧️',
        'Drizzle': '🌦️',
        'Thunderstorm': '⛈️',
        'Snow': '❄️',
        'Mist': '🌫️',
        'Fog': '🌁'
    };
    return icons[condition] || '🌈';
}

export function displayCurrentWeather(data) {
    console.log("Displaying data:", data); // Debug log

    if (!data) {
        console.error('No data received');
        return;
    }

    // Convert wind speed from m/s to km/h
    const windSpeedKmh = data.wind_speed ? Math.round(data.wind_speed * 3.6) : '--';

    // Update all elements
    const elements = {
        'location-name': data.location || '--',
        'temperature': data.temperature_c !== undefined
            ? `${Math.round(data.temperature_c)}°C / ${Math.round(data.temperature_f)}°F`
            : '--°C / --°F',
        'feels-like': data.feels_like_c !== undefined
            ? `${Math.round(data.feels_like_c)}°C / ${Math.round(data.feels_like_f)}°F`
            : '--°C / --°F',
        'humidity': (data.humidity !== undefined && data.humidity !== null) ? `${data.humidity}%` : '--%',
        'wind-speed': windSpeedKmh,
        'weather-icon': getWeatherIcon(data.conditions)
    };

    // Update DOM
    for (const [id, value] of Object.entries(elements)) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        } else {
            console.error(`Element #${id} not found!`);
        }
    }

    // Make visible
    document.getElementById('current-weather').classList.remove('hidden');
}

export function displayError(message) {
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');

        setTimeout(() => {
            errorElement.classList.add('hidden');
        }, 5000);
    }
}

export function displayForecast(data) {
  const container = document.getElementById("forecast-container");
  container.innerHTML = "";           // clear old forecast

  if (!Array.isArray(data) || data.length === 0) {
    container.innerHTML = "<p>No forecast data available.</p>";
    return;
  }

  /* ── 1. Group by YYYY-MM-DD ───────────────────────────── */
  const groups = {};
  data.forEach(item => {
    const dayKey = item.timestamp.split("T")[0];   // e.g. "2025-05-23"
    if (!groups[dayKey]) groups[dayKey] = [];
    groups[dayKey].push(item);
  });

  /* ── 2. Build HTML for each date ───────────────────────── */
  Object.entries(groups).forEach(([dayKey, entries]) => {
    /* day wrapper */
    const dayDiv = document.createElement("div");
    dayDiv.className = "forecast-day";

    /* pretty date header */
    const header = document.createElement("h3");
    header.textContent = new Date(dayKey).toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric"
    });
    dayDiv.appendChild(header);

    /* entry grid */
    const entryGrid = document.createElement("div");
    entryGrid.className = "forecast-entries";

    entries.forEach(item => {
      const time = new Date(item.timestamp).toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit"
      });

      const entry = document.createElement("div");
      entry.className = "forecast-entry";
      entry.innerHTML = `
        <span class="fe-time">${time}</span>
        <span class="fe-icon">${getWeatherIcon(item.conditions)}</span>
        <span class="fe-cond">${item.conditions}</span>
        <span class="fe-temp">${Math.round(item.temperature_c)}°C / ${Math.round(item.temperature_f)}°F</span>
      `;
      entryGrid.appendChild(entry);
    });

    dayDiv.appendChild(entryGrid);
    container.appendChild(dayDiv);
  });

  /* ── 3. Un-hide the section ───────────────────────────── */
    // ✅ Unhide the entire forecast section, including the heading
    document.getElementById('forecast-section').classList.remove('hidden');
    // Also unhide the forecast container inside it
    document.getElementById('forecast').classList.remove('hidden');

}


function prettyDate(isoDate) {
    try {
        const date = new Date(isoDate);
        return date.toLocaleString(undefined, {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (err) {
        console.error("Invalid date:", isoDate);
        return isoDate;
    }
}

function getWeatherIcon(condition) {
    const icons = {
        'Clear': '☀️',
        'Clouds': '☁️',
        'Rain': '🌧️',
        'Drizzle': '🌦️',
        'Thunderstorm': '⛈️',
        'Snow': '❄️',
        'Mist': '🌫️',
        'Fog': '🌁'
    };
    return icons[condition] || '🌈';
}

export function displayCurrentWeather(data) {
    console.log("Displaying data:", data); // Debug log

    if (!data) {
        console.error('No data received');
        return;
    }

    // Convert wind speed from m/s to km/h
    const windSpeedKmh = data.wind_speed ? Math.round(data.wind_speed * 3.6) : '--';

    // Update all elements
    const elements = {
        'location-name': data.location || '--',
        'temperature': data.temperature_c !== undefined
            ? `${Math.round(data.temperature_c)}°C / ${Math.round(data.temperature_f)}°F`
            : '--°C / --°F',
        'feels-like': data.temperature_c !== undefined
            ? `${Math.round(data.temperature_c)}°C`
            : '--°C',
        'humidity': (data.humidity !== undefined && data.humidity !== null) ? `${data.humidity}%` : '--%',
        'wind-speed': windSpeedKmh,
        'feels-like': data.temperature ? `${Math.round(data.temperature)}` : '--°C',
        'weather-icon': getWeatherIcon(data.conditions)
    };

    // Update DOM
    for (const [id, value] of Object.entries(elements)) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        } else {
            console.error(`Element #${id} not found!`);
        }
    }

    // Make visible
    document.getElementById('current-weather').classList.remove('hidden');
}

export function displayError(message) {
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');

        setTimeout(() => {
            errorElement.classList.add('hidden');
        }, 5000);
    }
}

export function displayForecast(data) {
  const container = document.getElementById("forecast-container");
  container.innerHTML = "";           // clear old forecast

  if (!Array.isArray(data) || data.length === 0) {
    container.innerHTML = "<p>No forecast data available.</p>";
    return;
  }

  /* ── 1. Group by YYYY-MM-DD ───────────────────────────── */
  const groups = {};
  data.forEach(item => {
    const dayKey = item.timestamp.split("T")[0];   // e.g. "2025-05-23"
    if (!groups[dayKey]) groups[dayKey] = [];
    groups[dayKey].push(item);
  });

  /* ── 2. Build HTML for each date ───────────────────────── */
  Object.entries(groups).forEach(([dayKey, entries]) => {
    /* day wrapper */
    const dayDiv = document.createElement("div");
    dayDiv.className = "forecast-day";

    /* pretty date header */
    const header = document.createElement("h3");
    header.textContent = new Date(dayKey).toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric"
    });
    dayDiv.appendChild(header);

    /* entry grid */
    const entryGrid = document.createElement("div");
    entryGrid.className = "forecast-entries";

    entries.forEach(item => {
      const time = new Date(item.timestamp).toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit"
      });

      const entry = document.createElement("div");
      entry.className = "forecast-entry";
      entry.innerHTML = `
        <span class="fe-time">${time}</span>
        <span class="fe-icon">${getWeatherIcon(item.conditions)}</span>
        <span class="fe-cond">${item.conditions}</span>
        <span class="fe-temp">${Math.round(item.temperature)}°C</span>
      `;
      entryGrid.appendChild(entry);
    });

    dayDiv.appendChild(entryGrid);
    container.appendChild(dayDiv);
  });

  /* ── 3. Un-hide the section ───────────────────────────── */
    // ✅ Unhide the entire forecast section, including the heading
    document.getElementById('forecast-section').classList.remove('hidden');
    // Also unhide the forecast container inside it
    document.getElementById('forecast').classList.remove('hidden');

}


function prettyDate(isoDate) {
    try {
        const date = new Date(isoDate);
        return date.toLocaleString(undefined, {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (err) {
        console.error("Invalid date:", isoDate);
        return isoDate;
    }
}

