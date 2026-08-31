import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { AuthContext } from '../context/auth-context'
import LandingPage from './LandingPage'

describe('LandingPage', () => {
  it('renders landing page with hero headline and CTA buttons', () => {
    render(
      <AuthContext.Provider value={{ isAuthenticated: false, user: null }}>
        <MemoryRouter>
          <LandingPage />
        </MemoryRouter>
      </AuthContext.Provider>,
    )

    expect(screen.getByText(/Plan less./i)).toBeInTheDocument()
    expect(screen.getByText(/Travel more./i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Start Planning/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Explore Trips/i })).toBeInTheDocument()
    expect(screen.getByText(/How GlobeTrotter Works/i)).toBeInTheDocument()
    expect(screen.getByText('Multi-City Itineraries')).toBeInTheDocument()
  })

  it('shows Go to Dashboard CTA when user is authenticated', () => {
    render(
      <AuthContext.Provider value={{ isAuthenticated: true, user: { username: 'alex', role: 'traveler' } }}>
        <MemoryRouter>
          <LandingPage />
        </MemoryRouter>
      </AuthContext.Provider>,
    )

    expect(screen.getByRole('link', { name: /Go to Dashboard/i })).toBeInTheDocument()
  })
})
