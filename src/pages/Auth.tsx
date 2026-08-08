import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { AuthCard } from '@/components/auth/AuthCard'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { FullPageLoader } from '@/components/FullPageLoader'
import { useAuth } from '@/hooks/useAuth'
import type { AuthMode, User } from '@/types/auth'

export default function Auth() {
  const navigate = useNavigate()
  const { isAuthenticated, loading } = useAuth()

  const [mode, setMode] = useState<AuthMode>('login')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null)

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
    setVerificationEmail(null)
    setMode(next)
  }, [])

  const handleRegistered = useCallback((user: User) => {
    setMode('register')

    if (user.email_verified) {
      setSuccessMessage('Your account was created successfully. Please sign in.')
      setMode('login')
      return
    }

    setVerificationEmail(user.email)
  }, [])

  const handleVerified = useCallback(() => {
    setSuccessMessage('Your email has been verified. Please sign in.')
    setVerificationEmail(null)
    setMode('login')
  }, [])

  const handleChangeEmail = useCallback(() => {
    setVerificationEmail(null)
    setMode('register')
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
        onVerified={handleVerified}
        onChangeEmail={handleChangeEmail}
        verificationEmail={verificationEmail}
        successMessage={successMessage}
      />
    </AuthLayout>
  )
}
