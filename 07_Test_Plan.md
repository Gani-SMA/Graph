# Test Plan
## Cascade-Aware Traffic Navigation System

### 1. Data Pipeline Tests (unchanged from prior scope)
- [ ] Traffic data loads without missing `sensor_id`/`timestamp` after cleaning.
- [ ] Traffic and weather timestamps align correctly (no timezone mismatch).
- [ ] `congestion_level` values fall strictly within [0, 1].
- [ ] No duplicate `(sensor_id, timestamp)` rows.
- [ ] Rolling average feature excludes future data (no look-ahead leakage).

### 2. Graph & Model Tests (unchanged from prior scope)
- [ ] Every `sensor_id` used appears as a graph node; adjacency verified against a real map for at least 2–3 connections.
- [ ] Model output shapes and ranges correct for LSTM and GAT+GRU.
- [ ] Train/test split is strictly time-based, identical across models, seed fixed and reproducible.
- [ ] SHAP output count matches feature count; attention weights approximately sum to 1 per node's neighbors.

### 3. Routing Engine Integration Tests (new)
- [ ] `POST /route` returns at least one valid route for a known-reachable origin/destination pair within the demo road subset.
- [ ] `POST /route` returns 404 (not a crash or malformed response) for an unreachable/invalid destination.
- [ ] Route geometry returned is a valid GeoJSON LineString that renders correctly on the Leaflet map.
- [ ] Candidate routes outside the trained cascade subset correctly set `cascade_data_available: false` on affected segments rather than silently omitting the flag.

### 4. Cascade-Aware Re-Ranking Tests (new)
- [ ] When a predicted cascade intersects one candidate route but not another, the system correctly re-ranks the uncongested route higher.
- [ ] `is_shortcut` is only ever true when the flagged route's cascade-adjusted ETA is genuinely lower than the shortest-by-distance route's — verify with at least one constructed test case.
- [ ] Emergency mode weighting demonstrably changes route ranking versus the same request with `emergency_mode: false` — verify with a constructed test case where this should occur.

### 5. Geolocation Tests (new)
- [ ] When location permission is granted, the map correctly centers on the reported coordinates.
- [ ] When location permission is denied, the manual entry fallback appears and is fully functional (does not block the rest of the app).
- [ ] Reported `accuracy_m` is surfaced somewhere in the UI or logs, not silently discarded (useful for debugging poor-GPS demo conditions).

### 6. Weather Tests (new)
- [ ] `GET /weather/current` returns live data (verify timestamp is recent, not stale/cached beyond a reasonable window).
- [ ] When the weather API is unavailable, the dashboard hides the weather panel without breaking other functionality (per AppFlow error handling).

### 7. Emergency Mode Tests (new)
- [ ] The mandatory disclaimer ("route recommendation only, does not control infrastructure") renders whenever `emergency_mode` is active — verify it cannot be dismissed permanently or hidden by default.
- [ ] `vehicle_type` is required when calling `/route/emergency`; missing value returns a clear 422, not a silent default.

### 8. Cross-Browser Tests (new)
- [ ] Full route flow (location → destination → route display) works correctly in the latest two versions of Chrome, Firefox, Safari, and Edge.
- [ ] Geolocation permission prompt and fallback behave consistently across all four browsers.

### 9. Cross-Device / Responsive Tests (new)
- [ ] Desktop layout (≥1024px): map + side panel both visible and usable simultaneously.
- [ ] Tablet layout (600–1023px): panels collapse into an expandable drawer without breaking map interaction.
- [ ] Mobile layout (<600px): map is full-screen by default; destination entry and timeline are reachable via bottom sheet or separate screen; test on at least one real mobile device in addition to browser emulation.
- [ ] PWA "Add to Home Screen" prompt appears and results in a functioning installed app icon on at least one Android and one iOS device (or documented as untested if real devices are unavailable, rather than assumed working).

### 10. End-to-End Smoke Test (run before any demo/presentation)
1. Fresh environment, run data pipeline from raw data → processed features.
2. Train (or load pre-trained checkpoint for) LSTM and GAT+GRU.
3. Launch backend and frontend.
4. Grant location permission, enter a destination within the demo road subset, confirm a route renders with delay timeline and weather.
5. Toggle Emergency Mode, confirm route re-ranking changes and disclaimer displays.
6. Deny location permission (in a separate test run) and confirm manual entry fallback works end-to-end.
7. Resize browser window / test on tablet and mobile to confirm responsive layout holds.
8. Confirm model comparison table (LSTM vs GAT+GRU) still renders correctly from the Model Card log.
