import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_read_root():
    resp = client.get("/")
    assert resp.status_code == 200
    data = resp.json()
    assert "notice" in data

def test_post_route_success():
    payload = {
        "origin": {"lat": 34.0522, "lng": -118.2437},
        "destination": {"lat": 34.0622, "lng": -118.2537},
        "waypoints": [],
        "emergency_mode": False,
        "vehicle_type": None
    }
    resp = client.post("/route", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "routes" in data
    assert len(data["routes"]) >= 1
    assert data["routes"][0]["recommended"] is True

def test_post_route_emergency_success():
    payload = {
        "origin": {"lat": 34.0522, "lng": -118.2437},
        "destination": {"lat": 34.0622, "lng": -118.2537},
        "waypoints": [],
        "emergency_mode": True,
        "vehicle_type": "ambulance"
    }
    resp = client.post("/route/emergency", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["priority_cleared"] is True
    assert "disclaimer" in data
    assert "Does not control traffic signals" in data["disclaimer"]

def test_post_route_emergency_missing_vehicle_type():
    payload = {
        "origin": {"lat": 34.0522, "lng": -118.2437},
        "destination": {"lat": 34.0622, "lng": -118.2537},
        "waypoints": [],
        "emergency_mode": True,
        "vehicle_type": None
    }
    resp = client.post("/route/emergency", json=payload)
    assert resp.status_code == 422

def test_get_sensor_prediction_found():
    resp = client.get("/predict/717447")
    assert resp.status_code == 200
    data = resp.json()
    assert data["sensor_id"] == "717447"
    assert len(data["predictions"]) == 3

def test_get_sensor_prediction_not_found():
    resp = client.get("/predict/invalid_sensor_999999")
    assert resp.status_code == 404

def test_get_weather_current():
    resp = client.get("/weather/current?lat=34.0522&lng=-118.2437")
    assert resp.status_code == 200
    data = resp.json()
    assert "temperature" in data
    assert "condition" in data

def test_get_compare_models():
    resp = client.get("/compare-models")
    assert resp.status_code == 200
    data = resp.json()
    assert "metrics" in data
