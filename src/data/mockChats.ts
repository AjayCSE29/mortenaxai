import type { Conversation, ModelOption } from '@/types/chat'

export const modelOptions: ModelOption[] = [
  {
    id: 'fast',
    label: 'Fast',
    description: 'Lightning quick responses',
  },
  {
    id: 'balanced',
    label: 'Balanced',
    description: 'Speed and quality in balance',
  },
  {
    id: 'quality',
    label: 'Quality',
    description: 'Best possible answers',
  },
  {
    id: 'auto',
    label: 'Auto',
    description: 'Let Mortenax decide',
  },
]

export const mockChats: Conversation[] = [
  {
    id: 'chat-1',
    title: 'Analog Clock React app',
    updatedAt: '2h ago',
  },
  {
    id: 'chat-2',
    title: 'Simple Design System',
    updatedAt: 'Yesterday',
  },
  {
    id: 'chat-3',
    title: 'Figma variable planning',
    updatedAt: 'Yesterday',
  },
  {
    id: 'chat-4',
    title: 'OKLCH token algorithm',
    updatedAt: '3d ago',
  },
  {
    id: 'chat-5',
    title: 'Component naming advice',
    updatedAt: '5d ago',
  },
]
