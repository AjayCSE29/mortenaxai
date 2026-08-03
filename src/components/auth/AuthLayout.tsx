import type { ReactNode } from 'react'
import { MessageSquare, ShieldCheck, Sparkles, Zap } from 'lucide-react'

import { BrandLogo } from '@/components/BrandLogo'

interface AuthLayoutProps {
  children: ReactNode
}

const features = [
  { icon: Sparkles, title: 'Natural conversations', description: 'Chat that feels human and responds instantly.' },
  { icon: ShieldCheck, title: 'Private by design', description: 'Your data stays yours, always.' },
  { icon: Zap, title: 'Blazing fast', description: 'Runs on your own local Ollama models.' },
  { icon: MessageSquare, title: 'Context aware', description: 'Picks up right where you left off.' },
]

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-dvh flex-col bg-auth-background lg:flex-row">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-auth-primary/5 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-auth-primary/10 blur-3xl" />
        <div className="absolute top-1/3 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-auth-sidebar/60 blur-3xl" />
      </div>

      <section className="relative z-10 flex flex-col gap-10 px-6 pt-10 sm:px-10 lg:w-[44%] lg:justify-center lg:px-14 lg:py-16">
        <div className="animate-fade-up flex items-center gap-3">
          <BrandLogo size="xl" />
          <span className="text-2xl font-semibold tracking-tight text-auth-foreground">
            Mortenax AI
          </span>
        </div>

        <div className="animate-fade-up [animation-delay:80ms]">
          <h1 className="text-3xl font-semibold tracking-tight text-auth-foreground sm:text-4xl">
            Intelligence, made effortless.
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-auth-muted">
            Your premium AI workspace. Ask anything, generate anything, and keep your
            conversations private — all from a single, elegant interface.
          </p>
        </div>

        <ul
          className="animate-fade-up grid gap-3 sm:grid-cols-2"
        >
          {features.map((feature) => (
            <li
              key={feature.title}
              className="flex items-start gap-3 rounded-xl border border-auth-border/60 bg-auth-sidebar/40 p-3.5"
            >
              <feature.icon className="mt-0.5 h-4.5 w-4.5 shrink-0 text-auth-primary" />
              <div>
                <p className="text-sm font-semibold text-auth-foreground">{feature.title}</p>
                <p className="mt-0.5 text-[13px] leading-snug text-auth-muted">
                  {feature.description}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <div className="animate-fade-up [animation-delay:240ms] relative">
          <div className="relative overflow-hidden rounded-2xl border border-auth-border/60 bg-auth-sidebar/50 p-6">
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-auth-primary/10 blur-2xl" />
            <div className="relative rounded-xl border border-auth-border/70 bg-white/70 p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-auth-primary/10">
                  <Sparkles className="h-4 w-4 text-auth-primary" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-auth-foreground">Mortenax Assistant</p>
                  <p className="text-[11px] text-auth-muted">Always ready to help</p>
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <div className="h-2 w-3/4 rounded-full bg-auth-border" />
                <div className="h-2 w-1/2 rounded-full bg-auth-border" />
              </div>
              <div className="mt-4 flex items-center gap-1.5 rounded-lg bg-auth-primary px-3 py-2 text-white">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 flex flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:py-16">
        <div className="animate-fade-up [animation-delay:100ms] w-full max-w-md">
          {children}
        </div>
      </section>
    </div>
  )
}
