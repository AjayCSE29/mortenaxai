import { LogIn, UserPlus } from 'lucide-react'

import { EmailVerification } from '@/components/auth/EmailVerification'
import { FormError } from '@/components/auth/FormError'
import { LoginForm } from '@/components/auth/LoginForm'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { cn } from '@/lib/utils'
import type { AuthMode, User } from '@/types/auth'

interface AuthCardProps {
  mode: AuthMode
  onSwitchMode: (mode: AuthMode) => void
  onRegistered: (user: User) => void
  onVerified: () => void
  onChangeEmail: () => void
  verificationEmail: string | null
  successMessage: string | null
}

export function AuthCard({
  mode,
  onSwitchMode,
  onRegistered,
  onVerified,
  onChangeEmail,
  verificationEmail,
  successMessage,
}: AuthCardProps) {
  const isLogin = mode === 'login'

  if (verificationEmail) {
    return (
      <div className="animate-scale-in w-full">
        <div className="rounded-2xl border border-auth-border/60 bg-white/70 p-6 shadow-[0_24px_80px_-24px_rgba(42,38,35,0.18)] backdrop-blur-xl sm:p-8">
          <EmailVerification
            active
            email={verificationEmail}
            onVerified={onVerified}
            onChangeEmail={onChangeEmail}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="animate-scale-in w-full">
      <div className="rounded-2xl border border-auth-border/60 bg-white/70 p-6 shadow-[0_24px_80px_-24px_rgba(42,38,35,0.18)] backdrop-blur-xl sm:p-8">
        <div className="mb-6">
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-auth-primary/10 text-auth-primary">
            {isLogin ? <LogIn className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-auth-foreground">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="mt-1 text-sm text-auth-muted">
            {isLogin
              ? 'Sign in to continue your conversations with Mortenax AI.'
              : 'Start using Mortenax AI — it only takes a minute.'}
          </p>
        </div>

        {successMessage && <FormError variant="success" message={successMessage} className="mb-5" />}

        <div
          className={cn(
            'grid transition-[grid-template-rows] duration-300 ease-out',
            isLogin ? 'grid-rows-[1fr_0fr]' : 'grid-rows-[0fr_1fr]',
          )}
        >
          <div
            className={cn(
              'min-h-0 overflow-hidden transition-all duration-300 ease-out',
              isLogin ? 'translate-x-0 opacity-100' : '-translate-x-3 opacity-0',
            )}
          >
            <div className="min-h-0">
              <LoginForm
                active={isLogin}
                onSwitchToRegister={() => onSwitchMode('register')}
              />
            </div>
          </div>

          <div
            className={cn(
              'min-h-0 overflow-hidden transition-all duration-300 ease-out',
              isLogin ? 'translate-x-3 opacity-0' : 'translate-x-0 opacity-100',
            )}
          >
            <div className="min-h-0">
              <RegisterForm
                active={!isLogin}
                onSwitchToLogin={() => onSwitchMode('login')}
                onRegistered={onRegistered}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
