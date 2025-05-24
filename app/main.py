#main.py
import logging
from fastapi import FastAPI, Depends, HTTPException, Query, Request  
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app import models, schemas, crud, services
from typing import List, Optional
from app.services import get_weather_by_location, get_forecast_by_location
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import os
import requests
from .config import settings
from fastapi.responses import FileResponse
import time
from urllib.parse import quote
import requests

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("app.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

models.Base.metadata.create_all(bind=engine)

BASE_DIR = Path(__file__).resolve().parent.parent      # WeatherApp/

app = FastAPI()

# Log startup event
logger.info("Starting Weather API Server")
logger.info(f"OpenWeather API Key valid: {'your_openweather_api_key' not in settings.openweather_api_key}")

FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "front")
app.mount("/front", StaticFiles(directory=FRONTEND_DIR), name="front")

# Middleware to log requests
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    logger.info(f"Request: {request.method} {request.url}")
    logger.debug(f"Headers: {request.headers}")
    
    try:
        response = await call_next(request)
    except Exception as e:
        logger.error(f"Request failed: {str(e)}")
        raise
    
    process_time = (time.time() - start_time) * 1000
    logger.info(f"Response: {response.status_code} (took {process_time:.2f}ms)")
    return response

@app.get("/")
def serve_frontend():
    logger.info("Serving frontend index.html")
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/location/suggest")
def suggest_locations(q: str = Query(..., min_length=2)):
    url = (
        "http://api.openweathermap.org/geo/1.0/direct"
        f"?q={quote(q)}&limit=5&appid={settings.openweather_api_key}"
    )
    try:
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        return resp.json()
    except requests.exceptions.RequestException as exc:
        raise HTTPException(502, f"Suggestion service unavailable: {exc}") from exc

@app.get("/weather/forecast/{location}")
def forecast_weather(location: str):
    logger.info(f"Fetching forecast for location: {location}")
    try:
        forecast = get_forecast_by_location(location)
        logger.debug(f"Forecast data: {forecast}")
        return forecast
    except HTTPException as e:
        logger.error(f"Forecast error for {location}: {e.detail}")
        raise e
    except Exception as e:
        logger.exception(f"Unexpected forecast error for {location}")
        raise HTTPException(500, f"Unexpected error: {str(e)}")

# Dependency
def get_db():
    db = SessionLocal()
    try:
        logger.debug("Creating new DB session")
        yield db
    finally:
        logger.debug("Closing DB session")
        db.close()

@app.get("/weather/today/{location}")
def today(location: str):
    return services.get_today_forecast(location)


@app.get("/weather/current/coords/{lat}/{lon}")
def weather_by_coords(lat: float, lon: float):
    logger.info(f"Fetching weather for coordinates: {lat},{lon}")
    try:
        url = (
            "https://api.openweathermap.org/data/2.5/weather"
            f"?lat={lat}&lon={lon}&appid={settings.openweather_api_key}&units=metric"
        )
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        data = resp.json()

        temp_c       = data["main"]["temp"]
        feels_like_c = data["main"].get("feels_like")

        return {
            "location": f"{lat},{lon}",
            "temperature_c": temp_c,
            "temperature_f": services.c_to_f(temp_c),
            "feels_like_c": feels_like_c,
            "feels_like_f": services.c_to_f(feels_like_c) if feels_like_c is not None else None,
            "humidity":     data["main"]["humidity"],
            "wind_speed":   data["wind"]["speed"],
            "conditions":   data["weather"][0]["main"],
            "latitude":  lat,
            "longitude": lon,
        }

    except requests.exceptions.RequestException as exc:
        logger.error(f"OpenWeather error: {exc}")
        raise HTTPException(502, f"Weather service unavailable: {exc}")


@app.get("/weather/current/{location}")
def weather_by_location(location: str):
    logger.info(f"Fetching current weather for: {location}")
    try:
        weather = services.get_weather_by_location(location)
        logger.debug(f"Weather data: {weather}")
        return weather
    except HTTPException as e:
        logger.error(f"Weather lookup failed for {location}: {e.detail}")
        raise e
    except Exception as e:
        logger.exception(f"Unexpected error fetching weather for {location}")
        raise HTTPException(status_code=500, detail="Internal server error")



