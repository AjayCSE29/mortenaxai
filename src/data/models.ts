import type { ModelOption } from '@/types/chat'

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
