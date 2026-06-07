'use client'

import { useState } from 'react'
import Markdown from 'react-markdown'
import type { ChatMessage } from '@/types/chat'
import { CheckIcon, CopyIcon, RobotIcon } from '@/components/Icons'

type Props = {
  message: ChatMessage
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)

  const timeStr = message.timestamp.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  async function handleCopy() {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isUser) {
    return (
      <div className="message-row user">
        <div className="message-bubble user">
          <p>{message.content}</p>
          <div className="message-footer user-footer">
            <time dateTime={message.timestamp.toISOString()}>{timeStr}</time>
            <span className="read-receipt" aria-label="Read">
              <CheckIcon size={12} />
              <CheckIcon size={12} />
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="message-row assistant">
      <div className="assistant-avatar">
        <RobotIcon size={18} />
      </div>
      <div className="message-bubble assistant">
        <div className="message-markdown">
          <Markdown>{message.content}</Markdown>
        </div>
        <div className="message-footer assistant-footer">
          <time dateTime={message.timestamp.toISOString()}>{timeStr}</time>
          <div className="message-actions">
            <button type="button" className="action-btn" onClick={handleCopy} aria-label="Copy message">
              {copied ? <CheckIcon size={14} /> : <CopyIcon />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
