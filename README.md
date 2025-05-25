# 🌤️ Weather App

Built by Jessie You for the PM Accelerator Technical Assessment.

## 📋 Project Overview

This weather app is a full-stack FastAPI application that fetches current weather data, 5-day forecasts, and allows users to save and export weather records. It integrates with the OpenWeatherMap API and is deployed on [Render](https://render.com).

🔗 **Live App**: [https://weatherapp-xpwy.onrender.com](https://weatherapp-xpwy.onrender.com)  
🔗 **API Docs**: [https://weatherapp-xpwy.onrender.com/docs](https://weatherapp-xpwy.onrender.com/docs)

---

## Tech Stack

- Backend: FastAPI, SQLAlchemy
- Database: SQLite
- Deployment: Render
- API Integration: OpenWeatherMap

---

## How to Run Locally

```bash
# Clone the repo
git clone https://github.com/yourusername/weather-app.git
cd weather-app

# Create virtual environment
python -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the app
uvicorn app.main:app --reload
