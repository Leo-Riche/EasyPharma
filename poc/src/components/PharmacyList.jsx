function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const toRad = (x) => (x * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

function formatDist(m) {
  return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`
}

function SkeletonLoading() {
  return (
    <div className="skeleton-list">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="skeleton-item">
          <div className="skeleton-icon" />
          <div className="skeleton-body">
            <div className="skeleton-line" style={{ width: '65%' }} />
            <div className="skeleton-line" style={{ width: '45%' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function PharmacyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <path d="M12 6v10M7 11h10" strokeLinecap="round"/>
    </svg>
  )
}

export default function PharmacyList({ pharmacies, center, selected, onSelect, loading, activeFilter }) {
  if (loading) return <SkeletonLoading />

  if (!center) {
    return (
      <div className="state-empty">
        <div className="state-empty-icon">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" color="var(--gray-400)">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
        </div>
        <strong>Trouvez une pharmacie</strong>
        <p>Entrez une adresse, un code postal ou utilisez votre position GPS pour afficher les officines proches.</p>
      </div>
    )
  }

  if (!pharmacies.length) {
    return (
      <div className="state-empty">
        <div className="state-empty-icon">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" color="var(--gray-400)">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        {activeFilter ? (
          <>
            <strong>Aucune pharmacie correspondante</strong>
            <p>Aucune officine dans ce secteur ne possède tous les médicaments filtrés. Essayez de retirer un filtre.</p>
          </>
        ) : (
          <>
            <strong>Aucune pharmacie trouvée</strong>
            <p>Aucune officine recensée dans un rayon de 2 km. Essayez une adresse différente.</p>
          </>
        )}
      </div>
    )
  }

  return (
    <ul className="pharmacy-list">
      {pharmacies.map((p, index) => {
        const dist = haversine(center.lat, center.lng, p.lat, p.lng)
        return (
          <li
            key={p.id}
            className={`pharmacy-card${selected === p.id ? ' active' : ''}`}
            onClick={() => onSelect(p.id)}
          >
            <div className="pharmacy-card-icon">
              <PharmacyIcon />
            </div>

            <div className="pharmacy-card-body">
              <div className="pharmacy-card-name">{p.name}</div>
              {p.address && (
                <div className="pharmacy-card-address">{p.address}</div>
              )}
              <div className="pharmacy-card-meta">
                {p.opening_hours && (
                  <span className="meta-tag">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                    </svg>
                    {p.opening_hours}
                  </span>
                )}
                {p.phone && (
                  <span className="meta-tag">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.77 3.36 2 2 0 0 1 3.74 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.69a16 16 0 0 0 6.29 6.29l1.05-1.04a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    {p.phone}
                  </span>
                )}
              </div>
            </div>

            <div className="pharmacy-card-dist">
              <span className="dist-badge">{formatDist(dist)}</span>
              <span className="rank-badge">#{index + 1}</span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
