#services.py
import requests
from fastapi import HTTPException
from urllib.parse import quote
from .config import settings
from typing import Dict, Any
from datetime import datetime
from typing import List, Optional

import re

_zip_re = re.compile(r"^\d{5}(?:-\d{4})?$")     # 12345   or   12345-6789

def get_forecast_by_location(location: str, start: Optional[str] = None, end: Optional[str] = None) -> List[Dict[str, Any]]:
    coords = validate_location(location)

    forecast_url = (
        f"https://api.openweathermap.org/data/2.5/forecast?"
        f"lat={coords['lat']}&lon={coords['lon']}&appid={settings.openweather_api_key}&units=metric"
    )
    
    response = requests.get(forecast_url, timeout=10)
    response.raise_for_status()
    forecast_data = response.json()

    start_dt = datetime.fromisoformat(start) if start else None
    end_dt = datetime.fromisoformat(end) if end else None

    results = []
    for entry in forecast_data.get("list", []):
        forecast_time = datetime.fromtimestamp(entry["dt"])
        if start_dt and forecast_time.date() < start_dt.date():
            continue
        if end_dt and forecast_time.date() >= end_dt.date():
            continue


        results.append({
            "timestamp": forecast_time.isoformat(),
            "temperature": entry["main"]["temp"],
            "humidity": entry["main"]["humidity"],
            "wind_speed": entry["wind"]["speed"],
            "conditions": entry["weather"][0]["main"]
        })
    return results

def is_zip(candidate: str) -> bool:
    """Return True if the string looks like a U.S. ZIP code."""
    return bool(_zip_re.fullmatch(candidate.strip()))


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

        # Transform data to match database model
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

def lookup_zip(zip_code: str, country: str = "us") -> Dict[str, float]:
    url = (
        f"http://api.openweathermap.org/geo/1.0/zip"
        f"?zip={zip_code},{country}&appid={settings.openweather_api_key}"
    )
    r = requests.get(url, timeout=10)
    r.raise_for_status()
    data = r.json()           # raises if invalid JSON
    return {"lat": float(data["lat"]), "lon": float(data["lon"])}


def validate_location(location: str) -> Dict[str, float]:
    key = settings.openweather_api_key
    if not key or key == "your_openweather_api_key":
        raise HTTPException(500, "API key mis-configured")

    location = location.strip()

    # ZIP-code path
    if is_zip(location):
        try:
            return lookup_zip(location)
        except requests.exceptions.RequestException as e:
            raise HTTPException(502, f"Weather service unavailable: {e}")
        except KeyError:
            raise HTTPException(502, "Incomplete ZIP response")

    # Original city/place path
    try:
        url = (
            "http://api.openweathermap.org/geo/1.0/direct"
            f"?q={quote(location)}&limit=5&appid={key}"
        )
        r = requests.get(url, timeout=10)
        r.raise_for_status()
        data = r.json()
        if not data:
            raise HTTPException(404, "Location not found")
        return {"lat": float(data[0]["lat"]), "lon": float(data[0]["lon"])}
    except requests.exceptions.RequestException as e:
        raise HTTPException(502, f"Weather service unavailable: {e}")
