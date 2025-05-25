# crud.py
from sqlalchemy.orm import Session
from . import models, schemas

def create_weather_record(db: Session, record: schemas.WeatherRecordCreate):
    db_record = models.WeatherRecord(
        location=record.location,
        record_date=record.record_date,
        latitude=record.latitude,
        longitude=record.longitude,
        temperature=None,
        humidity=None,
        wind_speed=None,
        conditions=None
    )
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record

def update_weather_record(db: Session, record_id: int, updates: schemas.WeatherRecordUpdate):
    db_record = db.query(models.WeatherRecord).filter(models.WeatherRecord.id == record_id).first()
    if db_record:
        for key, value in updates.dict(exclude_unset=True).items():  # exclude_unset prevents None-overwrites
            setattr(db_record, key, value)
        db.commit()
        db.refresh(db_record)
    return db_record

# Add to crud.py
def get_weather_records(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.WeatherRecord).offset(skip).limit(limit).all()

def delete_weather_record(db: Session, record_id: int):
    db_record = db.query(models.WeatherRecord).filter(models.WeatherRecord.id == record_id).first()
    if db_record:
        db.delete(db_record)
        db.commit()
        return True
    return False

def get_weather_record(db: Session, record_id: int):
    return db.query(models.WeatherRecord).filter(models.WeatherRecord.id == record_id).first()
