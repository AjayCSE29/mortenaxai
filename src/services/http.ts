import axios, { type AxiosError, type AxiosInstance } from 'axios'

const API_URL: string = import.meta.env.VITE_API_URL ?? '/api/v1'

export class ApiError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export const http: AxiosInstance = axios.create({
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

http.interceptors.request.use((config) => {
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

http.interceptors.response.use(
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
