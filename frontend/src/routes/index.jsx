import { Route, Routes } from 'react-router-dom'

import AdminRoute from '../components/auth/AdminRoute'
import AppShell from '../components/layout/AppShell'
import { AuthProvider } from '../context/AuthContext'
import AdminDashboardPage from '../pages/AdminDashboardPage'
import DashboardPage from '../pages/DashboardPage'
import DiscoveryPage from '../pages/DiscoveryPage'
import LandingPage from '../pages/LandingPage'
import LoginPage from '../pages/LoginPage'
import NotFoundPage from '../pages/NotFoundPage'
import ProfilePage from '../pages/ProfilePage'
import PublicTripPage from '../pages/PublicTripPage'
import SignUpPage from '../pages/SignUpPage'
import TripBudgetPage from '../pages/TripBudgetPage'
import TripCalendarPage from '../pages/TripCalendarPage'
import TripDetailPage from '../pages/TripDetailPage'
import TripEditorPage from '../pages/TripEditorPage'
import TripsPage from '../pages/TripsPage'

export function AppRoutes() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />

        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/discover" element={<DiscoveryPage />} />
          <Route path="/destinations" element={<DiscoveryPage />} />
          <Route path="/trips" element={<TripsPage />} />
          <Route path="/trips/new" element={<TripEditorPage />} />
          <Route path="/trips/:id" element={<TripDetailPage />} />
          <Route path="/trips/:id/budget" element={<TripBudgetPage />} />
          <Route path="/trips/:id/calendar" element={<TripCalendarPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<ProfilePage />} />
          <Route path="/public/trip/:slug" element={<PublicTripPage />} />
          <Route path="/public/trips/:slug" element={<PublicTripPage />} />

          {/* Admin Protected Routes */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/analytics" element={<AdminDashboardPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  )
}

export default AppRoutes
