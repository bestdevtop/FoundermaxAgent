export type MessageRole = 'user' | 'assistant'

export type ChatMessage = {
  id: string
  role: MessageRole
  content: string
  timestamp: Date
  streaming?: boolean
}

export type ChatStreamEvent =
  | { type: 'reset' }
  | { type: 'token'; content: string }
  | { type: 'done'; response: string; session_id: string; execution_log: string[] }
  | { type: 'error'; message: string }

export type ChatHistoryEntry = {
  role: MessageRole
  content: string
}

export type ChatRequest = {
  messages: ChatHistoryEntry[]
  session_id?: string
}

export type ChatResponse = {
  response: string
  session_id: string
  execution_log: string[]
}
