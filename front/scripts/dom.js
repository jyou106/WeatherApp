function getWeatherIcon(condition) {
  const normalized = condition.toLowerCase();

  if (normalized.includes("clear")) return { icon: "☀️", title: "Clear sky" };
  if (normalized.includes("cloud")) return { icon: "☁️", title: "Cloudy" };
  if (normalized.includes("rain")) return { icon: "🌧️", title: "Rain" };
  if (normalized.includes("thunder")) return { icon: "⛈️", title: "Thunderstorm" };
  if (normalized.includes("drizzle")) return { icon: "🌦️", title: "Drizzle" };
  if (normalized.includes("snow")) return { icon: "❄️", title: "Snow" };
  if (normalized.includes("mist")) return { icon: "🌫️", title: "Mist" };
  if (normalized.includes("fog")) return { icon: "🌫️", title: "Fog" };
  if (normalized.includes("smoke")) return { icon: "🌫️", title: "Smoke" };
  if (normalized.includes("haze")) return { icon: "🌫️", title: "Haze" };
  if (normalized.includes("dust")) return { icon: "🌫️", title: "Dust" };
  if (normalized.includes("tornado")) return { icon: "🌪️", title: "Tornado" };
  if (normalized.includes("sand") || normalized.includes("ash")) return { icon: "🌬️", title: "Sand/Ash" };
  return { icon: "❓", title: "Unknown weather condition" };
}


export function displayCurrentWeather(data) {
    console.log("Displaying data:", data); // Debug log

    if (!data) {
        console.error('No data received');
        return;
    }

    // Debug logs for wind speed and feels like
    console.log('Wind speed:', data.wind_speed);
    console.log('Feels like (C):', data.feels_like_c);
    console.log('Feels like (F):', data.feels_like_f);

    // Convert wind speed from m/s to km/h
    const windSpeedKmh = (data.wind_speed !== undefined && data.wind_speed !== null)
        ? Math.round(data.wind_speed * 3.6)
        : '--';

    const feelsLikeText = (data.feels_like_c !== undefined && data.feels_like_c !== null && 
                      data.feels_like_f !== undefined && data.feels_like_f !== null)
    ? `${Math.round(data.feels_like_c)}°C / ${Math.round(data.feels_like_f)}°F`
    : '--°C / --°F';


    // Update all elements
    const elements = {
        'location-name': data.location || '--',
        'temperature': data.temperature_c !== undefined && data.temperature_f !== undefined
            ? `${Math.round(data.temperature_c)}°C / ${Math.round(data.temperature_f)}°F`
            : '--°C / --°F',
        'feels-like': feelsLikeText,
        'humidity': (data.humidity !== undefined && data.humidity !== null) ? `${data.humidity}%` : '--%',
        'wind-speed': windSpeedKmh !== '--' ? `${windSpeedKmh} km/h` : '--',
        'weather-icon': data.conditions 
            ? (() => {
                const icon = getWeatherIcon(data.conditions);
                return `<span title="${icon.title}">${icon.icon}</span>`;
            })()
            : '🌈',
    };

    // Update DOM
    for (const [id, value] of Object.entries(elements)) {
        const element = document.getElementById(id);
        if (element) {
            if (id === 'weather-icon') {
                element.innerHTML = value; // use innerHTML to include span with title and icon
            } else {
                element.textContent = value;
            }
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

    const iconObj = getWeatherIcon(item.conditions);

    const entry = document.createElement("div");
    entry.className = "forecast-entry";
    entry.innerHTML = `
        <span class="fe-time">${time}</span>
        <span class="fe-icon" title="${iconObj.title}">${iconObj.icon}</span>
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

