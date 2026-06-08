import { NextResponse } from 'next/server'
import { runAgent } from '@/lib/agent/agent'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  let body: {
    messages?: Array<{ role?: string; content?: string }>
    session_id?: string
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ detail: 'Invalid JSON body' }, { status: 400 })
  }

  const messages = (body.messages ?? [])
    .filter(
      (entry): entry is { role: 'user' | 'assistant'; content: string } =>
        (entry.role === 'user' || entry.role === 'assistant') &&
        typeof entry.content === 'string' &&
        entry.content.trim().length > 0,
    )
    .map((entry) => ({ role: entry.role, content: entry.content.trim() }))

  const lastMessage = messages.at(-1)
  if (!lastMessage || lastMessage.role !== 'user') {
    return NextResponse.json(
      { detail: 'messages required with the last entry being a user message' },
      { status: 400 },
    )
  }

  try {
    const [response, sessionId, executionLog] = await runAgent(messages, body.session_id)
    return NextResponse.json({
      response,
      session_id: sessionId,
      execution_log: executionLog,
    })
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ detail }, { status: 500 })
  }
}
