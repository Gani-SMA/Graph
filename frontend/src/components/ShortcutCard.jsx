import React from 'react';

export default function ShortcutCard({ selectedRoute }) {
  if (!selectedRoute || !selectedRoute.is_shortcut) return null;

  return (
    <div style={{
      padding: '12px',
      margin: '12px 16px 0 16px',
      backgroundColor: 'rgba(39, 174, 96, 0.12)',
      border: '1px solid var(--accent-clear-mint)',
      borderRadius: '6px',
      fontSize: '12px',
      color: 'var(--text-main)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--accent-clear-mint)', marginBottom: '4px' }}>
        <span>⚡</span> CASCADE SHORTCUT DETECTED
      </div>
      <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
        This candidate route achieves a faster cascade-adjusted ETA by bypassing predicted multi-hop bottlenecks along the shortest-by-distance highway path.
      </p>
    </div>
  );
}
