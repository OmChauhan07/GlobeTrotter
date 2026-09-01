import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  AlertCircle,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  Copy,
  DollarSign,
  ExternalLink,
  GripVertical,
  Loader2,
  MapPin,
  Plus,
  Save,
  Share2,
  Trash2,
  X,
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import api from '../api/client'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'

const emptyStop = { city: '', start_date: '', end_date: '', notes: '' }
const emptyActivity = { activity: '', date: '', start_time: '', end_time: '', estimated_cost: '', notes: '' }

function validateStop(stopData, trip) {
  if (!stopData.city?.trim()) {
    return 'City name is required.'
  }
  if (!stopData.start_date || !stopData.end_date) {
    return 'Both start date and end date are required for the stop.'
  }
  if (stopData.start_date > stopData.end_date) {
    return 'Stop start date cannot be after end date.'
  }
  if (trip?.start_date && stopData.start_date < trip.start_date) {
    return `Stop start date (${stopData.start_date}) cannot be before trip start date (${trip.start_date}).`
  }
  if (trip?.end_date && stopData.end_date > trip.end_date) {
    return `Stop end date (${stopData.end_date}) cannot be after trip end date (${trip.end_date}).`
  }
  return null
}

function validateActivity(activityData, stop) {
  if (!activityData.activity?.trim()) {
    return 'Activity name is required.'
  }
  if (!activityData.date) {
    return 'Activity date is required.'
  }
  if (stop?.start_date && activityData.date < stop.start_date) {
    return `Activity date (${activityData.date}) must fall within stop dates (${stop.start_date} to ${stop.end_date}).`
  }
  if (stop?.end_date && activityData.date > stop.end_date) {
    return `Activity date (${activityData.date}) must fall within stop dates (${stop.start_date} to ${stop.end_date}).`
  }
  if (activityData.start_time && activityData.end_time && activityData.start_time > activityData.end_time) {
    return 'Activity start time cannot be after end time.'
  }
  return null
}

