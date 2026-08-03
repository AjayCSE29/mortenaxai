import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Mail, User } from 'lucide-react'

import { AuthButton } from '@/components/auth/AuthButton'
import { AuthFooter } from '@/components/auth/AuthFooter'
import { FormError } from '@/components/auth/FormError'
import { InputField } from '@/components/auth/InputField'
import { PasswordField } from '@/components/auth/PasswordField'
import { useAuth } from '@/hooks/useAuth'
import type { RegisterFormValues } from '@/types/auth'
import { validateRegister } from '@/utils/validators'
import type { FieldErrors } from '@/utils/validators'

interface RegisterFormProps {
  active: boolean
  onSwitchToLogin: () => void
  onRegistered: () => void
}

const initialValues: RegisterFormValues = {
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false,
}

export function RegisterForm({ active, onSwitchToLogin, onRegistered }: RegisterFormProps) {
  const { register } = useAuth()

  const [values, setValues] = useState<RegisterFormValues>(initialValues)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const usernameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!active) return

    const timer = window.setTimeout(() => usernameRef.current?.focus(), 320)
    return () => window.clearTimeout(timer)
  }, [active])

  const updateField = (
    field: keyof RegisterFormValues,
    value: string | boolean,
  ) => {
    setValues((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
    setSubmitError(null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors = validateRegister(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    setSubmitError(null)

    try {
      await register(values)
      setValues(initialValues)
      onRegistered()
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Unable to create your account. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {submitError && <FormError message={submitError} />}

      <div className="flex flex-col gap-4">
        <InputField
          ref={usernameRef}
          id="register-username"
          label="Username"
          type="text"
          autoComplete="username"
          placeholder="johndoe"
          icon={<User className="h-4 w-4" />}
          value={values.username}
          disabled={submitting}
          error={errors.username}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            updateField('username', event.target.value)
          }
        />

        <InputField
          id="register-email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          icon={<Mail className="h-4 w-4" />}
          value={values.email}
          disabled={submitting}
          error={errors.email}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            updateField('email', event.target.value)
          }
        />

        <PasswordField
          id="register-password"
          label="Password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          hint={!errors.password ? 'At least 8 characters' : undefined}
          value={values.password}
          disabled={submitting}
          error={errors.password}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            updateField('password', event.target.value)
          }
        />

        <PasswordField
          id="register-confirm-password"
          label="Confirm password"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          value={values.confirmPassword}
          disabled={submitting}
          error={errors.confirmPassword}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            updateField('confirmPassword', event.target.value)
          }
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="flex cursor-pointer select-none items-start gap-2 text-sm text-auth-muted">
          <input
            type="checkbox"
            checked={values.acceptTerms}
            disabled={submitting}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              updateField('acceptTerms', event.target.checked)
            }
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-auth-border bg-auth-input accent-auth-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-auth-primary/30"
          />
          <span>
            I agree to the <span className="font-medium text-auth-primary">Terms of Service</span> and{' '}
            <span className="font-medium text-auth-primary">Privacy Policy</span>
          </span>
        </label>
        {errors.acceptTerms && <p className="text-xs text-auth-danger">{errors.acceptTerms}</p>}
      </div>

      <AuthButton type="submit" loading={submitting}>
        Create Account
      </AuthButton>

      <AuthFooter
        prompt="Already have an account?"
        action="Sign In"
        onAction={onSwitchToLogin}
      />
    </form>
  )
}
