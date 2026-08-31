import { useState } from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '../hooks/useAuth'

export default function SignUpPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (form.password !== form.password_confirm) {
      setError('Passwords do not match.')
      return
    }

    try {
      setLoading(true)
      await register(form)
      navigate('/dashboard')
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.username?.[0] ||
          err.response?.data?.email?.[0] ||
          'Unable to create your account. Please check your information and try again.'
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
            'url(https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80)',
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
            &ldquo;Plan somewhere beautiful.&rdquo;
          </blockquote>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem' }}>
            Join thousands of travelers designing multi-city adventures and tracking every step.
          </p>
        </div>
      </div>

      {/* Right Form Pane */}
      <div className="auth-form-pane">
        <div className="auth-form-box">
          <div className="auth-form-header">
            <h2>Create your account</h2>
            <p>Start planning your next multi-city journey.</p>
          </div>

          {error ? (
            <div className="alert-banner error" role="alert">
              <span>{error}</span>
            </div>
          ) : null}

          <form className="stack-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                type="text"
                name="username"
                placeholder="e.g. globetrotter"
                value={form.username}
                onChange={handleChange}
                required
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
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
                placeholder="At least 8 characters"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password_confirm">
                Confirm Password
              </label>
              <input
                id="password_confirm"
                type="password"
                name="password_confirm"
                placeholder="Repeat your password"
                value={form.password_confirm}
                onChange={handleChange}
                required
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              className="button button--accent button--lg"
              disabled={loading}
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              <span>{loading ? 'Creating Account...' : 'Get Started'}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '0.92rem', color: 'var(--color-ink-soft)' }}>
            Already have an account?{' '}
            <Link
              to="/login"
              style={{ color: 'var(--color-accent-dark)', fontWeight: 700, textDecoration: 'none' }}
            >
              Log in &rarr;
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