@app.get("/weather/", response_model=List[schemas.WeatherRecord])
def read_records(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    logger.info(f"Fetching weather records (skip={skip}, limit={limit})")
    records = crud.get_weather_records(db, skip=skip, limit=limit)
    logger.debug(f"Found {len(records)} records")
    return records

@app.get("/weather/{record_id}", response_model=schemas.WeatherRecord)
def read_record(record_id: int, db: Session = Depends(get_db)):
    logger.info(f"Fetching weather record ID: {record_id}")
    record = crud.get_weather_record(db, record_id=record_id)
    if record is None:
        logger.warning(f"Record not found: {record_id}")
        raise HTTPException(status_code=404, detail="Record not found")
    logger.debug(f"Record data: {record}")
    return record

@app.put("/weather/{record_id}", response_model=schemas.WeatherRecord)
def update_record(
    record_id: int, 
    updates: schemas.WeatherRecordUpdate,
    db: Session = Depends(get_db)
):
    logger.info(f"Updating record ID: {record_id} with {updates}")
    record = crud.update_weather_record(db, record_id=record_id, updates=updates)
    if record is None:
        logger.warning(f"Update failed - record not found: {record_id}")
        raise HTTPException(status_code=404, detail="Record not found")
    logger.info(f"Record updated: {record}")
    return record

@app.delete("/weather/{record_id}")
def delete_record(record_id: int, db: Session = Depends(get_db)):
    logger.info(f"Deleting record ID: {record_id}")
    success = crud.delete_weather_record(db, record_id=record_id)
    if not success:
        logger.warning(f"Delete failed - record not found: {record_id}")
        raise HTTPException(status_code=404, detail="Record not found")
    logger.info(f"Record deleted: {record_id}")
    return {"message": "Record deleted successfully"}

@app.get("/weather/export/{record_id}/{format}")
def export_record(record_id: int, format: str, db: Session = Depends(get_db)):
    logger.info(f"Exporting record {record_id} as {format}")
    record = crud.get_weather_record(db, record_id=record_id)
    if not record:
        logger.warning(f"Export failed - record not found: {record_id}")
        raise HTTPException(status_code=404, detail="Record not found")
    
    try:
        exported = services.export_data(record, format)
        logger.debug(f"Exported data: {exported[:100]}...")  # Log first 100 chars
        return exported
    except Exception as e:
        logger.exception(f"Export failed for record {record_id}")
        raise HTTPException(500, "Export failed")

@app.get("/location/map/{location}")
def get_map_data(location: str):
    logger.info(f"Fetching map data for: {location}")
    try:
        map_data = services.get_map_data(location)
        return map_data
    except Exception as e:
        logger.error(f"Map data error for {location}: {str(e)}")
        raise HTTPException(500, "Map service error")

@app.post("/weather/", response_model=schemas.WeatherRecord)
def create_record(
    record: schemas.WeatherRecordCreate, 
    db: Session = Depends(get_db)
):
    logger.info(f"Creating new record for: {record.location}")
    try:
        location_data = services.validate_location(record.location)
        if not location_data:
            logger.warning(f"Invalid location: {record.location}")
            raise HTTPException(status_code=400, detail="Location not found")

        db_record = models.WeatherRecord(
            location=record.location,
            record_date=record.record_date,
            latitude=location_data['lat'],
            longitude=location_data['lon'],
            temperature=None,
            humidity=None,
            wind_speed=None,
            conditions=None
        )

        db.add(db_record)
        db.commit()
        db.refresh(db_record)
        logger.info(f"Created new record ID: {db_record.id}")
        return db_record

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.exception("Record creation failed")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/debug-key")
def debug_key():
    logger.info("Debugging API key")
    from app.config import settings
    return {
        "loaded_key": settings.openweather_api_key,
        "key_valid": "your_openweather_api_key" not in settings.openweather_api_key
    }