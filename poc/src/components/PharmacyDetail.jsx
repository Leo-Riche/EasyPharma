function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000, r = x => (x * Math.PI) / 180
  const a = Math.sin(r(lat2-lat1)/2)**2 + Math.cos(r(lat1))*Math.cos(r(lat2))*Math.sin(r(lng2-lng1)/2)**2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)))
}
function fmt(m) { return m < 1000 ? `${m} m` : `${(m/1000).toFixed(1)} km` }

const GROUPS = [
  {
    key: 'available',
    label: 'Disponible',
    color: '#16a34a',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    dot: '#22c55e',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
  },
  {
    key: 'low',
    label: 'Stock faible',
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
    dot: '#f59e0b',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
  },
  {
    key: 'unavailable',
    label: 'Indisponible',
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#fecaca',
    dot: '#ef4444',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    ),
  },
]

function MedRow({ med, group }) {
  return (
    <li className="stock-row">
      <div className="stock-row-icon" style={{ background: group.bg, border: `1px solid ${group.border}` }}>
        {group.icon}
      </div>
      <div className="stock-row-body">
        <span className="stock-row-name">{med.name}</span>
        <span className="stock-row-meta">{med.form} · {med.lab}</span>
      </div>
      <div className="stock-row-right">
        {med.status !== 'unavailable' ? (
          <>
            <span className="stock-row-qty" style={{ color: group.color }}>{med.qty}</span>
            <span className="stock-row-unit">{med.unit}</span>
          </>
        ) : (
          <span className="stock-row-rupture">Rupture</span>
        )}
      </div>
    </li>
  )
}

export default function PharmacyDetail({ pharmacy, mockStock, center, onBack }) {
  const dist = center ? haversine(center.lat, center.lng, pharmacy.lat, pharmacy.lng) : null

  const grouped = {
    available:   mockStock.filter(s => s.status === 'available'),
    low:         mockStock.filter(s => s.status === 'low'),
    unavailable: mockStock.filter(s => s.status === 'unavailable'),
  }
  const total = mockStock.length

  return (
    <div className="detail-panel">

      {/* Back */}
      <button className="detail-back" onClick={onBack}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
        Retour à la liste
      </button>

      {/* Header pharmacie */}
      <div className="detail-hero">
        <div className="detail-hero-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <path d="M12 6v10M7 11h10" strokeLinecap="round"/>
          </svg>
        </div>
        <div className="detail-hero-body">
          <h2 className="detail-name">{pharmacy.name}</h2>
          {pharmacy.address && (
            <p className="detail-address">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              {pharmacy.address}
            </p>
          )}
          <div className="detail-meta-row">
            {dist !== null && <span className="detail-chip green">{fmt(dist)}</span>}
            {pharmacy.opening_hours && (
              <span className="detail-chip gray">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                </svg>
                {pharmacy.opening_hours}
              </span>
            )}
            {pharmacy.phone && (
              <span className="detail-chip gray">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.77 3.36 2 2 0 0 1 3.74 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.69a16 16 0 0 0 6.29 6.29l1.05-1.04a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                {pharmacy.phone}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Barre de stock */}
      <div className="stock-summary">
        <div className="stock-summary-bar">
          <div title="Disponible"   style={{ flex: grouped.available.length,   background: '#22c55e', minWidth: grouped.available.length   ? 4 : 0 }} />
          <div title="Stock faible" style={{ flex: grouped.low.length,         background: '#f59e0b', minWidth: grouped.low.length         ? 4 : 0 }} />
          <div title="Indisponible" style={{ flex: grouped.unavailable.length, background: '#ef4444', minWidth: grouped.unavailable.length ? 4 : 0 }} />
        </div>
        <div className="stock-summary-legend">
          {GROUPS.map(g => (
            <span key={g.key}>
              <span className="legend-dot" style={{ background: g.dot }} />
              {g.label} <strong>{grouped[g.key].length}</strong>
            </span>
          ))}
          <span className="legend-total">sur {total} médicaments</span>
        </div>
      </div>

      {/* Groupes */}
      <div className="stock-groups">
        {GROUPS.map(group => {
          const meds = grouped[group.key]
          if (!meds.length) return null
          return (
            <div key={group.key} className="stock-group">
              <div className="stock-group-header" style={{ borderLeftColor: group.dot }}>
                <span className="stock-group-label" style={{ color: group.color }}>
                  {group.icon}
                  {group.label}
                </span>
                <span className="stock-group-count" style={{ background: group.bg, color: group.color, border: `1px solid ${group.border}` }}>
                  {meds.length}
                </span>
              </div>
              <ul className="stock-rows">
                {meds.map(med => <MedRow key={med.cip13} med={med} group={group} />)}
              </ul>
            </div>
          )
        })}
      </div>

      <div className="detail-footer">
        <span className="mock-badge">données simulées — POC</span>
      </div>

    </div>
  )
}
