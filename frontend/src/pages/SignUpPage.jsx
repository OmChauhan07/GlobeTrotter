import { useState } from 'react'
import { ArrowRight, Loader2, Sparkles } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import OtpVerification from '../components/auth/OtpVerification'
import { useAuth } from '../hooks/useAuth'

export default function SignUpPage() {
  const navigate = useNavigate()
  const { requestRegistrationOTP, completeRegistrationWithTokens } = useAuth()

  const [step, setStep] = useState('details') // 'details' | 'otp'
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    password_confirm: '',
  })
  const [devOtp, setDevOtp] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const handleRequestOtp = async (event) => {
    event.preventDefault()
    setError('')

    if (form.password !== form.password_confirm) {
      setError('Passwords do not match.')
      return
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    try {
      setLoading(true)
      const res = await requestRegistrationOTP({
        email: form.email,
        password: form.password,
        first_name: form.first_name,
        last_name: form.last_name,
      })

      if (res.data?.dev_otp) {
        setDevOtp(res.data.dev_otp)
      }
      setStep('otp')
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          err.response?.data?.email?.[0] ||
          'Unable to send verification code. Please check your information and try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  const handleVerified = (authData) => {
    completeRegistrationWithTokens(authData)
    navigate('/dashboard')
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
          {step === 'details' ? (
            <>
              <div className="auth-form-header">
                <h2>Create your account</h2>
                <p>Start planning your next multi-city journey.</p>
              </div>

              {error ? (
                <div className="alert-banner error" role="alert">
                  <span>{error}</span>
                </div>
              ) : null}

              <form className="stack-form" onSubmit={handleRequestOtp}>
                <div className="form-row-2col">
                  <div className="form-group">
                    <label className="form-label" htmlFor="first_name">
                      First Name
                    </label>
                    <input
                      id="first_name"
                      type="text"
                      name="first_name"
                      placeholder="e.g. Alex"
                      value={form.first_name}
                      onChange={handleChange}
                      autoComplete="given-name"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="last_name">
                      Last Name
                    </label>
                    <input
                      id="last_name"
                      type="text"
                      name="last_name"
                      placeholder="e.g. Morgan"
                      value={form.last_name}
                      onChange={handleChange}
                      autoComplete="family-name"
                    />
                  </div>
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
                  {loading ? (
                    <>
                      <Loader2 size={16} className="spin" />
                      <span>Sending Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue & Verify</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              <p style={{ textAlign: 'center', fontSize: '0.92rem', color: 'var(--color-ink-soft)', marginTop: '1.5rem' }}>
                Already have an account?{' '}
                <Link
                  to="/login"
                  style={{ color: 'var(--color-accent-dark)', fontWeight: 700, textDecoration: 'none' }}
                >
                  Log in &rarr;
                </Link>
              </p>
            </>
          ) : (
            <OtpVerification
              email={form.email}
              devOtp={devOtp}
              onVerified={handleVerified}
              onBackToSignUp={() => setStep('details')}
            />
          )}
        </div>
      </div>
    </div>
  )
}
