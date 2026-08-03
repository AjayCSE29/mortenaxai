import { createContext } from 'react'

import type { LoginPayload, RegisterFormValues, User } from '@/types/auth'

export interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  login: (payload: LoginPayload) => Promise<void>
  register: (values: RegisterFormValues) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
