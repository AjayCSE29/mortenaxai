export type ModelId = 'fast' | 'balanced' | 'quality' | 'auto'

export interface ModelOption {
  id: ModelId
  label: string
  description: string
}

export type Role = 'user' | 'assistant'

export interface Message {
  id: string
  role: Role
  content: string
  createdAt: string
}

export interface Conversation {
  id: string
  title: string
  updatedAt: string
}

export type ChatSelection = Conversation
