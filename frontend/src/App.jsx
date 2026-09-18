import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';

import { ThemeProvider, useTheme } from './context/ThemeContext.jsx';
import LocationInput from './components/LocationInput.jsx';
import RoutePanel from './components/RoutePanel.jsx';
import DelayTimeline from './components/DelayTimeline.jsx';
import WeatherOverlay from './components/WeatherOverlay.jsx';
import MapContainerView from './components/MapContainer.jsx';
import EmergencyPanel from './components/EmergencyPanel.jsx';
import ExplainabilityPanel from './components/ExplainabilityPanel.jsx';
import ShortcutCard from './components/ShortcutCard.jsx';

const BACKEND_URL = 'http://localhost:8000';
const FALLBACK_CENTER = { lat: 9.9252, lng: 78.1198 };
const GEO_TIMEOUT_MS = 10000;

// Inner component so it can consume ThemeContext
function AppInner() {
  const { theme, setTheme, toggleTheme } = useTheme();

  const [userLocation, setUserLocation] = useState({ ...FALLBACK_CENTER, source: 'fallback' });
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [vehicleType, setVehicleType] = useState('ambulance');
  const [weather, setWeather] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [explainSensorId, setExplainSensorId] = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // ── Live Geolocation on mount ──────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) {
      toast.info('Geolocation is not supported by this browser. Showing default location.', {
        duration: 4000
      });
      fetchWeather(FALLBACK_CENTER.lat, FALLBACK_CENTER.lng);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        setUserLocation({ lat, lng, accuracy, source: 'geolocation' });
        fetchWeather(lat, lng);
        toast.success(`📍 Live GPS location detected (${lat.toFixed(4)}, ${lng.toFixed(4)}). Map centered.`);
        if (accuracy > 100) {
          toast.info(`Location accuracy is ±${Math.round(accuracy)}m.`, {
            duration: 3000
          });
        }
      },
      (err) => {
        let message = 'Location access was denied. Showing default location.';
        if (err.code === err.TIMEOUT) {
          message = 'Location acquisition timed out. Showing default location.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          message = 'Location information is unavailable. Showing default location.';
        }
        toast.info(message, { duration: 4000 });
        fetchWeather(FALLBACK_CENTER.lat, FALLBACK_CENTER.lng);
      },
      { timeout: GEO_TIMEOUT_MS, enableHighAccuracy: true }
    );

    // PWA install prompt listener
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstallPWA = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          toast.success('PWA installed on home screen!');
        }
        setDeferredPrompt(null);
      });
    } else {
      toast.info("To install on mobile, tap browser menu → 'Add to Home Screen'.");
    }
  };

  const fetchWeather = async (lat, lng) => {
    try {
      const resp = await fetch(`${BACKEND_URL}/weather/current?lat=${lat}&lng=${lng}`);
      if (resp.ok) {
        const data = await resp.json();
        setWeather(data);
      }
    } catch (_) {
      console.warn('Weather API offline/unreachable');
    }
  };

  const handleRouteSubmit = async (params) => {
    setIsSubmitting(true);
    setOrigin(params.origin);
    setDestination(params.destination);
    setEmergencyMode(params.emergency_mode);
    if (params.vehicle_type) setVehicleType(params.vehicle_type);

    if (params.source === 'geolocation' || params.source === 'live_gps') {
      setUserLocation(prev => ({ ...params.origin, accuracy: prev?.accuracy, source: 'geolocation' }));
    }

    fetchWeather(params.origin.lat, params.origin.lng);

    const endpoint = params.emergency_mode ? '/route/emergency' : '/route';
    const payload = {
      origin: params.origin,
      destination: params.destination,
      waypoints: [],
      emergency_mode: params.emergency_mode,
      vehicle_type: params.emergency_mode ? (params.vehicle_type || vehicleType) : null,
      departure_time: new Date().toISOString()
    };

    try {
      const resp = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!resp.ok) {
        const errData = await resp.json();
        throw new Error(errData.detail || 'Route calculation failed.');
      }

      const data = await resp.json();
      setRoutes(data.routes || []);
      if (data.routes && data.routes.length > 0) {
        const rec = data.routes.find(r => r.recommended) || data.routes[0];
        setSelectedRouteId(rec.route_id);
        toast.success(`Computed ${data.routes.length} candidate route(s).`);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to connect to backend server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleEmergency = async (newMode) => {
    setEmergencyMode(newMode);
    if (newMode) {
      toast.info('🚨 Emergency Dispatch Priority Mode activated.');
    } else {
      toast.success('Emergency Mode deactivated. Returned to standard routing.');
    }

    if (origin && destination) {
      handleRouteSubmit({
        origin,
        destination,
        emergency_mode: newMode,
        vehicle_type: vehicleType,
        source: userLocation?.source
      });
    }
  };

  const activeRoute = routes.find(r => r.route_id === selectedRouteId) || (routes.length > 0 ? routes[0] : null);

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <Toaster position="top-right" theme={theme} />

      {/* Control Panel */}
      <div style={{
        width: '380px',
        minWidth: '320px',
        maxWidth: '100%',
        height: '100%',
        backgroundColor: 'var(--bg-panel)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10,
        overflowY: 'auto'
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 16px',
          backgroundColor: 'var(--bg-app)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{ fontSize: '18px', color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <span>🛣️</span> CascadeNav
            </h1>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Graph-Temporal Cascade Prediction & Routing
            </p>
          </div>

          {/* Header action buttons */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* Dual Dark and Light mode buttons */}
            <div className="theme-toggle-group" role="group" aria-label="Color theme switcher">
              <button
                type="button"
                className={`theme-toggle-btn ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => setTheme('dark')}
                title="Switch to Dark theme"
              >
                <span>🌙</span> Dark
              </button>
              <button
                type="button"
                className={`theme-toggle-btn ${theme === 'light' ? 'active' : ''}`}
                onClick={() => setTheme('light')}
                title="Switch to Light theme"
              >
                <span>☀️</span> Light
              </button>
            </div>

            {/* PWA install */}
            <button
              type="button"
              onClick={handleInstallPWA}
              style={{
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              📲 PWA
            </button>
          </div>
        </div>

        <EmergencyPanel
          emergencyMode={emergencyMode}
          onToggleEmergency={handleToggleEmergency}
          vehicleType={vehicleType}
          onVehicleTypeChange={setVehicleType}
          activeRoute={activeRoute}
        />

        <LocationInput
          onRouteSubmit={handleRouteSubmit}
          isSubmitting={isSubmitting}
          userLocation={userLocation}
          emergencyMode={emergencyMode}
          onToggleEmergency={handleToggleEmergency}
          vehicleType={vehicleType}
          onVehicleTypeChange={setVehicleType}
        />
        <ShortcutCard selectedRoute={activeRoute} />
        <RoutePanel
          routes={routes}
          selectedRouteId={selectedRouteId}
          onSelectRoute={setSelectedRouteId}
        />
        <DelayTimeline
          selectedRoute={activeRoute}
          onSelectExplainableSensor={setExplainSensorId}
        />
      </div>

      {/* Map View */}
      <div style={{ flex: 1, height: '100%', position: 'relative' }}>
        <WeatherOverlay weather={weather} />
        <MapContainerView
          userLocation={userLocation}
          origin={origin}
          destination={destination}
          routes={routes}
          selectedRouteId={selectedRouteId}
          onSelectRoute={setSelectedRouteId}
          emergencyMode={emergencyMode}
          theme={theme}
        />
        <ExplainabilityPanel
          sensorId={explainSensorId}
          onClose={() => setExplainSensorId(null)}
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}
