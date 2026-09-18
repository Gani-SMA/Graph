import React, { useEffect, useRef, useState } from 'react';
import { MapContainer as LeafletMap, TileLayer, Polyline, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';

// ── Available Map Tile Layers ────────────────────────────────────────────────
const MAP_LAYERS = {
  geographical: {
    name: 'Geographical',
    icon: '🗺️',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  },
  voyager: {
    name: 'Voyager / Street',
    icon: '🧭',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
    maxZoom: 19
  },
  satellite: {
    name: 'Satellite',
    icon: '🛰️',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Earthstar Geographics',
    maxZoom: 18
  },
  dark: {
    name: 'Dark Transit',
    icon: '🌙',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
    maxZoom: 19
  },
  light: {
    name: 'Light Minimal',
    icon: '☀️',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
    maxZoom: 19
  }
};

// ── Google Maps Style Custom Icons ───────────────────────────────────────────
// Start / Live Origin Marker
const startIcon = L.divIcon({
  className: 'gmap-marker-start',
  html: `
    <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;">
      <div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background: rgba(39, 174, 96, 0.3); animation: map-pulse 2s infinite;"></div>
      <div style="width: 18px; height: 18px; border-radius: 50%; background: #27AE60; border: 3px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;">
        <div style="width: 6px; height: 6px; border-radius: 50%; background: #ffffff;"></div>
      </div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

// Destination Pin (Google Maps Red Pin)
const destinationPinIcon = L.divIcon({
  className: 'gmap-marker-dest',
  html: `
    <div style="position: relative; width: 32px; height: 42px; display: flex; justify-content: center;">
      <svg viewBox="0 0 24 24" width="34" height="42" style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.45));">
        <path fill="#EA4335" stroke="#FFFFFF" stroke-width="1" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        <circle cx="12" cy="9" r="3.2" fill="#FFFFFF"/>
      </svg>
    </div>
  `,
  iconSize: [34, 42],
  iconAnchor: [17, 40],
  popupAnchor: [0, -36]
});

// Live GPS User Pulse Icon
const userLiveIcon = L.divIcon({
  className: 'custom-user-live-marker',
  html: `
    <div class="pulse-marker-container">
      <div class="pulse-ring"></div>
      <div class="pulse-dot"></div>
      <div class="pulse-label">YOU (LIVE)</div>
    </div>
  `,
  iconSize: [80, 30],
  iconAnchor: [40, 15]
});

// ── Safely capture map instance to pass to outer action buttons ───────────────
function MapInstanceCapture({ setMap }) {
  const map = useMap();
  useEffect(() => {
    if (map) setMap(map);
  }, [map, setMap]);
  return null;
}

// ── RouteCameraManager: Automatically & smoothly fits bounds like Google Maps ──
function RouteCameraManager({
  activeRouteCoordinates,
  origin,
  destination,
  userLocation
}) {
  const map = useMap();
  const lastTargetRef = useRef(null);

  useEffect(() => {
    // 1. Auto-fit entire route when computed / active route changes
    if (activeRouteCoordinates && activeRouteCoordinates.length > 0) {
      const routeKey = `route_${activeRouteCoordinates.length}_${activeRouteCoordinates[0][0]}_${activeRouteCoordinates[activeRouteCoordinates.length - 1][0]}`;
      if (lastTargetRef.current !== routeKey) {
        lastTargetRef.current = routeKey;
        const bounds = L.latLngBounds(activeRouteCoordinates);
        if (bounds.isValid()) {
          map.flyToBounds(bounds, {
            padding: [60, 60],
            maxZoom: 16,
            duration: 1.4,
            easeLinearity: 0.25
          });
        }
      }
      return;
    }

    // 2. If origin and destination both set (before route computation)
    if (origin && destination) {
      const odKey = `od_${origin.lat}_${origin.lng}_${destination.lat}_${destination.lng}`;
      if (lastTargetRef.current !== odKey) {
        lastTargetRef.current = odKey;
        const bounds = L.latLngBounds([
          [origin.lat, origin.lng],
          [destination.lat, destination.lng]
        ]);
        if (bounds.isValid()) {
          map.flyToBounds(bounds, {
            padding: [60, 60],
            maxZoom: 16,
            duration: 1.4,
            easeLinearity: 0.25
          });
        }
      }
      return;
    }

    // 3. Initial live user location focus on app start
    if (userLocation && userLocation.source === 'geolocation') {
      const liveKey = `live_${userLocation.lat.toFixed(4)}_${userLocation.lng.toFixed(4)}`;
      if (lastTargetRef.current !== liveKey) {
        lastTargetRef.current = liveKey;
        map.flyTo([userLocation.lat, userLocation.lng], 14, { duration: 1.2 });
      }
    }
  }, [activeRouteCoordinates, origin, destination, userLocation, map]);

  return null;
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function MapContainerView({
  userLocation,
  origin,
  destination,
  routes,
  selectedRouteId,
  onSelectRoute,
  emergencyMode,
  theme = 'dark'
}) {
  const [map, setMap] = useState(null);
  const [activeLayerKey, setActiveLayerKey] = useState('geographical');

  // Fallback (Madurai)
  const FALLBACK = [9.9252, 78.1198];

  const currentCenter = origin
    ? [origin.lat, origin.lng]
    : (userLocation && userLocation.lat ? [userLocation.lat, userLocation.lng] : FALLBACK);

  const currentZoom = (userLocation && userLocation.source === 'geolocation') || origin ? 14 : 12;
  const currentTileConfig = MAP_LAYERS[activeLayerKey] || MAP_LAYERS.geographical;

  // Identify active / recommended route
  const activeRoute = (routes && routes.length > 0)
    ? (routes.find(r => r.route_id === selectedRouteId) || routes.find(r => r.recommended) || routes[0])
    : null;

  const activeRouteCoordinates = (activeRoute?.geometry?.coordinates)
    ? activeRoute.geometry.coordinates.map(c => [c[1], c[0]])
    : [];

  const hasRoute = activeRouteCoordinates.length > 0;

  // Action handlers
  const handleFitWholeRoute = () => {
    if (!map) return;
    let bounds = null;
    if (activeRouteCoordinates.length > 0) {
      bounds = L.latLngBounds(activeRouteCoordinates);
    } else if (origin && destination) {
      bounds = L.latLngBounds([[origin.lat, origin.lng], [destination.lat, destination.lng]]);
    }
    if (bounds && bounds.isValid()) {
      map.flyToBounds(bounds, { padding: [60, 60], maxZoom: 16, duration: 1.4 });
    }
  };

  const handleFocusMyLocation = () => {
    if (!map || !userLocation?.lat) return;
    map.flyTo([userLocation.lat, userLocation.lng], 15, { duration: 1.2 });
  };

  const handleFocusDestination = () => {
    if (!map || !destination?.lat) return;
    map.flyTo([destination.lat, destination.lng], 15, { duration: 1.2 });
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <LeafletMap
        center={currentCenter}
        zoom={currentZoom}
        style={{ width: '100%', height: '100%', backgroundColor: theme === 'light' ? '#EAEAE4' : '#121518' }}
        zoomControl={false}
      >
        {/* Safely capture map instance */}
        <MapInstanceCapture setMap={setMap} />

        {/* All Available Map Tile Layers pre-mounted for instant sub-millisecond switching */}
        {Object.entries(MAP_LAYERS).map(([key, cfg]) => (
          <TileLayer
            key={key}
            attribution={cfg.attribution}
            url={cfg.url}
            maxZoom={cfg.maxZoom}
            opacity={activeLayerKey === key ? 1 : 0}
            zIndex={activeLayerKey === key ? 10 : 1}
            keepBuffer={4}
          />
        ))}

        {/* Google Maps-style Intelligent Camera Manager */}
        <RouteCameraManager
          activeRouteCoordinates={activeRouteCoordinates}
          origin={origin}
          destination={destination}
          userLocation={userLocation}
        />

        {/* Accuracy circle around live user location */}
        {userLocation && userLocation.source === 'geolocation' && userLocation.accuracy && (
          <Circle
            center={[userLocation.lat, userLocation.lng]}
            radius={Math.min(userLocation.accuracy, 500)}
            pathOptions={{
              color: '#27AE60',
              fillColor: '#27AE60',
              fillOpacity: 0.12,
              weight: 1,
              dashArray: '4, 4'
            }}
          />
        )}

        {/* Start / Origin Marker */}
        {origin ? (
          <Marker position={[origin.lat, origin.lng]} icon={startIcon}>
            <Popup>
              <strong>🟢 Start / Origin</strong>
              <div>Lat: {origin.lat.toFixed(5)}, Lng: {origin.lng.toFixed(5)}</div>
            </Popup>
          </Marker>
        ) : userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={userLocation.source === 'geolocation' ? userLiveIcon : startIcon}
          >
            <Popup>
              {userLocation.source === 'geolocation'
                ? `📍 Current Live Location (${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)})`
                : `📍 Default Map Center (${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)})`}
            </Popup>
          </Marker>
        )}

        {/* Destination Marker (Google Maps Red Pin) */}
        {destination && (
          <Marker position={[destination.lat, destination.lng]} icon={destinationPinIcon}>
            <Popup>
              <strong>🔴 Destination</strong>
              <div>Lat: {destination.lat.toFixed(5)}, Lng: {destination.lng.toFixed(5)}</div>
              {activeRoute && (
                <div style={{ marginTop: '4px', fontSize: '11px', color: '#E5A93C', fontWeight: 700 }}>
                  ETA: {activeRoute.eta_min} min ({activeRoute.distance_km || activeRoute.distance} km)
                </div>
              )}
            </Popup>
          </Marker>
        )}

        {/* Alternative Candidate Routes (rendered underneath) */}
        {routes && routes.filter(r => r.route_id !== activeRoute?.route_id).map((r) => {
          const coords = (r.geometry && r.geometry.coordinates)
            ? r.geometry.coordinates.map(c => [c[1], c[0]])
            : [];
          if (coords.length === 0) return null;

          return (
            <React.Fragment key={`alt_${r.route_id}`}>
              {/* Alternative casing */}
              <Polyline
                positions={coords}
                eventHandlers={{ click: () => onSelectRoute && onSelectRoute(r.route_id) }}
                pathOptions={{
                  color: theme === 'light' ? '#CBD5E1' : '#334155',
                  weight: 7,
                  opacity: 0.6,
                  lineCap: 'round',
                  lineJoin: 'round'
                }}
              />
              {/* Alternative stroke */}
              <Polyline
                positions={coords}
                eventHandlers={{ click: () => onSelectRoute && onSelectRoute(r.route_id) }}
                pathOptions={{
                  color: theme === 'light' ? '#94A3B8' : '#64748B',
                  weight: 4,
                  opacity: 0.85,
                  lineCap: 'round',
                  lineJoin: 'round'
                }}
              />
            </React.Fragment>
          );
        })}

        {/* Active / Primary Route (Google Maps style layered glow & crisp stroke) */}
        {activeRouteCoordinates.length > 0 && (
          <React.Fragment key={`active_${activeRoute?.route_id}`}>
            {/* Dark casing border for high contrast against any map style */}
            <Polyline
              positions={activeRouteCoordinates}
              pathOptions={{
                color: theme === 'light' ? '#FFFFFF' : '#0F172A',
                weight: 9,
                opacity: 0.9,
                lineCap: 'round',
                lineJoin: 'round'
              }}
            />
            {/* Primary vibrant route line */}
            <Polyline
              positions={activeRouteCoordinates}
              pathOptions={{
                color: emergencyMode
                  ? '#EF4444'
                  : (activeRoute?.is_shortcut ? '#27AE60' : (theme === 'light' ? '#2563EB' : '#E5A93C')),
                weight: 6,
                opacity: 1.0,
                lineCap: 'round',
                lineJoin: 'round',
                dashArray: emergencyMode ? '10, 6' : null
              }}
            />
          </React.Fragment>
        )}
      </LeafletMap>

      {/* Floating Google Maps-Style Quick Action Bar */}
      <div className="map-floating-controls">
        {/* Navigation Quick Framing Actions */}
        <div className="map-control-card" style={{ gap: '6px' }}>
          {hasRoute && (
            <button
              type="button"
              className="map-btn active"
              onClick={handleFitWholeRoute}
              title="Fit entire route from origin to destination on screen"
            >
              🎯 Fit Whole Route
            </button>
          )}

          {userLocation && userLocation.source === 'geolocation' && (
            <button
              type="button"
              className="map-btn"
              onClick={handleFocusMyLocation}
              title="Focus on my live GPS location"
            >
              📍 My Location
            </button>
          )}

          {destination && (
            <button
              type="button"
              className="map-btn"
              onClick={handleFocusDestination}
              title="Focus on destination pin"
            >
              🏁 Destination
            </button>
          )}
        </div>

        {/* Zoom In/Out Controls */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--bg-panel-overlay)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)'
          }}>
            <button
              type="button"
              onClick={() => map?.zoomIn()}
              title="Zoom In"
              style={{
                width: '32px',
                height: '32px',
                backgroundColor: 'transparent',
                color: 'var(--text-main)',
                border: 'none',
                borderBottom: '1px solid var(--border-subtle)',
                fontSize: '16px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              +
            </button>
            <button
              type="button"
              onClick={() => map?.zoomOut()}
              title="Zoom Out"
              style={{
                width: '32px',
                height: '32px',
                backgroundColor: 'transparent',
                color: 'var(--text-main)',
                border: 'none',
                fontSize: '16px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              −
            </button>
          </div>
        </div>

        {/* Map Layer Switcher Card */}
        <div className="map-control-card">
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, padding: '2px 4px' }}>
            MAP STYLE (DEFAULT: GEOGRAPHICAL)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
            {Object.entries(MAP_LAYERS).map(([key, cfg]) => (
              <button
                key={key}
                type="button"
                className={`map-btn ${activeLayerKey === key ? 'active' : ''}`}
                onClick={() => setActiveLayerKey(key)}
                style={{ padding: '4px 6px', fontSize: '10px', justifyContent: 'center' }}
              >
                <span>{cfg.icon}</span> {cfg.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

