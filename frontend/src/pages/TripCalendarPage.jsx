import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  AlertCircle,
  ArrowLeft,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  DollarSign,
  Edit2,
  GripVertical,
  Landmark,
  List as ListIcon,
  MapPin,
  Plus,
  Sparkles,
  Trash2,
  Utensils,
  Car,
  Bed,
  Mountain,
  Palmtree,
  PartyPopper,
  X,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import api from '../api/client'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'

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

// Draggable timeline activity item
function TimelineActivityItem({ activity, stop, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `activity-${activity.id}`,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const category = (activity.category || 'other').toLowerCase()
  const Icon = CATEGORY_ICONS[category] || Sparkles

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`timeline-item ${isDragging ? 'dragging' : ''}`}
    >
      <div className="timeline-item__time">
        <Clock size={13} />
        <span>
          {activity.start_time
            ? activity.end_time
              ? `${activity.start_time} - ${activity.end_time}`
              : activity.start_time
            : 'Flexible Time'}
        </span>
      </div>

      <div className="timeline-item__card">
        <div
          className="timeline-item__drag"
          {...attributes}
          {...listeners}
          title="Drag to reorder"
        >
          <GripVertical size={14} />
        </div>

        <div className="timeline-item__content">
          <div className="timeline-item__header">
            <h4 className="timeline-item__title">
              {activity.activity_name || activity.activity || 'Activity'}
            </h4>
            <span className={`badge badge--cat badge--${category}`}>
              <Icon size={12} />
              <span>{CATEGORY_LABELS[category] || category}</span>
            </span>
          </div>

          {activity.notes ? (
            <p className="timeline-item__notes">{activity.notes}</p>
          ) : null}

          <div className="timeline-item__meta">
            {activity.estimated_cost && Number(activity.estimated_cost) > 0 ? (
              <span className="timeline-cost">
                <DollarSign size={13} />
                ${Number(activity.estimated_cost).toFixed(2)}
              </span>
            ) : null}
            {stop?.city_name ? (
              <span className="timeline-city">
                <MapPin size={13} />
                {stop.city_name}
              </span>
            ) : null}
          </div>
        </div>

        <div className="timeline-item__actions">
          <button
            type="button"
            className="icon-button"
            title="Edit activity details"
            onClick={() => onEdit(activity, stop)}
          >
            <Edit2 size={13} />
          </button>
          <button
            type="button"
            className="icon-button danger"
            title="Delete activity"
            onClick={() => onDelete(activity.id)}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

export function TripCalendarPage() {
  const { id } = useParams()
  const [trip, setTrip] = useState(null)
  const [stops, setStops] = useState([])
  const [viewMode, setViewMode] = useState('timeline') // 'timeline' | 'calendar' | 'list'
  const [selectedDate, setSelectedDate] = useState(null)
  const [collapsedDays, setCollapsedDays] = useState({})

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Quick edit & quick add modals
  const [editingActivity, setEditingActivity] = useState(null)
  const [addingToDay, setAddingToDay] = useState(null)
  const [isSubmittingModal, setIsSubmittingModal] = useState(false)

  // Edit draft form
  const [editDraft, setEditDraft] = useState({
    name: '',
    date: '',
    start_time: '',
    end_time: '',
    estimated_cost: '',
    notes: '',
  })

  // Add draft form
  const [addDraft, setAddDraft] = useState({
    name: '',
    date: '',
    start_time: '',
    end_time: '',
    estimated_cost: '',
    notes: '',
    trip_stop: '',
  })

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const loadTripData = useCallback(async () => {
    try {
      setIsLoading(true)
      const [tripRes, stopsRes] = await Promise.all([
        api.get(`/trips/${id}/`),
        api.get(`/trips/${id}/stops/`),
      ])
      setTrip(tripRes.data)
      const fetchedStops = stopsRes.data || []
      setStops(fetchedStops)

      if (tripRes.data?.start_date && !selectedDate) {
        setSelectedDate(tripRes.data.start_date)
      }
      setError('')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load trip schedule.')
    } finally {
      setIsLoading(false)
    }
  }, [id, selectedDate])

  useEffect(() => {
    let isMounted = true
    const init = async () => {
      if (isMounted) await loadTripData()
    }
    init()
    return () => {
      isMounted = false
    }
  }, [loadTripData])

  const showNotification = (msg) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 3500)
  }

  // Generate day-by-day chronological calendar structures
  const daysList = useMemo(() => {
    if (!trip?.start_date || !trip?.end_date) return []

    const start = parseISODate(trip.start_date)
    const end = parseISODate(trip.end_date)
    if (!start || !end || start > end) return []

    const days = []
    let curr = new Date(start)
    let dayNum = 1

    // Flatten all activities with stop reference
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

      // Find matching stop for this date
      const activeStop = stops.find((s) => {
        if (!s.start_date || !s.end_date) return false
        return dateStr >= s.start_date && dateStr <= s.end_date
      }) || stops[0] || null

      // Find activities scheduled for this date
      const dayActivities = allActivities.filter((act) => act.date === dateStr)
      dayActivities.sort((a, b) => {
        if (a.start_time && b.start_time) return a.start_time.localeCompare(b.start_time)
        if (a.start_time) return -1
        if (b.start_time) return 1
        return (a.position || 0) - (b.position || 0)
      })

      days.push({
        dayNumber: dayNum,
        date: dateStr,
        stop: activeStop,
        cityName: activeStop?.city_name || (typeof activeStop?.city === 'string' ? activeStop.city : 'General'),
        activities: dayActivities,
      })

      curr.setDate(curr.getDate() + 1)
      dayNum += 1
    }

    return days
  }, [trip, stops])

  // Floating / unscheduled activities
  const unscheduledActivities = useMemo(() => {
    const unscheduled = []
    stops.forEach((stop) => {
      if (stop.activities) {
        stop.activities.forEach((act) => {
          if (!act.date) {
            unscheduled.push({ ...act, stopRef: stop })
          }
        })
      }
    })
    return unscheduled
  }, [stops])

  const toggleCollapseDay = (dayNum) => {
    setCollapsedDays((prev) => ({ ...prev, [dayNum]: !prev[dayNum] }))
  }

  // Quick edit trigger
  const handleOpenEdit = (activity, stop) => {
    setEditingActivity({ ...activity, stop })
    setEditDraft({
      name: activity.activity_name || activity.activity || '',
      date: activity.date || stop?.start_date || '',
      start_time: activity.start_time || '',
      end_time: activity.end_time || '',
      estimated_cost: activity.estimated_cost || '',
      notes: activity.notes || '',
    })
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!editingActivity) return

    try {
      setIsSubmittingModal(true)
      const payload = {
        activity: editDraft.name.trim(),
        date: editDraft.date,
        start_time: editDraft.start_time || null,
        end_time: editDraft.end_time || null,
        estimated_cost: editDraft.estimated_cost ? parseFloat(editDraft.estimated_cost) : 0,
        notes: editDraft.notes || '',
      }

      await api.patch(`/trips/trip-activities/${editingActivity.id}/`, payload)
      showNotification('Activity updated successfully.')
      setEditingActivity(null)
      await loadTripData()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update activity.')
    } finally {
      setIsSubmittingModal(false)
    }
  }

  // Quick add trigger
  const handleOpenQuickAdd = (day) => {
    setAddingToDay(day)
    setAddDraft({
      name: '',
      date: day.date,
      start_time: '',
      end_time: '',
      estimated_cost: '',
      notes: '',
      trip_stop: day.stop?.id || (stops[0]?.id || ''),
    })
  }

  const handleSaveQuickAdd = async (e) => {
    e.preventDefault()
    if (!addDraft.name.trim()) {
      setError('Please provide an activity name.')
      return
    }
    const stopId = addDraft.trip_stop || addingToDay?.stop?.id || stops[0]?.id
    if (!stopId) {
      setError('Please create a city stop in the itinerary builder first.')
      return
    }

    try {
      setIsSubmittingModal(true)
      const payload = {
        activity: addDraft.name.trim(),
        trip_stop: parseInt(stopId, 10),
        date: addDraft.date,
        start_time: addDraft.start_time || null,
        end_time: addDraft.end_time || null,
        estimated_cost: addDraft.estimated_cost ? parseFloat(addDraft.estimated_cost) : 0,
        notes: addDraft.notes || '',
      }

      await api.post(`/trips/stops/${stopId}/activities/`, payload)
      showNotification(`Added "${addDraft.name}" to Day ${addingToDay?.dayNumber}!`)
      setAddingToDay(null)
      await loadTripData()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add activity.')
    } finally {
      setIsSubmittingModal(false)
    }
  }

  const handleDeleteActivity = async (activityId) => {
    if (!window.confirm('Delete this scheduled activity?')) return
    try {
      await api.delete(`/trips/trip-activities/${activityId}/`)
      showNotification('Activity deleted.')
      await loadTripData()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete activity.')
    }
  }

  // Handle Drag & Drop reordering within a day
  const handleDragEnd = async (event, day) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeId = parseInt(String(active.id).replace('activity-', ''), 10)
    const overId = parseInt(String(over.id).replace('activity-', ''), 10)

    const oldIndex = day.activities.findIndex((a) => a.id === activeId)
    const newIndex = day.activities.findIndex((a) => a.id === overId)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(day.activities, oldIndex, newIndex)
    const orderedIds = reordered.map((a) => a.id)

    // Optimistic UI state update
    const previousStops = [...stops]
    setStops((currentStops) =>
      currentStops.map((stop) => {
        if (stop.id === day.stop?.id) {
          const acts = [...(stop.activities || [])]
          acts.sort((a, b) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id))
          return { ...stop, activities: acts }
        }
        return stop
      }),
    )

    try {
      if (day.stop?.id) {
        await api.patch(`/trips/stops/${day.stop.id}/reorder-activities/`, { order: orderedIds })
      }
    } catch {
      setStops(previousStops)
      setError('Failed to persist activity order. Restored prior state.')
    }
  }

  const selectedDayData = daysList.find((d) => d.date === selectedDate) || daysList[0] || null

  return (
    <div className="trip-calendar-page">
      {/* Top Header */}
      <div className="page-header-row">
        <div>
          <Link to={`/trips/${id}`} className="back-link">
            <ArrowLeft size={16} /> Back to Itinerary Builder
          </Link>
          <h2>{trip?.name || 'Trip'} Schedule & Timeline</h2>
          <p className="subtext">
            Visual day-by-day itinerary review, chronological timeline, and quick activity scheduling.
          </p>
        </div>

        <div className="view-mode-toggles" role="tablist">
          <button
            type="button"
            className={`view-toggle ${viewMode === 'timeline' ? 'active' : ''}`}
            onClick={() => setViewMode('timeline')}
            role="tab"
          >
            <Clock size={15} /> Timeline
          </button>
          <button
            type="button"
            className={`view-toggle ${viewMode === 'calendar' ? 'active' : ''}`}
            onClick={() => setViewMode('calendar')}
            role="tab"
          >
            <CalendarIcon size={15} /> Calendar
          </button>
          <button
            type="button"
            className={`view-toggle ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            role="tab"
          >
            <ListIcon size={15} /> List
          </button>
        </div>
      </div>

      {error ? (
        <div className="alert-banner error" role="alert">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      ) : null}

      {successMsg ? (
        <div className="alert-banner success" role="alert">
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      ) : null}

      {isLoading && !trip ? (
        <p>Loading itinerary schedule...</p>
      ) : daysList.length === 0 ? (
        <Card className="empty-calendar-state">
          <CalendarIcon size={48} className="empty-icon" />
          <h3>No trip dates configured</h3>
          <p>Please configure start and end dates in the trip editor to generate your visual timeline.</p>
          <Link to={`/trips/${id}`} className="button">
            Edit Trip Dates
          </Link>
        </Card>
      ) : (
        <>
          {/* =================================================================
             1. TIMELINE VIEW
             ================================================================= */}
          {viewMode === 'timeline' ? (
            <div className="timeline-container">
              {daysList.map((day) => {
                const isCollapsed = Boolean(collapsedDays[day.dayNumber])
                const sortableIds = day.activities.map((a) => `activity-${a.id}`)

                return (
                  <div key={day.dayNumber} className="timeline-day-block">
                    <div
                      className="timeline-day-header"
                      onClick={() => toggleCollapseDay(day.dayNumber)}
                    >
                      <div className="day-title-wrap">
                        {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                        <span className="day-badge">DAY {day.dayNumber}</span>
                        <h3>{formatDisplayDate(day.date)}</h3>
                        <span className="day-city-tag">
                          <MapPin size={13} /> {day.cityName}
                        </span>
                      </div>

                      <div className="day-actions" onClick={(e) => e.stopPropagation()}>
                        <span className="activities-count">
                          {day.activities.length} {day.activities.length === 1 ? 'activity' : 'activities'}
                        </span>
                        <Button
                          type="button"
                          variant="secondary"
                          className="button--sm"
                          onClick={() => handleOpenQuickAdd(day)}
                        >
                          <Plus size={14} /> Add
                        </Button>
                      </div>
                    </div>

                    {!isCollapsed ? (
                      <div className="timeline-day-body">
                        {day.activities.length > 0 ? (
                          <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={(e) => handleDragEnd(e, day)}
                          >
                            <SortableContext
                              items={sortableIds}
                              strategy={verticalListSortingStrategy}
                            >
                              <div className="timeline-items-list">
                                {day.activities.map((act) => (
                                  <TimelineActivityItem
                                    key={act.id}
                                    activity={act}
                                    stop={day.stop}
                                    onEdit={handleOpenEdit}
                                    onDelete={handleDeleteActivity}
                                  />
                                ))}
                              </div>
                            </SortableContext>
                          </DndContext>
                        ) : (
                          <div className="timeline-empty-day">
                            <p>No activities scheduled for {day.cityName} on this day.</p>
                            <button
                              type="button"
                              className="button button--secondary button--sm"
                              onClick={() => handleOpenQuickAdd(day)}
                            >
                              <Plus size={13} /> Schedule Activity
                            </button>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          ) : null}

          {/* =================================================================
             2. CALENDAR VIEW
             ================================================================= */}
          {viewMode === 'calendar' ? (
            <div className="calendar-view-wrap">
              <div className="calendar-grid">
                {daysList.map((day) => {
                  const isSelected = day.date === selectedDate
                  return (
                    <div
                      key={day.dayNumber}
                      className={`calendar-cell ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedDate(day.date)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="calendar-cell__top">
                        <span className="cal-day-num">Day {day.dayNumber}</span>
                        <span className="cal-date">{day.date.slice(5)}</span>
                      </div>

                      <div className="calendar-cell__city">
                        <MapPin size={12} />
                        <span>{day.cityName}</span>
                      </div>

                      <div className="calendar-cell__count">
                        <span>
                          {day.activities.length}{' '}
                          {day.activities.length === 1 ? 'Activity' : 'Activities'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Selected Day Inspector */}
              {selectedDayData ? (
                <Card
                  title={`Day ${selectedDayData.dayNumber} Overview — ${formatDisplayDate(selectedDayData.date)} (${selectedDayData.cityName})`}
                  className="calendar-inspector-card"
                >
                  <div className="inspector-actions">
                    <Button
                      type="button"
                      variant="secondary"
                      className="button--sm"
                      onClick={() => handleOpenQuickAdd(selectedDayData)}
                    >
                      <Plus size={14} /> Add Activity to this Day
                    </Button>
                  </div>

                  {selectedDayData.activities.length > 0 ? (
                    <div className="inspector-list">
                      {selectedDayData.activities.map((act) => {
                        const cat = (act.category || 'other').toLowerCase()
                        const Icon = CATEGORY_ICONS[cat] || Sparkles
                        return (
                          <div key={act.id} className="inspector-item">
                            <div className="inspector-time">
                              <Clock size={13} />
                              <span>
                                {act.start_time
                                  ? act.end_time
                                    ? `${act.start_time} - ${act.end_time}`
                                    : act.start_time
                                  : 'Flexible'}
                              </span>
                            </div>
                            <div className="inspector-info">
                              <strong>{act.activity_name || act.activity}</strong>
                              <span className={`badge badge--cat badge--${cat}`}>
                                <Icon size={12} />
                                <span>{CATEGORY_LABELS[cat] || cat}</span>
                              </span>
                            </div>
                            <div className="inspector-actions-right">
                              <button
                                type="button"
                                className="icon-button"
                                onClick={() => handleOpenEdit(act, selectedDayData.stop)}
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                type="button"
                                className="icon-button danger"
                                onClick={() => handleDeleteActivity(act.id)}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="empty-subtext">No activities scheduled for this day.</p>
                  )}
                </Card>
              ) : null}
            </div>
          ) : null}

          {/* =================================================================
             3. LIST VIEW
             ================================================================= */}
          {viewMode === 'list' ? (
            <div className="agenda-list-wrap">
              {daysList.map((day) => (
                <Card key={day.dayNumber} className="agenda-day-card">
                  <div className="agenda-header">
                    <div className="agenda-title">
                      <span className="day-badge">DAY {day.dayNumber}</span>
                      <h4>{formatDisplayDate(day.date)}</h4>
                      <span className="day-city-tag">
                        <MapPin size={13} /> {day.cityName}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      className="button--sm"
                      onClick={() => handleOpenQuickAdd(day)}
                    >
                      <Plus size={13} /> Add Activity
                    </Button>
                  </div>

                  {day.activities.length > 0 ? (
                    <table className="agenda-table">
                      <thead>
                        <tr>
                          <th>Time</th>
                          <th>Activity</th>
                          <th>Category</th>
                          <th>Cost</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {day.activities.map((act) => {
                          const cat = (act.category || 'other').toLowerCase()
                          const Icon = CATEGORY_ICONS[cat] || Sparkles
                          return (
                            <tr key={act.id}>
                              <td className="agenda-time">
                                {act.start_time
                                  ? act.end_time
                                    ? `${act.start_time} - ${act.end_time}`
                                    : act.start_time
                                  : '—'}
                              </td>
                              <td>
                                <strong>{act.activity_name || act.activity}</strong>
                                {act.notes ? <p className="agenda-notes">{act.notes}</p> : null}
                              </td>
                              <td>
                                <span className={`badge badge--cat badge--${cat}`}>
                                  <Icon size={12} />
                                  <span>{CATEGORY_LABELS[cat] || cat}</span>
                                </span>
                              </td>
                              <td>
                                {act.estimated_cost && Number(act.estimated_cost) > 0
                                  ? `$${Number(act.estimated_cost).toFixed(2)}`
                                  : '—'}
                              </td>
                              <td>
                                <div className="table-actions">
                                  <button
                                    type="button"
                                    className="icon-button"
                                    onClick={() => handleOpenEdit(act, day.stop)}
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    className="icon-button danger"
                                    onClick={() => handleDeleteActivity(act.id)}
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <p className="empty-subtext">No activities scheduled for this day.</p>
                  )}
                </Card>
              ))}
            </div>
          ) : null}

          {/* Unscheduled Activities Drawer / Card */}
          {unscheduledActivities.length > 0 ? (
            <Card title={`Unassigned Experiences (${unscheduledActivities.length})`} className="unscheduled-card">
              <p className="subtext">These activities do not have a scheduled date yet. Click edit to assign them to a day.</p>
              <div className="unscheduled-grid">
                {unscheduledActivities.map((act) => (
                  <div key={act.id} className="unscheduled-item">
                    <div>
                      <strong>{act.activity_name || act.activity}</strong>
                      <span className="unscheduled-city">{act.stopRef?.city_name || 'General'}</span>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      className="button--sm"
                      onClick={() => handleOpenEdit(act, act.stopRef)}
                    >
                      <CalendarIcon size={13} /> Assign Date
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}
        </>
      )}

      {/* =================================================================
         QUICK EDIT MODAL
         ================================================================= */}
      {editingActivity ? (
        <div className="modal-backdrop" onClick={() => setEditingActivity(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Activity Schedule</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setEditingActivity(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="modal-form">
              <label>
                <span>Activity Name</span>
                <input
                  className="input-field"
                  value={editDraft.name}
                  onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
                  required
                />
              </label>

              <label>
                <span>Date</span>
                <input
                  type="date"
                  className="input-field"
                  min={trip?.start_date || undefined}
                  max={trip?.end_date || undefined}
                  value={editDraft.date}
                  onChange={(e) => setEditDraft({ ...editDraft, date: e.target.value })}
                  required
                />
              </label>

              <div className="stop-form-grid">
                <label>
                  <span>Start Time</span>
                  <input
                    type="time"
                    className="input-field"
                    value={editDraft.start_time}
                    onChange={(e) => setEditDraft({ ...editDraft, start_time: e.target.value })}
                  />
                </label>

                <label>
                  <span>End Time</span>
                  <input
                    type="time"
                    className="input-field"
                    value={editDraft.end_time}
                    onChange={(e) => setEditDraft({ ...editDraft, end_time: e.target.value })}
                  />
                </label>
              </div>

              <label>
                <span>Estimated Cost ($)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input-field"
                  value={editDraft.estimated_cost}
                  onChange={(e) => setEditDraft({ ...editDraft, estimated_cost: e.target.value })}
                />
              </label>

              <label>
                <span>Notes / Tips</span>
                <textarea
                  className="input-field"
                  rows={3}
                  value={editDraft.notes}
                  onChange={(e) => setEditDraft({ ...editDraft, notes: e.target.value })}
                />
              </label>

              <div className="modal-actions">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setEditingActivity(null)}
                  disabled={isSubmittingModal}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmittingModal}>
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* =================================================================
         QUICK ADD TO DAY MODAL
         ================================================================= */}
      {addingToDay ? (
        <div className="modal-backdrop" onClick={() => setAddingToDay(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Add Activity to Day {addingToDay.dayNumber}</h3>
                <span className="helper-text">{formatDisplayDate(addingToDay.date)} — {addingToDay.cityName}</span>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setAddingToDay(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveQuickAdd} className="modal-form">
              <label>
                <span>Activity Name</span>
                <input
                  className="input-field"
                  placeholder="e.g. Louvre Museum, Walking Tour, Sunset Cruise"
                  value={addDraft.name}
                  onChange={(e) => setAddDraft({ ...addDraft, name: e.target.value })}
                  required
                />
              </label>

              <div className="stop-form-grid">
                <label>
                  <span>Start Time (optional)</span>
                  <input
                    type="time"
                    className="input-field"
                    value={addDraft.start_time}
                    onChange={(e) => setAddDraft({ ...addDraft, start_time: e.target.value })}
                  />
                </label>

                <label>
                  <span>End Time (optional)</span>
                  <input
                    type="time"
                    className="input-field"
                    value={addDraft.end_time}
                    onChange={(e) => setAddDraft({ ...addDraft, end_time: e.target.value })}
                  />
                </label>
              </div>

              <label>
                <span>Estimated Cost ($)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input-field"
                  placeholder="0.00"
                  value={addDraft.estimated_cost}
                  onChange={(e) => setAddDraft({ ...addDraft, estimated_cost: e.target.value })}
                />
              </label>

              <label>
                <span>Notes (optional)</span>
                <input
                  className="input-field"
                  placeholder="Ticket numbers, meeting points..."
                  value={addDraft.notes}
                  onChange={(e) => setAddDraft({ ...addDraft, notes: e.target.value })}
                />
              </label>

              <div className="modal-actions">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setAddingToDay(null)}
                  disabled={isSubmittingModal}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmittingModal}>
                  <Plus size={15} /> Add to Schedule
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default TripCalendarPage
