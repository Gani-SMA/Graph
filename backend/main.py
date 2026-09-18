"""
FastAPI Backend Main Application Entrypoint.
Provides endpoints for cascade-aware routing, live weather, sensor predictions, and model comparisons.
"""
from typing import Optional
from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware

from backend.schemas import (
    RouteRequest, RouteResponse, WeatherResponse,
    SensorPrediction, HorizonPrediction, ExplainabilityResponse
)
from routing.osrm_client import OSRMClient
from routing.reranker import CascadeReRanker
from backend.services.weather import OpenMeteoService
from models.inference import get_inference_engine
from explainability.shap_gat import CascadeExplainer

app = FastAPI(
    title="Cascade-Aware Traffic Navigation System API",
    description="Backend API serving open-source route computation re-ranked by GAT+GRU cascade congestion model predictions.",
    version="1.0.0"
)

# Enable CORS for local dev and web/PWA clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

osrm_client = OSRMClient()
reranker = CascadeReRanker()
weather_service = OpenMeteoService()
inference_engine = get_inference_engine()
explainer = CascadeExplainer()

@app.get("/")
def read_root():
    return {
        "system": "Cascade-Aware Traffic Navigation System",
        "status": "online",
        "notice": "Powered by open-source OSRM routing + historically-trained GAT+GRU cascade prediction model."
    }

@app.post("/route", response_model=RouteResponse)
def compute_route(req: RouteRequest):
    """
    Computes candidate routes via OSRM and re-ranks them using GAT+GRU cascade congestion predictions.
    """
    origin_pt = (req.origin.lat, req.origin.lng)
    dest_pt = (req.destination.lat, req.destination.lng)
    waypoints_pts = [(w.lat, w.lng) for w in req.waypoints] if req.waypoints else None

    # Retrieve candidate routes from routing engine
    candidates = osrm_client.get_candidate_routes(origin_pt, dest_pt, waypoints_pts)
    if not candidates:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No valid route found between origin and destination."
        )

    # Re-rank candidates using cascade predictions
    ranked_routes = reranker.rank_routes(candidates, emergency_mode=req.emergency_mode)
    return RouteResponse(routes=ranked_routes)

@app.post("/route/emergency", response_model=RouteResponse)
def compute_emergency_route(req: RouteRequest):
    """
    Emergency Vehicle Mode route recommendation endpoint.
    Applies priority weighting favoring predicted clearance and safety over raw distance.
    Mandatory disclaimer included per AppFlow Section 2.
    """
    if not req.vehicle_type:
        raise HTTPException(
            status_code=422,
            detail="vehicle_type must be specified when requesting emergency vehicle routing ('ambulance', 'fire_engine', 'police')."
        )

    origin_pt = (req.origin.lat, req.origin.lng)
    dest_pt = (req.destination.lat, req.destination.lng)
    waypoints_pts = [(w.lat, w.lng) for w in req.waypoints] if req.waypoints else None

    candidates = osrm_client.get_candidate_routes(origin_pt, dest_pt, waypoints_pts)
    if not candidates:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No valid emergency route found between origin and destination."
        )

    ranked_routes = reranker.rank_routes(candidates, emergency_mode=True)
    
    return RouteResponse(
        routes=ranked_routes,
        priority_cleared=True,
        disclaimer="Route recommendation only. Does not control traffic signals or road infrastructure."
    )

@app.get("/predict/{sensor_id}", response_model=SensorPrediction)
def get_sensor_prediction(sensor_id: str):
    """
    Returns predicted congestion levels for a specific sensor at 15, 30, and 60 min horizons.
    """
    pred_dict = inference_engine.get_sensor_prediction(sensor_id)
    if not pred_dict:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sensor '{sensor_id}' not found in bounded demo road subset graph."
        )

    horizons = [
        HorizonPrediction(horizon_min=15, predicted_congestion=round(pred_dict[15], 2), confidence=0.92),
        HorizonPrediction(horizon_min=30, predicted_congestion=round(pred_dict[30], 2), confidence=0.88),
        HorizonPrediction(horizon_min=60, predicted_congestion=round(pred_dict[60], 2), confidence=0.84)
    ]
    return SensorPrediction(sensor_id=sensor_id, predictions=horizons)

@app.get("/explain/{sensor_id}", response_model=ExplainabilityResponse)
def explain_sensor(sensor_id: str):
    """
    Returns SHAP feature contributions and GAT spatial attention weights for a sensor node.
    """
    res = explainer.explain_sensor_prediction(sensor_id)
    if not res:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sensor '{sensor_id}' not found in bounded demo road subset graph."
        )
    return res

@app.get("/weather/current", response_model=WeatherResponse)
def get_weather(lat: float = Query(...), lng: float = Query(...)):
    """
    Returns live current weather from Open-Meteo for given coordinates.
    """
    res = weather_service.get_current_weather(lat, lng)
    if not res:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Live weather service temporarily unavailable."
        )
    return res

@app.get("/compare-models")
def get_model_comparison():
    """
    Returns logged metrics comparing LSTM baseline vs GAT+GRU core model from Model Card log.
    """
    return {
        "metrics": [
            {
                "model": "LSTM Baseline",
                "mae_15min": None,
                "mae_30min": None,
                "mae_60min": None,
                "rmse_avg": None,
                "notes": "Awaiting Colab/Kaggle training run log"
            },
            {
                "model": "GAT+GRU (Core)",
                "mae_15min": None,
                "mae_30min": None,
                "mae_60min": None,
                "rmse_avg": None,
                "notes": "Awaiting Colab/Kaggle training run log"
            }
        ]
    }
