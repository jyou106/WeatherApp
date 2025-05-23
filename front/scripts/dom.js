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
        'temperature': data.temperature ? `${Math.round(data.temperature)}°C` : '--°C',
        'humidity': data.humidity ? `${data.humidity}` : '--%',
        'wind-speed': windSpeedKmh !== '--' ? `${windSpeedKmh}` : '-- km/h',
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
    container.innerHTML = ''; // Clear previous forecast

    if (!data || data.length === 0) {
        container.innerHTML = '<p>No forecast data available.</p>';
        return;
    }

    data.forEach(item => {
        const forecastDiv = document.createElement('div');
        forecastDiv.classList.add('forecast-day'); // match your CSS class

        forecastDiv.innerHTML = `
            <h4>${prettyDate(item.timestamp)}</h4>
            <p><strong>Temp:</strong> ${item.temperature}°C</p>
            <p><strong>Humidity:</strong> ${item.humidity}%</p>
            <p><strong>Wind:</strong> ${item.wind_speed} m/s</p>
            <p><strong>Conditions:</strong> ${item.conditions}</p>
        `;

        container.appendChild(forecastDiv);
    });

    // Make forecast section visible
    const forecastSection = document.getElementById("forecast");
    if (forecastSection.classList.contains("hidden")) {
        forecastSection.classList.remove("hidden");
    }
}


function prettyDate(isoDate) {
    const date = new Date(isoDate);
    return date.toLocaleString(undefined, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
