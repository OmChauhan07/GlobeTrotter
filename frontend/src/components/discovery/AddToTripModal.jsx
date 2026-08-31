import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, MapPin, Plus, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../../api/client'
import { Button } from '../ui/Button'

export function AddToTripModal({ item, itemType, onClose, onSuccess }) {
  const [trips, setTrips] = useState([])
  const [selectedTripId, setSelectedTripId] = useState('')
  const [tripStops, setTripStops] = useState([])
  const [selectedStopId, setSelectedStopId] = useState('')
  
  // Date and time fields
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [activityDate, setActivityDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  
  const [isLoadingTrips, setIsLoadingTrips] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [addedTripId, setAddedTripId] = useState(null)

  useEffect(() => {
    let isMounted = true
    const fetchTrips = async () => {
      try {
        setIsLoadingTrips(true)
        const response = await api.get('/trips/')
        const list = response.data.results || response.data || []
        if (isMounted) {
          setTrips(list)
          if (list.length > 0) {
            setSelectedTripId(String(list[0].id))
            setStartDate(list[0].start_date)
            setEndDate(list[0].end_date)
            setActivityDate(list[0].start_date)
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.detail || 'Failed to load your trips.')
        }
      } finally {
        if (isMounted) {
          setIsLoadingTrips(false)
        }
      }
    }
    fetchTrips()
    return () => {
      isMounted = false
    }
  }, [])

  // When selected trip changes, fetch its stops if adding an activity
  useEffect(() => {
    if (!selectedTripId || itemType !== 'activity') return
    let isMounted = true
    const fetchStops = async () => {
      try {
        const res = await api.get(`/trips/${selectedTripId}/stops/`)
        const stops = res.data || []
        if (isMounted) {
          setTripStops(stops)
          if (stops.length > 0) {
            setSelectedStopId(String(stops[0].id))
            setActivityDate(stops[0].start_date || '')
          } else {
            setSelectedStopId('')
          }
        }
      } catch {
        if (isMounted) {
          setTripStops([])
        }
      }
    }
    fetchStops()
    return () => {
      isMounted = false
    }
  }, [selectedTripId, itemType])

  const selectedTrip = trips.find((t) => String(t.id) === String(selectedTripId))
  const selectedStop = tripStops.find((s) => String(s.id) === String(selectedStopId))

  const handleTripSelect = (tripId) => {
    setSelectedTripId(tripId)
    const t = trips.find((item) => String(item.id) === String(tripId))
    if (t) {
      setStartDate(t.start_date)
      setEndDate(t.end_date)
      setActivityDate(t.start_date)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedTripId) {
      setError('Please select a destination trip.')
      return
    }

    try {
      setIsSubmitting(true)
      setError('')

      if (itemType === 'city') {
        // Validate dates
        if (!startDate || !endDate) {
          setError('Please provide start and end dates for this stop.')
          setIsSubmitting(false)
          return
        }
        if (startDate > endDate) {
          setError('Stop start date cannot be after end date.')
          setIsSubmitting(false)
          return
        }
        if (selectedTrip) {
          if (startDate < selectedTrip.start_date || endDate > selectedTrip.end_date) {
            setError(`Stop dates must fall within trip boundaries (${selectedTrip.start_date} to ${selectedTrip.end_date}).`)
            setIsSubmitting(false)
            return
          }
        }

        // 1. Ensure city exists in DB
        const cityRes = await api.post('/cities/get-or-create/', {
          name: item.name,
          country: item.country,
          region: item.region || '',
          latitude: item.latitude,
          longitude: item.longitude,
          cost_index: item.cost_index || 0,
          popularity: item.popularity || 0,
          image_url: item.image_url || '',
          source: item.source || 'discovery',
        })

        // 2. Attach stop to trip
        await api.post(`/trips/${selectedTripId}/stops/`, {
          city: cityRes.data.id,
          start_date: startDate,
          end_date: endDate,
          notes: `Added from Discovery search: ${item.name}, ${item.country}`,
        })

        setAddedTripId(selectedTripId)
        setSuccessMessage(`Successfully added ${item.name} to ${selectedTrip?.name || 'trip'}!`)
        if (onSuccess) onSuccess()
      } else {
        // Adding activity
        if (!selectedStopId) {
          setError('Please select a city stop to attach this activity to.')
          setIsSubmitting(false)
          return
        }
        if (!activityDate) {
          setError('Activity date is required.')
          setIsSubmitting(false)
          return
        }
        if (selectedStop) {
          if (activityDate < selectedStop.start_date || activityDate > selectedStop.end_date) {
            setError(`Activity date must fall within stop dates (${selectedStop.start_date} to ${selectedStop.end_date}).`)
            setIsSubmitting(false)
            return
          }
        }

        // 1. Ensure activity exists in DB
        const actRes = await api.post('/activities/get-or-create/', {
          name: item.name,
          city_name: item.city_name || selectedStop?.city_name || 'Destination',
          description: item.description || '',
          category: item.category || 'other',
          estimated_cost: item.estimated_cost || 0,
          duration: item.duration || 60,
          image_url: item.image_url || '',
          source: item.source || 'discovery',
        })

        // 2. Attach activity to stop
        await api.post(`/stops/${selectedStopId}/activities/`, {
          activity: actRes.data.id,
          date: activityDate,
          start_time: startTime || null,
          end_time: endTime || null,
          estimated_cost: item.estimated_cost || 0,
          notes: `Added from Discovery: ${item.name}`,
        })

        setAddedTripId(selectedTripId)
        setSuccessMessage(`Successfully added "${item.name}" to your itinerary!`)
        if (onSuccess) onSuccess()
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add item to trip. Please check dates and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-container">
        <div className="modal-header">
          <div>
            <h3>Add to Itinerary</h3>
            <p className="subtext">
              {itemType === 'city' ? `Add ${item.name} as a stop` : `Schedule "${item.name}"`}
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {error ? (
          <div className="alert-banner error" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        ) : null}

        {successMessage ? (
          <div className="modal-success-state">
            <CheckCircle2 size={48} className="success-icon" />
            <h4>Success!</h4>
            <p>{successMessage}</p>
            <div className="modal-actions">
              {addedTripId ? (
                <Link to={`/trips/${addedTripId}`} className="button">
                  View Itinerary Builder
                </Link>
              ) : null}
              <button type="button" className="button button--secondary" onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        ) : isLoadingTrips ? (
          <p>Loading your trips...</p>
        ) : trips.length === 0 ? (
          <div className="empty-modal-state">
            <MapPin size={36} />
            <h4>No trips found</h4>
            <p>You need to create a trip first before adding destination stops.</p>
            <Link to="/trips/new" className="button" onClick={onClose}>
              <Plus size={16} /> Create a New Trip
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="stack-form modal-form">
            <label>
              <span>Select Trip</span>
              <select
                className="input-field"
                value={selectedTripId}
                onChange={(e) => handleTripSelect(e.target.value)}
                required
              >
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.start_date} to {t.end_date})
                  </option>
                ))}
              </select>
            </label>

            {itemType === 'city' ? (
              <div className="stop-form-grid">
                <label>
                  <span>Stop Arrival (Start)</span>
                  <input
                    type="date"
                    className="input-field"
                    min={selectedTrip?.start_date || undefined}
                    max={selectedTrip?.end_date || undefined}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </label>
                <label>
                  <span>Stop Departure (End)</span>
                  <input
                    type="date"
                    className="input-field"
                    min={startDate || selectedTrip?.start_date || undefined}
                    max={selectedTrip?.end_date || undefined}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </label>
              </div>
            ) : (
              <>
                <label>
                  <span>Select City Stop in Trip</span>
                  {tripStops.length > 0 ? (
                    <select
                      className="input-field"
                      value={selectedStopId}
                      onChange={(e) => {
                        setSelectedStopId(e.target.value)
                        const s = tripStops.find((item) => String(item.id) === String(e.target.value))
                        if (s?.start_date) setActivityDate(s.start_date)
                      }}
                      required
                    >
                      {tripStops.map((stop) => (
                        <option key={stop.id} value={stop.id}>
                          {stop.city_name || stop.city} ({stop.start_date} to {stop.end_date})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="helper-text error">
                      No stops in this trip yet. Please add a city stop to this trip first.
                    </p>
                  )}
                </label>

                {tripStops.length > 0 ? (
                  <div className="stop-form-grid">
                    <label>
                      <span>Activity Date</span>
                      <input
                        type="date"
                        className="input-field"
                        min={selectedStop?.start_date || selectedTrip?.start_date || undefined}
                        max={selectedStop?.end_date || selectedTrip?.end_date || undefined}
                        value={activityDate}
                        onChange={(e) => setActivityDate(e.target.value)}
                        required
                      />
                    </label>

                    <label>
                      <span>Start Time (optional)</span>
                      <input
                        type="time"
                        className="input-field"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                      />
                    </label>

                    <label>
                      <span>End Time (optional)</span>
                      <input
                        type="time"
                        className="input-field"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                      />
                    </label>
                  </div>
                ) : null}
              </>
            )}

            <div className="modal-actions">
              <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || (itemType === 'activity' && tripStops.length === 0)}
              >
                <Plus size={16} /> Confirm & Add
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default AddToTripModal
