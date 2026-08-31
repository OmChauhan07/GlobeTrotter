import { useEffect, useState } from 'react'
import { CalendarDays, Compass, Plus, Sparkles } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import api from '../api/client'
import { useAuth } from '../hooks/useAuth'

const CURATED_INSPIRATION = [
  {
    city: 'Kyoto',
    country: 'Japan',
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop&q=80',
    description: 'Ancient bamboo groves, wooden temples, and peaceful shrines.',
  },
  {
    city: 'Amalfi Coast',
    country: 'Italy',
    image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&auto=format&fit=crop&q=80',
    description: 'Sun-drenched cliffs, pastel villas, and sapphire Mediterranean waters.',
  },
  {
    city: 'Zermatt',
    country: 'Switzerland',
    image: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=800&auto=format&fit=crop&q=80',
    description: 'Crisp alpine air and breathtaking views of the majestic Matterhorn.',
  },
  {
    city: 'Cape Town',
    country: 'South Africa',
    image: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=800&auto=format&fit=crop&q=80',
    description: 'Towering ocean cliffs, dramatic mountains, and world-class wine valleys.',
  },
]

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [trips, setTrips] = useState([])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  useEffect(() => {
    let isMounted = true
    const fetchDashboardData = async () => {
      try {
        const res = await api.get('/trips/')
        if (isMounted) {
          setTrips(res.data.results || res.data || [])
        }
      } catch {
        // quiet fallback
      }
    }
    fetchDashboardData()
    return () => {
      isMounted = false
    }
  }, [])

  const nextTrip = trips[0] || null

  const calculateDaysLeft = (startDate) => {
    if (!startDate) return null
    const diffTime = new Date(startDate) - new Date()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : null
  }

  const daysLeft = nextTrip ? calculateDaysLeft(nextTrip.start_date) : null

  return (
    <div className="dashboard-page">
      {/* Editorial Greeting Hero */}
      <section className="dashboard-hero">
        <div>
          <div className="dashboard-greeting-eyebrow">
            <Sparkles size={14} style={{ display: 'inline', marginRight: '6px' }} />
            {getGreeting()}, {user?.first_name || user?.username || 'Traveler'}
          </div>
          <h1 className="dashboard-title">Your next chapter is waiting.</h1>
          <p className="dashboard-subtext">
            {nextTrip
              ? `Your adventure to ${nextTrip.name} is taking shape.`
              : 'Every great journey begins with a single destination.'}
          </p>
        </div>
        <Link to="/trips/new" className="button button--accent button--lg">
          <Plus size={18} />
          <span>Plan a New Trip</span>
        </Link>
      </section>

      {/* Flagship Next Adventure Feature Card */}
      {nextTrip ? (
        <div className="next-adventure-card">
          <div
            className="adventure-media-wrap"
            style={{
              backgroundImage: `url(${
                nextTrip.cover_image ||
                'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&auto=format&fit=crop&q=80'
              })`,
            }}
          >
            <div className="adventure-badge-pill">Next Adventure</div>
          </div>

          <div className="adventure-content">
            <div className="adventure-header">
              <div className="adventure-dates">
                <CalendarDays size={16} />
                <span>
                  {nextTrip.start_date} &mdash; {nextTrip.end_date}
                </span>
              </div>
              <h3>{nextTrip.name}</h3>
              {nextTrip.description && <p>{nextTrip.description}</p>}
            </div>

            <div className="adventure-meta-grid">
              <div className="meta-stat-block">
                <span className="meta-stat-label">Destinations</span>
                <span className="meta-stat-value">{nextTrip.stops_count || 1} Stops</span>
              </div>
              <div className="meta-stat-block">
                <span className="meta-stat-label">Countdown</span>
                <span className="meta-stat-value">
                  {daysLeft !== null ? `${daysLeft} Days` : 'Ready'}
                </span>
              </div>
              <div className="meta-stat-block">
                <span className="meta-stat-label">Budget</span>
                <span className="meta-stat-value">
                  ${Number(nextTrip.estimated_budget || 0).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="adventure-actions">
              <Link to={`/trips/${nextTrip.id}`} className="button">
                Open Itinerary
              </Link>
              <Link to={`/trips/${nextTrip.id}/calendar`} className="button button--secondary">
                View Calendar
              </Link>
              <Link to={`/trips/${nextTrip.id}/budget`} className="button button--secondary">
                Budget
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {/* Recent Trips Section */}
      <section className="dashboard-section">
        <div className="section-header-row">
          <div>
            <h3>Your Journeys</h3>
            <p>Recent and upcoming itineraries</p>
          </div>
          <Link to="/trips" className="section-view-all">
            View all trips &rarr;
          </Link>
        </div>

        {trips.length > 0 ? (
          <div className="trips-card-grid">
            {trips.slice(0, 3).map((trip) => (
              <Link key={trip.id} to={`/trips/${trip.id}`} className="trip-editorial-card">
                <div
                  className="trip-card-image"
                  style={{
                    backgroundImage: `url(${
                      trip.cover_image ||
                      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&auto=format&fit=crop&q=80'
                    })`,
                  }}
                >
                  <span className="trip-card-badge">{trip.is_public ? 'Public' : 'Private'}</span>
                </div>
                <div className="trip-card-body">
                  <div>
                    <h4 className="trip-card-title">{trip.name}</h4>
                    <div className="trip-card-dates">
                      <CalendarDays size={14} />
                      <span>
                        {trip.start_date} &mdash; {trip.end_date}
                      </span>
                    </div>
                  </div>
                  <div className="trip-card-footer">
                    <span>{trip.stops_count || 1} destinations</span>
                    <span className="trip-card-cost">
                      ${Number(trip.estimated_budget || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
            <Compass size={40} style={{ color: 'var(--color-accent)', margin: '0 auto 1rem' }} />
            <h3 style={{ marginBottom: '0.5rem' }}>Your next adventure starts here.</h3>
            <p style={{ maxWidth: '420px', margin: '0 auto 1.5rem' }}>
              You haven't planned a trip yet. Shape your journey with multi-city stops, curated
              activities, and automated budgets.
            </p>
            <Link to="/trips/new" className="button button--accent">
              <Plus size={16} />
              <span>Plan Your First Trip</span>
            </Link>
          </div>
        )}
      </section>

      {/* Curated Destination Inspiration Shelf */}
      <section className="dashboard-section">
        <div className="section-header-row">
          <div>
            <h3>Where to wander next</h3>
            <p>Curated destinations to spark your imagination</p>
          </div>
          <Link to="/discover" className="section-view-all">
            Explore places &rarr;
          </Link>
        </div>

        <div className="inspo-cards-grid">
          {CURATED_INSPIRATION.map((item) => (
            <div
              key={item.city}
              className="inspo-card"
              style={{ backgroundImage: `url(${item.image})` }}
            >
              <div className="inspo-card-content">
                <span className="inspo-country">{item.country}</span>
                <h4 className="inspo-city-title">{item.city}</h4>
                <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.82rem', marginBottom: '1rem' }}>
                  {item.description}
                </p>
                <button
                  type="button"
                  className="button button--sm"
                  style={{
                    background: 'rgba(255,255,255,0.92)',
                    color: 'var(--color-ink)',
                    border: 'none',
                  }}
                  onClick={() => navigate(`/discover?q=${encodeURIComponent(item.city)}`)}
                >
                  Explore {item.city}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

