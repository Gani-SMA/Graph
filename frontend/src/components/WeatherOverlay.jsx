import React from 'react';

export default function WeatherOverlay({ weather }) {
  if (!weather) return null;

  return (
    <div style={{
      position: 'absolute',
      top: '16px',
      right: '16px',
      zIndex: 1000,
      backgroundColor: 'var(--bg-panel-overlay)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '6px',
      padding: '8px 12px',
      color: 'var(--text-main)',
      fontSize: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      backdropFilter: 'none' /* No glassmorphism per Anti-Vibecode rules */
    }}>
      <span style={{ fontSize: '14px' }}>
        {weather.condition === 'rain' ? '🌧️' : (weather.condition === 'clear' ? '☀️' : '🌤️')}
      </span>
      <div>
        <div style={{ fontWeight: 700, lineHeight: 1 }}>{weather.temperature}°C</div>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
          {weather.condition.replace('_', ' ')} {weather.is_live && '(Live)'}
        </div>
      </div>
    </div>
  );
}
