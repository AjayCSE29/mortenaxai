const MAX_TITLE_WORDS = 6
const MAX_TITLE_LENGTH = 60

/**
 * Derives a short conversation title from the first user message.
 * Used only to relabel a conversation that is still titled "New Chat",
 * since the backend has no title-update endpoint yet.
 */
export function deriveConversationTitle(content: string): string {
  const words = content.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return 'New Chat'

  const title = words.slice(0, MAX_TITLE_WORDS).join(' ')
  if (title.length <= MAX_TITLE_LENGTH) return title

  return `${title.slice(0, MAX_TITLE_LENGTH).trimEnd()}…`
}
