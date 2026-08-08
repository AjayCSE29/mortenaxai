import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChangeEvent, ClipboardEvent, KeyboardEvent } from 'react'
import { MailCheck } from 'lucide-react'

import { AuthButton } from '@/components/auth/AuthButton'
import { AuthFooter } from '@/components/auth/AuthFooter'
import { FormError } from '@/components/auth/FormError'
import { resendVerification, verifyEmail } from '@/services/auth'
import { ApiError } from '@/services/http'
import { cn } from '@/lib/utils'

const OTP_LENGTH = 6
const RESEND_COOLDOWN_SECONDS = 60
const SUCCESS_DELAY_MS = 900

interface EmailVerificationProps {
  active: boolean
  email: string
  onVerified: () => void
  onChangeEmail: () => void
}

function verificationErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 429) return 'Please wait before requesting another code.'
    if (error.message.includes('expired')) {
      return 'Your verification code has expired. Please request a new code.'
    }
    if (error.message.includes('attempts')) {
      return 'Too many incorrect attempts. Please request a new code.'
    }
    if (error.status === 400) return 'Incorrect verification code. Please try again.'
  }
  return 'Something went wrong. Please try again.'
}

function isAlreadyVerified(error: unknown): boolean {
  return error instanceof ApiError && error.message.includes('verified')
}

