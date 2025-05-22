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

from fastapi.staticfiles import StaticFiles

app = FastAPI()

app.mount("/front", StaticFiles(directory="front"), name="front")
app.mount("/", StaticFiles(directory="front", html=True), name="front_index")

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