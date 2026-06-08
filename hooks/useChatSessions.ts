'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChatHistoryItem } from '@/components/LeftSidebar'
import type { ChatMessage, ChatStreamEvent } from '@/types/chat'

const STORAGE_KEY = 'foundersmax_sessions'

type ChatSession = {
  id: string
  title: string
  backendSessionId: string
  messages: ChatMessage[]
  executionLog: string[]
  updatedAt: string
}

const WELCOME_TEXT = "Hello! I'm AI Agent from FoundersMax. How can I help you?"

function welcomeMessage(): ChatMessage {
  return {
    id: 'welcome',
    role: 'assistant',
    content: WELCOME_TEXT,
    timestamp: new Date(),
  }
}

function createSession(title = 'New Chat'): ChatSession {
  return {
    id: crypto.randomUUID(),
    title,
    backendSessionId: crypto.randomUUID(),
    messages: [welcomeMessage()],
    executionLog: [],
    updatedAt: new Date().toISOString(),
  }
}

function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ChatSession[]
    return parsed.map((s) => ({
      ...s,
      executionLog: s.executionLog ?? [],
      messages: s.messages.map((m) => ({ ...m, timestamp: new Date(m.timestamp) })),
    }))
  } catch {
    return []
  }
}

function saveSessions(sessions: ChatSession[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
}

function formatChatTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const day = 86400000

  if (diff < day && now.getDate() === date.getDate()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  if (diff < day * 2) return 'Yesterday'
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function deriveTitle(messages: ChatMessage[]): string {
  const firstUser = messages.find((m) => m.role === 'user')
  if (!firstUser) return 'New Chat'
  const text = firstUser.content.trim()
  return text.length > 32 ? `${text.slice(0, 32)}...` : text
}

function isRealSession(session: ChatSession): boolean {
  return session.messages.some((m) => m.role === 'user')
}

function refreshWelcomeMessages(sessions: ChatSession[]): ChatSession[] {
  const oldWelcomePrefixes = [
    "Hello! I'm Smart Agent",
    "Hello! I'm AI Agent from FoundersMax",
  ]

  return sessions.map((s) => {
    if (isRealSession(s)) return s
    return {
      ...s,
      messages: s.messages.map((m, i) => {
        if (m.id === 'welcome') return { ...m, content: WELCOME_TEXT }
        if (
          i === 0 &&
          m.role === 'assistant' &&
          oldWelcomePrefixes.some((prefix) => m.content.startsWith(prefix))
        ) {
          return { ...m, id: 'welcome', content: WELCOME_TEXT }
        }
        return m
      }),
    }
  })
}

function removeMockSessions(sessions: ChatSession[]): ChatSession[] {
  return sessions.filter((s) => {
    if (['history-1', 'history-2', 'history-3'].includes(s.id)) return false
    if (s.messages.some((m) => m.id === 'demo-user' || m.id === 'demo-assistant')) return false
    return true
  })
}

export function useChatSessions() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    let stored = refreshWelcomeMessages(removeMockSessions(loadSessions()))
    if (stored.length === 0) {
      stored = [createSession()]
    }
    saveSessions(stored)
    setSessions(stored)
    setActiveId(stored[0].id)
  }, [])

  useEffect(() => {
    if (sessions.length > 0) saveSessions(sessions)
  }, [sessions])

  const activeSession = sessions.find((s) => s.id === activeId)

  const chatHistory: ChatHistoryItem[] = sessions
    .filter(isRealSession)
    .map((s) => ({
      id: s.id,
      title: s.title,
      time: formatChatTime(new Date(s.updatedAt)),
      active: s.id === activeId,
    }))

  const chatTitle = activeSession?.title ?? 'New Chat'

  const createNewChat = useCallback(() => {
    const session = createSession()
    setSessions((prev) => [session, ...prev])
    setActiveId(session.id)
    setError(null)
  }, [])

  const selectChat = useCallback((id: string) => {
    setActiveId(id)
    setError(null)
  }, [])

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || loading || !activeSession) return

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: trimmed,
        timestamp: new Date(),
      }

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== activeId) return s
          const updated = [...s.messages, userMessage]
          return {
            ...s,
            messages: updated,
            title: deriveTitle(updated),
            updatedAt: new Date().toISOString(),
          }
        }),
      )
      setLoading(true)
      setError(null)

      const historyMessages = [...activeSession.messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const assistantId = crypto.randomUUID()

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: historyMessages,
            session_id: activeSession.backendSessionId,
          }),
        })

        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.detail ?? 'Failed to send message')
        }

        if (!res.body) {
          throw new Error('No response stream received')
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        const upsertStreamingMessage = (content: string, streaming: boolean) => {
          setSessions((prev) =>
            prev.map((s) => {
              if (s.id !== activeId) return s

              const exists = s.messages.some((m) => m.id === assistantId)
              if (!exists) {
                return {
                  ...s,
                  messages: [
                    ...s.messages,
                    {
                      id: assistantId,
                      role: 'assistant',
                      content,
                      timestamp: new Date(),
                      streaming,
                    },
                  ],
                }
              }

              return {
                ...s,
                messages: s.messages.map((m) =>
                  m.id === assistantId ? { ...m, content, streaming } : m,
                ),
              }
            }),
          )
        }

        const finalizeAssistantMessage = (
          content: string,
          sessionId: string,
          executionLog: string[],
        ) => {
          setSessions((prev) =>
            prev.map((s) => {
              if (s.id !== activeId) return s

              const exists = s.messages.some((m) => m.id === assistantId)
              const assistantMessage: ChatMessage = {
                id: assistantId,
                role: 'assistant',
                content,
                timestamp: new Date(),
              }

              return {
                ...s,
                backendSessionId: sessionId,
                messages: exists
                  ? s.messages.map((m) =>
                      m.id === assistantId ? { ...assistantMessage, streaming: false } : m,
                    )
                  : [...s.messages, assistantMessage],
                executionLog,
                updatedAt: new Date().toISOString(),
              }
            }),
          )
        }

        const handleStreamEvent = (event: ChatStreamEvent) => {
          if (event.type === 'reset') {
            upsertStreamingMessage('', true)
          } else if (event.type === 'token') {
            upsertStreamingMessage(event.content, true)
          } else if (event.type === 'done') {
            finalizeAssistantMessage(
              event.response,
              event.session_id,
              event.execution_log ?? [],
            )
          } else if (event.type === 'error') {
            throw new Error(event.message)
          }
        }

        const processBufferLines = (flushRemainder = false) => {
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed) continue
            handleStreamEvent(JSON.parse(trimmed) as ChatStreamEvent)
          }

          if (flushRemainder) {
            const remainder = buffer.trim()
            buffer = ''
            if (remainder) {
              handleStreamEvent(JSON.parse(remainder) as ChatStreamEvent)
            }
          }
        }

        while (true) {
          const { done, value } = await reader.read()
          if (value) {
            buffer += decoder.decode(value, { stream: !done })
          }
          processBufferLines()
          if (done) {
            buffer += decoder.decode()
            processBufferLines(true)
            break
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      } finally {
        setLoading(false)
      }
    },
    [activeId, activeSession, loading],
  )

  return {
    messages: activeSession?.messages ?? [],
    executionLog: activeSession?.executionLog ?? [],
    loading,
    error,
    sendMessage,
    chatHistory,
    chatTitle,
    createNewChat,
    selectChat,
  }
}
