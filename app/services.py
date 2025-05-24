import re
from datetime import datetime, timezone, date
from typing import List, Dict, Any

import requests
from fastapi import HTTPException
from urllib.parse import quote

from .config import settings

# ──────────────────────────────────────────────────────────────
# Regex helper (US ZIP‑code test)
_zip_re = re.compile(r"^\d{5}(?:-\d{4})?$")


def c_to_f(c: float) -> float:
    """Convert °C to °F (rounded to one decimal)."""
    return round(c * 9 / 5 + 32, 1)

# ---------------------------------------------------------------------------
# 1.  CURRENT CONDITIONS
# ---------------------------------------------------------------------------

def get_weather_by_location(location: str) -> Dict[str, Any]:
    """Return current conditions (both °C and °F)."""

    coords = validate_location(location)

    url = (
        "https://api.openweathermap.org/data/2.5/weather"
        f"?lat={coords['lat']}&lon={coords['lon']}"
        f"&appid={settings.openweather_api_key}&units=metric"
    )

    try:
        r = requests.get(url, timeout=10)
        r.raise_for_status()
    except requests.exceptions.RequestException as exc:
        raise HTTPException(502, f"Weather service unavailable: {exc}") from exc

    data = r.json()
    temp_c = data["main"]["temp"]
    feels_like_c = data["main"].get("feels_like")

    return {
        "location": location,
        "temperature_c": temp_c,
        "temperature_f": c_to_f(temp_c),
        "feels_like_c": feels_like_c,
        "feels_like_f": c_to_f(feels_like_c) if feels_like_c is not None else None,
        "humidity": data["main"]["humidity"],
        "wind_speed": data["wind"]["speed"],  # or convert to km/h if needed
        "conditions": data["weather"][0]["main"],
        "latitude": coords["lat"],
        "longitude": coords["lon"],
    }

# ---------------------------------------------------------------------------
# 2.  5‑DAY / 3‑HOUR FORECAST
# ---------------------------------------------------------------------------

def get_forecast_by_location(location: str) -> List[Dict[str, Any]]:
    """Return the next ≈5 days (40 slots) of 3‑hour forecasts."""

    coords = validate_location(location)

    url = (
        "https://api.openweathermap.org/data/2.5/forecast"
        f"?lat={coords['lat']}&lon={coords['lon']}"
        f"&appid={settings.openweather_api_key}&units=metric"
    )

    try:
        r = requests.get(url, timeout=10)
        r.raise_for_status()
    except requests.exceptions.RequestException as exc:
        raise HTTPException(502, f"Weather service unavailable: {exc}") from exc

    data = r.json()
    results: list[dict[str, Any]] = []

    for slot in data.get("list", []):
        ts = datetime.fromtimestamp(slot["dt"], tz=timezone.utc).astimezone()
        temp_c = slot["main"]["temp"]
        results.append(
            {
                "timestamp": ts.isoformat(),
                "temperature_c": temp_c,
                "temperature_f": c_to_f(temp_c),
                "humidity": slot["main"]["humidity"],
                "wind_speed_ms": slot["wind"]["speed"],
                "conditions": slot["weather"][0]["main"],
            }
        )
    return results

# ---------------------------------------------------------------------------
# 3.  TODAY‑ONLY FORECAST (optional helper)
# ---------------------------------------------------------------------------

def get_today_forecast(location: str) -> Dict[str, Any]:
    """Return every 3‑hour slot **for today** plus min / max temps."""

    today_iso = date.today().isoformat()  # YYYY‑MM‑DD
    slots = [s for s in get_forecast_by_location(location) if s["timestamp"].startswith(today_iso)]

    if not slots:
        raise HTTPException(404, "No forecast slots for today")

    min_c = min(s["temperature_c"] for s in slots)
    max_c = max(s["temperature_c"] for s in slots)

    return {
        "date": today_iso,
        "min_c": min_c,
        "min_f": c_to_f(min_c),
        "max_c": max_c,
        "max_f": c_to_f(max_c),
        "slots": slots,
    }

# ---------------------------------------------------------------------------
# 4.  LOCATION HELPERS
# ---------------------------------------------------------------------------

def is_zip(txt: str) -> bool:
    """Return True if *txt* looks like a US ZIP code."""
    return bool(_zip_re.fullmatch(txt.strip()))


def lookup_zip(zip_code: str, country: str = "us") -> Dict[str, float]:
    url = (
        "http://api.openweathermap.org/geo/1.0/zip"
        f"?zip={zip_code},{country}&appid={settings.openweather_api_key}"
    )
    r = requests.get(url, timeout=10)
    r.raise_for_status()
    data = r.json()
    return {"lat": float(data["lat"]), "lon": float(data["lon"])}


def validate_location(raw: str) -> Dict[str, float]:
    """Resolve city name / landmark / ZIP → {lat, lon}."""

    key = settings.openweather_api_key
    if not key or key == "your_openweather_api_key":
        raise HTTPException(500, "API key mis‑configured")

    query = raw.strip()

    # 1) ZIP code path
    if is_zip(query):
        try:
            return lookup_zip(query)
        except requests.exceptions.RequestException as exc:
            raise HTTPException(502, f"Weather service unavailable: {exc}") from exc

    # 2) Generic place / landmark
    try:
        url = (
            "http://api.openweathermap.org/geo/1.0/direct"
            f"?q={quote(query)}&limit=5&appid={key}"
        )
        r = requests.get(url, timeout=10)
        r.raise_for_status()
        data = r.json()
        if not data:
            raise HTTPException(404, "Location not found")
        hit = data[0]  # first hit (landmark, city, etc.)
        return {"lat": float(hit["lat"]), "lon": float(hit["lon"])}
    except requests.exceptions.RequestException as exc:
        raise HTTPException(502, f"Weather service unavailable: {exc}") from exc
