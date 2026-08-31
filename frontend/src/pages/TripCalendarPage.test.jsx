import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import TripCalendarPage from './TripCalendarPage'
import api from '../api/client'

vi.mock('../api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('TripCalendarPage Component', () => {
  const mockTrip = {
    id: 1,
    name: 'France & Italy Explorer',
    start_date: '2026-06-01',
    end_date: '2026-06-03',
  }

  const mockStops = [
    {
      id: 10,
      trip: 1,
      city: 'Paris',
      city_name: 'Paris',
      start_date: '2026-06-01',
      end_date: '2026-06-02',
      activities: [
        {
          id: 101,
          trip_stop: 10,
          activity: 'Louvre Museum Tour',
          activity_name: 'Louvre Museum Tour',
          category: 'culture',
          date: '2026-06-01',
          start_time: '09:00',
          end_time: '12:00',
          estimated_cost: 45.0,
          notes: 'Masterpieces tour',
        },
        {
          id: 102,
          trip_stop: 10,
          activity: 'Seine River Cruise',
          activity_name: 'Seine River Cruise',
          category: 'relaxation',
          date: '2026-06-02',
          start_time: '18:00',
          end_time: '19:30',
          estimated_cost: 25.0,
          notes: 'Sunset departure',
        },
      ],
    },
    {
      id: 11,
      trip: 1,
      city: 'Rome',
      city_name: 'Rome',
      start_date: '2026-06-03',
      end_date: '2026-06-03',
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
      return Promise.resolve({ data: [] })
    })
  })

  const renderComponent = () =>
    render(
      <MemoryRouter initialEntries={['/trips/1/calendar']}>
        <Routes>
          <Route path="/trips/:id/calendar" element={<TripCalendarPage />} />
        </Routes>
      </MemoryRouter>,
    )

  it('renders timeline view with days, city badges, and scheduled activities', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText(/France & Italy Explorer Schedule & Timeline/i)).toBeInTheDocument()
      expect(screen.getByText('DAY 1')).toBeInTheDocument()
      expect(screen.getByText('DAY 2')).toBeInTheDocument()
      expect(screen.getByText('DAY 3')).toBeInTheDocument()
      expect(screen.getByText('Louvre Museum Tour')).toBeInTheDocument()
      expect(screen.getByText('Seine River Cruise')).toBeInTheDocument()
    })
  })

  it('switches between timeline, calendar, and list views', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Louvre Museum Tour')).toBeInTheDocument()
    })

    // Switch to Calendar view
    const calTab = screen.getByRole('tab', { name: /Calendar/i })
    fireEvent.click(calTab)

    await waitFor(() => {
      expect(screen.getByText(/Day 1 Overview/i)).toBeInTheDocument()
    })

    // Switch to List view
    const listTab = screen.getByRole('tab', { name: /List/i })
    fireEvent.click(listTab)

    await waitFor(() => {
      expect(screen.getByText('09:00 - 12:00')).toBeInTheDocument()
    })
  })

  it('opens quick edit modal and submits updated activity schedule', async () => {
    api.patch.mockResolvedValueOnce({
      data: { id: 101, start_time: '10:00' },
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Louvre Museum Tour')).toBeInTheDocument()
    })

    const editButtons = screen.getAllByTitle(/Edit activity details/i)
    fireEvent.click(editButtons[0])

    await waitFor(() => {
      expect(screen.getByText('Edit Activity Schedule')).toBeInTheDocument()
    })

    const saveButton = screen.getByRole('button', { name: /Save Changes/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith(
        '/trips/trip-activities/101/',
        expect.objectContaining({
          activity: 'Louvre Museum Tour',
        }),
      )
    })
  })

  it('opens quick add modal and schedules an activity for a day', async () => {
    api.post.mockResolvedValueOnce({
      data: { id: 103, activity: 'Eiffel Tower Visit' },
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('DAY 1')).toBeInTheDocument()
    })

    const addButtons = screen.getAllByRole('button', { name: /^Add$/i })
    fireEvent.click(addButtons[0]) // Day 1 Add button

    await waitFor(() => {
      expect(screen.getByText('Add Activity to Day 1')).toBeInTheDocument()
    })

    const nameInput = screen.getByPlaceholderText(/e\.g\. Louvre Museum/i)
    fireEvent.change(nameInput, { target: { value: 'Eiffel Tower Visit' } })

    const submitBtn = screen.getByRole('button', { name: /Add to Schedule/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/trips/stops/10/activities/',
        expect.objectContaining({
          activity: 'Eiffel Tower Visit',
          date: '2026-06-01',
        }),
      )
    })
  })

  it('deletes an activity with confirmation', async () => {
    window.confirm = vi.fn().mockReturnValue(true)
    api.delete.mockResolvedValueOnce({})

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Louvre Museum Tour')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByTitle(/Delete activity/i)
    fireEvent.click(deleteButtons[0])

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/trips/trip-activities/101/')
    })
  })
})
