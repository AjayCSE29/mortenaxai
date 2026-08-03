import { useId } from 'react'
import type { InputHTMLAttributes, ReactNode, Ref } from 'react'

import { cn } from '@/lib/utils'

interface InputFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'id' | 'ref'> {
  id?: string
  label: string
  icon?: ReactNode
  trailing?: ReactNode
  error?: string
  hint?: string
  inputClassName?: string
  className?: string
  ref?: Ref<HTMLInputElement>
}

export function InputField({
  id,
  label,
  icon,
  trailing,
  error,
  hint,
  inputClassName,
  className,
  ref,
  ...props
}: InputFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const messageId = `${inputId}-message`

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={inputId} className="text-[13px] font-medium text-auth-foreground">
        {label}
      </label>

      <div className="relative">
        {icon && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-auth-muted"
          >
            {icon}
          </span>
        )}

        <input
          id={inputId}
          ref={ref}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? messageId : undefined}
          className={cn(
            'h-11 w-full rounded-lg border bg-auth-input px-3.5 text-[15px] text-auth-foreground shadow-sm outline-none transition-all duration-200',
            'placeholder:text-auth-muted/60',
            icon && 'pl-10',
            trailing && 'pr-10',
            error
              ? 'border-auth-danger/60 focus:border-auth-danger focus:ring-4 focus:ring-auth-danger/10'
              : 'border-auth-border focus:border-auth-primary/60 focus:ring-4 focus:ring-auth-primary/10',
            inputClassName,
          )}
          {...props}
        />

        {trailing && (
          <span className="absolute inset-y-0 right-0 flex items-center pr-1.5">{trailing}</span>
        )}
      </div>

      {error || hint ? (
        <p id={messageId} className={cn('text-xs', error ? 'text-auth-danger' : 'text-auth-muted')}>
          {error ?? hint}
        </p>
      ) : null}
    </div>
  )
}
