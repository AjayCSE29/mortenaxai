import { useState } from 'react'
import { Menu, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { BrandLogo } from '@/components/BrandLogo'
import { cn } from '@/lib/utils'

interface NavLink {
  label: string
  href: string
}

const navLinks: NavLink[] = [
  { label: 'Resources', href: '#resources' },
  { label: 'Contact', href: '#contact' },
]

interface NavbarProps {
  onToggleSidebar: () => void
  sidebarCollapsed?: boolean
}

export function Navbar({ onToggleSidebar, sidebarCollapsed = false }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="relative z-30 flex h-[72px] shrink-0 items-center justify-between border-b border-border bg-background px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'text-muted-foreground lg:hidden',
            sidebarCollapsed && 'lg:inline-flex',
          )}
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <BrandLogo size="md" />
        <span className="text-lg font-bold tracking-tight text-foreground">Mortenax</span>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <Button variant="outline" size="sm" className="hidden sm:inline-flex">
          Sign In
        </Button>

        <Button size="sm" className="hidden bg-foreground text-background shadow-sm hover:bg-foreground/90 sm:inline-flex">
          Register
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground md:hidden"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {menuOpen && (
        <div className="absolute inset-x-0 top-[72px] border-b border-border bg-background p-3 shadow-lg md:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 flex gap-2 border-t border-border pt-3">
              <Button variant="outline" size="sm" className="flex-1">
                Sign In
              </Button>
              <Button size="sm" className="flex-1 bg-foreground text-background hover:bg-foreground/90">
                Register
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
