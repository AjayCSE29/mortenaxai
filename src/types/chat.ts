export type ModelId = 'fast' | 'balanced' | 'quality' | 'auto'

export interface ModelOption {
  id: ModelId
  label: string
  description: string
}

export type Role = 'user' | 'assistant'

export interface Message {
  id: number
  role: Role
  content: string
  created_at: string
}

export interface Conversation {
  id: number
  title: string
  created_at: string
  updated_at: string
}
