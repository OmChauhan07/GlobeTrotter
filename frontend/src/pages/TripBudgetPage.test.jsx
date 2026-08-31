import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import TripBudgetPage from './TripBudgetPage'
import api from '../api/client'

vi.mock('../api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}))

// Mock Recharts ResponsiveContainer to avoid jsdom zero-size issues
vi.mock('recharts', async (importOriginal) => {
  const original = await importOriginal()
  return {
    ...original,
    ResponsiveContainer: ({ children }) => <div className="recharts-responsive-container">{children}</div>,
  }
})

describe('TripBudgetPage Component', () => {
  const mockTrip = {
    id: 1,
    name: 'Italian Highlights',
    start_date: '2026-06-01',
    end_date: '2026-06-05',
  }

  const mockBudgetData = {
    trip_id: 1,
    trip_name: 'Italian Highlights',
    currency: 'USD',
    total: 850.0,
    average_per_day: 170.0,
    days_count: 5,
    daily_threshold: 255.0,
    category_breakdown: {
      transport: { amount: 400.0, percentage: 47.1 },
      accommodation: { amount: 300.0, percentage: 35.3 },
      activities: { amount: 70.0, percentage: 8.2 },
      meals: { amount: 80.0, percentage: 9.4 },
      other: { amount: 0.0, percentage: 0.0 },
    },
    daily_breakdown: [
      {
        date: '2026-06-01',
        total: 700.0,
        items_count: 2,
        is_over_budget: true,
        threshold: 255.0,
        categories: { transport: 400.0, accommodation: 300.0, activities: 0, meals: 0, other: 0 },
      },
      {
        date: '2026-06-02',
        total: 80.0,
        items_count: 1,
        is_over_budget: false,
        threshold: 255.0,
        categories: { transport: 0, accommodation: 0, activities: 0, meals: 80.0, other: 0 },
      },
    ],
    over_budget_days: [
      {
        date: '2026-06-01',
        total: 700.0,
        threshold: 255.0,
        excess: 445.0,
      },
    ],
    expenses_count: 4,
  }

  const mockExpenses = [
    {
      id: 101,
      trip: 1,
      category: 'transport',
      name: 'Flight to Rome',
      amount: 400.0,
      currency: 'USD',
      date: '2026-06-01',
      notes: 'Direct flight',
    },
    {
      id: 102,
      trip: 1,
      category: 'meals',
      name: 'Pasta Lunch in Trastevere',
      amount: 80.0,
      currency: 'USD',
      date: '2026-06-02',
      notes: 'Carbonara',
    },
  ]

  const mockStops = [
    { id: 201, city: 'Rome', city_name: 'Rome', start_date: '2026-06-01', end_date: '2026-06-05' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    api.get.mockImplementation((url) => {
      if (url.includes('/budget/')) {
        return Promise.resolve({ data: mockBudgetData })
      }
      if (url.includes('/expenses/')) {
        return Promise.resolve({ data: mockExpenses })
      }
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
      <MemoryRouter initialEntries={['/trips/1/budget']}>
        <Routes>
          <Route path="/trips/:id/budget" element={<TripBudgetPage />} />
        </Routes>
      </MemoryRouter>,
    )

  it('renders total spend, daily average, and over-budget warning', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText(/Italian Highlights Budget & Cost Analytics/i)).toBeInTheDocument()
      expect(screen.getByText('850.00')).toBeInTheDocument()
      expect(screen.getByText('170.00')).toBeInTheDocument()
      expect(screen.getByText(/Over-Budget Day Alert/i)).toBeInTheDocument()
      expect(screen.getByText('Flight to Rome')).toBeInTheDocument()
    })
  })

  it('adds an expense successfully via form submission', async () => {
    api.post.mockResolvedValueOnce({
      data: {
        id: 103,
        name: 'Colosseum Guided Tour',
        category: 'activities',
        amount: 70.0,
        date: '2026-06-03',
      },
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Flight to Rome')).toBeInTheDocument()
    })

    const descInput = screen.getByPlaceholderText(/e\.g\. Flight tickets, Hotel booking/i)
    const amountInput = screen.getByPlaceholderText('0.00')
    const addExpenseButton = screen.getByRole('button', { name: /Add Expense/i })

    fireEvent.change(descInput, { target: { value: 'Colosseum Guided Tour' } })
    fireEvent.change(amountInput, { target: { value: '70.00' } })

    fireEvent.click(addExpenseButton)

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/trips/1/expenses/', expect.objectContaining({
        name: 'Colosseum Guided Tour',
        amount: 70.0,
      }))
    })
  })

  it('deletes an expense with confirmation', async () => {
    window.confirm = vi.fn().mockReturnValue(true)
    api.delete.mockResolvedValueOnce({})

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Flight to Rome')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByTitle(/Delete expense/i)
    fireEvent.click(deleteButtons[0])

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/expenses/101/')
    })
  })

  it('filters logged expenses by category chip', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Flight to Rome')).toBeInTheDocument()
      expect(screen.getByText('Pasta Lunch in Trastevere')).toBeInTheDocument()
    })

    const transportChip = screen.getByRole('button', { name: 'Transport' })
    fireEvent.click(transportChip)

    await waitFor(() => {
      expect(screen.getByText('Flight to Rome')).toBeInTheDocument()
      expect(screen.queryByText('Pasta Lunch in Trastevere')).not.toBeInTheDocument()
    })
  })
})
