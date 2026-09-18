import pytest
from datetime import datetime
from backend.schemas import RouteRequest, RouteResponse, WeatherResponse, Location

def test_route_request_schema_validation():
    payload = {
        "origin": {"lat": 34.0522, "lng": -118.2437},
        "destination": {"lat": 34.0622, "lng": -118.2537},
        "waypoints": [],
        "emergency_mode": False,
        "vehicle_type": None,
        "departure_time": "2026-09-17T10:30:00Z"
    }
    req = RouteRequest(**payload)
    assert req.origin.lat == 34.0522
    assert req.origin.lng == -118.2437
    assert req.emergency_mode is False
    assert req.vehicle_type is None

def test_route_response_schema_validation():
    payload = {
        "routes": [
            {
                "route_id": "r1",
                "geometry": {
                    "type": "LineString",
                    "coordinates": [[-118.2437, 34.0522], [-118.2537, 34.0622]]
                },
                "eta_min": 14.2,
                "cascade_safety_score": 0.81,
                "delay_timeline": [
                    {
                        "point": "sensor_717447",
                        "eta_min": 3.0,
                        "predicted_congestion": 0.42,
                        "cascade_data_available": True
                    }
                ],
                "is_shortcut": False,
                "recommended": True
            }
        ]
    }
    res = RouteResponse(**payload)
    assert len(res.routes) == 1
    assert res.routes[0].route_id == "r1"
    assert res.routes[0].cascade_safety_score == 0.81
    assert res.routes[0].delay_timeline[0].cascade_data_available is True

def test_weather_response_schema_validation():
    payload = {
        "latitude": 34.0522,
        "longitude": -118.2437,
        "temperature": 22.4,
        "precipitation": 0.0,
        "condition": "clear",
        "is_live": True
    }
    weather = WeatherResponse(**payload)
    assert weather.temperature == 22.4
    assert weather.condition == "clear"
    assert weather.is_live is True
