'use client'

import { useState } from 'react'
import { ChatHeader } from '@/components/ChatHeader'
import { ChatWindow } from '@/components/ChatWindow'
import { LeftSidebar } from '@/components/LeftSidebar'
import { RightSidebar } from '@/components/RightSidebar'
import { useChatSessions } from '@/hooks/useChatSessions'

export default function Home() {
  const [leftOpen, setLeftOpen] = useState(false)
  const [rightOpen, setRightOpen] = useState(false)

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
      </main>

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
