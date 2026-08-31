import { useState } from 'react'
import { AlertCircle, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import api from '../api/client'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'

export default function TripEditorPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    is_public: false,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setError('Trip name is required.')
      return
    }
    if (!formData.start_date || !formData.end_date) {
      setError('Both start and end dates are required.')
      return
    }
    if (formData.start_date > formData.end_date) {
      setError('Start date cannot be after end date.')
      return
    }

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
    <div className="trip-create-page">
      <Card title="Start a New Journey">
        <p className="subtext">Set your trip dates and destination overview, then start adding city stops.</p>

        {error ? (
          <div className="alert-banner error" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="stack-form">
          <label>
            <span>Trip Name</span>
            <input
              className="input-field"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g. Summer in Southern Europe, Japan Cherry Blossom Tour"
              required
            />
          </label>

          <label>
            <span>Description (optional)</span>
            <textarea
              className="input-field"
              rows={3}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Brief overview or goals for this journey..."
            />
          </label>

          <div className="stop-form-grid">
            <label>
              <span>Trip Start Date</span>
              <input
                type="date"
                className="input-field"
                value={formData.start_date}
                onChange={(e) => handleChange('start_date', e.target.value)}
                required
              />
            </label>

            <label>
              <span>Trip End Date</span>
              <input
                type="date"
                className="input-field"
                min={formData.start_date || undefined}
                value={formData.end_date}
                onChange={(e) => handleChange('end_date', e.target.value)}
                required
              />
            </label>
          </div>

          <div className="form-actions">
            <Button type="submit" disabled={saving}>
              <Plus size={16} /> Create Trip & Build Itinerary
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

