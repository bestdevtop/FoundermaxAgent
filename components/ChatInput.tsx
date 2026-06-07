'use client'

import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { SendIcon } from '@/components/Icons'

type Props = {
  onSend: (message: string) => void
  disabled?: boolean
}

export function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!value.trim()) return
    onSend(value)
    setValue('')
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!value.trim() || disabled) return
      onSend(value)
      setValue('')
    }
  }

  return (
    <form className="chat-input-form" onSubmit={handleSubmit}>
      <div className="chat-input-wrapper">
        <textarea
          className="chat-input"
          placeholder="Type your message..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
        />
        <div className="chat-input-toolbar">
          <button type="submit" className="send-btn" disabled={disabled || !value.trim()} aria-label="Send message">
            <SendIcon />
          </button>
        </div>
      </div>
    </form>
  )
}
