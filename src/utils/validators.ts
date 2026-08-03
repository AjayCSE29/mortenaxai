import type { LoginPayload, RegisterFormValues } from '@/types/auth'

export type FieldErrors = Record<string, string | undefined>

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim())
}

export function validateLogin(values: LoginPayload): FieldErrors {
  const errors: FieldErrors = {}

  if (!values.email.trim()) {
    errors.email = 'Email is required'
  } else if (!isValidEmail(values.email)) {
    errors.email = 'Enter a valid email address'
  }

  if (!values.password) {
    errors.password = 'Password is required'
  }

  return errors
}

export function validateRegister(values: RegisterFormValues): FieldErrors {
  const errors: FieldErrors = {}
  const username = values.username.trim()

  if (!username) {
    errors.username = 'Username is required'
  } else if (username.length < 3) {
    errors.username = 'Username must be at least 3 characters'
  }

  if (!values.email.trim()) {
    errors.email = 'Email is required'
  } else if (!isValidEmail(values.email)) {
    errors.email = 'Enter a valid email address'
  }

  if (!values.password) {
    errors.password = 'Password is required'
  } else if (values.password.length < 8) {
    errors.password = 'Password must be at least 8 characters'
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password'
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Passwords do not match'
  }

  if (!values.acceptTerms) {
    errors.acceptTerms = 'You must accept the Terms of Service'
  }

  return errors
}
