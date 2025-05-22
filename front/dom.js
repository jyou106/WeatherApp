export function displayCurrentWeather(data) {
    // Match your backend response structure
    const locationName = data.location || `${data.latitude}, ${data.longitude}`;
    const temperature = data.temperature !== null ? `${Math.round(data.temperature)}°C` : 'N/A';
    const humidity = data.humidity !== null ? `${data.humidity}%` : 'N/A';
    const windSpeed = data.wind_speed !== null ? `${Math.round(data.wind_speed)} km/h` : 'N/A';
    
    document.getElementById('location-name').textContent = locationName;
    document.getElementById('temperature').textContent = temperature;
    document.getElementById('humidity').textContent = humidity;
    document.getElementById('wind-speed').textContent = windSpeed;
    document.getElementById('feels-like').textContent = temperature; // Adjust if you have feels_like
    
    // Set weather icon based on conditions
    const icon = data.conditions ? getWeatherIcon(data.conditions) : '🌈';
    document.getElementById('weather-icon').textContent = icon;
    
    document.getElementById('current-weather').classList.remove('hidden');
    addToSearchHistory(locationName);
}

export function displayForecast(data) {
    const container = document.getElementById('forecast-container');
    container.innerHTML = '';
    
    // Adjust based on your forecast data structure
    if (Array.isArray(data)) {
        data.slice(0, 5).forEach(day => {
            const dayElement = createForecastDayElement(day);
            container.appendChild(dayElement);
        });
    } else {
        // Handle object response if needed
    }
    
    document.getElementById('forecast').classList.remove('hidden');
}

function createForecastDayElement(day) {
    const dayElement = document.createElement('div');
    dayElement.className = 'forecast-day';
    
    const date = day.record_date ? new Date(day.record_date).toLocaleDateString('en', { weekday: 'short' }) : '--';
    const icon = day.conditions ? getWeatherIcon(day.conditions) : '🌈';
    const temp = day.temperature !== null ? `${Math.round(day.temperature)}°C` : '--';
    
    dayElement.innerHTML = `
        <span>${date}</span>
        <span>${icon}</span>
        <span>${temp}</span>
    `;
    
    return dayElement;
}

// Add to search history in localStorage
function addToSearchHistory(location) {
    const history = JSON.parse(localStorage.getItem('weatherSearchHistory') || '[]');
    if (!history.includes(location)) {
        history.unshift(location);
        localStorage.setItem('weatherSearchHistory', JSON.stringify(history.slice(0, 5)));
        updateSearchHistoryDisplay();
    }
}

function updateSearchHistoryDisplay() {
    const history = JSON.parse(localStorage.getItem('weatherSearchHistory') || []);
    const historyList = document.getElementById('history-list');
    
    if (history.length > 0) {
        historyList.innerHTML = '';
        history.forEach(location => {
            const li = document.createElement('li');
            li.textContent = location;
            li.addEventListener('click', () => {
                document.getElementById('location-input').value = location;
                handleSearch();
            });
            historyList.appendChild(li);
        });
        document.getElementById('search-history').classList.remove('hidden');
    } else {
        document.getElementById('search-history').classList.add('hidden');
    }
}