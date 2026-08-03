import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  className?: string
  size?: 'sm' | 'md'
}

export function LoadingSpinner({ className, size = 'md' }: LoadingSpinnerProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn('animate-spin', size === 'md' ? 'h-5 w-5' : 'h-4 w-4', className)}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        className="opacity-25"
      />
      <path
        fill="currentColor"
        className="opacity-90"
        d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647Z"
      />
    </svg>
  )
}
