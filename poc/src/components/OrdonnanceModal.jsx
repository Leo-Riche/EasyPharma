import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString()

async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  let fullText = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    fullText += content.items.map(item => item.str).join(' ') + '\n'
  }
  return fullText
}

function matchMedications(text, allMedications) {
  const normalized = text.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // retire les accents
  return allMedications.filter(med => {
    // Essaie de trouver le nom du médicament (sans dosage) dans le texte
    const nameParts = med.name.toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .split(' ')
    // Le premier mot suffit (ex: "doliprane", "amoxicilline", "levothyrox")
    const keyword = nameParts[0]
    return keyword.length >= 4 && normalized.includes(keyword)
  })
}

export default function OrdonnanceModal({ allMedications, onApply, onClose }) {
  const [step, setStep] = useState('upload') // 'upload' | 'scanning' | 'result' | 'error'
  const [detectedMeds, setDetectedMeds] = useState([])
  const [selectedCips, setSelectedCips] = useState(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState(null)
  const [scanError, setScanError] = useState(null)
  const fileRef = useRef()

  async function processFile(file) {
    if (!file) return
    setFileName(file.name)
    setStep('scanning')
    setScanError(null)

    try {
      if (file.type === 'application/pdf') {
        const text = await extractTextFromPDF(file)
        const found = matchMedications(text, allMedications)
        if (found.length === 0) {
          setScanError('Aucun médicament reconnu dans ce PDF. Ajoutez-les manuellement ci-dessous.')
          setDetectedMeds([])
          setSelectedCips(new Set())
        } else {
          setDetectedMeds(found)
          setSelectedCips(new Set(found.map(m => m.cip13)))
        }
      } else {
        // Image : pas d'OCR dans le navigateur sans lib lourde
        setScanError("L'analyse d'images n'est pas encore supportée. Ajoutez les médicaments manuellement.")
        setDetectedMeds([])
        setSelectedCips(new Set())
      }
    } catch (err) {
      setScanError('Erreur lors de la lecture du fichier. Vérifiez que le PDF n\'est pas protégé.')
      console.error(err)
    }

    setStep('result')
  }

  function toggleCip(cip13) {
    setSelectedCips(prev => {
      const next = new Set(prev)
      next.has(cip13) ? next.delete(cip13) : next.add(cip13)
      return next
    })
  }

  function addManual(med) {
    if (!detectedMeds.find(m => m.cip13 === med.cip13)) {
      setDetectedMeds(prev => [...prev, med])
    }
    setSelectedCips(prev => new Set([...prev, med.cip13]))
    setSearchQuery('')
  }

  function removeMed(cip13) {
    setDetectedMeds(prev => prev.filter(m => m.cip13 !== cip13))
    setSelectedCips(prev => { const n = new Set(prev); n.delete(cip13); return n })
  }

  function handleApply() {
    onApply(selectedCips)
    onClose()
  }

  function reset() {
    setStep('upload')
    setDetectedMeds([])
    setSelectedCips(new Set())
    setFileName(null)
    setScanError(null)
    setSearchQuery('')
  }

  const searchResults = searchQuery.length > 1
    ? allMedications.filter(m =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !detectedMeds.find(d => d.cip13 === m.cip13)
      ).slice(0, 5)
    : []

  return createPortal(
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal ordo-modal">

        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="ordo-modal-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <path d="M10 9H8"/>
              </svg>
            </div>
            <div>
              <h2 className="modal-title">Importer une ordonnance</h2>
              <p className="modal-subtitle">
                {step === 'upload' && 'Importez votre ordonnance PDF pour détecter automatiquement les médicaments'}
                {step === 'scanning' && `Analyse de "${fileName}" en cours...`}
                {step === 'result' && !scanError && `${detectedMeds.length} médicament${detectedMeds.length > 1 ? 's' : ''} détecté${detectedMeds.length > 1 ? 's' : ''}`}
                {step === 'result' && scanError && 'Ajout manuel des médicaments'}
              </p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">

          {/* ── Upload ── */}
          {step === 'upload' && (
            <div className="ordo-upload-section">
              <div
                className={`ordo-dropzone${dragOver ? ' drag-over' : ''}`}
                onClick={() => fileRef.current.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); processFile(e.dataTransfer.files[0]) }}
              >
                <div className="ordo-dropzone-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="12" y1="18" x2="12" y2="12"/>
                    <polyline points="9 15 12 12 15 15"/>
                  </svg>
                </div>
                <p className="ordo-dropzone-title">Glissez votre ordonnance PDF ici</p>
                <p className="ordo-dropzone-sub">ou cliquez pour sélectionner un fichier</p>
                <span className="ordo-dropzone-formats">PDF recommandé · JPG, PNG acceptés</span>
                <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }}
                  onChange={e => processFile(e.target.files[0])} />
              </div>

              <div className="ordo-divider"><span>ou ajoutez manuellement</span></div>

              <div className="ordo-manual-search">
                <input className="ordo-search-input" placeholder="Rechercher un médicament..."
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                {searchResults.length > 0 && (
                  <div className="ordo-search-results">
                    {searchResults.map(m => (
                      <button key={m.cip13} className="ordo-search-result-item" onClick={() => {
                        setDetectedMeds([m])
                        setSelectedCips(new Set([m.cip13]))
                        setSearchQuery('')
                        setStep('result')
                      }}>
                        <span className="osri-name">{m.name}</span>
                        <span className="osri-meta">{m.form} · {m.lab}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Scan ── */}
          {step === 'scanning' && (
            <div className="ordo-scanning">
              <div className="ordo-scan-animation">
                <div className="ordo-scan-doc">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <path d="M10 9H8"/>
                  </svg>
                  <div className="ordo-scan-line"/>
                </div>
              </div>
              <p className="ordo-scanning-title">Analyse de l'ordonnance</p>
              <p className="ordo-scanning-sub">Extraction et identification des médicaments...</p>
              <div className="ordo-scan-steps">
                <div className="ordo-scan-step active">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  Lecture du document
                </div>
                <div className="ordo-scan-step active">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  Extraction du texte
                </div>
                <div className="ordo-scan-step loading">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    style={{ animation: 'spin .7s linear infinite' }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  Identification des médicaments
                </div>
              </div>
            </div>
          )}

          {/* ── Résultats ── */}
          {step === 'result' && (
            <div className="ordo-result">
              {fileName && (
                <div className="ordo-file-chip">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  {fileName}
                  {!scanError && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: '#22c55e' }}>
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
              )}

              {scanError && (
                <div className="ordo-scan-error">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {scanError}
                </div>
              )}

              {detectedMeds.length > 0 && (
                <div className="ordo-meds-list">
                  {detectedMeds.map(med => (
                    <div key={med.cip13} className={`ordo-med-item${selectedCips.has(med.cip13) ? ' checked' : ''}`}>
                      <label className="ordo-med-check">
                        <input type="checkbox" checked={selectedCips.has(med.cip13)} onChange={() => toggleCip(med.cip13)} />
                        <span className="ordo-med-checkmark"/>
                      </label>
                      <div className="ordo-med-info">
                        <span className="ordo-med-name">{med.name}</span>
                        <span className="ordo-med-meta">{med.form} · {med.lab}</span>
                      </div>
                      <button className="ordo-med-remove" onClick={() => removeMed(med.cip13)}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="ordo-add-more">
                <input className="ordo-search-input" placeholder="Ajouter un médicament..."
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                {searchResults.length > 0 && (
                  <div className="ordo-search-results">
                    {searchResults.map(m => (
                      <button key={m.cip13} className="ordo-search-result-item" onClick={() => addManual(m)}>
                        <span className="osri-name">{m.name}</span>
                        <span className="osri-meta">{m.form} · {m.lab}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {!scanError && detectedMeds.length > 0 && (
                <div className="ordo-result-info">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  Seules les pharmacies ayant <strong>tous les médicaments cochés</strong> en stock seront affichées.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          {step === 'result' && (
            <button className="btn btn-ghost" onClick={reset}>Recommencer</button>
          )}
          <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
          {step === 'result' && (
            <button className="btn btn-primary" onClick={handleApply} disabled={selectedCips.size === 0}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              Rechercher ({selectedCips.size} médicament{selectedCips.size > 1 ? 's' : ''})
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
