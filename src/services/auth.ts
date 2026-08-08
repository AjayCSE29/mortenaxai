import type {
  LoginPayload,
  RegisterPayload,
  TokenResponse,
  User,
  VerifyEmailResponse,
} from '@/types/auth'
import { http } from '@/services/http'

/**
 * POST /api/v1/auth/register
 * Body: JSON `{ username, email, password }`.
 */
export async function registerUser(payload: RegisterPayload): Promise<User> {
  const { data } = await http.post<User>('/auth/register', {
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

  const { data } = await http.post<TokenResponse>('/auth/login', form, {
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
  const { data } = await http.get<User>('/auth/me')
  return data
}

/**
 * The backend exposes no logout endpoint, so sign-out is handled
 * entirely client-side by discarding the stored JWT in AuthContext.
 */
export async function logoutUser(): Promise<void> {
  return
}

/**
 * POST /api/v1/auth/verify-email
 * Body: JSON `{ email, otp }`.
 */
export async function verifyEmail(email: string, otp: string): Promise<VerifyEmailResponse> {
  const { data } = await http.post<VerifyEmailResponse>('/auth/verify-email', {
    email,
    otp,
  })
  return data
}

/**
 * POST /api/v1/auth/resend-verification
 * Body: JSON `{ email }`.
 */
export async function resendVerification(email: string): Promise<VerifyEmailResponse> {
  const { data } = await http.post<VerifyEmailResponse>('/auth/resend-verification', {
    email,
  })
  return data
}
