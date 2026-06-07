export type MessageRole = 'user' | 'assistant'

export type ChatMessage = {
  id: string
  role: MessageRole
  content: string
  timestamp: Date
}

export type ChatRequest = {
  message: string
  session_id?: string
}

export type ChatResponse = {
  response: string
  session_id: string
  execution_log: string[]
}
