import { useState, useMemo } from 'react'
import PharmacyMap from './components/PharmacyMap'
import SearchBar from './components/SearchBar'
import PharmacyList from './components/PharmacyList'
import PharmacyDetail from './components/PharmacyDetail'
import MedFilter from './components/MedFilter'
import mockData from './data/pharmacies.json'
import './App.css'

// Liste unique de médicaments extraite du JSON mock
const ALL_MEDICATIONS = Array.from(
  new Map(
    mockData.flatMap(p => p.stock).map(m => [m.cip13, m])
  ).values()
)

export default function App() {
  const [center, setCenter] = useState(null)
  const [address, setAddress] = useState('')
  const [pharmacies, setPharmacies] = useState([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState(null)
  const [selectedMeds, setSelectedMeds] = useState(new Set())

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
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query,
    })
    const data = await res.json()
    return data.elements.map((el, i) => {
      const t = el.tags || {}
      const addrParts = [t['addr:housenumber'], t['addr:street'], t['addr:postcode'], t['addr:city']].filter(Boolean)
      return {
        id: el.id,
        lat: el.lat,
        lng: el.lon,
        name: t.name || 'Pharmacie',
        address: addrParts.length ? addrParts.join(' ') : null,
        opening_hours: t.opening_hours || null,
        phone: t.phone || t['contact:phone'] || null,
        // stock mock assigné de façon stable par index
        stock: mockData[i % mockData.length].stock,
      }
    })
  }

  function sortByDist(list, lat, lng) {
    return [...list].sort((a, b) =>
      Math.hypot(a.lat - lat, a.lng - lng) - Math.hypot(b.lat - lat, b.lng - lng)
    )
  }

  async function handleSearch(query) {
    setError(null)
    setLoading(true)
    setSelected(null)
    try {
      const { lat, lng, label } = await geocode(query)
      setAddress(label)
      setCenter({ lat, lng })
      setPharmacies(sortByDist(await fetchPharmacies(lat, lng), lat, lng))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleGeolocate() {
    if (!navigator.geolocation) return
    setError(null)
    setLoading(true)
    setSelected(null)
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lng } }) => {
        setCenter({ lat, lng })
        setAddress('Ma position actuelle')
        try {
          setPharmacies(sortByDist(await fetchPharmacies(lat, lng), lat, lng))
        } catch (e) {
          setError(e.message)
        } finally {
          setLoading(false)
        }
      },
      () => { setError('Géolocalisation refusée ou indisponible.'); setLoading(false) }
    )
  }

  // Pharmacies filtrées : ne garder que celles qui ont TOUS les médicaments sélectionnés (dispo ou faible)
  const visiblePharmacies = useMemo(() => {
    if (selectedMeds.size === 0) return pharmacies
    return pharmacies.filter(p =>
      [...selectedMeds].every(cip13 =>
        p.stock.some(s => s.cip13 === cip13 && s.status !== 'unavailable')
      )
    )
  }, [pharmacies, selectedMeds])

  const selectedPharmacy = pharmacies.find(p => p.id === selected)

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
      </header>

      {/* Barre de filtres actifs */}
      {selectedMeds.size > 0 && (
        <div className="filter-bar">
          <span className="filter-bar-label">Filtre :</span>
          {[...selectedMeds].map(cip13 => {
            const med = ALL_MEDICATIONS.find(m => m.cip13 === cip13)
            return (
              <span key={cip13} className="filter-pill">
                {med?.name}
                <button onClick={() => {
                  const next = new Set(selectedMeds)
                  next.delete(cip13)
                  setSelectedMeds(next)
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

      <div className="layout">
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
    </div>
  )
}
