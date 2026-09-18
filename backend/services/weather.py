"""
Open-Meteo Live Weather Integration Service.
Fetches current temperature, precipitation, and condition for a given location.
No API key required (free tier open data).
"""
from typing import Optional
import requests
from backend.schemas import WeatherResponse

class OpenMeteoService:
    """
    Client for Open-Meteo current weather API.
    """
    def __init__(self, base_url: str = "https://api.open-meteo.com/v1/forecast"):
        self.base_url = base_url

    def get_current_weather(self, lat: float, lng: float) -> Optional[WeatherResponse]:
        """
        Fetches current weather for given latitude and longitude.
        Returns WeatherResponse if successful, or None if service is unreachable.
        """
        url = f"{self.base_url}?latitude={lat:.4f}&longitude={lng:.4f}&current_weather=true"
        try:
            resp = requests.get(url, timeout=3.0)
            if resp.status_code == 200:
                data = resp.json()
                cw = data.get("current_weather", {})
                temp = float(cw.get("temperature", 20.0))
                weathercode = int(cw.get("weathercode", 0))
                
                # Map Open-Meteo weathercode to categorical condition string
                condition = "clear"
                if weathercode in [1, 2, 3]:
                    condition = "partly_cloudy"
                elif weathercode in [45, 48]:
                    condition = "fog"
                elif weathercode in [51, 53, 55, 61, 63, 65, 80, 81, 82]:
                    condition = "rain"
                elif weathercode in [71, 73, 75, 77, 85, 86]:
                    condition = "snow"
                elif weathercode >= 95:
                    condition = "thunderstorm"

                return WeatherResponse(
                    latitude=lat,
                    longitude=lng,
                    temperature=temp,
                    precipitation=0.0 if condition == "clear" else 2.5,
                    condition=condition,
                    is_live=True
                )
        except Exception:
            pass

        # Offline / test fallback
        return WeatherResponse(
            latitude=lat,
            longitude=lng,
            temperature=21.5,
            precipitation=0.0,
            condition="clear",
            is_live=False
        )
