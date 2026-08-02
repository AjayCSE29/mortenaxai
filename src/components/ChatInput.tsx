import { useEffect, useRef, useState } from 'react'
import { ArrowUp, Mic } from 'lucide-react'

import { ModelSelector } from '@/components/ModelSelector'
import type { ModelId } from '@/types/chat'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend: (value: string) => void
  model: ModelId
  onModelChange: (model: ModelId) => void
}

const MAX_HEIGHT = 200

export function ChatInput({ value, onChange, onSend, model, onModelChange }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isListening, setIsListening] = useState(false)

  const canSend = value.trim().length > 0

  const resize = () => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_HEIGHT)}px`
  }

  useEffect(() => {
    resize()
  }, [value])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      if (canSend) {
        onSend(value)
      }
    }
  }

  const handleMicClick = () => {
    setIsListening((listening) => !listening)
  }

  return (
    <div className="rounded-2xl border border-border bg-background shadow-sm transition-shadow focus-within:border-primary/50 focus-within:shadow-md">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="What would you like to know?"
        rows={1}
        className="max-h-[200px] w-full resize-none bg-transparent px-4 pt-3.5 pb-1 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none"
      />

      <div className="flex items-center justify-between gap-2 px-2.5 py-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleMicClick}
            aria-label={isListening ? 'Stop recording' : 'Record audio'}
            aria-pressed={isListening}
            className={cn(
              'inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors',
              isListening
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            <Mic className="h-4 w-4" />
          </button>
          <ModelSelector value={model} onChange={onModelChange} />
        </div>

        <button
          type="button"
          onClick={() => canSend && onSend(value)}
          disabled={!canSend}
          aria-label="Send message"
          className={cn(
            'inline-flex h-9 w-9 items-center justify-center rounded-full transition-all',
            canSend
              ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
              : 'cursor-not-allowed bg-accent text-muted-foreground',
          )}
        >
          <ArrowUp className="h-4.5 w-4.5" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}
