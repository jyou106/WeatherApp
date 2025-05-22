import requests
from fastapi import HTTPException
from urllib.parse import quote
from .config import settings
from typing import Dict, Any

def get_weather_by_location(location: str) -> Dict[str, Any]:
    """
    Get complete weather data for a location using OpenWeatherMap API
    Returns:
        Dictionary containing weather data with keys:
        - location (str)
        - temperature (float)
        - humidity (float)
        - wind_speed (float)
        - conditions (str)
        - latitude (float)
        - longitude (float)
    """
    try:
        # First validate location and get coordinates
        coords = validate_location(location)
        if not coords:
            raise HTTPException(status_code=404, detail="Location not found")

        # Get weather data from OpenWeather API
        weather_url = (
            f"https://api.openweathermap.org/data/2.5/weather?"
            f"lat={coords['lat']}&lon={coords['lon']}&"
            f"appid={settings.openweather_api_key}&units=metric"
        )
        
        response = requests.get(weather_url, timeout=10)
        response.raise_for_status()
        weather_data = response.json()

        # Transform data to match your database model
        return {
            "location": location,
            "temperature": weather_data["main"]["temp"],
            "humidity": weather_data["main"]["humidity"],
            "wind_speed": weather_data["wind"]["speed"],
            "conditions": weather_data["weather"][0]["main"],
            "latitude": coords["lat"],
            "longitude": coords["lon"]
        }

    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=502,
            detail=f"Weather service unavailable: {str(e)}"
        )
    except KeyError as e:
        raise HTTPException(
            status_code=502,
            detail=f"Unexpected API response format: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        )

# Keep your existing validate_location function
def validate_location(location: str):
    print(f"VALIDATION KEY: {settings.openweather_api_key}")
    
    if "your_openweather_api_key" in settings.openweather_api_key:
        raise HTTPException(
            status_code=500,
            detail="Server misconfiguration: Invalid API key"
        )
    
    if not settings.openweather_api_key:
        raise HTTPException(
            status_code=500,
            detail="Server error: API key not configured"
        )

    try:
        url = f"http://api.openweathermap.org/geo/1.0/direct?q={location}&limit=1&appid={settings.openweather_api_key}"
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        # Debug print to see actual API response
        print(f"API Response: {data}")
        
        if not data or not isinstance(data, list):
            raise HTTPException(
                status_code=404,
                detail="Location not found or invalid response"
            )
            
        location_data = data[0]
        
        if 'lat' not in location_data or 'lon' not in location_data:
            raise HTTPException(
                status_code=502,
                detail="API returned incomplete location data"
            )
            
        return {
            'lat': float(location_data['lat']),
            'lon': float(location_data['lon'])
        }
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=502,
            detail=f"Weather service unavailable: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        )