import { useEffect, useMemo, useState } from 'react'
import {
  Calendar,
  Check,
  Clock,
  Compass,
  Copy,
  DollarSign,
  Landmark,
  MapPin,
  Mountain,
  Palmtree,
  PartyPopper,
  Sparkles,
  UserCircle2,
  Utensils,
  Car,
  Bed,
  Share2,
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import api from '../api/client'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useAuth } from '../hooks/useAuth'

const CATEGORY_ICONS = {
  transport: Car,
  accommodation: Bed,
  culture: Landmark,
  food: Utensils,
  adventure: Mountain,
  nature: Palmtree,
  relaxation: Palmtree,
  nightlife: PartyPopper,
  other: Sparkles,
}

const CATEGORY_LABELS = {
  transport: 'Transport',
  accommodation: 'Accommodation',
  culture: 'Culture & Art',
  food: 'Food & Dining',
  adventure: 'Adventure',
  nature: 'Nature & Parks',
  relaxation: 'Relaxation',
  nightlife: 'Nightlife',
  other: 'Experience',
}

function parseISODate(dateStr) {
  if (!dateStr) return null
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function formatToISODate(dateObj) {
  if (!dateObj) return ''
  const y = dateObj.getFullYear()
  const m = String(dateObj.getMonth() + 1).padStart(2, '0')
  const d = String(dateObj.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return ''
  const dateObj = parseISODate(dateStr)
  if (!dateObj) return dateStr
  return dateObj.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function PublicTripPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const [trip, setTrip] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isCloning, setIsCloning] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  useEffect(() => {
    let isMounted = true
    const fetchPublicTrip = async () => {
      try {
        setIsLoading(true)
        setError('')
        const res = await api.get(`/trips/public/${slug}/`)
        if (isMounted) {
          setTrip(res.data)
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.status === 404
              ? 'This public itinerary was not found or is set to private.'
              : 'Failed to load public itinerary. Please try again.',
          )
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    if (slug) {
      fetchPublicTrip()
    }
    return () => {
      isMounted = false
    }
  }, [slug])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2500)
  }

  const handleCloneTrip = async () => {
    if (!isAuthenticated) {
      // Prompt user to login with return path
      navigate(`/login?redirect=/public/trip/${slug}`)
      return
    }

    try {
      setIsCloning(true)
      const res = await api.post(`/trips/public/${slug}/clone/`)
      const newTripId = res.data?.trip?.id
      if (newTripId) {
        navigate(`/trips/${newTripId}`)
      } else {
        navigate('/trips')
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to clone itinerary. Please try again.')
    } finally {
      setIsCloning(false)
    }
  }

  // Generate day-by-day structured timeline
  const daysList = useMemo(() => {
    if (!trip?.start_date || !trip?.end_date) return []

    const start = parseISODate(trip.start_date)
    const end = parseISODate(trip.end_date)
    if (!start || !end || start > end) return []

    const days = []
    let curr = new Date(start)
    let dayNum = 1
    const stops = trip.stops || []

    const allActivities = []
    stops.forEach((stop) => {
      if (stop.activities) {
        stop.activities.forEach((act) => {
          allActivities.push({ ...act, stopRef: stop })
        })
      }
    })

    while (curr <= end) {
      const dateStr = formatToISODate(curr)
      const activeStop = stops.find((s) => {
        if (!s.start_date || !s.end_date) return false
        return dateStr >= s.start_date && dateStr <= s.end_date
      }) || stops[0] || null

      const dayActivities = allActivities.filter((act) => act.date === dateStr)
      dayActivities.sort((a, b) => {
        if (a.start_time && b.start_time) return a.start_time.localeCompare(b.start_time)
        return (a.position || 0) - (b.position || 0)
      })

      days.push({
        dayNumber: dayNum,
        date: dateStr,
        stop: activeStop,
        cityName: activeStop?.city_name || (typeof activeStop?.city === 'string' ? activeStop.city : 'Destination'),
        activities: dayActivities,
      })

      curr.setDate(curr.getDate() + 1)
      dayNum += 1
    }

    return days
  }, [trip])

  const totalActivitiesCount = useMemo(() => {
    if (!trip?.stops) return 0
    return trip.stops.reduce((acc, stop) => acc + (stop.activities?.length || 0), 0)
  }, [trip])

  if (isLoading) {
    return (
      <div className="public-trip-page loading">
        <p>Loading public itinerary...</p>
      </div>
    )
  }

  if (error || !trip) {
    return (
      <div className="public-trip-page">
        <Card className="empty-public-state">
          <Compass size={48} className="empty-icon" />
          <h3>Itinerary Not Found</h3>
          <p>{error || 'The itinerary you are looking for does not exist or has been made private.'}</p>
          <div className="public-empty-actions">
            <Link to="/discover" className="button">
              Explore Destinations
            </Link>
            <Link to="/login" className="button button--secondary">
              Sign In to GlobeTrotter
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="public-trip-page">
      {/* Hero Showcase Banner */}
      <div
        className="public-hero"
        style={
          trip.cover_image
            ? { backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.45), rgba(15, 23, 42, 0.85)), url(${trip.cover_image})` }
            : undefined
        }
      >
        <div className="public-hero__content">
          <div className="public-hero__badges">
            <span className="public-badge-pill">
              <Share2 size={13} /> Public Itinerary
            </span>
            <span className="public-author-tag">
              <UserCircle2 size={14} /> Curated by {trip.author || 'Traveler'}
            </span>
          </div>

          <h1 className="public-hero__title">{trip.name}</h1>

          {trip.description ? (
            <p className="public-hero__desc">{trip.description}</p>
          ) : null}

          <div className="public-hero__meta">
            <span className="meta-item">
              <Calendar size={15} />
              {trip.start_date} &rarr; {trip.end_date} ({daysList.length} Days)
            </span>
            <span className="meta-item">
              <MapPin size={15} />
              {trip.stops?.length || 0} {(trip.stops?.length === 1 ? 'City Stop' : 'City Stops')}
            </span>
            <span className="meta-item">
              <Compass size={15} />
              {totalActivitiesCount} Experiences
            </span>
          </div>

          <div className="public-hero__actions">
            <Button
              type="button"
              className="button button--lg public-clone-btn"
              onClick={handleCloneTrip}
              disabled={isCloning}
            >
              <Copy size={17} /> {isCloning ? 'Cloning Itinerary...' : 'Copy Itinerary to My Trips'}
            </Button>

            <button
              type="button"
              className="button button--secondary button--lg share-link-btn"
              onClick={handleCopyLink}
            >
              {copiedLink ? <Check size={16} /> : <Share2 size={16} />}
              {copiedLink ? 'Link Copied to Clipboard!' : 'Share Itinerary'}
            </button>
          </div>
        </div>
      </div>

      {/* Destinations Strip */}
      {trip.stops && trip.stops.length > 0 ? (
        <div className="public-destinations-strip">
          <h3 className="section-title">Destinations & Stops</h3>
          <div className="destinations-cards-grid">
            {trip.stops.map((stop, idx) => (
              <div key={stop.id || idx} className="destination-mini-card">
                <div className="destination-mini-card__header">
                  <span className="stop-num">Stop {idx + 1}</span>
                  <h4>{stop.city_name || (typeof stop.city === 'string' ? stop.city : 'City')}</h4>
                  {stop.city_country ? (
                    <span className="country-sub">{stop.city_country}</span>
                  ) : null}
                </div>
                <div className="destination-mini-card__meta">
                  <span>{stop.start_date} to {stop.end_date}</span>
                  <span className="activities-pill">
                    {stop.activities?.length || 0} scheduled
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Complete Itinerary Timeline */}
      <div className="public-timeline-section">
        <h3 className="section-title">Day-by-Day Journey</h3>

        <div className="timeline-container">
          {daysList.map((day) => (
            <div key={day.dayNumber} className="timeline-day-block">
              <div className="timeline-day-header">
                <div className="day-title-wrap">
                  <span className="day-badge">DAY {day.dayNumber}</span>
                  <h3>{formatDisplayDate(day.date)}</h3>
                  <span className="day-city-tag">
                    <MapPin size={13} /> {day.cityName}
                  </span>
                </div>
                <span className="activities-count">
                  {day.activities.length} {day.activities.length === 1 ? 'activity' : 'activities'}
                </span>
              </div>

              <div className="timeline-day-body">
                {day.activities.length > 0 ? (
                  <div className="timeline-items-list">
                    {day.activities.map((act) => {
                      const cat = (act.category || 'other').toLowerCase()
                      const Icon = CATEGORY_ICONS[cat] || Sparkles

                      return (
                        <div key={act.id} className="timeline-item">
                          <div className="timeline-item__time">
                            <Clock size={13} />
                            <span>
                              {act.start_time
                                ? act.end_time
                                  ? `${act.start_time} - ${act.end_time}`
                                  : act.start_time
                                : 'Flexible'}
                            </span>
                          </div>

                          <div className="timeline-item__card">
                            <div className="timeline-item__content">
                              <div className="timeline-item__header">
                                <h4 className="timeline-item__title">
                                  {act.activity_name || act.activity}
                                </h4>
                                <span className={`badge badge--cat badge--${cat}`}>
                                  <Icon size={12} />
                                  <span>{CATEGORY_LABELS[cat] || cat}</span>
                                </span>
                              </div>

                              {act.notes ? (
                                <p className="timeline-item__notes">{act.notes}</p>
                              ) : null}

                              {act.estimated_cost && Number(act.estimated_cost) > 0 ? (
                                <div className="timeline-item__meta">
                                  <span className="timeline-cost">
                                    <DollarSign size={13} />
                                    ${Number(act.estimated_cost).toFixed(2)}
                                  </span>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="empty-subtext">Free exploration day in {day.cityName}.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Clone Call to Action Card */}
      <Card className="public-clone-cta-card">
        <div className="cta-content">
          <Sparkles size={36} className="cta-icon" />
          <div>
            <h3>Love this itinerary?</h3>
            <p>Duplicate this trip into your account to customize dates, add custom activities, and budget expenses.</p>
          </div>
        </div>
        <Button
          type="button"
          className="button button--lg"
          onClick={handleCloneTrip}
          disabled={isCloning}
        >
          <Copy size={16} /> {isCloning ? 'Cloning...' : 'Copy to My Account'}
        </Button>
      </Card>
    </div>
  )
}

export default PublicTripPage

