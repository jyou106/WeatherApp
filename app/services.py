import requests
from fastapi import HTTPException
from urllib.parse import quote
from .config import settings
from typing import Dict, Any

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