import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import TripDetailPage from './TripDetailPage'
import api from '../api/client'

vi.mock('../api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('TripDetailPage Itinerary Builder', () => {
  const mockTrip = {
    id: 1,
    name: 'Europe Discovery Tour',
    start_date: '2026-06-01',
    end_date: '2026-06-15',
  }

  const mockStops = [
    {
      id: 101,
      trip: 1,
      city: 'Paris',
      city_name: 'Paris',
      start_date: '2026-06-01',
      end_date: '2026-06-04',
      position: 1,
      notes: 'Hotel near Eiffel',
      activities: [
        {
          id: 201,
          trip_stop: 101,
          activity: 'Louvre Museum',
          activity_name: 'Louvre Museum',
          date: '2026-06-02',
          start_time: '10:00:00',
          end_time: '13:00:00',
          position: 1,
          notes: 'Pre-booked pass',
        },
      ],
    },
    {
      id: 102,
      trip: 1,
      city: 'Rome',
      city_name: 'Rome',
      start_date: '2026-06-05',
      end_date: '2026-06-08',
      position: 2,
      notes: 'Colosseum tour',
      activities: [],
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    api.get.mockImplementation((url) => {
      if (url === '/trips/1/') {
        return Promise.resolve({ data: mockTrip })
      }
      if (url === '/trips/1/stops/') {
        return Promise.resolve({ data: mockStops })
      }
      return Promise.reject(new Error('Not found'))
    })
  })

  const renderComponent = () =>
    render(
      <MemoryRouter initialEntries={['/trips/1']}>
        <Routes>
          <Route path="/trips/:id" element={<TripDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

  it('renders trip overview, stops, and activities correctly', async () => {
    renderComponent()

    expect(screen.getByText(/Loading your itinerary/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Europe Discovery Tour')).toBeInTheDocument()
      expect(screen.getAllByText('Paris').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Rome').length).toBeGreaterThan(0)
      expect(screen.getByDisplayValue('Louvre Museum')).toBeInTheDocument()
    })
  })

  it('adds a new stop with valid dates within the trip range', async () => {
    api.post.mockResolvedValueOnce({
      data: {
        id: 103,
        trip: 1,
        city: 'Florence',
        city_name: 'Florence',
        start_date: '2026-06-09',
        end_date: '2026-06-12',
        position: 3,
        notes: '',
        activities: [],
      },
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Europe Discovery Tour')).toBeInTheDocument()
    })

    const cityInput = screen.getByPlaceholderText(/e\.g\. Rome, Tokyo, Barcelona/i)
    const startDateInput = screen.getByLabelText(/Stop Arrival \(Start\)/i)
    const endDateInput = screen.getByLabelText(/Stop Departure \(End\)/i)
    const addStopButton = screen.getByRole('button', { name: /Add Stop to Itinerary/i })

    fireEvent.change(cityInput, { target: { value: 'Florence' } })
    fireEvent.change(startDateInput, { target: { value: '2026-06-09' } })
    fireEvent.change(endDateInput, { target: { value: '2026-06-12' } })

    fireEvent.click(addStopButton)

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/trips/1/stops/', {
        city: 'Florence',
        start_date: '2026-06-09',
        end_date: '2026-06-12',
        notes: '',
      })
    })
  })

  it('shows validation error when stop dates are outside trip range', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Europe Discovery Tour')).toBeInTheDocument()
    })

    const cityInput = screen.getByPlaceholderText(/e\.g\. Rome, Tokyo, Barcelona/i)
    const startDateInput = screen.getByLabelText(/Stop Arrival \(Start\)/i)
    const endDateInput = screen.getByLabelText(/Stop Departure \(End\)/i)
    const addStopButton = screen.getByRole('button', { name: /Add Stop to Itinerary/i })

    fireEvent.change(cityInput, { target: { value: 'Amsterdam' } })
    fireEvent.change(startDateInput, { target: { value: '2026-05-25' } }) // before trip start 2026-06-01
    fireEvent.change(endDateInput, { target: { value: '2026-06-02' } })

    fireEvent.click(addStopButton)

    await waitFor(() => {
      expect(screen.getByText(/cannot be before trip start date/i)).toBeInTheDocument()
      expect(api.post).not.toHaveBeenCalled()
    })
  })

  it('removes a stop when delete button is clicked and handles rollback on failure', async () => {
    api.delete.mockRejectedValueOnce({
      response: { data: { detail: 'Server database error removing stop' } },
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getAllByText('Paris').length).toBeGreaterThan(0)
    })

    const deleteButtons = screen.getAllByRole('button', { name: /Delete stop/i })
    fireEvent.click(deleteButtons[0])

    await waitFor(() => {
      expect(screen.getByText(/Server database error removing stop/i)).toBeInTheDocument()
    })
  })

  it('attaches an activity to a stop within valid stop dates', async () => {
    api.post.mockResolvedValueOnce({
      data: {
        id: 202,
        trip_stop: 102,
        activity: 'Vatican Museums',
        activity_name: 'Vatican Museums',
        date: '2026-06-06',
        position: 1,
      },
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Rome')).toBeInTheDocument()
    })

    const activityInputs = screen.getAllByPlaceholderText(/Activity name/i)
    const addActivityButtons = screen.getAllByRole('button', { name: /Add Activity/i })

    fireEvent.change(activityInputs[1], { target: { value: 'Vatican Museums' } })
    fireEvent.click(addActivityButtons[1])

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/stops/102/activities/', expect.objectContaining({
        activity: 'Vatican Museums',
      }))
    })
  })

  it('displays validation error if activity date is outside stop dates', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Paris')).toBeInTheDocument()
    })

    const activityInputs = screen.getAllByPlaceholderText(/Activity name/i)
    const addActivityButtons = screen.getAllByRole('button', { name: /Add Activity/i })

    fireEvent.change(activityInputs[0], { target: { value: 'Eiffel Tower at Night' } })
    
    // Stop dates are 2026-06-01 to 2026-06-04. Let's find the date input within the activity form.
    const forms = document.querySelectorAll('.activity-form')
    const dateInput = forms[0].querySelector('input[type="date"]')
    fireEvent.change(dateInput, { target: { value: '2026-06-10' } })

    fireEvent.click(addActivityButtons[0])

    await waitFor(() => {
      expect(screen.getByText(/must fall within stop dates/i)).toBeInTheDocument()
      expect(api.post).not.toHaveBeenCalled()
    })
  })
})
