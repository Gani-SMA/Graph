# Product Requirements Document (PRD)
## Cascade-Aware Traffic Navigation System (Graph-Temporal Cascade Prediction + Live Routing)

### 1. Problem Statement
Existing navigation systems (Google Maps, Waze) compute routes using live traffic conditions but treat congestion as a present-state fact, not a spreading phenomenon — they do not predict which roads will become congested next because of a jam happening right now. They also provide no dedicated mechanism to prioritize or pre-clear a route for an emergency vehicle (ambulance, fire engine, police) ahead of its arrival. This project addresses both gaps: predicting multi-hop congestion cascades across a road network graph, and using that prediction to bias route selection between a live user location and a destination — including a priority mode for emergency vehicles.

### 2. Goal
Build a cross-device, browser-based navigation system that: (a) takes the user's live location and a destination (with optional waypoints), (b) computes candidate routes using a real, free routing engine, (c) re-ranks those routes using the project's GAT+GRU cascade-prediction model so that predicted congestion is avoided where possible, (d) shows a delay timeline at each point along the chosen route, (e) suggests shortcuts when a faster cascade-aware path exists, and (f) supports an emergency-vehicle priority mode that highlights the safest, fastest cleared path.

**Honest positioning:** this system is not a replacement for Google Maps' live, crowdsourced traffic engine — no free/student-accessible data source matches that scale. Its actual contribution is the cascade-prediction layer: explainable, multi-hop congestion forecasting used to bias routing decisions, on top of an open-source routing engine and genuinely live location/weather data.

### 3. Target Users
- Commuters and general navigation users
- Emergency response services (ambulance, fire, police dispatch) as a decision-support tool
- Municipal traffic authorities (network-level planning)
- Academic reviewers / conference audience

### 4. Core Features
| # | Feature | Data Source | Priority |
|---|---|---|---|
| 1 | Live user location on map | Browser Geolocation API (live, free) | Must-have |
| 2 | Destination + waypoint entry | User input | Must-have |
| 3 | Candidate route computation | OSRM or GraphHopper (free, open-source routing engine) | Must-have |
| 4 | Cascade-aware route re-ranking | GAT+GRU model (project's own, trained on historical data) | Must-have |
| 5 | Per-point delay timeline along chosen route | Derived from cascade predictions | Must-have |
| 6 | Shortcut suggestion when a faster cascade-safe path exists | Derived from re-ranked candidates | Must-have |
| 7 | Live current weather overlay | Open-Meteo (live, free, no key) | Must-have |
| 8 | Emergency vehicle priority mode (flag route, highlight cleared path) | Same routing + cascade stack, priority weighting | Must-have |
| 9 | Explainability (SHAP + GAT attention) for why a route/segment is flagged congested | Project's own explainability layer | Should-have |
| 10 | Cross-device responsive UI (laptop, tablet, mobile), installable as a PWA | Frontend engineering | Must-have |
| 11 | Multi-hop cascade prediction dashboard view (original feature) | GAT+GRU model | Should-have |
| 12 | Model comparison (LSTM vs GAT+GRU) | Experiment log | Should-have (research credibility, not end-user facing) |

### 5. Out of Scope (explicit)
- A literal live, crowdsourced traffic data feed (Google/Waze-scale) — not freely available; the system uses live location + live weather + a historically-trained congestion prediction model instead, and this distinction must be stated plainly in the paper and demo.
- Actual control of traffic signals or physical infrastructure for emergency vehicles — the emergency mode is a route recommendation/decision-support feature only, not a traffic-control integration.
- Native mobile apps (iOS/Android app store builds) — delivered instead as a responsive, installable Progressive Web App (PWA) that runs in any modern browser on any device.
- Full-city, real-time production deployment.

### 6. Success Metrics
- Cascade model (GAT+GRU) achieves lower MAE/RMSE than the LSTM baseline on held-out time-based test data (technical core result).
- Given a live location and destination, the system returns at least one valid, drivable route within a few seconds using the routing engine.
- When a predicted cascade intersects a candidate route, the system correctly re-ranks or flags it, and this is demonstrable with a concrete before/after example.
- The UI renders and functions correctly on at least three form factors: desktop browser, tablet browser, and mobile browser (real device or emulated).
- Emergency mode visibly changes route selection/priority in at least one demonstrable scenario.

### 7. Assumptions
- A bounded road network subset (5–100+ roads depending on MVP vs. scaled phase) is sufficient to demonstrate both cascade prediction and cascade-aware routing.
- Users grant browser location permission; a manual location-entry fallback exists for when permission is denied.
- Open-source routing engines (OSRM/GraphHopper) provide sufficient road network coverage for the chosen demo area.

### 8. Constraints
- Zero budget: no paid APIs, no paid compute, no paid hosting.
- Must run in any modern browser (Chrome, Firefox, Safari, Edge) without installation, and must be installable as a PWA on mobile/tablet.
- Geolocation requires HTTPS (or localhost) — this affects deployment choice (see Deployment Guide).
- Must remain defensible: even where Antigravity's AI agents perform the implementation end-to-end, the student must be able to explain every architectural and modeling decision in a viva or reviewer Q&A.

### 9. Risks
| Risk | Mitigation |
|---|---|
| Overclaiming "beats Google Maps" damages credibility with reviewers | Frame the contribution explicitly as the cascade-prediction layer, not live-traffic superiority; state this limitation directly in the paper |
| Free routing engine (OSRM public demo server) has usage limits or coverage gaps | Self-host OSRM/GraphHopper via free Docker container for the demo area, documented in Deployment Guide |
| Geolocation denied or inaccurate (indoor use, browser permissions) | Provide manual location entry as fallback; do not block the demo on live GPS working perfectly |
| Emergency mode misread as literal traffic-control integration | Explicit UI labeling: "priority route recommendation," not "traffic signal control" |
| Cross-device layout breaks on small screens (map + timeline + panels) | Responsive design tested at defined breakpoints (see Test Plan); mobile-first layout for the map view |
| Full AI-driven build produces code the student can't defend | AGENTS.md requires documented reasoning for every major decision; student reviews and can explain all output before submission |

### 10. Phased Milestones (non-time-boxed)
- **Phase 1 – MVP:** Live location + manual destination entry, OSRM/GraphHopper route computation, GAT+GRU cascade re-ranking on a small road subset, basic responsive map UI, live weather overlay.
- **Phase 2 – Full feature set:** Emergency vehicle priority mode, delay timeline UI, shortcut suggestions, explainability panel, PWA installability, cross-device polish, expanded road network scale, stronger baseline (Graph WaveNet/DCRNN) for paper credibility.
- **Phase 3 – Submission:** Paper drafted (separate document), venue selected, demo finalized across at least 3 device types.
