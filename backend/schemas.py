from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field
from datetime import datetime

class Location(BaseModel):
    lat: float
    lng: float

class RouteRequest(BaseModel):
    origin: Location
    destination: Location
    waypoints: List[Location] = Field(default_factory=list)
    emergency_mode: bool = False
    vehicle_type: Optional[str] = None  # "ambulance" | "fire_engine" | "police" | None
    departure_time: Optional[datetime] = None

class DelayPoint(BaseModel):
    point: str
    eta_min: float
    predicted_congestion: float
    cascade_data_available: bool = True

class RouteGeometry(BaseModel):
    type: str = "LineString"
    coordinates: List[List[float]]

class CandidateRoute(BaseModel):
    route_id: str
    geometry: RouteGeometry
    eta_min: float
    cascade_safety_score: float
    delay_timeline: List[DelayPoint]
    is_shortcut: bool = False
    recommended: bool = False

class RouteResponse(BaseModel):
    routes: List[CandidateRoute]
    priority_cleared: Optional[bool] = None
    disclaimer: Optional[str] = None

class WeatherResponse(BaseModel):
    latitude: float
    longitude: float
    temperature: float
    precipitation: float
    condition: str
    is_live: bool = True

class HorizonPrediction(BaseModel):
    horizon_min: int
    predicted_congestion: float
    confidence: float

class SensorPrediction(BaseModel):
    sensor_id: str
    predictions: List[HorizonPrediction]

class FeatureContribution(BaseModel):
    feature_name: str
    shap_value: float

class UpstreamAttribution(BaseModel):
    upstream_sensor_id: str
    attention_weight: float

class ExplainabilityResponse(BaseModel):
    sensor_id: str
    feature_contributions: List[FeatureContribution]
    upstream_attributions: List[UpstreamAttribution]
