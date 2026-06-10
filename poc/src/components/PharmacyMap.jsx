import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

/* ── Custom SVG markers via DivIcon (no external image deps) ── */
function makePinIcon(bgColor, svgInner, size = 36, selected = false) {
  const shadow = selected ? 'drop-shadow(0 4px 12px rgba(0,0,0,.35))' : 'drop-shadow(0 2px 4px rgba(0,0,0,.25))'
  const scale = selected ? 1.2 : 1
  const html = `
    <div style="
      width:${size}px; height:${size * 1.35}px;
      transform: scale(${scale});
      transform-origin: bottom center;
      filter: ${shadow};
    ">
      <svg viewBox="0 0 36 48" xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size * 1.35}">
        <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 30 18 30S36 31.5 36 18C36 8.06 27.94 0 18 0z"
          fill="${bgColor}" />
        ${svgInner}
      </svg>
    </div>`
  return L.divIcon({
    html,
    className: '',
    iconSize: [size * scale, size * 1.35 * scale],
    iconAnchor: [(size * scale) / 2, size * 1.35 * scale],
    popupAnchor: [0, -(size * 1.35 * scale)],
  })
}

const crossSvg = `
  <rect x="15.5" y="9" width="5" height="18" rx="2" fill="white"/>
  <rect x="9" y="15.5" width="18" height="5" rx="2" fill="white"/>`

const dotSvg = `<circle cx="18" cy="18" r="7" fill="white" fill-opacity=".9"/>`

const pharmacyIcon   = () => makePinIcon('#16a34a', crossSvg)
const pharmacyActive = () => makePinIcon('#0d9488', crossSvg, 36, true)
const userIcon       = () => makePinIcon('#3b82f6', dotSvg)

/* ── Fly-to helper ─────────────────────────────────────────── */
function FlyTo({ center }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.flyTo([center.lat, center.lng], 14, { duration: 1.1 })
  }, [center, map])
  return null
}

/* ── Popup style override ──────────────────────────────────── */
const popupStyle = `
  .custom-popup .leaflet-popup-content-wrapper {
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0,0,0,.12);
    padding: 0;
    overflow: hidden;
  }
  .custom-popup .leaflet-popup-content {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }
  .custom-popup .leaflet-popup-tip-container { margin-top: -1px; }
  .popup-inner { padding: 14px 16px; min-width: 200px; }
  .popup-name { font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 6px; }
  .popup-row { display: flex; align-items: flex-start; gap: 7px; margin-bottom: 4px; color: #475569; font-size: 12.5px; line-height: 1.45; }
  .popup-row svg { flex-shrink: 0; margin-top: 1px; }
`

export default function PharmacyMap({ center, pharmacies, selected, onSelect }) {
  const markerRefs = useRef({})

  useEffect(() => {
    if (selected !== null && markerRefs.current[selected]) {
      markerRefs.current[selected].openPopup()
    }
  }, [selected])

  return (
    <>
      <style>{popupStyle}</style>
      <MapContainer
        center={[46.603354, 1.888334]}
        zoom={6}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {center && <FlyTo center={center} />}
        {center && (
          <>
            <Marker position={[center.lat, center.lng]} icon={userIcon()}>
              <Popup className="custom-popup">
                <div className="popup-inner">
                  <div className="popup-name">Ma position</div>
                </div>
              </Popup>
            </Marker>
            <Circle
              center={[center.lat, center.lng]}
              radius={2000}
              pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.06, weight: 1.5, dashArray: '6 4' }}
            />
          </>
        )}

        {pharmacies.map((p) => (
          <Marker
            key={p.id}
            position={[p.lat, p.lng]}
            icon={selected === p.id ? pharmacyActive() : pharmacyIcon()}
            ref={(ref) => { markerRefs.current[p.id] = ref }}
            eventHandlers={{ click: () => onSelect(p.id) }}
          >
            <Popup className="custom-popup">
              <div className="popup-inner">
                <div className="popup-name">{p.name}</div>
                {p.address && (
                  <div className="popup-row">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                    {p.address}
                  </div>
                )}
                {p.opening_hours && (
                  <div className="popup-row">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                    </svg>
                    {p.opening_hours}
                  </div>
                )}
                {p.phone && (
                  <div className="popup-row">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.77 3.36 2 2 0 0 1 3.74 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.69a16 16 0 0 0 6.29 6.29l1.05-1.04a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    {p.phone}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </>
  )
}
