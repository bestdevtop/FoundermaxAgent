'use client'

import { useState } from 'react'
import { ArchitectureFlowDialog } from '@/components/ArchitectureFlowDialog'
import { FlowIcon } from '@/components/Icons'
import { ChatHeader } from '@/components/ChatHeader'
import { ChatWindow } from '@/components/ChatWindow'
import { LeftSidebar } from '@/components/LeftSidebar'
import { RightSidebar } from '@/components/RightSidebar'
import { useChatSessions } from '@/hooks/useChatSessions'

export default function Home() {
  const [leftOpen, setLeftOpen] = useState(false)
  const [rightOpen, setRightOpen] = useState(false)
  const [architectureOpen, setArchitectureOpen] = useState(false)

  const {
    messages,
    executionLog,
    loading,
    error,
    sendMessage,
    chatHistory,
    chatTitle,
    createNewChat,
    selectChat,
    deleteChat,
  } = useChatSessions()

  function handleNewChat() {
    createNewChat()
    setLeftOpen(false)
  }

  function handleSelectChat(id: string) {
    selectChat(id)
    setLeftOpen(false)
  }

  function handlePromptClick(prompt: string) {
    sendMessage(prompt)
    setRightOpen(false)
  }

  return (
    <div className="app-layout">
      <LeftSidebar
        chats={chatHistory}
        isOpen={leftOpen}
        onClose={() => setLeftOpen(false)}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={deleteChat}
      />

      <main className="main-column">
        <ChatHeader
          title={chatTitle}
          onMenuClick={() => setLeftOpen(true)}
          onInfoClick={() => setRightOpen(true)}
        />
        <ChatWindow
          messages={messages}
          loading={loading}
          error={error}
          onSend={sendMessage}
        />
        <button
          type="button"
          className="architecture-fab"
          onClick={() => setArchitectureOpen(true)}
          aria-label="View app architecture and request flow"
          title="How it works"
        >
          <FlowIcon size={20} />
          <span>How it works</span>
        </button>
      </main>

      <ArchitectureFlowDialog isOpen={architectureOpen} onClose={() => setArchitectureOpen(false)} />

      <RightSidebar
        isOpen={rightOpen}
        onClose={() => setRightOpen(false)}
        onPromptClick={handlePromptClick}
        executionLog={executionLog}
        disabled={loading}
      />
    </div>
  )
}
