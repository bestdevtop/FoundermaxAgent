'use client'

import { CloseIcon, PlusIcon, RobotIcon } from '@/components/Icons'

export type ChatHistoryItem = {
  id: string
  title: string
  time: string
  active?: boolean
}

type Props = {
  chats: ChatHistoryItem[]
  isOpen: boolean
  onClose: () => void
  onNewChat: () => void
  onSelectChat: (id: string) => void
}

export function LeftSidebar({ chats, isOpen, onClose, onNewChat, onSelectChat }: Props) {
  return (
    <>
      <aside className={`left-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand">
            <div className="brand-icon">
              <RobotIcon size={22} />
            </div>
            <div className="brand-text">
              <span className="brand-name">FoundersMax</span>
              <span className="brand-tagline">Your AI Assistant</span>
            </div>
          </div>
          <button type="button" className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">
            <CloseIcon />
          </button>
        </div>

        <button type="button" className="new-chat-btn" onClick={onNewChat}>
          <PlusIcon />
          New Chat
        </button>

        <div className="chat-history">
          <h3 className="section-label">Chats</h3>
          <ul className="chat-list">
            {chats.map((chat) => (
              <li key={chat.id}>
                <button
                  type="button"
                  className={`chat-item ${chat.active ? 'active' : ''}`}
                  onClick={() => onSelectChat(chat.id)}
                >
                  <span className="chat-item-title">{chat.title}</span>
                  <span className="chat-item-meta">
                    {chat.active && <span className="active-dot" />}
                    {chat.time}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} aria-hidden="true" />}
    </>
  )
}
