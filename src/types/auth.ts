export interface User {
  id: string
  username: string
  email: string
}

export interface LoginPayload {
  email: string
  password: string
  remember: boolean
}

export interface RegisterFormValues {
  username: string
  email: string
  password: string
  confirmPassword: string
  acceptTerms: boolean
}

export interface RegisterPayload {
  username: string
  email: string
  password: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

export type AuthMode = 'login' | 'register'
