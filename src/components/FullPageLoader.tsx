import { LoadingSpinner } from '@/components/auth/LoadingSpinner'

export function FullPageLoader() {
  return (
    <div className="animate-fade-in flex min-h-dvh items-center justify-center bg-auth-background">
      <LoadingSpinner size="md" className="text-auth-primary" />
    </div>
  )
}
