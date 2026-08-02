import { MessageSquare } from 'lucide-react'

import type { Conversation } from '@/types/chat'
import { cn } from '@/lib/utils'

interface ChatListProps {
  chats: Conversation[]
  selectedId: string
  onSelect: (chat: Conversation) => void
}

export function ChatList({ chats, selectedId, onSelect }: ChatListProps) {
  if (chats.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
        No chats match your search.
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-0.5">
      {chats.map((chat) => {
        const active = chat.id === selectedId
        return (
          <li key={chat.id}>
            <button
              type="button"
              onClick={() => onSelect(chat)}
              aria-current={active ? 'true' : undefined}
              className={cn(
                'flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors',
                active
                  ? 'bg-accent text-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-accent/60 hover:text-accent-foreground',
              )}
            >
              <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-sm font-medium">{chat.title}</span>
                <span className="text-xs text-muted-foreground">{chat.updatedAt}</span>
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
