import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { FullPageLoader } from '@/components/FullPageLoader'
import { useAuth } from '@/hooks/useAuth'

interface RequireAuthProps {
  children: ReactNode
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <FullPageLoader />
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />
  }

  return children
}
