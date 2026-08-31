import { useState } from 'react'
import {
  Bookmark,
  Compass,
  LogOut,
  Save,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { useAuth } from '../hooks/useAuth'

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const [preferences, setPreferences] = useState({
    firstName: user?.first_name || 'Traveler',
    lastName: user?.last_name || '',
    email: user?.email || '',
    homeAirport: 'JFK / SFO',
    currency: 'USD',
    measurement: 'metric',
    bio: 'Passionate multi-city explorer seeking culture, architecture, and culinary adventures.',
  })
  const [saved, setSaved] = useState(false)

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
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'var(--color-ink)',
            color: 'var(--color-cream)',
            display: 'grid',
            placeItems: 'center',
            fontFamily: 'var(--font-display)',
            fontSize: '2.5rem',
            fontWeight: 700,
          }}
        >
          {user?.username?.charAt(0)?.toUpperCase() || 'T'}
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
            Member since 2026 &bull; {user?.email || 'traveler@globetrotter.travel'}
          </p>
        </div>

        <div>
          <button type="button" className="button button--secondary" onClick={logout}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Preferences Form */}
      <div className="card" style={{ padding: '2.5rem' }}>
        <h3 style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>Travel Preferences</h3>
        <p style={{ marginBottom: '2rem' }}>
          Customize your default currency, units, and traveler profile across all itineraries.
        </p>

        {saved && (
          <div className="alert-banner success">
            <span>Your traveler preferences have been updated.</span>
          </div>
        )}

        <form onSubmit={handleSave} className="stack-form">
          <div className="stop-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="first-name">
                First Name
              </label>
              <input
                id="first-name"
                type="text"
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
                type="text"
                value={preferences.lastName}
                onChange={(e) => setPreferences({ ...preferences, lastName: e.target.value })}
              />
            </div>
          </div>

          <div className="stop-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="currency">
                Preferred Currency
              </label>
              <select
                id="currency"
                value={preferences.currency}
                onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
              >
                <option value="USD">USD ($) - US Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="GBP">GBP (£) - British Pound</option>
                <option value="JPY">JPY (¥) - Japanese Yen</option>
                <option value="INR">INR (₹) - Indian Rupee</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="home-airport">
                Primary Home Airport
              </label>
              <input
                id="home-airport"
                type="text"
                value={preferences.homeAirport}
                onChange={(e) => setPreferences({ ...preferences, homeAirport: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="bio">
              Travel Bio
            </label>
            <textarea
              id="bio"
              rows={3}
              value={preferences.bio}
              onChange={(e) => setPreferences({ ...preferences, bio: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="submit" className="button button--accent">
              <Save size={16} />
              <span>Save Preferences</span>
            </button>
          </div>
        </form>
      </div>

      {/* Saved Places Quick Link */}
      <div
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '2rem 2.5rem',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'var(--color-sage-soft)',
              color: 'var(--color-sage-dark)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Bookmark size={24} />
          </div>
          <div>
            <h4 style={{ margin: '0 0 0.2rem', fontSize: '1.25rem' }}>Saved Destinations</h4>
            <p style={{ margin: 0 }}>Review cities and experiences you've bookmarked for future trips.</p>
          </div>
        </div>

        <Link to="/discover?tab=saved" className="button button--secondary">
          <Compass size={16} />
          <span>View Saved Places</span>
        </Link>
      </div>
    </div>
  )
}

