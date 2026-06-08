'use client'

import { useEffect, useRef } from 'react'
import { ChatInput } from '@/components/ChatInput'
import { MessageBubble } from '@/components/MessageBubble'
import { RobotIcon } from '@/components/Icons'
import type { ChatMessage } from '@/types/chat'

type Props = {
  messages: ChatMessage[]
  loading: boolean
  error: string | null
  onSend: (message: string) => void
}

export function ChatWindow({ messages, loading, error, onSend }: Props) {
  const messagesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = messagesRef.current
    if (!container) return
    container.scrollTop = container.scrollHeight
  }, [messages, loading])

  return (
    <section className="chat-window">
      <div className="chat-messages" ref={messagesRef}>
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {loading && (
          <div className="message-row assistant">
            <div className="message-avatar assistant" aria-hidden="true">
              <RobotIcon size={18} />
            </div>
            <div className="message-content assistant">
              <div className="message-sender assistant">
                <span>FoundersMax Support</span>
              </div>
              <div className="message-bubble assistant typing">
                <div className="typing-dots">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && <p className="chat-error">{error}</p>}

      <div className="chat-input-area">
        <ChatInput onSend={onSend} disabled={loading} />
      </div>
    </section>
  )
}
