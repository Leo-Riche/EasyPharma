import { useState } from 'react'

const STATUS_LABELS = {
  available:   { label: 'Disponible',   color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', dot: '#22c55e' },
  low:         { label: 'Stock faible', color: '#d97706', bg: '#fffbeb', border: '#fde68a', dot: '#f59e0b' },
  unavailable: { label: 'Indisponible', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', dot: '#ef4444' },
}

function StatusSelect({ value, onChange }) {
  return (
    <select className="stock-status-select" value={value} onChange={e => onChange(e.target.value)}
      style={{ color: STATUS_LABELS[value].color, borderColor: STATUS_LABELS[value].border,
               background: STATUS_LABELS[value].bg }}>
      <option value="available">Disponible</option>
      <option value="low">Stock faible</option>
      <option value="unavailable">Indisponible</option>
    </select>
  )
}

export default function Dashboard({ pharmacist, liveStock, onPublish, onLogout }) {
  const { pharmacy } = pharmacist
  // Initialise depuis le stock live (déjà potentiellement modifié par une session précédente)
  const [stock, setStock] = useState(() => (liveStock[pharmacy.id] ?? pharmacy.stock).map(s => ({ ...s })))
  const [published, setPublished] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [lastPublished, setLastPublished] = useState(null)

  function updateQty(cip13, val) {
    const qty = Math.max(0, parseInt(val) || 0)
    setStock(s => s.map(m => {
      if (m.cip13 !== cip13) return m
      const status = qty === 0 ? 'unavailable' : qty <= 3 ? 'low' : 'available'
      return { ...m, qty, status }
    }))
    setPublished(false)
  }

  function updateStatus(cip13, status) {
    setStock(s => s.map(m => m.cip13 === cip13 ? { ...m, status } : m))
    setPublished(false)
  }

  async function handlePublish() {
    setPublishing(true)
    await new Promise(r => setTimeout(r, 1200))
    onPublish(pharmacy.id, stock.map(s => ({ ...s })))
    setPublishing(false)
    setPublished(true)
    setLastPublished(new Date())
  }

  const available   = stock.filter(s => s.status === 'available').length
  const low         = stock.filter(s => s.status === 'low').length
  const unavailable = stock.filter(s => s.status === 'unavailable').length

  return (
    <div className="dashboard">

      {/* Topbar */}
      <header className="dash-header">
        <div className="brand">
          <div className="brand-logo">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 3v14M3 10h14" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="brand-name">Easy<span>Pharma</span></span>
        </div>

        <div className="dash-header-center">
          <span className="dash-role-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            Espace Pharmacien
          </span>
        </div>

        <div className="dash-header-right">
          {lastPublished && (
            <span className="dash-last-sync">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Synchronisé {lastPublished.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button className="btn btn-ghost dash-logout" onClick={onLogout}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Déconnexion
          </button>
        </div>
      </header>

      <div className="dash-body">

        {/* Pharmacy card */}
        <div className="dash-pharmacy-card">
          <div className="dash-pharmacy-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <path d="M12 6v10M7 11h10" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="dash-pharmacy-info">
            <h1 className="dash-pharmacy-name">{pharmacy.name}</h1>
            <div className="dash-pharmacy-meta">
              {pharmacy.address && (
                <span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  {pharmacy.address}
                </span>
              )}
              {pharmacy.phone && (
                <span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.77 3.36 2 2 0 0 1 3.74 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.69a16 16 0 0 0 6.29 6.29l1.05-1.04a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  {pharmacy.phone}
                </span>
              )}
              {pharmacy.opening_hours && (
                <span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                  </svg>
                  {pharmacy.opening_hours}
                </span>
              )}
            </div>
          </div>
          <div className="dash-stock-summary-mini">
            <div className="dsm-item" style={{ color: '#16a34a' }}>
              <strong>{available}</strong><span>Disponible{available > 1 ? 's' : ''}</span>
            </div>
            <div className="dsm-divider"/>
            <div className="dsm-item" style={{ color: '#d97706' }}>
              <strong>{low}</strong><span>Faible{low > 1 ? 's' : ''}</span>
            </div>
            <div className="dsm-divider"/>
            <div className="dsm-item" style={{ color: '#dc2626' }}>
              <strong>{unavailable}</strong><span>Rupture{unavailable > 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        {/* Stock table */}
        <div className="dash-section">
          <div className="dash-section-header">
            <div>
              <h2 className="dash-section-title">Gestion des stocks</h2>
              <p className="dash-section-sub">Modifiez les quantités et statuts, puis publiez vers l'application</p>
            </div>
            <button
              className={`btn ${published ? 'btn-published' : 'btn-primary'} dash-publish-btn`}
              onClick={handlePublish}
              disabled={publishing || published}
            >
              {publishing ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    style={{ animation: 'spin .7s linear infinite' }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  Publication...
                </>
              ) : published ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Données publiées
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="16 16 12 12 8 16"/>
                    <line x1="12" y1="12" x2="12" y2="21"/>
                    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                  </svg>
                  Publier les données
                </>
              )}
            </button>
          </div>

          <div className="stock-table-wrap">
            <table className="stock-table">
              <thead>
                <tr>
                  <th>Médicament</th>
                  <th>Forme · Laboratoire</th>
                  <th>Quantité (boîtes)</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {stock.map(med => {
                  const cfg = STATUS_LABELS[med.status]
                  return (
                    <tr key={med.cip13} className={`stock-table-row status-${med.status}`}>
                      <td>
                        <div className="st-name">{med.name}</div>
                        <div className="st-cip">CIP13 : {med.cip13}</div>
                      </td>
                      <td className="st-meta">{med.form} · {med.lab}</td>
                      <td>
                        <input
                          type="number"
                          className="stock-qty-input"
                          min="0"
                          value={med.qty}
                          onChange={e => updateQty(med.cip13, e.target.value)}
                        />
                      </td>
                      <td>
                        <StatusSelect value={med.status} onChange={v => updateStatus(med.cip13, v)} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Publish banner */}
        {!published && (
          <div className="dash-publish-banner">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Les modifications ne sont visibles par les patients qu'après avoir cliqué sur <strong>Publier les données</strong>.
          </div>
        )}

        {published && (
          <div className="dash-publish-banner success">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Vos données de stock sont maintenant <strong>visibles en temps réel</strong> par les patients de l'application.
          </div>
        )}

      </div>
    </div>
  )
}
