import { AlertCircle, CheckCircle2 } from 'lucide-react'

import { cn } from '@/lib/utils'

interface FormErrorProps {
  message?: string | null
  variant?: 'error' | 'success'
  className?: string
}

export function FormError({ message, variant = 'error', className }: FormErrorProps) {
  if (!message) return null

  const isError = variant === 'error'

  return (
    <div
      role="alert"
      className={cn(
        'animate-fade-in flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm',
        isError
          ? 'border-auth-danger/25 bg-auth-danger/5 text-auth-danger'
          : 'border-auth-success/25 bg-auth-success/5 text-auth-success',
        className,
      )}
    >
      {isError ? (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      <span>{message}</span>
    </div>
  )
}
