import React, { useEffect, useState } from 'react';

const BACKEND_URL = 'http://localhost:8000';

export default function ExplainabilityPanel({ sensorId, onClose }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!sensorId) return;
    
    // Clean sensorId string (e.g. "sensor_717447" -> "717447")
    const cleanId = sensorId.replace('sensor_', '');
    setIsLoading(true);
    setError(null);

    fetch(`${BACKEND_URL}/explain/${cleanId}`)
      .then(res => {
        if (!res.ok) throw new Error("Explainability data unavailable for this segment.");
        return res.json();
      })
      .then(d => {
        setData(d);
        setIsLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setIsLoading(false);
      });
  }, [sensorId]);

  if (!sensorId) return null;

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      right: 0,
      width: '360px',
      maxWidth: '100%',
      height: '100%',
      backgroundColor: 'var(--bg-panel)',
      borderLeft: '1px solid var(--border-subtle)',
      zIndex: 2000,
      padding: '16px',
      overflowY: 'auto',
      boxShadow: '-4px 0 16px rgba(0,0,0,0.5)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
        <div>
          <h2 style={{ fontSize: '15px', color: 'var(--accent-gold)' }}>🔍 Explainability Panel</h2>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Sensor Node: {sensorId}</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            backgroundColor: 'transparent',
            color: 'var(--text-muted)',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer'
          }}
        >
          ✕
        </button>
      </div>

      {isLoading && <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Loading SHAP & GAT attention factors...</div>}

      {error && <div style={{ color: 'var(--accent-safety-orange)', fontSize: '12px' }}>{error}</div>}

      {data && (
        <div>
          {/* GAT Spatial Attention Weights */}
          <div style={{ marginBottom: '18px' }}>
            <h3 style={{ fontSize: '12px', color: 'var(--text-main)', marginBottom: '8px' }}>
              🌐 Upstream Road Bottleneck Attribution (GAT Attention)
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', lineHeight: '1.4' }}>
              Multi-head attention weights showing which upstream road segments contributed to predicted congestion:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {data.upstream_attributions.map((attr, idx) => (
                <div key={idx} style={{ backgroundColor: 'var(--bg-card)', padding: '8px', borderRadius: '4px', fontSize: '11px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600 }}>Upstream Road #{attr.upstream_sensor_id}</span>
                    <span style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>{Math.round(attr.attention_weight * 100)}%</span>
                  </div>
                  <div style={{ height: '4px', width: '100%', backgroundColor: 'var(--border-subtle)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${attr.attention_weight * 100}%`, backgroundColor: 'var(--accent-gold)' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SHAP Feature Importances */}
          <div>
            <h3 style={{ fontSize: '12px', color: 'var(--text-main)', marginBottom: '8px' }}>
              📊 Feature Attribution Factors (SHAP Values)
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', lineHeight: '1.4' }}>
              Signed contribution of each temporal feature to predicted delay:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {data.feature_contributions.map((feat, idx) => {
                const isPositive = feat.shap_value >= 0;
                return (
                  <div key={idx} style={{ backgroundColor: 'var(--bg-card)', padding: '8px', borderRadius: '4px', fontSize: '11px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ textTransform: 'capitalize' }}>{feat.feature_name.replace(/_/g, ' ')}</span>
                    <span style={{
                      color: isPositive ? 'var(--accent-safety-orange)' : 'var(--accent-clear-mint)',
                      fontWeight: 700
                    }}>
                      {isPositive ? `+${feat.shap_value.toFixed(2)}` : feat.shap_value.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
