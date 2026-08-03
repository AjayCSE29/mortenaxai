import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Mail } from 'lucide-react'

import { AuthButton } from '@/components/auth/AuthButton'
import { AuthFooter } from '@/components/auth/AuthFooter'
import { Divider } from '@/components/auth/Divider'
import { FormError } from '@/components/auth/FormError'
import { InputField } from '@/components/auth/InputField'
import { PasswordField } from '@/components/auth/PasswordField'
import { useAuth } from '@/hooks/useAuth'
import type { LoginPayload } from '@/types/auth'
import { validateLogin } from '@/utils/validators'
import type { FieldErrors } from '@/utils/validators'

interface LoginFormProps {
  active: boolean
  onSwitchToRegister: () => void
}

const initialValues: LoginPayload = {
  email: '',
  password: '',
  remember: false,
}

export function LoginForm({ active, onSwitchToRegister }: LoginFormProps) {
  const { login } = useAuth()

  const [values, setValues] = useState<LoginPayload>(initialValues)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const emailRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!active) return

    const timer = window.setTimeout(() => emailRef.current?.focus(), 320)
    return () => window.clearTimeout(timer)
  }, [active])

  const updateField = (field: keyof LoginPayload, value: string | boolean) => {
    setValues((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
    setSubmitError(null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors = validateLogin(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    setSubmitError(null)

    try {
      await login(values)
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Unable to sign in. Please try again.',
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
          ref={emailRef}
          id="login-email"
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
          id="login-password"
          label="Password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={values.password}
          disabled={submitting}
          error={errors.password}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            updateField('password', event.target.value)
          }
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-auth-muted">
          <input
            type="checkbox"
            checked={values.remember}
            disabled={submitting}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              updateField('remember', event.target.checked)
            }
            className="h-4 w-4 rounded border-auth-border bg-auth-input accent-auth-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-auth-primary/30"
          />
          Remember me
        </label>

        <span>
          <button
            type="button"
            className="rounded-sm text-sm font-medium text-auth-primary underline-offset-4 transition-colors hover:text-auth-primary-hover hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-auth-primary/30"
          >
            Forgot password?
          </button>
        </span>
      </div>

      <AuthButton type="submit" loading={submitting}>
        Sign In
      </AuthButton>

      <Divider />

      <AuthFooter
        prompt="Don't have an account?"
        action="Create one"
        onAction={onSwitchToRegister}
      />
    </form>
  )
}
