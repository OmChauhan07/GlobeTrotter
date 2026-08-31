import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import DiscoveryPage from './DiscoveryPage'
import api from '../api/client'
import { AuthContext } from '../context/auth-context'

vi.mock('../api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('DiscoveryPage Component', () => {
  const mockCities = [
    {
      id: 1,
      name: 'Tokyo',
      country: 'Japan',
      region: 'Kanto',
      cost_index: 3.6,
      popularity: 4.95,
      image_url: 'https://example.com/tokyo.jpg',
      source: 'catalog',
    },
    {
      id: 2,
      name: 'Paris',
      country: 'France',
      region: 'Ile-de-France',
      cost_index: 3.8,
      popularity: 4.9,
      image_url: 'https://example.com/paris.jpg',
      source: 'catalog',
    },
  ]

  const mockActivities = [
    {
      id: 101,
      name: 'Louvre Museum Tour',
      city_name: 'Paris',
      description: 'Masterpieces tour with skip the line access',
      category: 'culture',
      estimated_cost: 45.0,
      duration: 150,
      image_url: 'https://example.com/louvre.jpg',
      source: 'catalog',
    },
  ]

  const mockTrips = [
    {
      id: 10,
      name: 'European Adventure',
      start_date: '2026-06-01',
      end_date: '2026-06-15',
    },
  ]

  const mockAuthContext = {
    isAuthenticated: true,
    user: { username: 'traveler' },
    login: vi.fn(),
    logout: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    api.get.mockImplementation((url) => {
      if (url === '/cities/search/') {
        return Promise.resolve({ data: mockCities })
      }
      if (url === '/activities/search/') {
        return Promise.resolve({ data: mockActivities })
      }
      if (url === '/destinations/saved/') {
        return Promise.resolve({ data: [] })
      }
      if (url === '/trips/') {
        return Promise.resolve({ data: mockTrips })
      }
      return Promise.resolve({ data: [] })
    })
  })

  const renderComponent = (auth = mockAuthContext) =>
    render(
      <AuthContext.Provider value={auth}>
        <MemoryRouter>
          <DiscoveryPage />
        </MemoryRouter>
      </AuthContext.Provider>,
    )

  it('renders discovery page and lists cities by default', async () => {
    renderComponent()

    expect(screen.getByText(/Discover Destinations & Activities/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Tokyo')).toBeInTheDocument()
      expect(screen.getByText('Paris')).toBeInTheDocument()
    })
  })

  it('switches to experiences tab and searches activities', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Tokyo')).toBeInTheDocument()
    })

    const experiencesTab = screen.getByRole('tab', { name: /Experiences/i })
    fireEvent.click(experiencesTab)

    await waitFor(() => {
      expect(screen.getByText('Louvre Museum Tour')).toBeInTheDocument()
    })
  })

  it('filters activities by category pill', async () => {
    renderComponent()

    const experiencesTab = screen.getByRole('tab', { name: /Experiences/i })
    fireEvent.click(experiencesTab)

    await waitFor(() => {
      expect(screen.getByText('Louvre Museum Tour')).toBeInTheDocument()
    })

    const foodCategoryButton = screen.getByRole('button', { name: /Food & Dining/i })
    fireEvent.click(foodCategoryButton)

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/activities/search/', expect.objectContaining({
        params: expect.objectContaining({ category: 'food' }),
      }))
    })
  })

  it('opens add to trip modal when clicking Add to Trip on a city card', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Tokyo')).toBeInTheDocument()
    })

    const addButtons = screen.getAllByRole('button', { name: /Add to Trip/i })
    fireEvent.click(addButtons[0])

    await waitFor(() => {
      expect(screen.getByText(/Add to Itinerary/i)).toBeInTheDocument()
      expect(screen.getByText(/Add Tokyo as a stop/i)).toBeInTheDocument()
    })
  })

  it('handles and displays error when search fails, allowing retry', async () => {
    api.get.mockRejectedValueOnce({
      response: { data: { detail: 'Upstream Geoapify service timeout' } },
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText(/Upstream Geoapify service timeout/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument()
    })
  })
})
