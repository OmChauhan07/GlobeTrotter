import { Navigate, Outlet } from 'react-router-dom'
import { ShieldAlert, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function AdminRoute() {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user?.role !== 'admin') {
    return (
      <div style={{ maxWidth: '640px', margin: '4rem auto', textAlign: 'center', padding: '3rem' }} className="card">
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(166, 83, 79, 0.12)', color: 'var(--color-danger)', display: 'grid', placeItems: 'center', margin: '0 auto 1.5rem' }}>
          <ShieldAlert size={32} />
        </div>
        <h2 style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>Administrator Access Required</h2>
        <p style={{ color: 'var(--color-ink-soft)', marginBottom: '2rem' }}>
          Your current account (<strong>{user?.username}</strong>, role: <em>{user?.role || 'traveler'}</em>) does not possess administrator permissions to view platform analytics.
        </p>
        <div>
          <Link to="/dashboard" className="button button--secondary">
            <ArrowLeft size={16} />
            <span>Return to Traveler Dashboard</span>
          </Link>
        </div>
      </div>
    )
  }

  return <Outlet />
}

export default AdminRoute
