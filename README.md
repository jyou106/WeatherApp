# Weather App

A full-stack weather application that was built using FastAPI and SQLAlchemy on the backend, and deployed using [Render](https://render.com). This app allows users to retrieve current weather, forecasts, and save weather records to a database.

🔗 **Live API Docs**: [https://weatherapp-xpwy.onrender.com/docs](https://weatherapp-xpwy.onrender.com/docs)  
🌐 **Base URL**: `https://weatherapp-xpwy.onrender.com`

---

## Features

- Get current weather by location or coordinates
- Retrieve 5-day forecasts
- Suggest locations and map coordinates
- Create, update, and delete weather records in a database
- Export saved records in different formats
- View API documentation through FastAPI’s Swagger UI

---

## Tech Stack

- **Backend**: FastAPI, SQLAlchemy
- **Database**: SQLite (can be swapped for PostgreSQL or others)
- **Deployment**: Render
- **External API**: OpenWeatherMap

---

## 📌 API Endpoints

You can interact with the app via `/docs`, or send requests directly to these endpoints:

### 🌦️ Current Weather
- `GET /weather/current/{location}`
- `GET /weather/current/coords/{lat}/{lon}`

### 📆 Forecast
- `GET /weather/forecast/{location}`

### 📍 Location
- `GET /location/suggest?query=toronto`
- `GET /location/map/{location}`

### 🗃️ Weather Records
- `GET /weather/` — Read all records
- `GET /weather/{record_id}` — Read a specific record
- `POST /weather/` — Create a record
- `PUT /weather/{record_id}` — Update a record
- `DELETE /weather/{record_id}` — Delete a record
- `GET /weather/export/{record_id}/{format}` — Export a record (e.g. CSV, JSON)

---

## 🧪 Example Usage

**Get Weather by City:**
```bash
curl https://weatherapp-xpwy.onrender.com/weather/current/Toronto
