import { useRef, useState } from 'react'
import {
  Camera,
  CheckCircle2,
  Loader2,
  LogOut,
  Sparkles,
} from 'lucide-react'

import api from '../api/client'
import { useAuth } from '../hooks/useAuth'

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const fileInputRef = useRef(null)

  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarMessage, setAvatarMessage] = useState('')
  const [avatarError, setAvatarError] = useState('')

  const [preferences, setPreferences] = useState({
    firstName: user?.first_name || 'Traveler',
    lastName: user?.last_name || '',
    email: user?.email || '',
    homeAirport: user?.home_airport || 'JFK / SFO',
    currency: user?.currency || 'USD',
    bio: user?.bio || 'Passionate multi-city explorer seeking culture, architecture, and culinary adventures.',
  })
  const [saved, setSaved] = useState(false)

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Image file size must not exceed 5MB.')
      return
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if (!validTypes.includes(file.type)) {
      setAvatarError('Please select a valid image format (JPEG, PNG, WebP).')
      return
    }

    try {
      setUploadingAvatar(true)
      setAvatarError('')
      setAvatarMessage('')

      const formData = new FormData()
      formData.append('avatar', file)

      const res = await api.post('/accounts/avatar/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const newUrl = res.data?.avatar_url || URL.createObjectURL(file)
      setAvatarUrl(newUrl)
      setAvatarMessage('Profile avatar updated successfully!')

      // Update local storage user if needed
      const savedUser = JSON.parse(localStorage.getItem('gt_user') || '{}')
      savedUser.avatar_url = newUrl
      localStorage.setItem('gt_user', JSON.stringify(savedUser))
    } catch (err) {
      setAvatarError(err.response?.data?.detail || 'Failed to upload avatar image.')
    } finally {
      setUploadingAvatar(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleSave = (e) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto', display: 'grid', gap: '2.5rem' }}>
      {/* Profile Header Hero */}
      <div
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2rem',
          padding: '2.5rem',
          background: 'var(--color-paper)',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative' }}>
          <div
            style={{
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              background: 'var(--color-ink)',
              color: 'var(--color-cream)',
              display: 'grid',
              placeItems: 'center',
              fontFamily: 'var(--font-display)',
              fontSize: '2.5rem',
              fontWeight: 700,
              overflow: 'hidden',
              border: '2px solid var(--color-border)',
            }}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile Avatar"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span>{user?.username?.charAt(0)?.toUpperCase() || 'T'}</span>
            )}
          </div>

          <button
            type="button"
            className="icon-button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            title="Upload profile picture"
            style={{
              position: 'absolute',
              bottom: '-4px',
              right: '-4px',
              width: '32px',
              height: '32px',
              minWidth: '32px',
              minHeight: '32px',
              borderRadius: '50%',
              background: 'var(--color-accent)',
              color: 'var(--color-white)',
              border: '2px solid var(--color-white)',
              padding: 0,
              cursor: 'pointer',
            }}
          >
            {uploadingAvatar ? <Loader2 size={14} className="spin" /> : <Camera size={14} />}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={handleAvatarFileChange}
          />
        </div>

        <div style={{ flex: 1, minWidth: '240px' }}>
          <div className="dashboard-greeting-eyebrow">
            <Sparkles size={14} style={{ display: 'inline', marginRight: '6px' }} />
            Explorer Profile
          </div>
          <h2 style={{ fontSize: '2.25rem', margin: '0.2rem 0 0.35rem' }}>
            {user?.first_name || user?.username || 'GlobeTrotter Explorer'}
          </h2>
          <p style={{ margin: 0, color: 'var(--color-ink-light)' }}>
            Role: <strong style={{ textTransform: 'capitalize' }}>{user?.role || 'traveler'}</strong> &bull; {user?.email || 'traveler@globetrotter.travel'}
          </p>
        </div>

        <div>
          <button type="button" className="button button--secondary" onClick={logout}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {avatarMessage ? (
        <div className="alert-banner success">
          <CheckCircle2 size={16} />
          <span>{avatarMessage}</span>
        </div>
      ) : null}

      {avatarError ? (
        <div className="alert-banner error">
          <span>{avatarError}</span>
        </div>
      ) : null}

      {/* Preferences Form */}
      <div className="card" style={{ padding: '2.5rem' }}>
        <h3 style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>Travel Preferences</h3>
        <p style={{ marginBottom: '2rem', color: 'var(--color-ink-light)' }}>
          Customize your default currency, airport, and traveler bio across all itineraries.
        </p>

        {saved && (
          <div className="alert-banner success">
            <span>Your traveler preferences have been updated.</span>
          </div>
        )}

        <form onSubmit={handleSave} className="stack-form">
          <div className="form-row-2col">
            <div className="form-group">
              <label className="form-label" htmlFor="first-name">
                First Name
              </label>
              <input
                id="first-name"
                className="input-field"
                value={preferences.firstName}
                onChange={(e) => setPreferences({ ...preferences, firstName: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="last-name">
                Last Name
              </label>
              <input
                id="last-name"
                className="input-field"
                value={preferences.lastName}
                onChange={(e) => setPreferences({ ...preferences, lastName: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email Address
            </label>
            <input id="email" className="input-field" value={preferences.email} disabled />
          </div>

          <div className="form-row-2col">
            <div className="form-group">
              <label className="form-label" htmlFor="home-airport">
                Home Base / Airport
              </label>
              <input
                id="home-airport"
                className="input-field"
                value={preferences.homeAirport}
                placeholder="e.g. LHR, JFK, CDG"
                onChange={(e) => setPreferences({ ...preferences, homeAirport: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="currency">
                Preferred Currency
              </label>
              <select
                id="currency"
                className="input-field"
                value={preferences.currency}
                onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="CAD">CAD ($)</option>
                <option value="AUD">AUD ($)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="bio">
              Traveler Bio & Exploration Goals
            </label>
            <textarea
              id="bio"
              className="input-field"
              rows={3}
              value={preferences.bio}
              onChange={(e) => setPreferences({ ...preferences, bio: e.target.value })}
            />
          </div>

          <button
            type="submit"
            className="button button--accent"
            style={{ alignSelf: 'flex-start', padding: '0.75rem 2rem' }}
          >
            Save Preferences
          </button>
        </form>
      </div>
    </div>
  )
}
