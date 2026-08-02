import { useMemo, useState } from 'react'
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx'
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript'
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash'
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Check, Copy } from 'lucide-react'

import { cn } from '@/lib/utils'

SyntaxHighlighter.registerLanguage('tsx', tsx)
SyntaxHighlighter.registerLanguage('typescript', typescript)
SyntaxHighlighter.registerLanguage('bash', bash)
SyntaxHighlighter.registerLanguage('json', json)

const LANGUAGES: Record<string, string> = {
  tsx: 'TypeScript React',
  typescript: 'TypeScript',
  ts: 'TypeScript',
  bash: 'Bash',
  sh: 'Bash',
  json: 'JSON',
}

interface CodeBlockProps {
  code: string
  language?: string
  className?: string
}

export function CodeBlock({ code, language, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const detectedLanguage = useMemo(() => language?.toLowerCase() ?? 'tsx', [language])
  const label = LANGUAGES[detectedLanguage] ?? detectedLanguage.toUpperCase()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-[#0d1117] shadow-sm',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-[#21262d] bg-[#161b22] px-4 py-2.5">
        <span className="flex items-center gap-2 font-mono text-xs text-[#8b949e]">
          <span className="flex items-center gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
          </span>
          <span className="ml-1">{label}</span>
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-[#8b949e] transition-colors hover:bg-white/5 hover:text-white"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-[#3fb950]" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <div className="max-h-96 overflow-auto">
        <SyntaxHighlighter
          language={detectedLanguage}
          style={oneDark}
          showLineNumbers
          customStyle={{
            margin: 0,
            background: 'transparent',
            padding: '1rem 0',
            fontSize: '0.8125rem',
            lineHeight: 1.6,
          }}
          codeTagProps={{
            style: { fontFamily: 'var(--font-mono)', fontSize: 'inherit' },
          }}
          lineNumberStyle={{
            minWidth: '3.5em',
            paddingRight: '1rem',
            marginRight: '1rem',
            color: '#484f58',
            borderRight: '1px solid #21262d',
            background: 'transparent',
          }}
          wrapLongLines={false}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}
