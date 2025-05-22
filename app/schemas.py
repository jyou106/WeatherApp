#schemas.py
from __future__ import annotations
from datetime import date, datetime
from pydantic import BaseModel, Field, field_validator

class WeatherRecordBase(BaseModel):
    location: str
    record_date: date = Field(default_factory=date.today)  # Changed from 'date' to 'record_date'

    @field_validator("record_date")
    @classmethod
    def date_not_future(cls, v: date):
        if v > date.today():
            raise ValueError("Date cannot be in the future")
        return v

class WeatherRecordCreate(WeatherRecordBase):
    location: str = Field(..., min_length=2, max_length=100)
    record_date: date = Field(default_factory=date.today)
    latitude: float | None = None  # Make optional
    longitude: float | None = None  # Make optional
    
    @field_validator('location')
    def validate_location(cls, v):
        if not v.replace(' ', '').isalnum():
            raise ValueError("Location can only contain letters, numbers and spaces")
        if ',' in v and len(v.split(',')) != 2:
            raise ValueError("Use 'City, Country' format when specifying country")
        return v.title()
    
class WeatherRecordUpdate(BaseModel):
    temperature: float | None = None
    humidity: float | None = None
    wind_speed: float | None = None
    conditions: str | None = None

    class Config:
        from_attributes = True

class WeatherRecord(WeatherRecordBase):
    id: int
    latitude: float
    longitude: float
    created_at: datetime
    updated_at: datetime | None = None

    class Config:
        from_attributes = True