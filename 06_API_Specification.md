# API Specification
## Cascade-Aware Traffic Navigation System — Backend API (FastAPI)

### Base URL
`http://localhost:8000` (local dev) or free-tier hosted URL (Render/Railway) for demo. Frontend must be served over HTTPS for Geolocation to function in production.

---

### 1. `POST /route`
Compute ranked, cascade-aware routes between an origin and destination.

**Request**
```json
{
  "origin": {"lat": 34.0522, "lng": -118.2437},
  "destination": {"lat": 34.0622, "lng": -118.2537},
  "waypoints": [],
  "emergency_mode": false,
  "vehicle_type": null,
  "departure_time": "2026-09-17T10:30:00Z"
}
```

**Response 200**
```json
{
  "routes": [
    {
      "route_id": "r1",
      "geometry": {"type": "LineString", "coordinates": [[-118.2437,34.0522],["..."]]},
      "eta_min": 14.2,
      "cascade_safety_score": 0.81,
      "delay_timeline": [
        {"point": "sensor_717447", "eta_min": 3, "predicted_congestion": 0.42, "cascade_data_available": true},
        {"point": "sensor_717512", "eta_min": 9, "predicted_congestion": 0.15, "cascade_data_available": true}
      ],
      "is_shortcut": false,
      "recommended": true
    }
  ]
}
```

**Response 404** — no valid route found between origin and destination.
**Response 422** — invalid coordinates or malformed request.

---

### 2. `GET /predict/{sensor_id}`
(Unchanged from prior scope) Predict congestion for a single sensor at given horizon(s).

**Response 200**
```json
{
  "sensor_id": "717447",
  "predictions": [
    {"horizon_min": 15, "predicted_congestion": 0.62, "confidence": 0.94}
  ]
}
```

---

### 3. `GET /cascade/{sensor_id}`
(Unchanged) Multi-hop cascade path starting from a sensor.

---

### 4. `GET /explain/{sensor_id}`
(Unchanged) SHAP + GAT attention explainability for a prediction.

---

### 5. `GET /weather/current`
Live current weather for a location.

**Request**
- Query params: `lat`, `lng`

**Response 200**
```json
{"latitude": 34.0522, "longitude": -118.2437, "temperature": 22.4, "precipitation": 0.0, "condition": "clear", "is_live": true}
```

**Response 503** — Open-Meteo unavailable/rate-limited; frontend should hide weather panel gracefully rather than error out.

---

### 6. `POST /route/emergency`
Convenience endpoint equivalent to `POST /route` with `emergency_mode: true` pre-set and priority weighting applied; kept separate for clarity in dispatch-style usage.

**Request/Response:** same shape as `POST /route`, with `vehicle_type` required (not nullable) and response including an additional field:
```json
{"priority_cleared": true, "disclaimer": "Route recommendation only. Does not control traffic signals or infrastructure."}
```

---

### 7. `GET /compare-models`
(Unchanged) Returns logged LSTM vs GAT+GRU comparison metrics.

---

### Error Handling Convention
All endpoints return standard HTTP status codes with:
```json
{"error": "description of what went wrong", "status_code": 404}
```

### Versioning
No versioning needed for current scope (single-version API, not public-facing).
