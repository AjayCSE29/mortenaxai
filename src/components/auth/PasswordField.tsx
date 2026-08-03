import { useState } from 'react'
import type { InputHTMLAttributes } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { InputField } from './InputField'

interface PasswordFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className' | 'id'> {
  id?: string
  label: string
  error?: string
  hint?: string
}

export function PasswordField({ id, label, error, hint, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <InputField
      id={id}
      label={label}
      type={visible ? 'text' : 'password'}
      icon={<Lock className="h-4 w-4" />}
      error={error}
      hint={hint}
      trailing={
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-auth-muted hover:bg-transparent hover:text-auth-foreground"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      }
      {...props}
    />
  )
}
