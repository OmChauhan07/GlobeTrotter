import { useState } from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    try {
      setLoading(true)
      await login(form)
      navigate('/dashboard')
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'We could not verify your credentials. Please double-check and try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-split-layout">
      {/* Left Full-Height Hero Pane */}
      <div
        className="auth-hero-pane"
        style={{
          backgroundImage:
            'url(https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80)',
        }}
      >
        <div className="auth-hero-content">
          <div className="auth-brand-logo">
            <Sparkles size={20} style={{ display: 'inline', marginRight: '8px' }} />
            GlobeTrotter
          </div>
        </div>

        <div className="auth-quote-wrap">
          <blockquote className="auth-quote">
            &ldquo;Travel well. Remember more.&rdquo;
          </blockquote>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem' }}>
            Curated journeys, multi-city itineraries, and effortless budget intelligence.
          </p>
        </div>
      </div>

      {/* Right Form Pane */}
      <div className="auth-form-pane">
        <div className="auth-form-box">
          <div className="auth-form-header">
            <h2>Welcome back</h2>
            <p>Enter your details to access your travels.</p>
          </div>

          {error ? (
            <div className="alert-banner error" role="alert">
              <span>{error}</span>
            </div>
          ) : null}

          <form className="stack-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="username">
                Username or Email
              </label>
              <input
                id="username"
                type="text"
                name="username"
                placeholder="e.g. explorer"
                value={form.username}
                onChange={handleChange}
                required
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                name="password"
                placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="button button--accent button--lg"
              disabled={loading}
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              <span>{loading ? 'Signing in...' : 'Continue'}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '0.92rem', color: 'var(--color-ink-soft)' }}>
            New to GlobeTrotter?{' '}
            <Link
              to="/signup"
              style={{ color: 'var(--color-accent-dark)', fontWeight: 700, textDecoration: 'none' }}
            >
              Create an account &rarr;
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

