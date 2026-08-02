import { Menu, Plus } from 'lucide-react'

import type { Conversation } from '@/types/chat'
import { BrandLogo } from '@/components/BrandLogo'
import { SearchBar } from '@/components/SearchBar'
import { ChatList } from '@/components/ChatList'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SidebarProps {
  chats: Conversation[]
  selectedId: string
  searchQuery: string
  onSearchChange: (query: string) => void
  onSelectChat: (chat: Conversation) => void
  onNewChat: () => void
  onToggle: () => void
  className?: string
}

export function Sidebar({
  chats,
  selectedId,
  searchQuery,
  onSearchChange,
  onSelectChat,
  onNewChat,
  onToggle,
  className,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        'flex h-full w-[280px] shrink-0 flex-col border-r border-border bg-background',
        className,
      )}
    >
      <div className="flex h-[72px] shrink-0 items-center justify-between gap-2 border-b border-border px-3">
        <div className="flex min-w-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={onToggle}
            aria-label="Toggle sidebar"
          >
            <Menu className="h-4.5 w-4.5" />
          </Button>
          <span className="flex min-w-0 items-center gap-2">
            <BrandLogo size="sm" />
            <span className="truncate text-sm font-semibold tracking-tight text-foreground">
              Mortenax Chat
            </span>
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={onNewChat}
          aria-label="New chat"
        >
          <Plus className="h-4.5 w-4.5" />
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        <SearchBar value={searchQuery} onChange={onSearchChange} />

        <div className="flex flex-col gap-2">
          <h2 className="px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Chats
          </h2>
          <ChatList chats={chats} selectedId={selectedId} onSelect={onSelectChat} />
        </div>
      </div>

      <footer className="flex shrink-0 items-center gap-2.5 border-t border-border px-4 py-3">
        <BrandLogo size="sm" />
        <span className="text-sm font-semibold text-foreground">Mortenax AI</span>
      </footer>
    </aside>
  )
}
