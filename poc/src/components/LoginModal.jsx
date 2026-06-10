import { useState } from 'react'
import { createPortal } from 'react-dom'
import accounts from '../data/accounts.json'
import mockData from '../data/pharmacies.json'

export default function LoginModal({ onClose, onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    // Simule une latence réseau
    await new Promise(r => setTimeout(r, 700))
    const account = accounts.find(
      a => a.email === email.trim().toLowerCase() && a.password === password
    )
    if (!account) {
      setError('Email ou mot de passe incorrect.')
      setLoading(false)
      return
    }
    const pharmacy = mockData.find(p => p.id === account.pharmacyId)
    setLoading(false)
    onLogin({ account, pharmacy })
  }

  return createPortal(
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal login-modal">
        <div className="modal-header">
          <div className="login-modal-brand">
            <div className="brand-logo" style={{ width: 40, height: 40 }}>
              <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
                <path d="M10 3v14M3 10h14" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
          <h2 className="modal-title" style={{ marginTop: 12 }}>Espace Pharmacien</h2>
          <p className="modal-subtitle">Connectez-vous pour gérer votre stock</p>
          <button className="modal-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label className="login-label">Adresse email</label>
            <input
              type="email"
              className="login-input"
              placeholder="contact@maPharmacie.fr"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="login-field">
            <label className="login-label">Mot de passe</label>
            <div className="login-input-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                className="login-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button type="button" className="login-eye" onClick={() => setShowPassword(s => !s)}>
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="login-error">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary login-submit" disabled={loading}>
            {loading ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  style={{ animation: 'spin .7s linear infinite' }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                Connexion...
              </>
            ) : 'Se connecter'}
          </button>
        </form>

        <div className="login-hint">
          <strong>Comptes de démonstration</strong>
          <div className="login-hint-accounts">
            {accounts.map(a => (
              <button key={a.email} type="button" className="login-hint-btn"
                onClick={() => { setEmail(a.email); setPassword(a.password) }}>
                {mockData.find(p => p.id === a.pharmacyId)?.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
