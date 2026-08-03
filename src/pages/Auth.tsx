import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { AuthCard } from '@/components/auth/AuthCard'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { FullPageLoader } from '@/components/FullPageLoader'
import { useAuth } from '@/hooks/useAuth'
import type { AuthMode } from '@/types/auth'

export default function Auth() {
  const navigate = useNavigate()
  const { isAuthenticated, loading } = useAuth()

  const [mode, setMode] = useState<AuthMode>('login')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    if (!successMessage) return

    const timer = window.setTimeout(() => setSuccessMessage(null), 6000)
    return () => window.clearTimeout(timer)
  }, [successMessage])

  const handleSwitchMode = useCallback((next: AuthMode) => {
    setSuccessMessage(null)
    setMode(next)
  }, [])

  const handleRegistered = useCallback(() => {
    setSuccessMessage('Your account was created successfully. Please sign in.')
    setMode('login')
  }, [])

  if (loading) {
    return <FullPageLoader />
  }

  return (
    <AuthLayout>
      <AuthCard
        mode={mode}
        onSwitchMode={handleSwitchMode}
        onRegistered={handleRegistered}
        successMessage={successMessage}
      />
    </AuthLayout>
  )
}
