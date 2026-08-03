import { cn } from '@/lib/utils'

interface BrandLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showWordmark?: boolean
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-7 w-7',
  lg: 'h-8 w-8',
  xl: 'h-11 w-11',
}

export function BrandLogo({ className, size = 'md', showWordmark = false }: BrandLogoProps) {
  const logo = (
    <img
      src="/logo.png"
      alt="Mortenax AI logo"
      draggable={false}
      className={cn(
        'inline-block shrink-0 rounded-md object-contain',
        sizeClasses[size],
        className,
      )}
    />
  )

  if (!showWordmark) return logo

  return (
    <span className="inline-flex items-center gap-2">
      {logo}
      <span className="text-[15px] font-semibold tracking-tight text-foreground">Mortenax AI</span>
    </span>
  )
}
