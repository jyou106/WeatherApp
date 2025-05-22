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
        'humidity': data.humidity ? `${data.humidity}%` : '--%',
        'wind-speed': windSpeedKmh !== '--' ? `${windSpeedKmh} km/h` : '-- km/h',
        'feels-like': data.temperature ? `${Math.round(data.temperature)}°C` : '--°C',
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