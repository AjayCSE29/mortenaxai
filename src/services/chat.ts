import { http } from '@/services/http'
import type { Conversation, Message, Role } from '@/types/chat'

/**
 * POST /api/v1/conversations
 * Body: JSON `{ title }`.
 */
export async function createConversation(title: string): Promise<Conversation> {
  const { data } = await http.post<Conversation>('/conversations', { title })
  return data
}

/**
 * GET /api/v1/conversations
 * Lists the current user's conversations, most recently updated first.
 */
export async function getConversations(): Promise<Conversation[]> {
  const { data } = await http.get<Conversation[]>('/conversations')
  return data
}

export interface MessagePayload {
  conversation_id: number
  role: Role
  content: string
}

/**
 * POST /api/v1/messages
 * Body: JSON `{ conversation_id, role, content }`.
 *
 * TODO: The backend router does not register a /messages route yet
 * (only /auth and /conversations are wired). Once the message endpoint
 * exists this function works unchanged.
 */
export async function createMessage(payload: MessagePayload): Promise<Message> {
  const { data } = await http.post<Message>('/messages', payload)
  return data
}

/**
 * GET /api/v1/messages/{conversation_id}
 * Returns the messages belonging to a conversation.
 *
 * TODO: The backend router does not register a /messages route yet.
 * Once the message endpoint exists this function works unchanged.
 */
export async function getMessages(conversationId: number): Promise<Message[]> {
  const { data } = await http.get<Message[]>(`/messages/${conversationId}`)
  return data
}
