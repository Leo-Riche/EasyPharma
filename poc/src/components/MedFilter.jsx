import { useState } from 'react'
import { createPortal } from 'react-dom'

export default function MedFilter({ medications, selectedMeds, onChange }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState(new Set())

  function openModal() {
    setDraft(new Set(selectedMeds))
    setSearch('')
    setOpen(true)
  }

  function apply() {
    onChange(draft)
    setOpen(false)
  }

  function reset() {
    setDraft(new Set())
  }

  function toggle(cip13) {
    const next = new Set(draft)
    next.has(cip13) ? next.delete(cip13) : next.add(cip13)
    setDraft(next)
  }

  const filtered = medications.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase())
  )

  const count = selectedMeds.size

  return (
    <>
      <button
        type="button"
        className={`btn btn-ghost medfilter-trigger${count > 0 ? ' medfilter-active' : ''}`}
        onClick={openModal}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="4" y1="6" x2="20" y2="6"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
          <line x1="11" y1="18" x2="13" y2="18"/>
        </svg>
        Médicaments
        {count > 0 && <span className="medfilter-badge">{count}</span>}
      </button>

      {open && createPortal(
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Filtrer par médicament</h2>
              <p className="modal-subtitle">Sélectionnez les médicaments dont vous avez besoin</p>
              <button className="modal-close" onClick={() => setOpen(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="modal-search-wrap">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" color="var(--gray-400)">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                className="modal-search"
                placeholder="Rechercher un médicament..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
              />
              {search && (
                <button className="modal-search-clear" onClick={() => setSearch('')}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>

            {draft.size > 0 && (
              <div className="modal-selection-bar">
                <span>{draft.size} médicament{draft.size > 1 ? 's' : ''} sélectionné{draft.size > 1 ? 's' : ''}</span>
                <button onClick={reset}>Tout effacer</button>
              </div>
            )}

            <ul className="modal-list">
              {filtered.length === 0 && (
                <li className="modal-empty">Aucun médicament ne correspond à votre recherche.</li>
              )}
              {filtered.map(med => {
                const checked = draft.has(med.cip13)
                return (
                  <li
                    key={med.cip13}
                    className={`modal-item${checked ? ' checked' : ''}`}
                    onClick={() => toggle(med.cip13)}
                  >
                    <span className={`modal-checkbox${checked ? ' checked' : ''}`}>
                      {checked && (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </span>
                    <span className="modal-item-body">
                      <span className="modal-item-name">{med.name}</span>
                      <span className="modal-item-meta">{med.form} · {med.lab}</span>
                    </span>
                  </li>
                )
              })}
            </ul>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setOpen(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={apply}>
                {draft.size > 0
                  ? `Appliquer (${draft.size} filtre${draft.size > 1 ? 's' : ''})`
                  : 'Afficher toutes les pharmacies'
                }
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
