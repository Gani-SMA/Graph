import React from 'react';

export default function EmergencyPanel({
  emergencyMode,
  onToggleEmergency,
  vehicleType,
  onVehicleTypeChange,
  activeRoute
}) {
  return (
    <div style={{
      padding: '12px 16px',
      backgroundColor: emergencyMode ? 'rgba(224, 90, 71, 0.12)' : 'var(--bg-card)',
      borderBottom: emergencyMode ? '1px solid var(--accent-safety-orange)' : '1px solid var(--border-subtle)',
      borderTop: emergencyMode ? '1px solid var(--accent-safety-orange)' : '1px solid var(--border-subtle)',
      transition: 'all 0.2s ease'
    }}>
      {/* Emergency Mode Header & ON/OFF Button Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: emergencyMode ? '10px' : '0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: emergencyMode ? 'var(--accent-safety-orange)' : 'var(--text-main)', fontSize: '13px' }}>
          <span>🚨</span> Emergency Mode
        </div>

        {/* Dual ON / OFF Interactive Buttons */}
        <div style={{
          display: 'inline-flex',
          backgroundColor: 'var(--bg-app)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '6px',
          padding: '2px',
          gap: '2px'
        }}>
          <button
            type="button"
            onClick={() => onToggleEmergency && onToggleEmergency(true)}
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 700,
              borderRadius: '4px',
              border: 'none',
              backgroundColor: emergencyMode ? 'var(--accent-safety-orange)' : 'transparent',
              color: emergencyMode ? '#ffffff' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Activate Emergency Dispatch Priority Mode"
          >
            <span>🚨</span> ON
          </button>
          <button
            type="button"
            onClick={() => onToggleEmergency && onToggleEmergency(false)}
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 700,
              borderRadius: '4px',
              border: 'none',
              backgroundColor: !emergencyMode ? 'var(--accent-clear-mint)' : 'transparent',
              color: !emergencyMode ? '#ffffff' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Deactivate Emergency Mode and return to Standard Routing"
          >
            <span>✕</span> OFF
          </button>
        </div>
      </div>

      {emergencyMode && (
        <>
          <div style={{ marginBottom: '8px' }}>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              ASSIGNED EMERGENCY VEHICLE
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['ambulance', 'fire_engine', 'police'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => onVehicleTypeChange && onVehicleTypeChange(type)}
                  style={{
                    flex: 1,
                    padding: '5px',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '4px',
                    border: vehicleType === type ? '1px solid var(--accent-safety-orange)' : '1px solid var(--border-subtle)',
                    backgroundColor: vehicleType === type ? 'var(--accent-safety-orange)' : 'var(--bg-panel)',
                    color: vehicleType === type ? '#ffffff' : 'var(--text-main)',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {type.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {activeRoute && (
            <div style={{ fontSize: '11px', color: 'var(--text-main)', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Cleared Path Safety: <strong>{Math.round((activeRoute.cascade_safety_score || 0.8) * 100)}%</strong></span>
              <span>Priority Clearance: <strong>{Math.max(1, Math.round(activeRoute.eta_min * 0.85))} min</strong></span>
            </div>
          )}

          {/* Mandatory Disclaimer per AppFlow Section 2 & Rule 4 */}
          <div style={{
            padding: '6px 8px',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            borderRadius: '3px',
            fontSize: '10px',
            color: 'var(--accent-safety-orange)',
            lineHeight: '1.4'
          }}>
            ⚠️ <strong>Notice:</strong> Route recommendation only. Does not control traffic signals or physical infrastructure.
          </div>
        </>
      )}
    </div>
  );
}