export function EmailVerification({
  active,
  email,
  onVerified,
  onChangeEmail,
}: EmailVerificationProps) {
  const [digits, setDigits] = useState<string[]>(() => Array(OTP_LENGTH).fill(''))
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SECONDS)

  const inputsRef = useRef<Array<HTMLInputElement | null>>([])
  const verifyingRef = useRef(false)
  const successTimerRef = useRef<number | null>(null)
  const prevLengthRef = useRef(0)

  const otpValue = digits.join('')
  const disabled = isVerifying || success

  useEffect(() => {
    if (!active) return

    setDigits(Array(OTP_LENGTH).fill(''))
    setError(null)
    setSuccess(false)
    setCodeSent(false)
    setResendCooldown(RESEND_COOLDOWN_SECONDS)
    prevLengthRef.current = 0

    const focusTimer = window.setTimeout(() => inputsRef.current[0]?.focus(), 320)
    return () => window.clearTimeout(focusTimer)
  }, [active])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = window.setTimeout(() => setResendCooldown((value) => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [resendCooldown])

  useEffect(() => {
    return () => {
      if (successTimerRef.current !== null) window.clearTimeout(successTimerRef.current)
    }
  }, [])

  const handleVerify = useCallback(async () => {
    if (verifyingRef.current || success) return

    const code = digits.join('')
    if (code.length !== OTP_LENGTH) return

    verifyingRef.current = true
    setError(null)
    setIsVerifying(true)

    try {
      await verifyEmail(email, code)
      setSuccess(true)
      successTimerRef.current = window.setTimeout(onVerified, SUCCESS_DELAY_MS)
    } catch (caught) {
      if (isAlreadyVerified(caught)) {
        onVerified()
      } else {
        setError(verificationErrorMessage(caught))
      }
    } finally {
      verifyingRef.current = false
      setIsVerifying(false)
    }
  }, [digits, email, onVerified, success])

  useEffect(() => {
    const length = otpValue.length

    if (length === OTP_LENGTH && prevLengthRef.current !== OTP_LENGTH) {
      prevLengthRef.current = OTP_LENGTH
      void handleVerify()
    } else if (length !== OTP_LENGTH) {
      prevLengthRef.current = length
    }
  }, [otpValue, handleVerify])

  const handleResend = async () => {
    if (isResending || resendCooldown > 0 || disabled) return

    setError(null)
    setCodeSent(false)
    setIsResending(true)

    try {
      await resendVerification(email)
      setCodeSent(true)
      setResendCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (caught) {
      setError(verificationErrorMessage(caught))
      if (caught instanceof ApiError && caught.status === 429) {
        setResendCooldown(RESEND_COOLDOWN_SECONDS)
      }
    } finally {
      setIsResending(false)
    }
  }

  const handleInputChange =
    (index: number) => (event: ChangeEvent<HTMLInputElement>) => {
      const cleaned = event.target.value.replace(/\D/g, '')

      setDigits((prev) => {
        const next = [...prev]
        next[index] = cleaned ? cleaned.slice(-1) : ''
        return next
      })

      if (cleaned && index < OTP_LENGTH - 1) {
        inputsRef.current[index + 1]?.focus()
      }
      setError(null)
    }

  const handleKeyDown =
    (index: number) => (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Backspace') {
        event.preventDefault()
        setDigits((prev) => {
          const next = [...prev]
          if (next[index]) {
            next[index] = ''
          } else if (index > 0) {
            next[index - 1] = ''
            inputsRef.current[index - 1]?.focus()
          }
          return next
        })
        setError(null)
        return
      }

      if (event.key === 'ArrowLeft' && index > 0) {
        event.preventDefault()
        inputsRef.current[index - 1]?.focus()
        return
      }

      if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
        event.preventDefault()
        inputsRef.current[index + 1]?.focus()
        return
      }

      if (event.key.length === 1 && !/\d/.test(event.key)) {
        event.preventDefault()
      }
    }

  const handlePaste =
    (index: number) => (event: ClipboardEvent<HTMLInputElement>) => {
      event.preventDefault()
      const pasted = event.clipboardData.getData('text').replace(/\D/g, '')
      if (!pasted) return

      setDigits((prev) => {
        const next = [...prev]
        for (let i = 0; i < pasted.length && index + i < OTP_LENGTH; i++) {
          next[index + i] = pasted[i]
        }
        return next
      })

      const focusIndex = Math.min(index + pasted.length, OTP_LENGTH) - 1
      inputsRef.current[focusIndex]?.focus()
      setError(null)
    }

  const canResend = resendCooldown <= 0 && !isResending && !disabled

  return (
    <form onSubmit={(event) => { event.preventDefault(); void handleVerify() }} noValidate>
      <div className="mb-6">
        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-auth-primary/10 text-auth-primary">
          <MailCheck className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-auth-foreground">
          Verify your email
        </h1>
        <p className="mt-1 text-sm text-auth-muted">
          We&apos;ve sent a 6-digit verification code to{' '}
          <span className="font-medium text-auth-foreground">{email}</span>
        </p>
      </div>

      {error && <FormError message={error} className="mb-5" />}
      {success && <FormError variant="success" message="Email verified ✓" className="mb-5" />}

      <div className="flex flex-col gap-5">
        <div role="group" aria-label="Verification code" className="flex flex-col gap-2">
          <div className="flex justify-between gap-2 sm:gap-3">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(element) => {
                  inputsRef.current[index] = element
                }}
                value={digit}
                onChange={handleInputChange(index)}
                onKeyDown={handleKeyDown(index)}
                onPaste={handlePaste(index)}
                inputMode="numeric"
                autoComplete={index === 0 ? 'one-time-code' : undefined}
                aria-label={`Digit ${index + 1}`}
                maxLength={1}
                disabled={disabled}
                className={cn(
                  'h-12 w-full rounded-lg border bg-auth-input text-center text-lg font-semibold text-auth-foreground shadow-sm outline-none transition-all duration-200',
                  'focus:border-auth-primary/60 focus:ring-4 focus:ring-auth-primary/10',
                  error
                    ? 'border-auth-danger/60'
                    : 'border-auth-border',
                )}
              />
            ))}
          </div>

          <p aria-live="polite" role="status" className="sr-only">
            {success
              ? 'Email verified'
              : otpValue.length === OTP_LENGTH
                ? 'Complete'
                : `${otpValue.length} of ${OTP_LENGTH} digits entered`}
          </p>
        </div>

        <AuthButton type="submit" loading={isVerifying} loadingLabel="Verifying...">
          Verify Email
        </AuthButton>
      </div>

      <div className="mt-5 text-center">
        <p className="text-sm text-auth-muted">Didn&apos;t receive the code?</p>
        <div className="mt-1.5">
          {codeSent && (
            <p role="status" className="mb-1.5 text-xs font-medium text-auth-success">
              Code sent
            </p>
          )}
          {canResend ? (
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="rounded-sm text-sm font-semibold text-auth-primary underline-offset-4 transition-colors hover:text-auth-primary-hover hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-auth-primary/30 disabled:opacity-60"
            >
              {isResending ? 'Sending...' : 'Resend code'}
            </button>
          ) : (
            <span className="text-sm text-auth-muted">Resend code in {resendCooldown}s</span>
          )}
        </div>
      </div>

      <div className="mt-5">
        <AuthFooter prompt="Wrong email?" action="Change email" onAction={onChangeEmail} />
      </div>
    </form>
  )
}
