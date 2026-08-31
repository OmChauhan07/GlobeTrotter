import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { AuthContext } from '../../context/auth-context'
import AppShell from './AppShell'

describe('AppShell Role Navigation', () => {
  it('hides Admin Portal link for traveler users', () => {
    render(
      <AuthContext.Provider value={{ isAuthenticated: true, user: { username: 'alex', role: 'traveler' } }}>
        <MemoryRouter>
          <AppShell />
        </MemoryRouter>
      </AuthContext.Provider>,
    )

    expect(screen.getAllByText('Home')[0]).toBeInTheDocument()
    expect(screen.getAllByText('My Trips')[0]).toBeInTheDocument()
    expect(screen.queryByText('Admin Portal')).not.toBeInTheDocument()
    expect(screen.getByText('Explorer')).toBeInTheDocument()
  })

  it('shows Admin Portal link for admin users', () => {
    render(
      <AuthContext.Provider value={{ isAuthenticated: true, user: { username: 'jordan', role: 'admin' } }}>
        <MemoryRouter>
          <AppShell />
        </MemoryRouter>
      </AuthContext.Provider>,
    )

    expect(screen.getAllByText('Home')[0]).toBeInTheDocument()
    expect(screen.getByText('Admin Portal')).toBeInTheDocument()
    expect(screen.getByText('Administrator')).toBeInTheDocument()
  })
})
