import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Compass,
  LayoutDashboard,
  LogOut,
  Map,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react'
import { useState } from 'react'

import { useAuth } from '../../hooks/useAuth'

const mainNavItems = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/trips', label: 'My Trips', icon: Map },
  { to: '/discover', label: 'Discover', icon: Compass },
]

export function AppShell() {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/discover?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <div className="app-shell">
      {/* Desktop Luxury Sidebar */}
      <aside className="app-sidebar" aria-label="Sidebar navigation">
        <div>
          <NavLink to="/dashboard" className="sidebar-brand">
            <div className="brand-icon-wrap">
              <Sparkles size={20} />
            </div>
            <span className="brand-name">GlobeTrotter</span>
          </NavLink>

          <nav className="sidebar-nav">
            {mainNavItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{label}</span>
              </NavLink>
            ))}
            <NavLink
              to="/profile"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Settings size={18} />
              <span>Settings</span>
            </NavLink>

            {user?.role === 'admin' && (
              <NavLink
                to="/admin"
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                style={{ marginTop: '0.5rem', borderTop: '1px dashed var(--color-border)', paddingTop: '0.75rem' }}
              >
                <ShieldCheck size={18} />
                <span>Admin Portal</span>
              </NavLink>
            )}
          </nav>
        </div>

        <div className="sidebar-footer">
          <NavLink to="/trips/new" className="button button--accent button--sm" style={{ width: '100%' }}>
            <Plus size={16} />
            <span>Plan New Trip</span>
          </NavLink>

          {isAuthenticated ? (
            <div className="user-profile-pill" onClick={() => navigate('/profile')}>
              <div className="user-avatar">
                {user?.username?.charAt(0)?.toUpperCase() || 'T'}
              </div>
              <div className="user-meta-info">
                <div className="user-name">{user?.username || 'Traveler'}</div>
                <div className="user-role">{user?.role === 'admin' ? 'Administrator' : 'Explorer'}</div>
              </div>
              <button
                type="button"
                className="icon-button"
                style={{ width: '28px', height: '28px', border: 'none', background: 'transparent' }}
                onClick={(e) => {
                  e.stopPropagation()
                  logout()
                }}
                title="Sign out"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <NavLink to="/login" className="button button--secondary button--sm">
              Sign In
            </NavLink>
          )}
        </div>
      </aside>

      {/* Main Content Layout */}
      <div className="app-main-layout">
        <header className="app-topbar">
          <form className="topbar-search" onSubmit={handleSearchSubmit}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Search cities, countries, places..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          <div className="topbar-actions">
            {isAuthenticated ? (
              <NavLink to="/profile" className="icon-button" title="My Profile">
                <User size={18} />
              </NavLink>
            ) : (
              <NavLink to="/login" className="button button--sm">
                Sign In
              </NavLink>
            )}
          </div>
        </header>

        <div className="app-main-content-scroll">
          <main className="page-shell">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Mobile Responsive Bottom Navigation */}
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        {mainNavItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
        <NavLink
          to="/profile"
          className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
        >
          <User size={20} />
          <span>Profile</span>
        </NavLink>
      </nav>
    </div>
  )
}

export default AppShell

