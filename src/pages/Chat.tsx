import { useMemo, useState } from 'react'

import type { Message, ModelId } from '@/types/chat'
import { mockChats } from '@/data/mockChats'
import { mockConversation } from '@/data/mockConversation'
import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'
import { ChatArea } from '@/components/ChatArea'
import { cn } from '@/lib/utils'

export default function Chat() {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches,
  )
  const [selectedChatId, setSelectedChatId] = useState<string>(mockChats[0].id)
  const [searchQuery, setSearchQuery] = useState('')
  const [messages, setMessages] = useState<Message[]>(mockConversation)
  const [inputValue, setInputValue] = useState('')
  const [model, setModel] = useState<ModelId>('fast')

  const filteredChats = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return mockChats
    return mockChats.filter((chat) => chat.title.toLowerCase().includes(query))
  }, [searchQuery])

  const toggleSidebar = () => setSidebarOpen((open) => !open)

  const closeSidebar = () => setSidebarOpen(false)

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId)
    setMessages(mockConversation)
    closeSidebar()
  }

  const handleNewChat = () => {
    setSelectedChatId('')
    setMessages([])
    setInputValue('')
    closeSidebar()
  }

  const handleSend = (content: string) => {
    if (!content.trim()) return
    const userMessage: Message = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    }
    const assistantMessage: Message = {
      id: `msg-assistant-${Date.now()}`,
      role: 'assistant',
      content:
        'I\'m a demo assistant — hook me up to your FastAPI + Ollama backend and I\'ll start answering for real. For now, everything you see is mock data. Try asking for a code snippet and I\'ll show it off with syntax highlighting.',
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMessage, assistantMessage])
    setInputValue('')
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <Navbar onToggleSidebar={toggleSidebar} sidebarCollapsed={!sidebarOpen} />

      <div className="relative flex min-h-0 flex-1">
        {sidebarOpen && (
          <div
            className="absolute inset-0 z-30 bg-black/30 backdrop-blur-sm lg:hidden"
            onClick={closeSidebar}
            aria-hidden="true"
          />
        )}

        <Sidebar
          chats={filteredChats}
          selectedId={selectedChatId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectChat={(chat) => handleSelectChat(chat.id)}
          onNewChat={handleNewChat}
          onToggle={toggleSidebar}
          className={cn(
            'absolute inset-y-0 left-0 z-40 transition-transform duration-200 ease-in-out',
            sidebarOpen
              ? 'translate-x-0 shadow-xl lg:relative lg:z-auto lg:translate-x-0 lg:shadow-none'
              : '-translate-x-full lg:hidden',
          )}
        />

        <ChatArea
          messages={messages}
          inputValue={inputValue}
          onInputChange={setInputValue}
          onSend={handleSend}
          model={model}
          onModelChange={setModel}
        />
      </div>
    </div>
  )
}
