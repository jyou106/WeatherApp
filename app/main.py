# main.py
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.database import SessionLocal, engine
from app import models, schemas, crud, services
from typing import List
from app.services import validate_location 
from app.services import get_weather_by_location 

models.Base.metadata.create_all(bind=engine)

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import os
import requests
from .config import settings

BASE_DIR = Path(__file__).resolve().parent.parent      # WeatherApp/

app = FastAPI()

FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "front")
app.mount("/front", StaticFiles(directory=FRONTEND_DIR), name="front")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
   
@app.get("/weather/current/coords/{lat}/{lon}")
def weather_by_coords(lat: float, lon: float):
    try:
        weather_url = (
            f"https://api.openweathermap.org/data/2.5/weather?"
            f"lat={lat}&lon={lon}&appid={settings.openweather_api_key}&units=metric"
        )
        response = requests.get(weather_url)
        response.raise_for_status()
        data = response.json()

        return {
            "location": f"{lat},{lon}",
            "temperature": data["main"]["temp"],
            "humidity": data["main"]["humidity"],
            "wind_speed": data["wind"]["speed"],
            "conditions": data["weather"][0]["main"],
            "latitude": lat,
            "longitude": lon
        }

    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Weather service unavailable: {e}")
        
@app.get("/weather/current/{location}")
def weather_by_location(location: str):
    return get_weather_by_location(location)

@app.get("/weather/", response_model=List[schemas.WeatherRecord])
def read_records(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    records = crud.get_weather_records(db, skip=skip, limit=limit)
    return records

@app.get("/weather/{record_id}", response_model=schemas.WeatherRecord)
def read_record(record_id: int, db: Session = Depends(get_db)):
    record = crud.get_weather_record(db, record_id=record_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Record not found")
    return record

@app.put("/weather/{record_id}", response_model=schemas.WeatherRecord)
def update_record(
    record_id: int, 
    updates: schemas.WeatherRecordUpdate,
    db: Session = Depends(get_db)
):
    record = crud.update_weather_record(db, record_id=record_id, updates=updates)
    if record is None:
        raise HTTPException(status_code=404, detail="Record not found")
    return record

@app.delete("/weather/{record_id}")
def delete_record(record_id: int, db: Session = Depends(get_db)):
    success = crud.delete_weather_record(db, record_id=record_id)
    if not success:
        raise HTTPException(status_code=404, detail="Record not found")
    return {"message": "Record deleted successfully"}

# Additional API endpoints for weather data
@app.get("/weather/current/{location}")
def get_current_weather(location: str):
    weather_data = services.get_weather_by_location(location)
    if not weather_data:
        raise HTTPException(status_code=404, detail="Weather data not found")
    return weather_data

@app.get("/weather/forecast/{location}")
def get_forecast(location: str, days: int = 5):
    forecast = services.get_weather_forecast(location, days)
    if not forecast:
        raise HTTPException(status_code=404, detail="Forecast not found")
    return forecast

# Export endpoints
@app.get("/weather/export/{record_id}/{format}")
def export_record(record_id: int, format: str, db: Session = Depends(get_db)):
    record = crud.get_weather_record(db, record_id=record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    return services.export_data(record, format)

# Additional API integrations
@app.get("/location/map/{location}")
def get_map_data(location: str):
    return services.get_map_data(location)

@app.post("/weather/", response_model=schemas.WeatherRecord)
def create_record(
    record: schemas.WeatherRecordCreate, 
    db: Session = Depends(get_db)
):
    try:
        location_data = validate_location(record.location)
        if not location_data:
            raise HTTPException(
                status_code=400,
                detail="Location not found"
            )
            
        # Create weather record with all required fields
        db_record = models.WeatherRecord(
            location=record.location,
            record_date=record.record_date,
            latitude=location_data['lat'],
            longitude=location_data['lon'],
            temperature=None,  # These can be None initially
            humidity=None,
            wind_speed=None,
            conditions=None
        )
        
        db.add(db_record)
        db.commit()
        db.refresh(db_record)
        return db_record
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )
        
@app.get("/debug-key")
def debug_key():
    from app.config import settings
    return {
        "loaded_key": settings.openweather_api_key,
        "key_valid": "your_openweather_api_key" not in settings.openweather_api_key
    }
