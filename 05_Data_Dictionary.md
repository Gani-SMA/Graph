# Data Dictionary / Schema Reference
## Cascade-Aware Traffic Navigation System

Authoritative reference for every field used in the project, including the routing/geolocation/weather/emergency additions. Check this file before referencing any field name — do not guess or invent columns.

### 1. Traffic Data (METR-LA source) — unchanged from prior scope
| Field | Type | Unit / Format | Description |
|---|---|---|---|
| sensor_id | string | e.g., "717447" | Unique road sensor identifier |
| timestamp | datetime | ISO 8601, 5-min intervals | Time of the reading |
| speed | float | mph | Raw recorded traffic speed |
| congestion_level | float | 0–1 (derived) | Normalized: `1 - (speed / free_flow_speed)`, clipped to [0,1] |
| free_flow_speed | float | mph | Reference max speed for that sensor/road |

### 2. Weather Data — Historical (training) vs Live (runtime)
| Field | Type | Unit / Format | Description |
|---|---|---|---|
| timestamp | datetime | ISO 8601 | For training: matched to traffic timestamp. For runtime: current time |
| temperature | float | °C | Air temperature |
| precipitation | float | mm | Precipitation amount |
| condition | string | e.g., "clear", "rain" | Categorical weather condition |
| latitude / longitude | float | decimal degrees | Query location |
| is_live | boolean | — | True when fetched at runtime from Open-Meteo current endpoint; False for historical training data |

### 3. Road Graph / Adjacency — unchanged from prior scope
| Field | Type | Format | Description |
|---|---|---|---|
| source_sensor_id | string | matches sensor_id | Upstream road/sensor |
| target_sensor_id | string | matches sensor_id | Downstream road/sensor |
| distance_km | float | kilometers | Physical distance (optional edge weight) |
| edge_index | tensor | PyG format `[2, num_edges]` | Derived at model-build time |

### 4. User Location (live, new)
| Field | Type | Format | Description |
|---|---|---|---|
| latitude, longitude | float | decimal degrees | From browser Geolocation API |
| accuracy_m | float | meters | Reported GPS accuracy |
| timestamp | datetime | ISO 8601 | Capture time |
| source | string | "geolocation" or "manual" | Whether live GPS or manual fallback entry was used |

### 5. Route Request (new)
| Field | Type | Format | Description |
|---|---|---|---|
| origin | object | {lat, lng} | Starting point |
| destination | object | {lat, lng} | End point |
| waypoints | array of {lat, lng} | ordered | Optional intermediate stops |
| emergency_mode | boolean | true/false | Priority routing toggle |
| vehicle_type | string or null | "ambulance" \| "fire_engine" \| "police" \| null | Only relevant if emergency_mode is true |
| departure_time | datetime | ISO 8601 | Used to determine which forecasting horizon (15/30/60 min) applies at each point along the route |

### 6. Route Response (new)
| Field | Type | Format | Description |
|---|---|---|---|
| route_id | string | — | Candidate route identifier |
| geometry | GeoJSON LineString | — | Path geometry from routing engine |
| eta_min | float | minutes | Base ETA from routing engine (topology-only, no cascade adjustment) |
| cascade_safety_score | float | 0–1 | Higher = less predicted congestion along the route |
| delay_timeline | array of {point, eta_min, predicted_congestion, cascade_data_available} | — | Per-point predicted delay; `cascade_data_available` is false for segments outside the trained subset |
| is_shortcut | boolean | true/false | True if this candidate beats the shortest-by-distance route once cascade adjustment is applied |
| recommended | boolean | true/false | True for the top-ranked route shown to the user |

### 7. Engineered Feature Vector (model input, per sensor per timestep) — unchanged
| Field | Type | Range/Unit | Notes |
|---|---|---|---|
| congestion_level | float | 0–1 | See Traffic Data |
| hour_of_day | sin/cos encoded | — | Cyclical encoding |
| day_of_week | sin/cos encoded | — | Cyclical encoding |
| rolling_avg_15min | float | 0–1 | Rolling mean of congestion_level |
| temperature | float | °C | See Weather Data |
| precipitation | float | mm | See Weather Data |

### 8. Model Output Schema — unchanged
| Field | Type | Description |
|---|---|---|
| sensor_id | string | Road/sensor the prediction applies to |
| horizon_min | int | 15, 30, or 60 |
| predicted_congestion | float | 0–1 normalized prediction |
| confidence | float | 0–1 |

### 9. Explainability Output Schema — unchanged
| Field | Type | Description |
|---|---|---|
| feature_name | string | e.g., "precipitation" |
| shap_value | float | Signed contribution |
| attention_weight | float | GAT attention score for a given upstream neighbor sensor |

### Notes on Units Consistency
- All congestion values used in modeling, routing re-ranking, and dashboard display must be the normalized 0–1 `congestion_level`, never raw speed.
- All timestamps must be timezone-consistent (recommend UTC internally, convert to local time only for display).
- `is_live` and `cascade_data_available` flags must always be surfaced to the frontend — never silently substitute historical/unavailable data for live/available data without flagging it.
