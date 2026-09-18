import React from 'react';

export default function DelayTimeline({ selectedRoute, onSelectExplainableSensor }) {
  if (!selectedRoute || !selectedRoute.delay_timeline || selectedRoute.delay_timeline.length === 0) {
    return null;
  }

  return (
    <div style={{ padding: '16px', backgroundColor: 'var(--bg-panel)', borderTop: '1px solid var(--border-subtle)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h3 style={{ fontSize: '13px', color: 'var(--text-main)', margin: 0 }}>
          Predictive Delay Timeline
        </h3>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Tap waypoint for SHAP explainability</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {selectedRoute.delay_timeline.map((pt, idx) => {
          const congPct = Math.round((pt.predicted_congestion || 0) * 100);
          
          return (
            <div
              key={idx}
              onClick={() => pt.cascade_data_available && onSelectExplainableSensor && onSelectExplainableSensor(pt.point)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                backgroundColor: 'var(--bg-card)',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: pt.cascade_data_available ? 'pointer' : 'default',
                transition: 'background 0.15s ease'
              }}
            >
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{pt.point}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>ETA +{pt.eta_min} min</div>
              </div>

              <div style={{ textAlign: 'right', minWidth: '90px' }}>
                {pt.cascade_data_available ? (
                  <>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: congPct > 50 ? 'var(--accent-safety-orange)' : 'var(--text-muted)' }}>
                      Congestion: {congPct}%
                    </div>
                    {/* Visual Bar */}
                    <div style={{ height: '4px', width: '100%', backgroundColor: 'var(--border-subtle)', borderRadius: '2px', marginTop: '3px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${congPct}%`,
                        backgroundColor: congPct > 50 ? 'var(--accent-safety-orange)' : 'var(--accent-gold)'
                      }} />
                    </div>
                  </>
                ) : (
                  <span style={{ fontSize: '10px', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                    No Cascade Data
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
