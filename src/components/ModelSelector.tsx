import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Zap } from 'lucide-react'

import { modelOptions } from '@/data/mockChats'
import type { ModelId } from '@/types/chat'
import { cn } from '@/lib/utils'

const modelIcons: Record<ModelId, typeof Zap> = {
  fast: Zap,
  balanced: Zap,
  quality: Zap,
  auto: Zap,
}

interface ModelSelectorProps {
  value: ModelId
  onChange: (model: ModelId) => void
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = modelOptions.find((option) => option.id === value) ?? modelOptions[0]
  const SelectedIcon = modelIcons[selected.id]

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((isOpen) => !isOpen)}
        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-transparent px-2 text-xs font-medium text-muted-foreground transition-colors hover:border-border hover:bg-accent hover:text-foreground"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <SelectedIcon className="h-3.5 w-3.5 text-primary" />
        {selected.label}
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Select model"
          className="absolute bottom-full left-0 z-50 mb-2 w-56 overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-lg"
        >
          {modelOptions.map((option) => {
            const Icon = modelIcons[option.id]
            const active = option.id === value
            return (
              <li key={option.id} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option.id)
                    setOpen(false)
                  }}
                  className={cn(
                    'flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors',
                    active ? 'bg-accent text-accent-foreground' : 'text-popover-foreground hover:bg-accent',
                  )}
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm font-medium">{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  </span>
                  {active && <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
