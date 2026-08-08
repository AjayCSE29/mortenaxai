import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { Conversation, Message, ModelId } from '@/types/chat'
import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'
import { ChatArea } from '@/components/ChatArea'
import { ErrorBanner } from '@/components/ErrorBanner'
import { ApiError } from '@/services/http'
import { createConversation, createMessage, getConversations, getMessages } from '@/services/chat'
import { deriveConversationTitle } from '@/lib/chat'
import { cn } from '@/lib/utils'

function errorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (error instanceof ApiError && error.message) return error.message
  return error instanceof Error ? error.message : fallback
}

export default function Chat() {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches,
  )
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null)
  const [messagesByConversation, setMessagesByConversation] = useState<Record<number, Message[]>>(
    {},
  )
  const [conversationsLoading, setConversationsLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [inputValue, setInputValue] = useState('')
  const [model, setModel] = useState<ModelId>('fast')

  const inputRef = useRef<HTMLTextAreaElement>(null)

  const messages = selectedChatId ? (messagesByConversation[selectedChatId] ?? []) : []

  const filteredChats = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return conversations
    return conversations.filter((chat) => chat.title.toLowerCase().includes(query))
  }, [conversations, searchQuery])

  useEffect(() => {
    let active = true
    setConversationsLoading(true)
    getConversations()
      .then((list) => {
        if (active) setConversations(list)
      })
      .catch((caught: unknown) => {
        if (active) setError(errorMessage(caught, 'Failed to load conversations'))
      })
      .finally(() => {
        if (active) setConversationsLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const loadMessages = useCallback(async (conversationId: number) => {
    setMessagesLoading(true)
    setError(null)
    try {
      const list = await getMessages(conversationId)
      setMessagesByConversation((prev) => ({ ...prev, [conversationId]: list }))
    } catch (caught) {
      setError(errorMessage(caught, 'Failed to load messages'))
    } finally {
      setMessagesLoading(false)
    }
  }, [])

  const toggleSidebar = () => setSidebarOpen((open) => !open)

  const closeSidebar = () => setSidebarOpen(false)

  const handleNewChat = () => {
    setSelectedChatId(null)
    setInputValue('')
    setError(null)
    closeSidebar()
    window.requestAnimationFrame(() => inputRef.current?.focus())
  }

  const handleSelectChat = (chatId: number) => {
    setSelectedChatId(chatId)
    setInputValue('')
    setError(null)
    closeSidebar()
    if (messagesByConversation[chatId]) return
    loadMessages(chatId)
  }

  const handleSend = async (content: string) => {
    const text = content.trim()
    if (!text || isSending) return

    setError(null)
    setIsSending(true)

    try {
      let conversationId = selectedChatId
      if (conversationId === null) {
        const conversation = await createConversation(deriveConversationTitle(text))
        conversationId = conversation.id
        setConversations((prev) => [conversation, ...prev])
        setSelectedChatId(conversation.id)
      }

      const message = await createMessage({
        conversation_id: conversationId,
        role: 'user',
        content: text,
      })

      setMessagesByConversation((prev) => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] ?? []), message],
      }))
      setInputValue('')
    } catch (caught) {
      setError(errorMessage(caught, 'Failed to send message'))
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      {error && (
        <ErrorBanner
          message={error}
          onDismiss={() => setError(null)}
          className="fixed top-4 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-md -translate-x-1/2"
        />
      )}

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
          chatsLoading={conversationsLoading}
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
          showWelcome={selectedChatId === null}
          isSending={isSending}
          isLoadingMessages={messagesLoading}
          inputRef={inputRef}
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
