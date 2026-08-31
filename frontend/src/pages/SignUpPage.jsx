import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useAuth } from '../hooks/useAuth'

export default function SignUpPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [form, setForm] = useState({ username: '', email: '', password: '', password_confirm: '' })
  const [error, setError] = useState('')

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    try {
      await register(form)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to create the account right now.')
    }
  }

  return (
    <div className="auth-page">
      <Card title="Create your account">
        <form className="stack-form" onSubmit={handleSubmit}>
          <label>
            <span>Username</span>
            <input name="username" value={form.username} onChange={handleChange} />
          </label>
          <label>
            <span>Email</span>
            <input type="email" name="email" value={form.email} onChange={handleChange} />
          </label>
          <label>
            <span>Password</span>
            <input type="password" name="password" value={form.password} onChange={handleChange} />
          </label>
          <label>
            <span>Confirm password</span>
            <input type="password" name="password_confirm" value={form.password_confirm} onChange={handleChange} />
          </label>
          {error ? <p className="error-message">{error}</p> : null}
          <Button type="submit">Sign up</Button>
        </form>
        <p className="auth-link">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </Card>
    </div>
  )
}
