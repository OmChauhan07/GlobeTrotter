import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PublicTripPage from './PublicTripPage'
import api from '../api/client'
import { AuthContext } from '../context/auth-context'

vi.mock('../api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('PublicTripPage Component', () => {
  const mockPublicTrip = {
    id: 5,
    name: 'Scenic Swiss Alps Tour',
    description: 'Breathtaking peaks and scenic alpine train rides.',
    cover_image: 'https://images.unsplash.com/photo-swiss',
    start_date: '2026-07-10',
    end_date: '2026-07-12',
    is_public: true,
    public_slug: 'swiss-alps-tour-12345',
    author: 'AlpineExplorer',
    stops: [
      {
        id: 50,
        city_name: 'Zermatt',
        city_country: 'Switzerland',
        start_date: '2026-07-10',
        end_date: '2026-07-11',
        activities: [
          {
            id: 501,
            activity: 'Matterhorn Glacier Paradise',
            activity_name: 'Matterhorn Glacier Paradise',
            category: 'adventure',
            date: '2026-07-10',
            start_time: '09:00',
            end_time: '13:00',
            estimated_cost: 110.0,
            notes: 'Cable car to highest glacier point',
          },
        ],
      },
      {
        id: 51,
        city_name: 'Interlaken',
        city_country: 'Switzerland',
        start_date: '2026-07-12',
        end_date: '2026-07-12',
        activities: [
          {
            id: 502,
            activity: 'Lake Brienz Cruise',
            activity_name: 'Lake Brienz Cruise',
            category: 'relaxation',
            date: '2026-07-12',
            start_time: '14:00',
            end_time: '16:00',
            estimated_cost: 35.0,
          },
        ],
      },
    ],
  }

  const renderComponent = (authContextValue = { isAuthenticated: true, user: { username: 'testuser' } }) =>
    render(
      <AuthContext.Provider value={authContextValue}>
        <MemoryRouter initialEntries={['/public/trip/swiss-alps-tour-12345']}>
          <Routes>
            <Route path="/public/trip/:slug" element={<PublicTripPage />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    )

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders public trip details, author, destinations, and scheduled activities', async () => {
    api.get.mockResolvedValueOnce({ data: mockPublicTrip })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Scenic Swiss Alps Tour')).toBeInTheDocument()
      expect(screen.getByText(/Curated by AlpineExplorer/i)).toBeInTheDocument()
      expect(screen.getAllByText('Zermatt').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('Interlaken').length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('Matterhorn Glacier Paradise')).toBeInTheDocument()
      expect(screen.getByText('Lake Brienz Cruise')).toBeInTheDocument()
    })
  })

  it('allows copying the public share link to clipboard', async () => {
    api.get.mockResolvedValueOnce({ data: mockPublicTrip })
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Scenic Swiss Alps Tour')).toBeInTheDocument()
    })

    const shareBtn = screen.getByRole('button', { name: /Share Itinerary/i })
    fireEvent.click(shareBtn)

    expect(navigator.clipboard.writeText).toHaveBeenCalled()
    await waitFor(() => {
      expect(screen.getByText(/Link Copied to Clipboard!/i)).toBeInTheDocument()
    })
  })

  it('allows authenticated traveler to clone trip and navigates to new itinerary', async () => {
    api.get.mockResolvedValueOnce({ data: mockPublicTrip })
    api.post.mockResolvedValueOnce({
      data: {
        detail: 'Trip cloned successfully.',
        trip: { id: 99, name: 'Copy of Scenic Swiss Alps Tour' },
      },
    })

    renderComponent({ isAuthenticated: true, user: { username: 'traveler' } })

    await waitFor(() => {
      expect(screen.getByText('Scenic Swiss Alps Tour')).toBeInTheDocument()
    })

    const cloneBtn = screen.getByRole('button', { name: /Copy Itinerary to My Trips/i })
    fireEvent.click(cloneBtn)

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/public/trips/swiss-alps-tour-12345/copy/')
      expect(mockNavigate).toHaveBeenCalledWith('/trips/99')
    })
  })

  it('redirects unauthenticated traveler to login when attempting to clone', async () => {
    api.get.mockResolvedValueOnce({ data: mockPublicTrip })

    renderComponent({ isAuthenticated: false, user: null })

    await waitFor(() => {
      expect(screen.getByText('Scenic Swiss Alps Tour')).toBeInTheDocument()
    })

    const cloneBtn = screen.getByRole('button', { name: /Copy Itinerary to My Trips/i })
    fireEvent.click(cloneBtn)

    expect(mockNavigate).toHaveBeenCalledWith('/login?redirect=/public/trip/swiss-alps-tour-12345')
  })

  it('displays 404 not found card when itinerary does not exist or is private', async () => {
    api.get.mockRejectedValueOnce({
      response: { status: 404, data: { detail: 'Not found.' } },
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Itinerary Not Found')).toBeInTheDocument()
      expect(screen.getByText(/This public itinerary was not found or is set to private/i)).toBeInTheDocument()
    })
  })
})
