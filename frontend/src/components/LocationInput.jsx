import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

export default function LocationInput({
  onRouteSubmit,
  isSubmitting,
  userLocation,
  emergencyMode: propEmergencyMode,
  onToggleEmergency,
  vehicleType: propVehicleType,
  onVehicleTypeChange
}) {
  const [searchMode, setSearchMode] = useState('address'); // 'address' | 'coordinates'

  // Free-form address / city search inputs
  const [originSearch, setOriginSearch] = useState('');
  const [destSearch, setDestSearch] = useState('Madurai');

  // Exact coordinates
  const [originLat, setOriginLat] = useState('13.0827');
  const [originLng, setOriginLng] = useState('80.2707');
  const [destLat, setDestLat] = useState('9.9252');
  const [destLng, setDestLng] = useState('78.1198');

  const [locationSource, setLocationSource] = useState('manual');
  const [localEmergencyMode, setLocalEmergencyMode] = useState(false);
  const [localVehicleType, setLocalVehicleType] = useState('ambulance');

  const emergencyMode = propEmergencyMode !== undefined ? propEmergencyMode : localEmergencyMode;
  const setEmergencyMode = onToggleEmergency || setLocalEmergencyMode;
  const vehicleType = propVehicleType !== undefined ? propVehicleType : localVehicleType;
  const setVehicleType = onVehicleTypeChange || setLocalVehicleType;

  // Auto-sync live geolocation when acquired on mount
  useEffect(() => {
    if (userLocation && userLocation.source === 'geolocation') {
      const lat = userLocation.lat.toFixed(4);
      const lng = userLocation.lng.toFixed(4);
      setOriginLat(lat);
      setOriginLng(lng);
      setOriginSearch(`📍 Live Location (${lat}, ${lng})`);
      setLocationSource('live_gps');
    }
  }, [userLocation]);

  // Geocode address via free OpenStreetMap Nominatim API
  const geocodeAddress = async (query) => {
    try {
      const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.length > 0) {
          return {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
            display_name: data[0].display_name
          };
        }
      }
    } catch (e) {
      console.warn("Nominatim geocoding failed", e);
    }
    return null;
  };

  const handleUseLiveGPS = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser — enter location manually.");
      return;
    }

    toast.info("Acquiring your live GPS location...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(4);
        const lng = position.coords.longitude.toFixed(4);
        setOriginLat(lat);
        setOriginLng(lng);
        setOriginSearch(`📍 Live Location (${lat}, ${lng})`);
        setLocationSource('live_gps');

        toast.success(`Live GPS acquired (${lat}, ${lng})`);
      },
      (error) => {
        setLocationSource('manual');
        toast.error("Location access denied by browser — enter coordinates or city name manually.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let finalOrigin = { lat: parseFloat(originLat), lng: parseFloat(originLng) };
    let finalDest = { lat: parseFloat(destLat), lng: parseFloat(destLng) };

    if (searchMode === 'address') {
      toast.info("Resolving location coordinates...");
      if (originSearch.trim() && !originSearch.includes("Live Location")) {
        const geoOrigin = await geocodeAddress(originSearch);
        if (geoOrigin) {
          finalOrigin = { lat: geoOrigin.lat, lng: geoOrigin.lng };
          setOriginLat(geoOrigin.lat.toFixed(4));
          setOriginLng(geoOrigin.lng.toFixed(4));
        } else {
          toast.error(`Could not resolve city '${originSearch}'. Please check address or enter lat/lng.`);
          return;
        }
      }

      if (destSearch.trim()) {
        const geoDest = await geocodeAddress(destSearch);
        if (geoDest) {
          finalDest = { lat: geoDest.lat, lng: geoDest.lng };
          setDestLat(geoDest.lat.toFixed(4));
          setDestLng(geoDest.lng.toFixed(4));
        } else {
          toast.error(`Could not resolve destination '${destSearch}'. Please check city name or enter lat/lng.`);
          return;
        }
      }
    }

    onRouteSubmit({
      origin: finalOrigin,
      destination: finalDest,
      emergency_mode: emergencyMode,
      vehicle_type: emergencyMode ? vehicleType : null,
      source: locationSource
    });
  };

  return (
    <div style={{
      padding: '16px',
      backgroundColor: 'var(--bg-panel)',
      borderBottom: '1px solid var(--border-subtle)'
    }}>
      {/* Live GPS Trigger Button */}
      <button
        type="button"
        onClick={handleUseLiveGPS}
        disabled={isSubmitting}
        style={{
          width: '100%',
          backgroundColor: 'var(--accent-clear-mint)',
          color: '#ffffff',
          border: 'none',
          borderRadius: '4px',
          padding: '10px',
          fontSize: '13px',
          fontWeight: 700,
          cursor: 'pointer',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px'
        }}
      >
        📍 Use My Current Live GPS Location
      </button>

      {/* Mode Switcher: Address Search vs Coordinates */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
        <button
          type="button"
          onClick={() => setSearchMode('address')}
          style={{
            flex: 1,
            padding: '6px',
            fontSize: '11px',
            fontWeight: 600,
            borderRadius: '4px',
            border: searchMode === 'address' ? '1px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
            backgroundColor: searchMode === 'address' ? 'var(--accent-gold-bg)' : 'var(--bg-card)',
            color: searchMode === 'address' ? 'var(--accent-gold)' : 'var(--text-main)',
            cursor: 'pointer'
          }}
        >
          🔍 Search City / Address
        </button>
        <button
          type="button"
          onClick={() => setSearchMode('coordinates')}
          style={{
            flex: 1,
            padding: '6px',
            fontSize: '11px',
            fontWeight: 600,
            borderRadius: '4px',
            border: searchMode === 'coordinates' ? '1px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
            backgroundColor: searchMode === 'coordinates' ? 'var(--accent-gold-bg)' : 'var(--bg-card)',
            color: searchMode === 'coordinates' ? 'var(--accent-gold)' : 'var(--text-main)',
            cursor: 'pointer'
          }}
        >
          🌐 Lat / Lng Coordinates
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {searchMode === 'address' ? (
          <>
            {/* Origin Address Search */}
            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                STARTING LOCATION (CITY / ADDRESS)
              </label>
              <input
                type="text"
                value={originSearch}
                onChange={(e) => setOriginSearch(e.target.value)}
                placeholder="e.g. Chennai, Mumbai, or your street address"
                style={{ ...inputStyle, width: '100%' }}
              />
            </div>

            {/* Destination Address Search */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                DESTINATION LOCATION (CITY / ADDRESS)
              </label>
              <input
                type="text"
                value={destSearch}
                onChange={(e) => setDestSearch(e.target.value)}
                placeholder="e.g. Madurai, Coimbatore, Delhi"
                style={{ ...inputStyle, width: '100%' }}
              />
            </div>
          </>
        ) : (
          <>
            {/* Origin Coordinates */}
            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                STARTING POINT (LAT, LNG)
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={originLat}
                  onChange={(e) => setOriginLat(e.target.value)}
                  placeholder="Lat"
                  style={inputStyle}
                />
                <input
                  type="text"
                  value={originLng}
                  onChange={(e) => setOriginLng(e.target.value)}
                  placeholder="Lng"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Destination Coordinates */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                DESTINATION (LAT, LNG)
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={destLat}
                  onChange={(e) => setDestLat(e.target.value)}
                  placeholder="Lat"
                  style={inputStyle}
                />
                <input
                  type="text"
                  value={destLng}
                  onChange={(e) => setDestLng(e.target.value)}
                  placeholder="Lng"
                  style={inputStyle}
                />
              </div>
            </div>
          </>
        )}

        {/* Emergency Mode Toggle Card with Explicit ON/OFF Buttons */}
        <div style={{
          padding: '10px 12px',
          backgroundColor: emergencyMode ? 'rgba(224, 90, 71, 0.12)' : 'var(--bg-card)',
          border: emergencyMode ? '1px solid var(--accent-safety-orange)' : '1px solid var(--border-subtle)',
          borderRadius: '6px',
          marginBottom: '14px',
          transition: 'all 0.2s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: emergencyMode ? 'var(--accent-safety-orange)' : 'var(--text-main)' }}>
              <span>🚨</span> Emergency Dispatch Mode
            </div>

            {/* ON / OFF Button Group */}
            <div style={{
              display: 'inline-flex',
              backgroundColor: 'var(--bg-app)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '5px',
              padding: '2px',
              gap: '2px'
            }}>
              <button
                type="button"
                onClick={() => setEmergencyMode(true)}
                style={{
                  padding: '3px 8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  borderRadius: '3px',
                  border: 'none',
                  backgroundColor: emergencyMode ? 'var(--accent-safety-orange)' : 'transparent',
                  color: emergencyMode ? '#ffffff' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                ON
              </button>
              <button
                type="button"
                onClick={() => setEmergencyMode(false)}
                style={{
                  padding: '3px 8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  borderRadius: '3px',
                  border: 'none',
                  backgroundColor: !emergencyMode ? 'var(--accent-clear-mint)' : 'transparent',
                  color: !emergencyMode ? '#ffffff' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                OFF
              </button>
            </div>
          </div>

          {emergencyMode && (
            <div style={{ marginTop: '10px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                VEHICLE TYPE
              </label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                style={{ ...inputStyle, width: '100%', backgroundColor: 'var(--bg-panel)' }}
              >
                <option value="ambulance">Ambulance</option>
                <option value="fire_engine">Fire Engine</option>
                <option value="police">Police Dispatch</option>
              </select>

              <div style={{
                marginTop: '8px',
                fontSize: '10px',
                color: 'var(--accent-safety-orange)',
                lineHeight: '1.4',
                padding: '6px',
                backgroundColor: 'rgba(0,0,0,0.3)',
                borderRadius: '3px'
              }}>
                <strong>Notice:</strong> Route recommendation only. Does not control traffic signals or physical infrastructure.
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: '100%',
            backgroundColor: emergencyMode ? 'var(--accent-safety-orange)' : 'var(--accent-gold)',
            color: '#121518',
            border: 'none',
            borderRadius: '4px',
            padding: '10px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            opacity: isSubmitting ? 0.7 : 1
          }}
        >
          {isSubmitting ? 'Calculating Cascade-Aware Route...' : 'Compute Cascade-Optimized Route'}
        </button>
      </form>
    </div>
  );
}

const inputStyle = {
  flex: 1,
  backgroundColor: 'var(--bg-card)',
  color: 'var(--text-main)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '4px',
  padding: '6px 10px',
  fontSize: '12px',
  outline: 'none'
};
