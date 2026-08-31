import { useCallback, useEffect, useState } from 'react'
import {
  Activity,
  AlertCircle,
  DollarSign,
  Globe,
  Map,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Link } from 'react-router-dom'

import api from '../api/client'

const BAR_COLORS = ['#b58a4a', '#758b7b', '#54758a', '#b57b35', '#8f6a38']

export default function AdminDashboardPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAnalytics = useCallback(async () => {
    try {
      setError(null)
      const res = await api.get('/admin/analytics/')
      setData(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch administrative analytics.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    api
      .get('/admin/analytics/')
      .then((res) => {
        if (isMounted) {
          setData(res.data)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.response?.data?.detail || 'Failed to fetch administrative analytics.')
          setLoading(false)
        }
      })
    return () => {
      isMounted = false
    }
  }, [])

  if (loading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div className="discovery-grid loading-skeleton">
          <div className="discovery-card skeleton-card"><div className="skeleton-text" /></div>
          <div className="discovery-card skeleton-card"><div className="skeleton-text" /></div>
          <div className="discovery-card skeleton-card"><div className="skeleton-text" /></div>
          <div className="discovery-card skeleton-card"><div className="skeleton-text" /></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ maxWidth: '800px', margin: '2rem auto' }} className="alert-banner error">
        <AlertCircle size={20} />
        <span>{error}</span>
        <button type="button" className="button button--sm" onClick={fetchAnalytics} style={{ marginLeft: 'auto' }}>
          Retry
        </button>
      </div>
    )
  }

  const summary = data?.summary || {}
  const popular = data?.popular_destinations || []
  const recentTrips = data?.recent_trips || []

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gap: '2.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <div className="dashboard-greeting-eyebrow">
            <ShieldCheck size={14} style={{ display: 'inline', marginRight: '6px' }} />
            Platform Administration
          </div>
          <h1 style={{ fontSize: '2.5rem', margin: '0.25rem 0 0.5rem' }}>System Analytics & Overview</h1>
          <p style={{ margin: 0 }}>
            Real-time traveler activity, destination popularity, and itinerary metrics across GlobeTrotter.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div className="badge badge--success" style={{ padding: '0.45rem 0.85rem' }}>
            <Sparkles size={14} />
            <span>Admin Portal Live</span>
          </div>
          <button type="button" className="button button--secondary button--sm" onClick={fetchAnalytics} title="Refresh metrics">
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.5rem',
        }}
      >
        <div className="card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-ink-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Travelers
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--color-sage-soft)', color: 'var(--color-sage-dark)', display: 'grid', placeItems: 'center' }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 700, color: 'var(--color-ink)' }}>
            {summary.total_users || 0}
          </div>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>Registered traveler accounts</p>
        </div>

        <div className="card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-ink-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Itineraries
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--color-accent-soft)', color: 'var(--color-accent-dark)', display: 'grid', placeItems: 'center' }}>
              <Map size={18} />
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 700, color: 'var(--color-ink)' }}>
            {summary.total_trips || 0}
          </div>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>{summary.public_trips || 0} public shared journeys</p>
        </div>

        <div className="card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-ink-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Planned Stops & Acts
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(84, 117, 138, 0.12)', color: '#54758a', display: 'grid', placeItems: 'center' }}>
              <Activity size={18} />
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 700, color: 'var(--color-ink)' }}>
            {(summary.total_stops || 0) + (summary.total_activities || 0)}
          </div>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>{summary.total_stops || 0} stops &bull; {summary.total_activities || 0} scheduled experiences</p>
        </div>

        <div className="card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-ink-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Logged Budget
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(181, 138, 74, 0.15)', color: 'var(--color-accent)', display: 'grid', placeItems: 'center' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 700, color: 'var(--color-accent)' }}>
            ${(summary.total_platform_spent || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>Across all traveler expense logs</p>
        </div>
      </div>

      {/* Popular Destinations Chart & Platform Health */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '2rem' }}>
        <div className="card" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>Most Visited Destinations</h3>
          <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>Top cities scheduled across traveler itineraries.</p>
          {popular.length > 0 ? (
            <div style={{ width: '100%', height: '280px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={popular} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="name" stroke="var(--color-ink-light)" fontSize={12} tickLine={false} />
                  <YAxis stroke="var(--color-ink-light)" fontSize={12} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-paper)',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      boxShadow: 'var(--shadow-floating)',
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {popular.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-ink-light)' }}>
              No destination stops recorded yet.
            </div>
          )}
        </div>

        <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>Platform Architecture</h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>Health status & infrastructure parameters.</p>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--color-cream-soft)', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.88rem', color: 'var(--color-ink-soft)' }}>API Engine</span>
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-ink)' }}>Django REST Framework</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--color-cream-soft)', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.88rem', color: 'var(--color-ink-soft)' }}>Authentication</span>
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-ink)' }}>JWT (SimpleJWT)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--color-cream-soft)', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.88rem', color: 'var(--color-ink-soft)' }}>Database Engine</span>
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-ink)' }}>PostgreSQL / SQLite</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--color-cream-soft)', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.88rem', color: 'var(--color-ink-soft)' }}>Client Stack</span>
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-ink)' }}>React + Vite + Recharts</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border-light)' }}>
            <Link to="/discover" className="button button--secondary button--sm" style={{ width: '100%' }}>
              <Globe size={14} />
              <span>Browse Public Catalog</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Trips Table */}
      <div className="card" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>Recent Platform Trips</h3>
        <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>Latest itineraries created by travelers across the system.</p>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-ink-light)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Trip Name</th>
                <th style={{ padding: '0.75rem 1rem' }}>Traveler</th>
                <th style={{ padding: '0.75rem 1rem' }}>Travel Window</th>
                <th style={{ padding: '0.75rem 1rem' }}>Stops</th>
                <th style={{ padding: '0.75rem 1rem' }}>Visibility</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentTrips.map((t) => (
                <tr key={t.id} style={{ borderBottom: '1px solid var(--color-border-light)', fontSize: '0.92rem' }}>
                  <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-ink)' }}>{t.name}</td>
                  <td style={{ padding: '1rem', color: 'var(--color-ink-soft)' }}>@{t.user}</td>
                  <td style={{ padding: '1rem', color: 'var(--color-ink-soft)' }}>{t.start_date} &rarr; {t.end_date}</td>
                  <td style={{ padding: '1rem' }}>{t.stops_count} stops</td>
                  <td style={{ padding: '1rem' }}>
                    <span className={`badge ${t.is_public ? 'badge--success' : ''}`}>
                      {t.is_public ? 'Public' : 'Private'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <Link to={`/trips/${t.id}`} className="button button--secondary button--sm">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
