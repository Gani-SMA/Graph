# Deployment / Setup Guide
## Cascade-Aware Traffic Navigation System — Zero-Cost Setup

### 1. Environment Setup (Local)

```bash
git clone <your-repo-url>
cd cascade-traffic-navigation

# Backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install torch torch_geometric shap pandas numpy scikit-learn fastapi uvicorn requests

# Frontend
cd frontend
npm install
```

### 2. Dataset & Road Network Setup
1. Download METR-LA (or PeMS) dataset and place in `/data/raw/` — used to train the cascade model.
2. Download an OpenStreetMap extract for your demo area (e.g., via Geofabrik) — used by the routing engine.
3. Run preprocessing scripts to produce `/data/processed/` feature data for the cascade model.
4. Weather: no download needed — pulled live from Open-Meteo at runtime; for training, pull historical Open-Meteo data for the same period as your traffic dataset.

### 3. Routing Engine Setup (OSRM, self-hosted, free)
```bash
# Using Docker (free)
docker pull osrm/osrm-backend
docker run -t -v "${PWD}/data:/data" osrm/osrm-backend osrm-extract -p /opt/car.lua /data/your-area.osm.pbf
docker run -t -v "${PWD}/data:/data" osrm/osrm-backend osrm-contract /data/your-area.osrm
docker run -t -i -p 5000:5000 -v "${PWD}/data:/data" osrm/osrm-backend osrm-routed /data/your-area.osrm
```
Alternative: GraphHopper offers a free-tier hosted routing API if self-hosting via Docker is not preferred — trade-off is a request-per-day limit on the free tier versus unlimited local self-hosting.

### 4. Training the Cascade Model (Free GPU via Google Colab)
1. Upload `/notebooks/train_lstm_baseline.ipynb` and `/notebooks/train_gat_gru.ipynb` to Google Colab.
2. Runtime → Change runtime type → GPU (T4, free tier).
3. Mount Drive or upload processed data for the session.
4. Run all cells; save checkpoint files to Drive (Colab sessions are not persistent).
5. Kaggle Notebooks (30 free GPU hours/week) as backup if Colab limits are hit.

### 5. Running Locally
```bash
# Backend
cd backend
uvicorn main:app --reload
# Runs at http://localhost:8000

# Frontend (separate terminal)
cd frontend
npm start
# Runs at http://localhost:3000
```
**Important:** Geolocation works on `http://localhost` for local development without HTTPS, but will NOT work on a non-localhost HTTP address — use HTTPS for anything beyond local testing (see Section 6).

### 6. Free-Tier Deployment (HTTPS required for Geolocation)

| Component | Free Host | Notes |
|---|---|---|
| Frontend (React PWA) | Vercel or Netlify free tier | HTTPS by default — required for Geolocation API to function |
| Backend (FastAPI) | Render or Railway free tier | May sleep after inactivity on free tier — "wake up" before a live demo |
| Routing engine | Self-hosted OSRM on a free-tier VM (e.g., Oracle Cloud free tier, or a free Render/Railway container), or GraphHopper free API tier | Choose based on demo area size and request volume needed |

### 7. Environment Variables
```
# No API keys required for the default free-tier stack.
# GraphHopper free tier (if used instead of self-hosted OSRM) requires a free API key:
GRAPHHOPPER_API_KEY=<your-free-tier-key>
```
Keep out of version control via `.env` + `.gitignore`.

### 8. PWA Installability Setup
1. Add `manifest.json` to `/frontend/public/` with app name, icons, theme color, and `display: "standalone"`.
2. Add a service worker (via `create-react-app`'s built-in PWA template, or `vite-plugin-pwa` if using Vite) for offline shell caching.
3. Test "Add to Home Screen" on at least one real Android device and one real iOS device before the demo — emulator testing alone can miss platform-specific install quirks.

### 9. Cross-Device Testing Checklist
- [ ] Chrome DevTools device emulation for quick iteration (desktop, tablet, mobile presets).
- [ ] At least one real mobile device test (Geolocation accuracy and PWA install behavior differ meaningfully from emulation).
- [ ] Test in Chrome, Firefox, Safari, and Edge before finalizing.

### 10. Pre-Demo Checklist
- [ ] All model checkpoints present and loadable.
- [ ] Routing engine (self-hosted OSRM or GraphHopper) reachable and responding.
- [ ] Frontend deployed over HTTPS; Geolocation permission prompt tested live.
- [ ] Fallback behavior verified: location denied → manual entry works; weather API down → panel hides gracefully; cascade data unavailable for a segment → flagged, not silently dropped.
- [ ] Emergency mode disclaimer confirmed visible and not dismissible.
- [ ] If using free-tier hosted backend/routing engine that sleeps on inactivity, "wake" it a few minutes before presenting.
