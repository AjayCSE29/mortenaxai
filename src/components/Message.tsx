import { Children, isValidElement, type ReactNode } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'

import type { Message } from '@/types/chat'
import { BrandLogo } from '@/components/BrandLogo'
import { CodeBlock } from '@/components/CodeBlock'
import { cn } from '@/lib/utils'

function nodeToString(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(nodeToString).join('')
  if (isValidElement<{ children?: ReactNode }>(node)) return nodeToString(node.props.children)
  return ''
}

const markdownComponents: Components = {
  pre: ({ children }) => {
    const child = Children.only(children)
    if (isValidElement<{ className?: string; children?: ReactNode }>(child)) {
      const className = child.props?.className ?? ''
      const match = /language-([\w-]+)/.exec(className)
      if (match) {
        return <CodeBlock code={nodeToString(child.props.children)} language={match[1]} />
      }
    }
    return <pre>{children}</pre>
  },
}

interface MessageProps {
  message: Message
}

export function Message({ message }: MessageProps) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl bg-accent px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap text-foreground sm:max-w-[70%]">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3">
      <BrandLogo size="sm" className="mt-0.5 shrink-0" />
      <div
        className={cn(
          'min-w-0 flex-1',
          'prose-message [&_pre]:my-3 [&_pre]:first:mt-0 [&_pre]:last:mb-0',
        )}
      >
        <ReactMarkdown components={markdownComponents}>{message.content}</ReactMarkdown>
      </div>
    </div>
  )
}
