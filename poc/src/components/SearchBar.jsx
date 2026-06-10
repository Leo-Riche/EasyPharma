import { useState } from 'react'

export default function SearchBar({ onSearch, onGeolocate, loading }) {
  const [query, setQuery] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (query.trim()) onSearch(query.trim())
  }

  return (
    <form className="search-form" onSubmit={handleSubmit}>
      <div className="search-field">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          type="text"
          className="search-input"
          placeholder="Adresse, ville ou code postal..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={loading}
          autoComplete="off"
        />
      </div>
      <button type="submit" className="btn btn-primary" disabled={loading || !query.trim()}>
        {loading ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            style={{ animation: 'spin .7s linear infinite' }}>
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
        )}
        Rechercher
      </button>
      <button type="button" className="btn btn-ghost" onClick={onGeolocate} disabled={loading} title="Utiliser ma position GPS">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2"/>
          <circle cx="12" cy="12" r="9" strokeDasharray="2 2.5"/>
        </svg>
        Ma position
      </button>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </form>
  )
}
