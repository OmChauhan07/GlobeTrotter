import { useCallback, useMemo, useState } from 'react'

import api from '../api/client'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('gt_user')
    return savedUser ? JSON.parse(savedUser) : null
  })

  const [token, setToken] = useState(() => localStorage.getItem('gt_access_token') || null)

  const storeAuth = useCallback((nextUser, nextToken) => {
    setUser(nextUser)
    setToken(nextToken)
    localStorage.setItem('gt_user', JSON.stringify(nextUser))
    localStorage.setItem('gt_access_token', nextToken)
  }, [])

  const login = useCallback(
    async (credentials) => {
      const response = await api.post('/accounts/login/', credentials)
      const nextUser = response.data.user || { username: credentials.username }
      const nextToken = response.data.access

      storeAuth(nextUser, nextToken)
      return response
    },
    [storeAuth],
  )

  const register = useCallback(
    async (payload) => {
      const response = await api.post('/accounts/register/', payload)
      const nextUser = response.data.user || payload
      const nextToken = response.data.access

      storeAuth(nextUser, nextToken)
      return response
    },
    [storeAuth],
  )

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('gt_user')
    localStorage.removeItem('gt_access_token')
  }, [])

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      login,
      register,
      logout,
    }),
    [user, token, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext

