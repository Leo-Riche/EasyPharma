import { useState, useMemo } from 'react'
import PharmacyMap from './components/PharmacyMap'
import SearchBar from './components/SearchBar'
import PharmacyList from './components/PharmacyList'
import PharmacyDetail from './components/PharmacyDetail'
import MedFilter from './components/MedFilter'
import LoginModal from './components/LoginModal'
import Dashboard from './pages/Dashboard'
import mockData from './data/pharmacies.json'
import './App.css'

const ALL_MEDICATIONS = Array.from(
  new Map(mockData.flatMap(p => p.stock).map(m => [m.cip13, m])).values()
)

export default function App() {
  const [center, setCenter]           = useState(null)
  const [address, setAddress]         = useState('')
  const [pharmacies, setPharmacies]   = useState([])   // OSM brut + mockPharmacyId
  const [loading, setLoading]         = useState(false)
  const [selected, setSelected]       = useState(null)
  const [error, setError]             = useState(null)
  const [selectedMeds, setSelectedMeds] = useState(new Set())
  const [showLogin, setShowLogin]     = useState(false)
  const [pharmacist, setPharmacist]   = useState(null)
  const [mobileTab, setMobileTab]     = useState('map') // 'map' | 'list'

  // Source de vérité du stock — initialisé depuis le JSON, mis à jour par le pharmacien
  const [liveStock, setLiveStock] = useState(
    () => Object.fromEntries(mockData.map(p => [p.id, p.stock.map(s => ({ ...s }))]))
  )

  // Pharmacies OSM enrichies avec le stock live correspondant
  const pharmaciesWithStock = useMemo(() =>
    pharmacies.map(p => ({ ...p, stock: liveStock[p.mockPharmacyId] })),
    [pharmacies, liveStock]
  )

  async function geocode(query) {
    const res = await fetch(
      `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=1`
    )
    const data = await res.json()
    if (!data.features?.length) throw new Error('Adresse introuvable. Essayez un nom de ville ou un code postal.')
    const [lng, lat] = data.features[0].geometry.coordinates
    return { lat, lng, label: data.features[0].properties.label }
  }

  async function fetchPharmacies(lat, lng) {
    const query = `[out:json][timeout:15];node["amenity"="pharmacy"](around:2000,${lat},${lng});out body;`
    const res = import.meta.env.DEV
      ? await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: query })
      : await fetch(`/api/overpass?data=${encodeURIComponent(query)}`)
    const data = await res.json()
    if (!data.elements?.length) return []
    let fallbackIdx = 0
    return data.elements.map((el) => {
      const t = el.tags || {}
      const osmName = (t.name || '').toLowerCase().trim()
      const addrParts = [t['addr:housenumber'], t['addr:street'], t['addr:postcode'], t['addr:city']].filter(Boolean)

      // Priorité 1 : correspondance exacte par nom avec un profil enregistré
      const namedMatch = mockData.find(m => m.name.toLowerCase().trim() === osmName)
      // Priorité 2 : correspondance partielle (le nom OSM contient le nom du profil ou vice-versa)
      const partialMatch = !namedMatch && mockData.find(m =>
        osmName.includes(m.name.toLowerCase().trim()) ||
        m.name.toLowerCase().trim().includes(osmName)
      )
      // Priorité 3 : rotation sur les profils restants (pharmacies sans profil dédié)
      const mockEntry = namedMatch ?? partialMatch ?? mockData[fallbackIdx++ % mockData.length]

      return {
        id: el.id,
        lat: el.lat,
        lng: el.lon,
        name: t.name || 'Pharmacie',
        address: addrParts.length ? addrParts.join(' ') : null,
        opening_hours: t.opening_hours || null,
        phone: t.phone || t['contact:phone'] || null,
        mockPharmacyId: mockEntry.id,
      }
    })
  }

  function sortByDist(list, lat, lng) {
    return [...list].sort((a, b) =>
      Math.hypot(a.lat - lat, a.lng - lng) - Math.hypot(b.lat - lat, b.lng - lng)
    )
  }

  async function handleSearch(query) {
    setError(null); setLoading(true); setSelected(null)
    try {
      const { lat, lng, label } = await geocode(query)
      setAddress(label); setCenter({ lat, lng })
      setPharmacies(sortByDist(await fetchPharmacies(lat, lng), lat, lng))
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  async function handleGeolocate() {
    if (!navigator.geolocation) return
    setError(null); setLoading(true); setSelected(null)
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lng } }) => {
        setCenter({ lat, lng }); setAddress('Ma position actuelle')
        try {
          setPharmacies(sortByDist(await fetchPharmacies(lat, lng), lat, lng))
        } catch (e) { setError(e.message) }
        finally { setLoading(false) }
      },
      () => { setError('Géolocalisation refusée ou indisponible.'); setLoading(false) }
    )
  }

  // Appelé par le dashboard quand le pharmacien publie
  function handlePublish(pharmacyId, newStock) {
    setLiveStock(prev => ({ ...prev, [pharmacyId]: newStock }))
  }

  const visiblePharmacies = useMemo(() => {
    if (selectedMeds.size === 0) return pharmaciesWithStock
    return pharmaciesWithStock.filter(p =>
      [...selectedMeds].every(cip13 =>
        p.stock.some(s => s.cip13 === cip13 && s.status !== 'unavailable')
      )
    )
  }, [pharmaciesWithStock, selectedMeds])

  const selectedPharmacy = pharmaciesWithStock.find(p => p.id === selected)

  if (pharmacist) {
    return (
      <Dashboard
        pharmacist={pharmacist}
        liveStock={liveStock}
        onPublish={handlePublish}
        onLogout={() => setPharmacist(null)}
      />
    )
  }

  return (
    <div className="app">
      <header className="header">
        <a className="brand" href="/">
          <div className="brand-logo">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 3v14M3 10h14" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="brand-name">Easy<span>Pharma</span></span>
        </a>
        <SearchBar onSearch={handleSearch} onGeolocate={handleGeolocate} loading={loading} />
        <MedFilter
          medications={ALL_MEDICATIONS}
          selectedMeds={selectedMeds}
          onChange={meds => { setSelectedMeds(meds); setSelected(null) }}
        />
        <button className="btn btn-pharmacist" onClick={() => setShowLogin(true)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          Espace Pharmacien
        </button>
      </header>

      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onLogin={data => { setPharmacist(data); setShowLogin(false) }}
        />
      )}

      {selectedMeds.size > 0 && (
        <div className="filter-bar">
          <span className="filter-bar-label">Filtre :</span>
          {[...selectedMeds].map(cip13 => {
            const med = ALL_MEDICATIONS.find(m => m.cip13 === cip13)
            return (
              <span key={cip13} className="filter-pill">
                {med?.name}
                <button onClick={() => {
                  const next = new Set(selectedMeds); next.delete(cip13); setSelectedMeds(next)
                }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </span>
            )
          })}
          <span className="filter-bar-count">
            {visiblePharmacies.length} pharmacie{visiblePharmacies.length !== 1 ? 's' : ''} correspondent
          </span>
        </div>
      )}

      <div className={`layout${mobileTab === 'map' ? ' mobile-map' : ' mobile-list'}`}>
        <aside className="sidebar">
          {selected === null ? (
            <>
              <div className="sidebar-header">
                <div className="sidebar-title">Résultats</div>
                {address && !error && (
                  <div className="sidebar-subtitle">
                    Autour de <strong>{address}</strong>
                    {visiblePharmacies.length > 0 && !loading && (
                      <span className="sidebar-count">{visiblePharmacies.length}</span>
                    )}
                  </div>
                )}
              </div>
              <div className="sidebar-scroll">
                {error && (
                  <div className="error-banner">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {error}
                  </div>
                )}
                <PharmacyList
                  pharmacies={visiblePharmacies}
                  center={center}
                  selected={selected}
                  onSelect={setSelected}
                  loading={loading}
                  activeFilter={selectedMeds.size > 0}
                />
              </div>
            </>
          ) : (
            <div className="sidebar-scroll">
              <PharmacyDetail
                pharmacy={selectedPharmacy}
                mockStock={selectedPharmacy.stock}
                center={center}
                onBack={() => setSelected(null)}
              />
            </div>
          )}
        </aside>

        <main className="map-area">
          <PharmacyMap
            center={center}
            pharmacies={visiblePharmacies}
            selected={selected}
            onSelect={setSelected}
          />
        </main>
      </div>

      {/* Barre d'onglets mobile */}
      <nav className="mobile-tabs">
        <button
          className={`mobile-tab${mobileTab === 'map' ? ' active' : ''}`}
          onClick={() => setMobileTab('map')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
            <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
          </svg>
          Carte
          {visiblePharmacies.length > 0 && mobileTab !== 'map' && (
            <span className="mobile-tab-badge">{visiblePharmacies.length}</span>
          )}
        </button>
        <button
          className={`mobile-tab${mobileTab === 'list' ? ' active' : ''}`}
          onClick={() => setMobileTab('list')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
          Liste
          {visiblePharmacies.length > 0 && mobileTab !== 'list' && (
            <span className="mobile-tab-badge">{visiblePharmacies.length}</span>
          )}
        </button>
      </nav>
    </div>
  )
}
