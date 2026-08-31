import { useEffect, useRef, useState } from 'react'
import { AlertCircle, ArrowLeft, Check, KeyRound, Loader2, RefreshCw, Sparkles } from 'lucide-react'

import api from '../../api/client'

export function OtpVerification({ email, onVerified, onBackToSignUp, devOtp }) {
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(60)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)
  const inputsRef = useRef([])

  // Auto-focus first input on mount
  useEffect(() => {
    if (inputsRef.current[0]) {
      inputsRef.current[0].focus()
    }
  }, [])

  // 60-second cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  // Helper to partially mask email for privacy (e.g. om***@gmail.com)
  const maskEmail = (str) => {
    if (!str || !str.includes('@')) return str
    const [name, domain] = str.split('@')
    if (name.length <= 2) return `${name}***@${domain}`
    return `${name.slice(0, 2)}***${name.slice(-1)}@${domain}`
  }

  const handleDigitChange = (index, value) => {
    // Only accept numbers
    const cleanVal = value.replace(/\D/g, '')
    const newDigits = [...digits]

    if (cleanVal.length > 1) {
      // Handle multi-character paste into a single box
      const pasted = cleanVal.slice(0, 6).split('')
      pasted.forEach((char, i) => {
        if (index + i < 6) {
          newDigits[index + i] = char
        }
      })
      setDigits(newDigits)
      const nextIdx = Math.min(index + pasted.length, 5)
      inputsRef.current[nextIdx]?.focus()

      // Auto-submit if all 6 filled
      if (newDigits.every((d) => d !== '')) {
        verifyCode(newDigits.join(''))
      }
      return
    }

    newDigits[index] = cleanVal
    setDigits(newDigits)
    setError(null)

    if (cleanVal && index < 5) {
      inputsRef.current[index + 1]?.focus()
    }

    if (newDigits.every((d) => d !== '') && cleanVal) {
      verifyCode(newDigits.join(''))
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputsRef.current[index - 1]?.focus()
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, 6)
    if (!pastedData) return

    const newDigits = [...digits]
    pastedData.split('').forEach((char, i) => {
      if (i < 6) newDigits[i] = char
    })
    setDigits(newDigits)
    const nextIdx = Math.min(pastedData.length, 5)
    inputsRef.current[nextIdx]?.focus()

    if (newDigits.every((d) => d !== '')) {
      verifyCode(newDigits.join(''))
    }
  }

  const verifyCode = async (otpString) => {
    const codeToVerify = otpString || digits.join('')
    if (codeToVerify.length !== 6) {
      setError('Please enter the full 6-digit verification code.')
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      const res = await api.post('/auth/register/verify-otp/', {
        email,
        otp: codeToVerify,
      })
      if (onVerified) {
        onVerified(res.data)
      }
    } catch (err) {
      const data = err.response?.data
      setError(data?.message || 'Invalid or expired verification code. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return
    try {
      setResending(true)
      setError(null)
      setSuccessMsg(null)
      const res = await api.post('/auth/register/resend-otp/', { email })
      setSuccessMsg(res.data?.message || 'A fresh code has been sent to your email.')
      setResendCooldown(res.data?.cooldown_seconds || 60)
      setDigits(['', '', '', '', '', ''])
      inputsRef.current[0]?.focus()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend verification code.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="otp-verification-container">
      <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
        <div
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            background: 'var(--color-sage-soft)',
            color: 'var(--color-sage-dark)',
            display: 'grid',
            placeItems: 'center',
            margin: '0 auto 1.25rem',
          }}
        >
          <KeyRound size={26} />
        </div>
        <h2 style={{ fontSize: '1.85rem', margin: '0 0 0.5rem' }}>Verify your email</h2>
        <p style={{ margin: 0, fontSize: '0.94rem', color: 'var(--color-ink-soft)', lineHeight: 1.5 }}>
          We sent a 6-digit verification code to
          <br />
          <strong style={{ color: 'var(--color-ink)' }}>{maskEmail(email)}</strong>
        </p>
      </div>

      {devOtp ? (
        <div
          style={{
            padding: '0.75rem 1rem',
            background: 'rgba(181, 138, 74, 0.12)',
            border: '1px dashed var(--color-accent)',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            textAlign: 'center',
            fontSize: '0.85rem',
            color: 'var(--color-accent-dark)',
          }}
        >
          <Sparkles size={14} style={{ display: 'inline', marginRight: '6px' }} />
          <span>Development OTP: <strong>{devOtp}</strong></span>
        </div>
      ) : null}

      {error ? (
        <div className="alert-banner error" role="alert" style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      ) : null}

      {successMsg ? (
        <div className="alert-banner success" style={{ marginBottom: '1.5rem' }}>
          <Check size={16} />
          <span>{successMsg}</span>
        </div>
      ) : null}

      {/* 6-Digit OTP Input Rail */}
      <div
        className="otp-inputs-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '0.65rem',
          marginBottom: '1.75rem',
        }}
      >
        {digits.map((digit, idx) => (
          <input
            key={idx}
            ref={(el) => {
              inputsRef.current[idx] = el
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            autoComplete="one-time-code"
            value={digit}
            onChange={(e) => handleDigitChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            onPaste={handlePaste}
            aria-label={`Digit ${idx + 1} of 6`}
            style={{
              width: '100%',
              height: '56px',
              textAlign: 'center',
              fontSize: '1.5rem',
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              borderRadius: '10px',
              border: '2px solid var(--color-border)',
              background: 'var(--color-white)',
              color: 'var(--color-ink)',
              outline: 'none',
              transition: 'all var(--transition-fast)',
            }}
            className="otp-digit-input"
          />
        ))}
      </div>

      <button
        type="button"
        className="button button--accent"
        style={{ width: '100%', padding: '0.85rem', marginBottom: '1.25rem' }}
        onClick={() => verifyCode()}
        disabled={submitting || digits.some((d) => d === '')}
      >
        {submitting ? (
          <>
            <Loader2 size={16} className="spin" />
            <span>Verifying...</span>
          </>
        ) : (
          <span>Verify Email</span>
        )}
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.86rem' }}>
        <button
          type="button"
          onClick={onBackToSignUp}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--color-ink-soft)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            cursor: 'pointer',
            padding: '0.4rem 0',
          }}
        >
          <ArrowLeft size={14} />
          <span>Edit details</span>
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={resendCooldown > 0 || resending}
          style={{
            background: 'transparent',
            border: 'none',
            color: resendCooldown > 0 ? 'var(--color-ink-light)' : 'var(--color-accent-dark)',
            fontWeight: 600,
            cursor: resendCooldown > 0 ? 'default' : 'pointer',
            padding: '0.4rem 0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          {resending ? (
            <RefreshCw size={13} className="spin" />
          ) : null}
          <span>
            {resendCooldown > 0
              ? `Resend code (${String(Math.floor(resendCooldown / 60)).padStart(2, '0')}:${String(
                  resendCooldown % 60,
                ).padStart(2, '0')})`
              : 'Resend code'}
          </span>
        </button>
      </div>
    </div>
  )
}

export default OtpVerification
