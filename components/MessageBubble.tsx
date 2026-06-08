'use client'

import { useState } from 'react'
import Markdown from 'react-markdown'
import type { ChatMessage } from '@/types/chat'
import { CheckIcon, CopyIcon, RobotIcon, UserIcon } from '@/components/Icons'

type Props = {
  message: ChatMessage
}

function MessageAvatar({ isUser }: { isUser: boolean }) {
  return (
    <div className={`message-avatar ${isUser ? 'user' : 'assistant'}`} aria-hidden="true">
      {isUser ? <UserIcon size={18} /> : <RobotIcon size={18} />}
    </div>
  )
}

function MessageSender({ isUser }: { isUser: boolean }) {
  return (
    <div className={`message-sender ${isUser ? 'user' : 'assistant'}`}>
      <span>{isUser ? 'You' : 'FoundersMax Support'}</span>
    </div>
  )
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
        <div className="message-content user">
          <MessageSender isUser />
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
        <MessageAvatar isUser />
      </div>
    )
  }

  return (
    <div className="message-row assistant">
      <MessageAvatar isUser={false} />
      <div className="message-content assistant">
        <MessageSender isUser={false} />
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
    </div>
  )
}
