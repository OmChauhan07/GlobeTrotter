import { useCallback, useEffect, useState } from 'react'
import { CalendarDays, MapPin, Plus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'

import api from '../api/client'
import { Card } from '../components/ui/Card'

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
      setError(err.response?.data?.detail || 'Failed to load trips. Please try again.')
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
          setError(err.response?.data?.detail || 'Failed to load trips. Please try again.')
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
      <div className="page-header-row">
        <div>
          <h2>My Journeys</h2>
          <p className="subtext">Plan, customize, and build multi-city itineraries.</p>
        </div>
        <Link to="/trips/new" className="button">
          <Plus size={16} /> Create Trip
        </Link>
      </div>

      {error ? <p className="error-message">{error}</p> : null}

      {isLoading ? (
        <p>Loading your trips...</p>
      ) : trips.length > 0 ? (
        <div className="trips-grid">
          {trips.map((trip) => (
            <Card key={trip.id} className="trip-card">
              <div className="trip-card__header">
                <h3>{trip.name}</h3>
                <button
                  type="button"
                  className="icon-button danger"
                  title="Delete trip"
                  onClick={(e) => handleDeleteTrip(e, trip.id)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              {trip.description ? <p className="trip-description">{trip.description}</p> : null}
              <div className="trip-dates">
                <CalendarDays size={15} />
                <span>
                  {trip.start_date} &rarr; {trip.end_date}
                </span>
              </div>
              <div className="trip-card__actions">
                <Link to={`/trips/${trip.id}`} className="button button--secondary">
                  Open Itinerary Builder
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="empty-trips-card">
          <div className="empty-itinerary-state">
            <MapPin size={48} className="empty-icon" />
            <h3>No trips created yet</h3>
            <p>Start by creating your first trip and adding destination stops.</p>
            <Link to="/trips/new" className="button">
              <Plus size={16} /> Create Your First Trip
            </Link>
          </div>
        </Card>
      )}
    </div>
  )
}

