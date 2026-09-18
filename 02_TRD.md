# Technical Requirements Document (TRD)
## Cascade-Aware Traffic Navigation System

### 1. System Architecture Overview

```
[Browser: Geolocation API]   [User Input: Destination, Waypoints, Emergency Toggle]
          |                              |
          v                              v
     ┌─────────────────────────────────────────┐
     │   Frontend (Responsive PWA — React +      │
     │   Leaflet.js + Leaflet Routing Machine)   │
     └─────────────────────────────────────────┘
                       |
                       v  (REST API calls)
     ┌─────────────────────────────────────────┐
     │            Backend (FastAPI)              │
     └─────────────────────────────────────────┘
        |            |             |            |
        v            v             v            v
  [Routing Engine] [GAT+GRU    [Open-Meteo   [Explainability
   OSRM/GraphHopper  Cascade    live weather   SHAP + GAT
   free, self-hosted  Model]     API]          attention]
        |            |             |            |
        └────────────┴─────────────┴────────────┘
                       |
                       v
        Route Re-Ranking Logic (candidate routes
        scored by ETA + cascade-safety, emergency
        priority weighting applied if toggled)
                       |
                       v
        Response: ranked route(s), delay timeline,
        shortcut flag, cascade explanation, weather
```

### 2. Tech Stack (Free-Tier / Open-Source Only)

| Layer | Tool | Justification | Cost |
|---|---|---|---|
| Frontend framework | React (as a PWA — manifest.json + service worker) | Responsive, installable on mobile/tablet, works in any modern browser | Free |
| Map + routing UI | Leaflet.js + Leaflet Routing Machine | Open-source, lightweight, works well on mobile | Free |
| Live location | Browser Geolocation API | Native browser capability, requires HTTPS | Free |
| Routing engine | OSRM (Open Source Routing Machine) or GraphHopper | Real, open-source route computation over actual road network data (OpenStreetMap); self-hostable via Docker or free-tier hosted API | Free |
| Cascade model | PyTorch + PyTorch Geometric (GAT) + PyTorch GRU | Core project model, as established | Free |
| Baseline model | PyTorch LSTM | Comparison only | Free |
| Weather (live) | Open-Meteo current + forecast API | No key required, genuinely live data | Free |
| Explainability | SHAP + GAT attention extraction | As established | Free |
| Backend | FastAPI | Serves routing, prediction, and explainability endpoints | Free |
| Road/graph data | OpenStreetMap (via OSRM/GraphHopper's own data ingestion) + METR-LA/PeMS for training the cascade model | Real road topology + real historical traffic patterns | Free |
| Training compute | Google Colab / Kaggle Notebooks (free GPU) | As established | Free |
| Hosting (frontend) | Vercel / Netlify free tier (must support HTTPS for Geolocation) | Free tier, HTTPS by default | Free |
| Hosting (backend) | Render / Railway free tier | Free tier | Free |
| Hosting (routing engine) | Self-hosted OSRM via free-tier VM, or GraphHopper free API tier | Free | Free |
| Dev tools | VS Code / Antigravity IDE, Git/GitHub | As available | Free |

### 3. Frontend Design Requirements
The frontend must follow the project's Anti-Vibecode design ruleset: no default AI-generated visual patterns (harsh gradients, generic icon packs, purple-on-black "techy" palettes, glassmorphism, bento grids, etc.). Palette, typography, and layout must be chosen deliberately based on the subject (a navigation/safety tool — consider palettes drawn from road signage, map cartography conventions, or transit systems rather than generic SaaS purple). This applies specifically to the dashboard chrome around the map (panels, buttons, timeline UI) — the map itself uses standard cartographic styling (OpenStreetMap tiles).

### 4. Data Schema (additions to existing traffic/weather/graph schema)

**4.1 User location (live)**
| Field | Type | Description |
|---|---|---|
| latitude, longitude | float | From Geolocation API |
| accuracy_m | float | Reported GPS accuracy in meters |
| timestamp | datetime | When the position was captured |

**4.2 Route request**
| Field | Type | Description |
|---|---|---|
| origin | {lat, lng} | Live or manually entered |
| destination | {lat, lng} | User-entered |
| waypoints | list of {lat, lng} | Optional, ordered |
| emergency_mode | boolean | Priority routing toggle |
| vehicle_type | string (optional) | "ambulance" / "fire_engine" / "police" / null |

**4.3 Route response**
| Field | Type | Description |
|---|---|---|
| route_id | string | Candidate route identifier |
| geometry | polyline / GeoJSON | Path geometry from routing engine |
| eta_min | float | Base ETA from routing engine (topology-only) |
| cascade_safety_score | float (0–1) | Derived from cascade model — lower predicted congestion along path = higher score |
| delay_timeline | list of {point, eta_min, predicted_congestion} | Per-waypoint predicted delay |
| is_shortcut | boolean | True if this route is faster than the topologically shortest path once cascade prediction is considered |
| recommended | boolean | True for the top-ranked route returned to the user |

**4.4 Live weather**
| Field | Type | Description |
|---|---|---|
| latitude, longitude | float | Query location |
| temperature, precipitation, condition | as in existing Data Dictionary | Live values, not historical |

### 5. Model / Routing Logic Specification
- Candidate routes are generated by the routing engine (OSRM/GraphHopper) using standard shortest-path algorithms (Dijkstra/A*/Contraction Hierarchies, engine-dependent) over real road network topology.
- Each candidate route's road segments are matched against the project's road graph subset; where a match exists, the GAT+GRU model's predicted congestion for the relevant time window is used to compute a cascade_safety_score for that route.
- Routes are re-ranked by a combined score: weighted combination of raw ETA and cascade_safety_score. In emergency_mode, the weighting shifts to prioritize cascade-safety and predicted clearance over raw shortest distance.
- A route is flagged is_shortcut = true if a non-topologically-shortest candidate achieves a lower effective (cascade-adjusted) ETA than the shortest-by-distance candidate.
- **Important scope note:** cascade prediction is only available for roads within the project's trained subset/graph. For road segments outside that subset, the system falls back to the routing engine's raw ETA with no cascade adjustment — this must be handled gracefully (not silently ignored) and disclosed in the UI (e.g., "cascade prediction unavailable for this segment").

### 6. API Contract
See `07_API_Specification.md` for full endpoint definitions (routing, prediction, explainability, weather).

### 7. Non-Functional Requirements
- Must function correctly in Chrome, Firefox, Safari, and Edge (latest two major versions each).
- Responsive breakpoints: desktop (≥1024px), tablet (600–1023px), mobile (<600px) — map and panel layout must adapt at each.
- Installable as a PWA (manifest.json + service worker) on Android and iOS home screens.
- Geolocation requires HTTPS in production; local development may use localhost exception.
- Route computation (engine + cascade re-ranking combined) should return within a few seconds for a demo-scale road subset.
- Manual location entry must be available as a fallback when geolocation permission is denied or unavailable.

### 8. Evaluation Methodology (cascade model, unchanged from prior scope)
- Metrics: MAE, RMSE, Accuracy per horizon (15/30/60 min).
- Strict time-based train/test split, identical across LSTM baseline and GAT+GRU.
- Routing/UI features are evaluated functionally (does it work correctly across devices and scenarios), not via the same statistical metrics as the prediction model.
