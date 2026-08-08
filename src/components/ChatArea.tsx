import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { Loader2, Sparkles } from 'lucide-react'

import type { Message, ModelId } from '@/types/chat'
import { Message as MessageBubble } from '@/components/Message'
import { BrandLogo } from '@/components/BrandLogo'
import { ChatInput } from '@/components/ChatInput'

interface ChatAreaProps {
  messages: Message[]
  showWelcome: boolean
  isSending: boolean
  isLoadingMessages: boolean
  inputRef?: RefObject<HTMLTextAreaElement | null>
  inputValue: string
  onInputChange: (value: string) => void
  onSend: (value: string) => void
  model: ModelId
  onModelChange: (model: ModelId) => void
}

export function ChatArea({
  messages,
  showWelcome,
  isSending,
  isLoadingMessages,
  inputRef,
  inputValue,
  onInputChange,
  onSend,
  model,
  onModelChange,
}: ChatAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return
    container.scrollTop = container.scrollHeight
  }, [messages, isSending])

  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[950px] px-6 py-8 sm:px-8">
          {showWelcome ? (
            <EmptyState />
          ) : isLoadingMessages ? (
            <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading conversation…
            </div>
          ) : messages.length === 0 ? null : (
            <div className="flex flex-col gap-8">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {isSending && <ThinkingIndicator />}
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-border bg-background px-4 pb-6 pt-4 sm:px-8">
        <div className="mx-auto w-full max-w-[950px]">
          <ChatInput
            textareaRef={inputRef}
            value={inputValue}
            onChange={onInputChange}
            onSend={onSend}
            model={model}
            onModelChange={onModelChange}
            isSending={isSending}
          />
        </div>
      </div>
    </main>
  )
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 py-24 text-center">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Sparkles className="h-7 w-7" />
      </span>
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          How can I help you today?
        </h1>
        <p className="text-sm text-muted-foreground">
          Ask Mortenax AI anything — coding, research, design, writing, or ideas.
        </p>
      </div>
    </div>
  )
}

function ThinkingIndicator() {
  return (
    <div className="flex gap-3">
      <BrandLogo size="sm" className="mt-0.5 shrink-0" />
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Thinking…
      </div>
    </div>
  )
}
