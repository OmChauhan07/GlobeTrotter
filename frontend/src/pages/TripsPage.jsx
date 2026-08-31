import { useCallback, useEffect, useState } from 'react'
import {
  CalendarDays,
  Compass,
  Plus,
  Trash2,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import api from '../api/client'

export default function TripsPage() {
  const [trips, setTrips] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchTrips = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await api.get('/trips/')
      setTrips(response.data.results || response.data || [])
      setError('')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load your trips. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    const init = async () => {
      try {
        setIsLoading(true)
        const response = await api.get('/trips/')
        if (isMounted) {
          setTrips(response.data.results || response.data || [])
          setError('')
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.detail || 'Failed to load your trips. Please try again.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }
    init()
    return () => {
      isMounted = false
    }
  }, [])

  const handleDeleteTrip = async (e, tripId) => {
    e.preventDefault()
    e.stopPropagation()
    if (!window.confirm('Are you sure you want to delete this trip and its itinerary?')) {
      return
    }
    try {
      await api.delete(`/trips/${tripId}/`)
      await fetchTrips()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete trip.')
    }
  }

  return (
    <div className="trips-page">
      <div className="section-header-row" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.75rem', marginBottom: '0.4rem' }}>My Journeys</h1>
          <p style={{ fontSize: '1.05rem', color: 'var(--color-ink-soft)' }}>
            Curate, organize, and build multi-city travel itineraries.
          </p>
        </div>
        <Link to="/trips/new" className="button button--accent button--lg">
          <Plus size={18} />
          <span>Plan a New Trip</span>
        </Link>
      </div>

      {error ? (
        <div className="alert-banner error" role="alert">
          <span>{error}</span>
        </div>
      ) : null}

      {isLoading ? (
        <div className="trips-card-grid">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="card"
              style={{ height: '320px', background: 'var(--color-cream-soft)', opacity: 0.6 }}
            />
          ))}
        </div>
      ) : trips.length > 0 ? (
        <div className="trips-card-grid">
          {trips.map((trip) => (
            <div key={trip.id} className="trip-editorial-card">
              <Link to={`/trips/${trip.id}`} style={{ textDecoration: 'none' }}>
                <div
                  className="trip-card-image"
                  style={{
                    backgroundImage: `url(${
                      trip.cover_image ||
                      'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&auto=format&fit=crop&q=80'
                    })`,
                  }}
                >
                  <span className="trip-card-badge">
                    {trip.is_public ? 'Public Showcase' : 'Private'}
                  </span>
                </div>
              </Link>

              <div className="trip-card-body">
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '0.5rem',
                    }}
                  >
                    <Link to={`/trips/${trip.id}`} style={{ textDecoration: 'none' }}>
                      <h3 className="trip-card-title">{trip.name}</h3>
                    </Link>
                    <button
                      type="button"
                      className="icon-button danger"
                      title="Delete trip"
                      onClick={(e) => handleDeleteTrip(e, trip.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {trip.description ? (
                    <p
                      style={{
                        fontSize: '0.88rem',
                        color: 'var(--color-ink-soft)',
                        marginBottom: '0.75rem',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {trip.description}
                    </p>
                  ) : null}

                  <div className="trip-card-dates">
                    <CalendarDays size={15} />
                    <span>
                      {trip.start_date} &mdash; {trip.end_date}
                    </span>
                  </div>
                </div>

                <div className="trip-card-footer">
                  <span>{trip.stops_count || 1} Destinations</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="trip-card-cost">
                      ${Number(trip.estimated_budget || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="card"
          style={{ textAlign: 'center', padding: '4rem 2rem', maxWidth: '640px', margin: '0 auto' }}
        >
          <Compass size={48} style={{ color: 'var(--color-accent)', margin: '0 auto 1.25rem' }} />
          <h3 style={{ marginBottom: '0.5rem', fontSize: '1.85rem' }}>
            Your next adventure starts here.
          </h3>
          <p style={{ maxWidth: '440px', margin: '0 auto 2rem' }}>
            You haven't planned a trip yet. Create your first journey, add stops, and customize your
            timeline.
          </p>
          <Link to="/trips/new" className="button button--accent button--lg">
            <Plus size={18} />
            <span>Plan Your First Trip</span>
          </Link>
        </div>
      )}
    </div>
  )
}