function SortableActivityItem({ activity, stop, onChange, onSave, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `activity-${activity.id}`,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 2 : 1,
  }

  const cityName = stop?.city_name || (typeof stop?.city === 'string' ? stop.city : 'Stop')

  return (
    <div ref={setNodeRef} style={style} className={`activity-item ${isDragging ? 'dragging' : ''}`}>
      <div className="activity-item__drag" {...attributes} {...listeners} title="Drag to reorder activity">
        <GripVertical size={16} />
      </div>

      <div className="activity-item__body">
        <div className="activity-item__name-row">
          <input
            className="input-field"
            value={activity.activity_name || activity.activity || ''}
            placeholder="Activity description"
            onChange={(event) => onChange(activity.trip_stop, activity.id, 'activity', event.target.value)}
          />
        </div>

        <div className="mini-grid">
          <label className="field-compact">
            <span className="field-label">Date</span>
            <input
              type="date"
              className="input-field"
              min={stop?.start_date || undefined}
              max={stop?.end_date || undefined}
              value={activity.date || ''}
              onChange={(event) => onChange(activity.trip_stop, activity.id, 'date', event.target.value)}
            />
          </label>

          <label className="field-compact">
            <span className="field-label">Start</span>
            <input
              type="time"
              className="input-field"
              value={activity.start_time || ''}
              onChange={(event) => onChange(activity.trip_stop, activity.id, 'start_time', event.target.value)}
            />
          </label>

          <label className="field-compact">
            <span className="field-label">End</span>
            <input
              type="time"
              className="input-field"
              value={activity.end_time || ''}
              onChange={(event) => onChange(activity.trip_stop, activity.id, 'end_time', event.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="activity-item__actions">
        <button
          type="button"
          className="icon-button save-button"
          onClick={() => onSave(activity, stop)}
          title={`Save activity in ${cityName}`}
          aria-label="Save activity"
        >
          <Save size={14} />
        </button>
        <button
          type="button"
          className="icon-button danger"
          onClick={() => onDelete(activity.trip_stop, activity.id)}
          title="Delete activity"
          aria-label="Delete activity"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

function SortableStop({
  stop,
  index,
  trip,
  onChange,
  onSave,
  onDelete,
  onAddActivity,
  onActivityChange,
  onActivitySave,
  onActivityDelete,
  onActivityReorder,
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `stop-${stop.id}`,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 3 : 1,
  }

  const activitySortableIds = useMemo(
    () => (stop.activities || []).map((activity) => `activity-${activity.id}`),
    [stop.activities],
  )

  const stopSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const handleActivityDragEnd = (event) => {
    onActivityReorder(stop.id, event)
  }

  const displayCity = stop.city_name || (typeof stop.city === 'string' ? stop.city : 'City destination')

  return (
    <div ref={setNodeRef} style={style} className={`itinerary-stop ${isDragging ? 'dragging' : ''}`}>
      <div className="itinerary-stop__header">
        <div className="itinerary-stop__drag" {...attributes} {...listeners} title="Drag to reorder city stop">
          <GripVertical size={18} />
        </div>
        <div className="itinerary-stop__meta">
          <span className="eyebrow">Stop #{index + 1}</span>
          <h4>{displayCity}</h4>
        </div>
        <button
          type="button"
          className="icon-button danger"
          onClick={() => onDelete(stop.id)}
          title={`Remove stop ${displayCity}`}
          aria-label="Delete stop"
        >
          <Trash2 size={15} />
        </button>
      </div>

      <div className="stop-form-grid">
        <label>
          <span>City</span>
          <input
            className="input-field"
            value={stop.city_name || (typeof stop.city === 'string' ? stop.city : '')}
            placeholder="e.g. Paris"
            onChange={(event) => onChange(stop.id, 'city', event.target.value)}
          />
        </label>
        <label>
          <span>Start Date</span>
          <input
            type="date"
            className="input-field"
            min={trip?.start_date || undefined}
            max={trip?.end_date || undefined}
            value={stop.start_date || ''}
            onChange={(event) => onChange(stop.id, 'start_date', event.target.value)}
          />
        </label>
        <label>
          <span>End Date</span>
          <input
            type="date"
            className="input-field"
            min={stop.start_date || trip?.start_date || undefined}
            max={trip?.end_date || undefined}
            value={stop.end_date || ''}
            onChange={(event) => onChange(stop.id, 'end_date', event.target.value)}
          />
        </label>
      </div>

      <label className="stop-notes-label">
        <span>Stop Notes & Recommendations</span>
        <textarea
          className="input-field"
          value={stop.notes || ''}
          placeholder="Hotel booking details, transit tips, packing notes..."
          rows={2}
          onChange={(event) => onChange(stop.id, 'notes', event.target.value)}
        />
      </label>

      <div className="stop-actions" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <Button type="button" variant="secondary" onClick={() => onSave(stop)}>
          <Save size={14} /> Save Stop Details
        </Button>
        <Link
          to={`/discover?tab=activities&q=${encodeURIComponent(displayCity)}`}
          className="button button--secondary button--sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}
        >
          <Compass size={14} /> Discover {displayCity} Experiences
        </Link>
      </div>

      <div className="activity-list">
        <div className="section-heading">
          <h5>Planned Activities ({stop.activities?.length || 0})</h5>
        </div>

        {stop.activities && stop.activities.length > 0 ? (
          <DndContext sensors={stopSensors} collisionDetection={closestCenter} onDragEnd={handleActivityDragEnd}>
            <SortableContext items={activitySortableIds} strategy={verticalListSortingStrategy}>
              <div className="activities-container">
                {stop.activities.map((activity) => (
                  <SortableActivityItem
                    key={activity.id}
                    activity={activity}
                    stop={stop}
                    onChange={onActivityChange}
                    onSave={onActivitySave}
                    onDelete={onActivityDelete}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="empty-activities">
            <p>No activities scheduled yet for {displayCity}. Add your first activity below!</p>
          </div>
        )}

        <div className="activity-form-card">
          <span className="eyebrow">Add Activity to {displayCity}</span>
          <div className="activity-form">
            <input
              className="input-field"
              placeholder="Activity name (e.g. Louvre Museum)"
              value={stop.newActivity?.activity || ''}
              onChange={(event) => onAddActivity(stop.id, 'activity', event.target.value)}
            />
            <input
              type="date"
              className="input-field"
              min={stop.start_date || trip?.start_date || undefined}
              max={stop.end_date || trip?.end_date || undefined}
              value={stop.newActivity?.date || stop.start_date || ''}
              onChange={(event) => onAddActivity(stop.id, 'date', event.target.value)}
            />
            <input
              type="time"
              className="input-field"
              title="Start Time"
              value={stop.newActivity?.start_time || ''}
              onChange={(event) => onAddActivity(stop.id, 'start_time', event.target.value)}
            />
            <input
              type="time"
              className="input-field"
              title="End Time"
              value={stop.newActivity?.end_time || ''}
              onChange={(event) => onAddActivity(stop.id, 'end_time', event.target.value)}
            />
            <Button type="button" variant="secondary" onClick={() => onAddActivity(stop.id, 'submit')}>
              <Plus size={14} /> Add Activity
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function TripDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [trip, setTrip] = useState(null)
  const [stops, setStops] = useState([])
  const [draftStop, setDraftStop] = useState(emptyStop)
  const [isLoading, setIsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Share & Clone & Cover states
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isCloning, setIsCloning] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const coverInputRef = useRef(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const stopSortableIds = useMemo(() => stops.map((stop) => `stop-${stop.id}`), [stops])

  const loadTrip = useCallback(
    async (preserveError = false) => {
      try {
        setIsLoading(true)
        const tripResponse = await api.get(`/trips/${id}/`)
        const stopResponse = await api.get(`/trips/${id}/stops/`)
        setTrip(tripResponse.data)
        setStops(
          (stopResponse.data || []).map((stop) => ({
            ...stop,
            newActivity: {
              ...emptyActivity,
              date: stop.start_date || '',
            },
          })),
        )
        if (!preserveError) {
          setError('')
        }
      } catch (err) {
        const message = err.response?.data?.detail || 'Unable to load the itinerary. Please refresh or try again.'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    },
    [id],
  )

  useEffect(() => {
    let isMounted = true
    const init = async () => {
      try {
        setIsLoading(true)
        const tripResponse = await api.get(`/trips/${id}/`)
        const stopResponse = await api.get(`/trips/${id}/stops/`)
        if (isMounted) {
          setTrip(tripResponse.data)
          setStops(
            (stopResponse.data || []).map((stop) => ({
              ...stop,
              newActivity: {
                ...emptyActivity,
                date: stop.start_date || '',
              },
            })),
          )
          setError('')
        }
      } catch (err) {
        if (isMounted) {
          const message = err.response?.data?.detail || 'Unable to load the itinerary. Please refresh or try again.'
          setError(message)
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
  }, [id])

  const showSuccess = (msg) => {
    setSuccessMessage(msg)
    setTimeout(() => {
      setSuccessMessage('')
    }, 3500)
  }

  const handleTogglePublish = async () => {
    try {
      setIsPublishing(true)
      const res = await api.post(`/trips/${id}/publish/`)
      setTrip((prev) => ({
        ...prev,
        is_public: res.data.is_public,
        public_slug: res.data.public_slug,
      }))
      showSuccess(res.data.is_public ? 'Trip published to public sharing!' : 'Trip made private.')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update sharing settings.')
    } finally {
      setIsPublishing(false)
    }
  }

  const handleCopyShareLink = () => {
    if (!trip?.public_slug) return
    const publicUrl = `${window.location.origin}/public/trip/${trip.public_slug}`
    navigator.clipboard.writeText(publicUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2500)
  }

  const handleDuplicateTrip = async () => {
    if (!window.confirm(`Duplicate "${trip?.name}" into a new itinerary?`)) return
    try {
      setIsCloning(true)
      const res = await api.post(`/trips/${id}/clone/`)
      const newTripId = res.data?.trip?.id
      if (newTripId) {
        navigate(`/trips/${newTripId}`)
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to clone trip.')
    } finally {
      setIsCloning(false)
    }
  }

  const handleCoverFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError('Cover image file size must not exceed 5MB.')
      return
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image format (JPEG, PNG, WebP).')
      return
    }

    try {
      setUploadingCover(true)
      setError('')
      const formData = new FormData()
      formData.append('cover_image', file)

      const res = await api.post(`/trips/${id}/cover/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const newCover = res.data?.cover_image || res.data?.trip?.cover_image || URL.createObjectURL(file)
      setTrip((prev) => ({ ...prev, cover_image: newCover }))
      showSuccess('Trip cover image updated successfully!')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload cover image.')
    } finally {
      setUploadingCover(false)
      if (coverInputRef.current) {
        coverInputRef.current.value = ''
      }
    }
  }

  const handleStopDraft = (field, value) => {
    setDraftStop((current) => ({ ...current, [field]: value }))
  }

  const handleStopChange = (stopId, field, value) => {
    setStops((current) =>
      current.map((stop) =>
        stop.id === stopId
          ? {
              ...stop,
              [field]: value,
              ...(field === 'city' ? { city_name: value } : {}),
            }
          : stop,
      ),
    )
  }

  const saveStop = async (stop) => {
    const validationError = validateStop(stop, trip)
    if (validationError) {
      setError(validationError)
      return
    }

    const payload = {
      city: stop.city_name || stop.city,
      start_date: stop.start_date,
      end_date: stop.end_date,
      notes: stop.notes || '',
    }

    try {
      setSaving(true)
      setError('')
      await api.patch(`/stops/${stop.id}/`, payload)
      showSuccess('Stop updated successfully!')
      await loadTrip()
    } catch (err) {
      const msg = err.response?.data?.detail || 'Stop update failed. Restoring latest server state.'
      await loadTrip(true)
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleCreateStop = async () => {
    const validationError = validateStop(draftStop, trip)
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setSaving(true)
      setError('')
      await api.post(`/trips/${id}/stops/`, {
        city: draftStop.city.trim(),
        start_date: draftStop.start_date,
        end_date: draftStop.end_date,
        notes: draftStop.notes || '',
      })
      setDraftStop(emptyStop)
      showSuccess('New stop added to your itinerary!')
      await loadTrip()
    } catch (err) {
      const msg = err.response?.data?.detail || 'The stop could not be saved. Please review dates and location.'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteStop = async (stopId) => {
    const previousStops = [...stops]
    setStops((current) => current.filter((s) => s.id !== stopId))

    try {
      setSaving(true)
      setError('')
      await api.delete(`/stops/${stopId}/`)
      showSuccess('Stop removed from itinerary.')
      await loadTrip()
    } catch (err) {
      const msg = err.response?.data?.detail || 'The stop could not be removed. Restoring itinerary.'
      setStops(previousStops)
      await loadTrip(true)
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleActivityField = (stopId, activityId, field, value) => {
    setStops((current) =>
      current.map((stop) => {
        if (stop.id !== stopId) return stop
        return {
          ...stop,
          activities: (stop.activities || []).map((activity) =>
            activity.id === activityId
              ? {
                  ...activity,
                  [field]: value,
                  ...(field === 'activity' ? { activity_name: value } : {}),
                }
              : activity,
          ),
        }
      }),
    )
  }

  const handleDraftActivity = (stopId, field, value) => {
    setStops((current) =>
      current.map((stop) => {
        if (stop.id !== stopId) return stop
        return {
          ...stop,
          newActivity: {
            ...(stop.newActivity || emptyActivity),
            [field]: value,
          },
        }
      }),
    )
  }

  const handleAddActivity = async (stopId, field, value) => {
    if (field === 'submit') {
      const targetStop = stops.find((item) => item.id === stopId)
      const draft = targetStop?.newActivity || emptyActivity
      const activityData = {
        activity: draft.activity,
        date: draft.date || targetStop?.start_date || '',
        start_time: draft.start_time || null,
        end_time: draft.end_time || null,
        notes: draft.notes || '',
      }

      const validationError = validateActivity(activityData, targetStop)
      if (validationError) {
        setError(validationError)
        return
      }

      try {
        setSaving(true)
        setError('')
        await api.post(`/stops/${stopId}/activities/`, activityData)
        showSuccess('Activity scheduled!')
        await loadTrip()
      } catch (err) {
        const msg = err.response?.data?.detail || 'This activity could not be saved. Verify dates and try again.'
        setError(msg)
      } finally {
        setSaving(false)
      }
      return
    }

    handleDraftActivity(stopId, field, value)
  }

  const saveActivity = async (activity, stop) => {
    const activityData = {
      activity: activity.activity_name || activity.activity,
      date: activity.date,
      start_time: activity.start_time || null,
      end_time: activity.end_time || null,
      notes: activity.notes || '',
    }

    const validationError = validateActivity(activityData, stop)
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setSaving(true)
      setError('')
      await api.patch(`/trip-activities/${activity.id}/`, activityData)
      showSuccess('Activity updated.')
      await loadTrip()
    } catch (err) {
      const msg = err.response?.data?.detail || 'Activity update failed. Restoring latest server state.'
      setError(msg)
      await loadTrip()
    } finally {
      setSaving(false)
    }
  }

  const deleteActivity = async (_stopId, activityId) => {
    const previousStops = [...stops]
    setStops((current) =>
      current.map((s) => ({
        ...s,
        activities: (s.activities || []).filter((a) => a.id !== activityId),
      })),
    )

    try {
      setSaving(true)
      setError('')
      await api.delete(`/trip-activities/${activityId}/`)
      showSuccess('Activity deleted.')
      await loadTrip()
    } catch (err) {
      const msg = err.response?.data?.detail || 'The activity could not be removed.'
      setError(msg)
      setStops(previousStops)
      await loadTrip()
    } finally {
      setSaving(false)
    }
  }

  const handleStopDragEnd = async (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeStopId = Number(String(active.id).replace('stop-', ''))
    const overStopId = Number(String(over.id).replace('stop-', ''))

    const oldIndex = stops.findIndex((stop) => stop.id === activeStopId)
    const newIndex = stops.findIndex((stop) => stop.id === overStopId)

    if (oldIndex < 0 || newIndex < 0) return

    const previousStops = [...stops]
    const reordered = arrayMove(stops, oldIndex, newIndex)
    setStops(reordered)

    try {
      await api.patch(`/trips/${id}/reorder-stops/`, { order: reordered.map((stop) => stop.id) })
      setError('')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Could not reorder stops. Restoring last saved order.'
      setError(msg)
      setStops(previousStops)
      await loadTrip()
    }
  }

  const handleActivityDragEnd = async (stopId, event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeActId = Number(String(active.id).replace('activity-', ''))
    const overActId = Number(String(over.id).replace('activity-', ''))

    const stopIndex = stops.findIndex((stop) => stop.id === stopId)
    if (stopIndex < 0) return

    const currentStop = stops[stopIndex]
    const activitiesList = currentStop.activities || []
    const oldIndex = activitiesList.findIndex((activity) => activity.id === activeActId)
    const newIndex = activitiesList.findIndex((activity) => activity.id === overActId)

    if (oldIndex < 0 || newIndex < 0) return

    const previousStops = [...stops]
    const reordered = arrayMove(activitiesList, oldIndex, newIndex)

    setStops((current) =>
      current.map((item) =>
        item.id === stopId
          ? {
              ...item,
              activities: reordered,
            }
          : item,
      ),
    )

    try {
      await api.patch(`/stops/${stopId}/reorder-activities/`, { order: reordered.map((activity) => activity.id) })
      setError('')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Activity reordering could not be saved. Restoring previous order.'
      setError(msg)
      setStops(previousStops)
      await loadTrip()
    }
  }

  const totalActivities = useMemo(
    () => stops.reduce((sum, stop) => sum + (stop.activities?.length || 0), 0),
    [stops],
  )

  return (
    <div className="trip-detail-page">
      <Card title={trip?.name || 'Trip Itinerary Builder'}>
        {isLoading ? (
          <div className="loading-state">
            <p>Loading your itinerary...</p>
          </div>
        ) : (
          <>
            {trip?.cover_image ? (
              <div
                style={{
                  width: '100%',
                  height: '180px',
                  borderRadius: 'var(--radius-md)',
                  backgroundImage: `url(${trip.cover_image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  marginBottom: '1.5rem',
                  position: 'relative',
                  border: '1px solid var(--color-border)',
                }}
              >
                <button
                  type="button"
                  className="button button--secondary button--sm"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploadingCover}
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    right: '12px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(6px)',
                  }}
                >
                  {uploadingCover ? <Loader2 size={13} className="spin" /> : <Camera size={13} />}
                  <span>Change Cover</span>
                </button>
              </div>
            ) : null}

            <input
              ref={coverInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={handleCoverFileChange}
            />

            <div className="trip-summary">
              <div className="summary-stat">
                <span className="eyebrow">Trip Dates</span>
                <p>
                  <CalendarDays size={16} /> {trip?.start_date} &rarr; {trip?.end_date}
                </p>
              </div>
              <div className="summary-stat">
                <span className="eyebrow">Destinations</span>
                <p>
                  <MapPin size={16} /> {stops.length} {stops.length === 1 ? 'City Stop' : 'City Stops'}
                </p>
              </div>
              <div className="summary-stat">
                <span className="eyebrow">Activities</span>
                <p>
                  <Clock size={16} /> {totalActivities} Scheduled
                </p>
              </div>
              <div className="summary-links">
                {!trip?.cover_image ? (
                  <button
                    type="button"
                    className="button button--secondary button--sm"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={uploadingCover}
                    title="Upload cover image"
                  >
                    {uploadingCover ? <Loader2 size={14} className="spin" /> : <Camera size={14} />}
                    <span>Cover</span>
                  </button>
                ) : null}
                <Link to={`/trips/${id}/budget`} className="button button--secondary button--sm">
                  <DollarSign size={14} /> Budget
                </Link>
                <Link to={`/trips/${id}/calendar`} className="button button--secondary button--sm">
                  <CalendarDays size={14} /> Calendar
                </Link>
                <button
                  type="button"
                  className="button button--secondary button--sm"
                  onClick={() => setIsShareModalOpen(true)}
                >
                  <Share2 size={14} /> {trip?.is_public ? 'Public Link' : 'Share'}
                </button>
                <button
                  type="button"
                  className="button button--secondary button--sm"
                  onClick={handleDuplicateTrip}
                  disabled={isCloning}
                  title="Duplicate this entire trip"
                >
                  <Copy size={14} /> Duplicate
                </button>
              </div>
            </div>

            {error ? (
              <div className="alert-banner error" role="alert">
                <AlertCircle size={16} />
                <span>{error}</span>
                <button type="button" className="alert-dismiss" onClick={() => setError('')} aria-label="Dismiss error">
                  &times;
                </button>
              </div>
            ) : null}

            {successMessage ? (
              <div className="alert-banner success" role="status">
                <CheckCircle2 size={16} />
                <span>{successMessage}</span>
              </div>
            ) : null}

            <div className="builder-panel">
              <div className="builder-panel__header">
                <h3>
                  <Plus size={18} /> Add New Stop
                </h3>
                <p className="subtext">
                  Choose a city and dates within your trip ({trip?.start_date} &rarr; {trip?.end_date})
                </p>
              </div>
              <div className="builder-form">
                <label>
                  <span>City Destination</span>
                  <input
                    className="input-field"
                    value={draftStop.city}
                    onChange={(event) => handleStopDraft('city', event.target.value)}
                    placeholder="e.g. Rome, Tokyo, Barcelona"
                  />
                </label>
                <label>
                  <span>Stop Arrival (Start)</span>
                  <input
                    type="date"
                    className="input-field"
                    min={trip?.start_date || undefined}
                    max={trip?.end_date || undefined}
                    value={draftStop.start_date}
                    onChange={(event) => handleStopDraft('start_date', event.target.value)}
                  />
                </label>
                <label>
                  <span>Stop Departure (End)</span>
                  <input
                    type="date"
                    className="input-field"
                    min={draftStop.start_date || trip?.start_date || undefined}
                    max={trip?.end_date || undefined}
                    value={draftStop.end_date}
                    onChange={(event) => handleStopDraft('end_date', event.target.value)}
                  />
                </label>
                <label className="span-2">
                  <span>Notes & Highlights</span>
                  <textarea
                    className="input-field"
                    value={draftStop.notes}
                    rows={2}
                    placeholder="Optional notes, lodging, or highlights..."
                    onChange={(event) => handleStopDraft('notes', event.target.value)}
                  />
                </label>
              </div>
              <div className="builder-actions">
                <Button type="button" onClick={handleCreateStop} disabled={saving}>
                  <Plus size={14} /> Add Stop to Itinerary
                </Button>
              </div>
            </div>

            <div className="itinerary-section">
              <div className="section-title-row">
                <h3>Trip Route & Stops</h3>
                <span className="badge">{stops.length} Stops</span>
              </div>

              {stops.length > 0 ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleStopDragEnd}>
                  <SortableContext items={stopSortableIds} strategy={rectSortingStrategy}>
                    <div className="itinerary-list">
                      {stops.map((stop, index) => (
                        <SortableStop
                          key={stop.id}
                          stop={stop}
                          index={index}
                          trip={trip}
                          onChange={handleStopChange}
                          onSave={saveStop}
                          onDelete={handleDeleteStop}
                          onAddActivity={handleAddActivity}
                          onActivityChange={handleActivityField}
                          onActivitySave={saveActivity}
                          onActivityDelete={deleteActivity}
                          onActivityReorder={handleActivityDragEnd}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="empty-itinerary-state">
                  <MapPin size={40} className="empty-icon" />
                  <h4>No stops added yet</h4>
                  <p>Build your multi-city route by adding your first destination stop above.</p>
                </div>
              )}
            </div>
          </>
        )}
      </Card>
      {/* Share & Publish Modal */}
      {isShareModalOpen ? (
        <div className="modal-backdrop" onClick={() => setIsShareModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Share Itinerary</h3>
                <p className="subtext">Make your itinerary public so other travelers can view and copy it.</p>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setIsShareModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="share-modal-body">
              <div className="share-toggle-row">
                <div>
                  <strong>Public Visibility</strong>
                  <p className="helper-text">
                    {trip?.is_public
                      ? 'This trip is currently public. Anyone with the link can view it.'
                      : 'This trip is private. Only you can view and edit it.'}
                  </p>
                </div>
                <Button
                  type="button"
                  variant={trip?.is_public ? 'primary' : 'secondary'}
                  onClick={handleTogglePublish}
                  disabled={isPublishing}
                >
                  {trip?.is_public ? 'Make Private' : 'Publish Trip'}
                </Button>
              </div>

              {trip?.is_public && trip?.public_slug ? (
                <div className="share-link-box">
                  <span className="eyebrow">Public Shareable Link</span>
                  <div className="share-input-group">
                    <input
                      className="input-field"
                      readOnly
                      value={`${window.location.origin}/public/trip/${trip.public_slug}`}
                    />
                    <Button type="button" onClick={handleCopyShareLink}>
                      {copiedLink ? <Check size={15} /> : <Copy size={15} />}
                      {copiedLink ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                  <div className="share-preview-link">
                    <Link
                      to={`/public/trip/${trip.public_slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="preview-link"
                    >
                      <ExternalLink size={13} /> View Live Public Page
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default TripDetailPage


