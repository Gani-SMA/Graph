import React from 'react';

export default function RoutePanel({ routes, selectedRouteId, onSelectRoute }) {
  if (!routes || routes.length === 0) {
    return (
      <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>
        Enter an origin and destination to compute cascade-aware routes.
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', backgroundColor: 'var(--bg-panel)' }}>
      {/* Honest Traffic Data Disclosure Banner */}
      <div style={{
        padding: '8px 10px',
        backgroundColor: 'rgba(44, 50, 56, 0.6)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '4px',
        fontSize: '11px',
        color: 'var(--text-muted)',
        marginBottom: '12px',
        lineHeight: '1.4'
      }}>
        ℹ️ <strong>System Note:</strong> Routes computed using open-source OSRM routing, live location/weather, and a GAT+GRU cascade congestion model trained on historical traffic patterns.
      </div>

      <h3 style={{ fontSize: '14px', color: 'var(--text-main)', marginBottom: '10px' }}>
        Candidate Routes ({routes.length})
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {routes.map((r) => {
          const isSelected = r.route_id === selectedRouteId || (selectedRouteId === null && r.recommended);
          const safetyPct = Math.round((r.cascade_safety_score || 0.8) * 100);

          return (
            <div
              key={r.route_id}
              onClick={() => onSelectRoute(r.route_id)}
              style={{
                padding: '12px',
                backgroundColor: isSelected ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                border: isSelected ? '2px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
                    {r.eta_min} min
                  </span>
                  {r.recommended && (
                    <span style={{
                      backgroundColor: 'var(--accent-gold-bg)',
                      color: 'var(--accent-gold)',
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '3px',
                      border: '1px solid var(--accent-gold)'
                    }}>
                      RECOMMENDED
                    </span>
                  )}
                  {r.is_shortcut && (
                    <span style={{
                      backgroundColor: 'rgba(39, 174, 96, 0.15)',
                      color: 'var(--accent-clear-mint)',
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '3px',
                      border: '1px solid var(--accent-clear-mint)'
                    }}>
                      ⚡ CASCADE SHORTCUT
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                <span>Route ID: {r.route_id}</span>
                <span>Cascade Safety: <strong style={{ color: safetyPct > 75 ? 'var(--accent-clear-mint)' : 'var(--accent-gold)' }}>{safetyPct}%</strong></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
