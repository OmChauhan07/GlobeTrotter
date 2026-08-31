import { useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  Compass,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import api from '../api/client'

const CURATED_COVERS = [
  {
    name: 'Paris',
    url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1000&auto=format&fit=crop&q=80',
  },
  {
    name: 'Tokyo',
    url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1000&auto=format&fit=crop&q=80',
  },
  {
    name: 'Amalfi',
    url: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1000&auto=format&fit=crop&q=80',
  },
  {
    name: 'Alps',
    url: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=1000&auto=format&fit=crop&q=80',
  },
  {
    name: 'Bali',
    url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1000&auto=format&fit=crop&q=80',
  },
  {
    name: 'Santorini',
    url: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1000&auto=format&fit=crop&q=80',
  },
]

export default function TripEditorPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    estimated_budget: 1500,
    cover_image: CURATED_COVERS[0].url,
    is_public: false,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }))
  }

  const handleNext = () => {
    setError('')
    if (step === 1) {
      if (!formData.name.trim()) {
        setError('Please name your journey.')
        return
      }
      setStep(2)
    } else if (step === 2) {
      if (!formData.start_date || !formData.end_date) {
        setError('Both start and end dates are required.')
        return
      }
      if (formData.start_date > formData.end_date) {
        setError('Start date cannot be after end date.')
        return
      }
      setStep(3)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      setError('')
      const response = await api.post('/trips/', formData)
      navigate(`/trips/${response.data.id}`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create trip. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', padding: '1rem 0 4rem' }}>
      {/* Guided Step Indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '2.5rem',
          marginBottom: '3rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: step >= 1 ? 'var(--color-ink)' : 'var(--color-border)',
              color: step >= 1 ? 'var(--color-cream)' : 'var(--color-ink-muted)',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 700,
              fontSize: '0.85rem',
            }}
          >
            {step > 1 ? <Check size={16} /> : '01'}
          </div>
          <span style={{ fontWeight: step === 1 ? 700 : 500, fontSize: '0.9rem' }}>Journey</span>
        </div>

        <div style={{ width: '40px', height: '1px', background: 'var(--color-border)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: step >= 2 ? 'var(--color-ink)' : 'var(--color-border)',
              color: step >= 2 ? 'var(--color-cream)' : 'var(--color-ink-muted)',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 700,
              fontSize: '0.85rem',
            }}
          >
            {step > 2 ? <Check size={16} /> : '02'}
          </div>
          <span style={{ fontWeight: step === 2 ? 700 : 500, fontSize: '0.9rem' }}>Dates</span>
        </div>

        <div style={{ width: '40px', height: '1px', background: 'var(--color-border)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: step >= 3 ? 'var(--color-ink)' : 'var(--color-border)',
              color: step >= 3 ? 'var(--color-cream)' : 'var(--color-ink-muted)',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 700,
              fontSize: '0.85rem',
            }}
          >
            03
          </div>
          <span style={{ fontWeight: step === 3 ? 700 : 500, fontSize: '0.9rem' }}>Atmosphere</span>
        </div>
      </div>

      <div className="card" style={{ padding: '3rem' }}>
        {error ? (
          <div className="alert-banner error" role="alert" style={{ marginBottom: '2rem' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        ) : null}

        {/* STEP 1: Name & Overview */}
        {step === 1 && (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <div className="dashboard-greeting-eyebrow">
                <Sparkles size={14} style={{ display: 'inline', marginRight: '6px' }} />
                Step 1 of 3
              </div>
              <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                Where do you want to wander?
              </h2>
              <p>Give your adventure a name that captures the mood.</p>
            </div>

            <div className="stack-form">
              <div className="form-group">
                <label className="form-label" htmlFor="trip-name">
                  Trip Name
                </label>
                <input
                  id="trip-name"
                  type="text"
                  placeholder="e.g. European Summer: Paris, Rome & Barcelona"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="trip-desc">
                  Travel Notes / Overview (optional)
                </label>
                <textarea
                  id="trip-desc"
                  rows={3}
                  placeholder="A slow journey through the best museums, coastal cafes, and hidden alleyways..."
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="button button--accent button--lg"
                  onClick={handleNext}
                >
                  <span>Continue to Dates</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Dates & Estimated Budget */}
        {step === 2 && (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <div className="dashboard-greeting-eyebrow">
                <Calendar size={14} style={{ display: 'inline', marginRight: '6px' }} />
                Step 2 of 3
              </div>
              <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>When are you going?</h2>
              <p>Set your travel window and baseline budget target.</p>
            </div>

            <div className="stack-form">
              <div className="stop-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="start-date">
                    Departure Date
                  </label>
                  <input
                    id="start-date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleChange('start_date', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="end-date">
                    Return Date
                  </label>
                  <input
                    id="end-date"
                    type="date"
                    min={formData.start_date || undefined}
                    value={formData.end_date}
                    onChange={(e) => handleChange('end_date', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="budget">
                  Estimated Total Budget ($ USD)
                </label>
                <input
                  id="budget"
                  type="number"
                  min="0"
                  step="50"
                  placeholder="1500"
                  value={formData.estimated_budget}
                  onChange={(e) => handleChange('estimated_budget', Number(e.target.value))}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '1.5rem',
                }}
              >
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => setStep(1)}
                >
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  className="button button--accent button--lg"
                  onClick={handleNext}
                >
                  <span>Continue to Atmosphere</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Curated Cover & Confirm */}
        {step === 3 && (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <div className="dashboard-greeting-eyebrow">
                <ImageIcon size={14} style={{ display: 'inline', marginRight: '6px' }} />
                Step 3 of 3
              </div>
              <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Set the atmosphere</h2>
              <p>Choose a cover image that reflects your journey.</p>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '1rem',
                  marginBottom: '1.5rem',
                }}
              >
                {CURATED_COVERS.map((cover) => {
                  const isSelected = formData.cover_image === cover.url
                  return (
                    <div
                      key={cover.name}
                      onClick={() => handleChange('cover_image', cover.url)}
                      style={{
                        height: '110px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundImage: `url(${cover.url})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        cursor: 'pointer',
                        position: 'relative',
                        boxShadow: isSelected
                          ? '0 0 0 3px var(--color-ink), 0 4px 14px rgba(0,0,0,0.15)'
                          : 'none',
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      {isSelected && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: 'var(--color-ink)',
                            color: 'var(--color-white)',
                            display: 'grid',
                            placeItems: 'center',
                          }}
                        >
                          <Check size={14} />
                        </div>
                      )}
                      <span
                        style={{
                          position: 'absolute',
                          bottom: '6px',
                          left: '8px',
                          background: 'rgba(0,0,0,0.5)',
                          color: '#fff',
                          fontSize: '0.72rem',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backdropFilter: 'blur(4px)',
                        }}
                      >
                        {cover.name}
                      </span>
                    </div>
                  )
                })}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="custom-cover">
                  Or enter custom image URL
                </label>
                <input
                  id="custom-cover"
                  type="text"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={formData.cover_image}
                  onChange={(e) => handleChange('cover_image', e.target.value)}
                />
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '2rem',
              }}
            >
              <button
                type="button"
                className="button button--secondary"
                onClick={() => setStep(2)}
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
              <button
                type="button"
                className="button button--accent button--lg"
                disabled={saving}
                onClick={handleSubmit}
              >
                <Compass size={18} />
                <span>{saving ? 'Creating Journey...' : 'Create Itinerary & Add Stops'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


