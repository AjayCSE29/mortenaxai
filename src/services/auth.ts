import axios, { type AxiosError, type AxiosInstance } from 'axios'

import type { LoginPayload, RegisterPayload, TokenResponse, User } from '@/types/auth'

const API_URL: string = import.meta.env.VITE_API_URL ?? '/api/v1'

export class ApiError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

let accessToken: string | null = null

/**
 * Injects the current JWT into every outgoing request.
 * Called ONLY by AuthContext so that storage never leaks
 * into the rest of the application.
 */
export function setAuthToken(token: string | null): void {
  accessToken = token
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

/**
 * Preserves backend error messages verbatim.
 * FastAPI returns `{ "detail": "..." }` for HTTPExceptions and a
 * `detail` array of validation objects for 422 responses.
 */
function extractErrorMessage(data: unknown, fallback: string): string {
  if (data && typeof data === 'object' && 'detail' in data) {
    const detail = (data as { detail: unknown }).detail

    if (typeof detail === 'string' && detail) {
      return detail
    }

    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) => {
          if (item && typeof item === 'object' && 'msg' in item) {
            const message = (item as { msg: unknown }).msg
            return typeof message === 'string' ? message : ''
          }
          return ''
        })
        .filter(Boolean)
        .join('. ')

      if (messages) {
        return messages
      }
    }
  }

  return fallback
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail?: unknown }>) => {
    const status = error.response?.status
    const message = extractErrorMessage(
      error.response?.data,
      error.message ?? 'Something went wrong',
    )
    return Promise.reject(new ApiError(message, status))
  },
)

/**
 * POST /api/v1/auth/register
 * Body: JSON `{ username, email, password }`.
 */
export async function registerUser(payload: RegisterPayload): Promise<User> {
  const { data } = await api.post<User>('/auth/register', {
    username: payload.username,
    email: payload.email,
    password: payload.password,
  })
  return data
}

/**
 * POST /api/v1/auth/login
 * The FastAPI endpoint consumes OAuth2 form data where `username` is the
 * user's email, so the body is sent urlencoded.
 */
export async function loginUser(payload: LoginPayload): Promise<TokenResponse> {
  const form = new URLSearchParams()
  form.append('username', payload.email)
  form.append('password', payload.password)

  const { data } = await api.post<TokenResponse>('/auth/login', form, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })
  return data
}

/**
 * GET /api/v1/auth/me
 * Uses the Bearer token attached by the request interceptor.
 */
export async function getCurrentUser(): Promise<User> {
  const { data } = await api.get<User>('/auth/me')
  return data
}

/**
 * The backend exposes no logout endpoint, so sign-out is handled
 * entirely client-side by discarding the stored JWT in AuthContext.
 */
export async function logoutUser(): Promise<void> {
  return
}
