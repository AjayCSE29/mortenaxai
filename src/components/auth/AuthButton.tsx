import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { LoadingSpinner } from './LoadingSpinner'

interface AuthButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  children: ReactNode
}

export function AuthButton({
  loading = false,
  children,
  className,
  disabled,
  ...props
}: AuthButtonProps) {
  return (
    <Button
      className={cn(
        'h-11 w-full rounded-lg bg-auth-primary text-white shadow-sm hover:bg-auth-primary-hover',
        'focus-visible:ring-4 focus-visible:ring-auth-primary/25',
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <LoadingSpinner size="sm" />
          <span>Please wait</span>
        </>
      ) : (
        children
      )}
    </Button>
  )
}
