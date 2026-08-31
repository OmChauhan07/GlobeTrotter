import { NavLink, Outlet } from 'react-router-dom'
import { Compass, LayoutDashboard, Map, Plane, UserCircle2 } from 'lucide-react'

import { useAuth } from '../../hooks/useAuth'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/discover', label: 'Discover', icon: Compass },
  { to: '/trips', label: 'Trips', icon: Map },
  { to: '/profile', label: 'Profile', icon: UserCircle2 },
]

export function AppShell() {
  const { isAuthenticated, user, logout } = useAuth()

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-wrap">
          <Plane size={18} />
          <span>GlobeTrotter</span>
        </div>

        <nav className="nav" aria-label="Main navigation">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="user-actions">
          {isAuthenticated ? (
            <>
              <span>{user?.username || 'Traveler'}</span>
              <button type="button" className="button button--secondary" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <NavLink to="/login" className="button">
              Login
            </NavLink>
          )}
        </div>
      </header>

      <main className="page-shell">
        <Outlet />
      </main>
    </div>
  )
}

export default AppShell
