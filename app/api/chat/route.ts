import { runAgentStream } from '@/lib/agent/agent'
import type { ChatStreamEvent } from '@/types/chat'

export const runtime = 'nodejs'

function parseMessages(body: {
  messages?: Array<{ role?: string; content?: string }>
}) {
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
    return null
  }

  return messages
}

export async function POST(request: Request) {
  let body: {
    messages?: Array<{ role?: string; content?: string }>
    session_id?: string
  }

  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ detail: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const messages = parseMessages(body)
  if (!messages) {
    return new Response(
      JSON.stringify({
        detail: 'messages required with the last entry being a user message',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ChatStreamEvent) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`))
      }

      try {
        const result = await runAgentStream(messages, body.session_id, {
          onReset: () => send({ type: 'reset' }),
          onToken: (content) => send({ type: 'token', content }),
        })

        send({
          type: 'done',
          response: result.response,
          session_id: result.sessionId,
          execution_log: result.executionLog,
        })
        controller.close()
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        send({ type: 'error', message })
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache, no-transform',
    },
  })
}
