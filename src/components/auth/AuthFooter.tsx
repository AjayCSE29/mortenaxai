interface AuthFooterProps {
  prompt: string
  action: string
  onAction: () => void
}

export function AuthFooter({ prompt, action, onAction }: AuthFooterProps) {
  return (
    <p className="text-center text-sm text-auth-muted">
      {prompt}{' '}
      <button
        type="button"
        onClick={onAction}
        className="rounded-sm font-semibold text-auth-primary underline-offset-4 transition-colors hover:text-auth-primary-hover hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-auth-primary/30"
      >
        {action}
      </button>
    </p>
  )
}
