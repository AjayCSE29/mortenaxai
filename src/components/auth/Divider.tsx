import { cn } from '@/lib/utils'

interface DividerProps {
  label?: string
  className?: string
}

export function Divider({ label, className }: DividerProps) {
  if (!label) {
    return <div role="separator" aria-hidden="true" className={cn('h-px w-full bg-auth-border', className)} />
  }

  return (
    <div role="separator" aria-hidden="true" className={cn('flex items-center gap-3', className)}>
      <span className="h-px flex-1 bg-auth-border" />
      <span className="text-xs font-medium text-auth-muted">{label}</span>
      <span className="h-px flex-1 bg-auth-border" />
    </div>
  )
}
