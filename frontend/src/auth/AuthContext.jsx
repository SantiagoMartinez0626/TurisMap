import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('tm_token') || null)
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('tm_user')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      localStorage.setItem('tm_token', token)
    } else {
      delete axios.defaults.headers.common['Authorization']
      localStorage.removeItem('tm_token')
    }
  }, [token])

  useEffect(() => {
    if (user) {
      localStorage.setItem('tm_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('tm_user')
    }
  }, [user])

  const login = useCallback((nextToken, nextUser) => {
    setToken(nextToken)
    setUser(nextUser)
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo(() => ({
    token,
    user,
    isAuthenticated: !!token,
    login,
    logout
  }), [token, user, login, logout])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}


