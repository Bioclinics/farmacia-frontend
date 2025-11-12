import React, { createContext, useState, useEffect } from 'react'
import { login as apiLogin } from '../services/api/auth'

type User = { id?: string; username?: string; [key: string]: any } | null
type AuthContextType = {
  user: User
  token: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  ready: boolean
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: async () => {},
  logout: () => {},
  ready: false,
})

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(null)
  const [token, setToken] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const t = localStorage.getItem('bioclinics_token')
    const u = localStorage.getItem('bioclinics_user')
    if (t) setToken(t)
    if (u) {
      try { setUser(JSON.parse(u)) } catch { setUser(null) }
    }
    setReady(true)
  }, [])

  const login = async (username: string, password: string) => {
    const data = await apiLogin({ username, password })
    const access = (data && (data.access_token || data.token)) || data
    const userData = data.user || data
    localStorage.setItem('bioclinics_token', access)
    localStorage.setItem('bioclinics_user', JSON.stringify(userData))
    setToken(access)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('bioclinics_token')
    localStorage.removeItem('bioclinics_user')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, ready }}>
      {children}
    </AuthContext.Provider>
  )
}
