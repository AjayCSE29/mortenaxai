import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { AuthContext, type AuthContextValue } from '@/context/AuthContextValue'
import { ApiError, setAuthToken } from '@/services/http'
import { getCurrentUser, loginUser, logoutUser, registerUser } from '@/services/auth'
import type { LoginPayload, RegisterFormValues, User } from '@/types/auth'

const TOKEN_KEY = 'moternax_access_token'

function clearStoredToken(): void {
  window.localStorage.removeItem(TOKEN_KEY)
  window.sessionStorage.removeItem(TOKEN_KEY)
  setAuthToken(null)
}

function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && error.status !== undefined && (error.status === 401 || error.status === 403)
}

/**
 * The AuthProvider is the ONLY place in the app that reads/writes JWT storage.
 * Never touch localStorage anywhere else.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    const token =
      window.localStorage.getItem(TOKEN_KEY) ?? window.sessionStorage.getItem(TOKEN_KEY)

    if (!token) {
      setLoading(false)
      return
    }

    setAuthToken(token)

    getCurrentUser()
      .then((currentUser) => {
        if (active) setUser(currentUser)
      })
      .catch((error) => {
        // Only discard the token when it was rejected (401/403). Network or
        // server failures keep the stored token so the user isn't logged out.
        if (isUnauthorized(error)) {
          clearStoredToken()
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const login = useCallback(async (payload: LoginPayload) => {
    try {
      const tokens = await loginUser(payload)
      const storage = payload.remember ? window.localStorage : window.sessionStorage

      storage.setItem(TOKEN_KEY, tokens.access_token)
      setAuthToken(tokens.access_token)

      const currentUser = await getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      clearStoredToken()
      throw error
    }
  }, [])

  const register = useCallback(async (values: RegisterFormValues) => {
    return registerUser({
      username: values.username,
      email: values.email,
      password: values.password,
    })
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutUser()
    } finally {
      clearStoredToken()
      setUser(null)
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      loading,
      login,
      register,
      logout,
    }),
    [user, loading, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
