'use client'

import { InfoIcon, MenuIcon } from '@/components/Icons'

type Props = {
  title: string
  onMenuClick: () => void
  onInfoClick: () => void
}

export function ChatHeader({ title, onMenuClick, onInfoClick }: Props) {
  return (
    <header className="chat-header">
      <div className="chat-header-left">
        <button type="button" className="icon-btn mobile-only" onClick={onMenuClick} aria-label="Open menu">
          <MenuIcon />
        </button>
        <h1 className="chat-title">{title}</h1>
      </div>
      <div className="chat-header-actions">
        <button type="button" className="icon-btn mobile-only" onClick={onInfoClick} aria-label="Open info">
          <InfoIcon />
        </button>
      </div>
    </header>
  )
}
