import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    try {
      await login(form)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to sign in. Check your credentials and try again.')
    }
  }

  return (
    <div className="auth-page">
      <Card title="Welcome back">
        <form className="stack-form" onSubmit={handleSubmit}>
          <label>
            <span>Username</span>
            <input name="username" value={form.username} onChange={handleChange} />
          </label>
          <label>
            <span>Password</span>
            <input type="password" name="password" value={form.password} onChange={handleChange} />
          </label>
          {error ? <p className="error-message">{error}</p> : null}
          <Button type="submit">Login</Button>
        </form>
        <p className="auth-link">
          Need an account? <Link to="/signup">Create one</Link>
        </p>
      </Card>
    </div>
  )
}
