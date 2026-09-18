# App Flow Document
## Cascade-Aware Traffic Navigation System — User & System Flow

### 1. Primary User Flow (any device/browser)

1. **User opens the app** in any modern browser (desktop, tablet, or mobile) — no installation required; an "Add to Home Screen" prompt is available via the PWA manifest for repeat use.
2. **App requests location permission.**
   - If granted: user's live position appears on the map (Leaflet.js), centered by default.
   - If denied or unavailable: app falls back to a manual location entry field, with a clear message explaining why ("Location access was not granted — enter your starting point manually").
3. **User enters a destination**, optionally adding one or more waypoints in between, via a search field or by tapping/clicking the map.
4. **User optionally toggles "Emergency Vehicle Mode"** and selects a vehicle type (ambulance, fire engine, police) if applicable.
5. **App requests candidate routes** from the routing engine (OSRM/GraphHopper) for the given origin, destination, and waypoints.
6. **App cross-references each candidate route** against the cascade model's current predictions for road segments within the trained subset, computing a cascade_safety_score and a delay_timeline for each candidate.
7. **App re-ranks candidates**, applying emergency-priority weighting if toggled, and selects the recommended route.
8. **App displays:**
   - The recommended route on the map, with the path drawn and, if applicable, alternate routes shown lighter/dimmed.
   - A delay timeline panel: for each waypoint/segment, the predicted congestion level and estimated added delay.
   - A "shortcut available" badge if a non-obvious faster route was found due to cascade-avoidance.
   - Live current weather for the origin area (temperature, condition icon — no stock icon packs, per design ruleset).
   - If a road segment along the route falls outside the trained cascade subset, a clear note: "cascade prediction unavailable for this segment — using standard routing only."
9. **User can tap/click any point on the route** to see the underlying explanation (SHAP factors + GAT attention-derived upstream road attribution) for why that segment is flagged as congested or clear.
10. **User can change destination/waypoints/emergency toggle at any time**, triggering steps 5–9 again.

### 2. Emergency Mode Flow (variation)
1. Dispatcher or driver toggles Emergency Vehicle Mode and selects vehicle type.
2. Routing re-ranking shifts weighting toward cascade-safety and predicted clearance over raw shortest distance.
3. UI visually distinguishes the emergency-recommended route (distinct styling, not a generic colored stripe per design ruleset — e.g., a dashed high-contrast line specific to emergency context).
4. UI displays estimated time-to-clear for the recommended path and flags any segment where predicted congestion could delay the emergency vehicle.
5. **Explicit UI disclaimer** is always shown in this mode: "This is a route recommendation only. It does not control traffic signals or road infrastructure."

### 3. Backend/Model Flow (internal, per request)
1. Receive route request (origin, destination, waypoints, emergency_mode, vehicle_type).
2. Call routing engine for N candidate routes.
3. For each candidate, extract road segments and match against the trained road graph subset.
4. For matched segments, query the GAT+GRU model for current predicted congestion at the relevant forecasting horizon (based on estimated arrival time at that segment).
5. Compute cascade_safety_score and delay_timeline per candidate.
6. Apply re-ranking logic (with emergency weighting if applicable).
7. Return ranked routes to frontend.
8. (Separately, on a scheduled/background basis) Query Open-Meteo for live weather relevant to the active demo area, cached briefly to avoid redundant calls.

### 4. Cross-Device Flow Considerations
- **Desktop/laptop:** full map + side panel layout (timeline, explanation, weather shown alongside the map).
- **Tablet:** map takes primary view; panels collapse into an expandable drawer.
- **Mobile:** map is full-screen by default; destination entry, timeline, and explanation are accessed via a bottom sheet or separate screen to preserve map visibility, consistent with standard mobile navigation app conventions.

### 5. Error / Edge-Case Flow
- **Geolocation denied:** fallback to manual entry (see step 2 above); app remains fully usable.
- **Routing engine returns no valid route** (e.g., destination unreachable in demo road subset): clear error message, no silent failure.
- **Cascade model has no data for the current time window** (e.g., outside the historical dataset's covered hours in a replay-based demo): fall back to routing engine's raw ETA with a visible note that cascade prediction is using the nearest available historical pattern, not live conditions.
- **Weather API unavailable/rate-limited:** dashboard hides the weather panel gracefully rather than breaking the page.
- **User on an unsupported/very old browser:** display a message recommending an updated browser rather than a broken UI.
