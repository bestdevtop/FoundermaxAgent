import { NextResponse } from 'next/server'
import { runAgent } from '@/lib/agent/agent'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  let body: { message?: string; session_id?: string }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ detail: 'Invalid JSON body' }, { status: 400 })
  }

  const message = body.message?.trim()
  if (!message) {
    return NextResponse.json({ detail: 'message required' }, { status: 400 })
  }

  try {
    const [response, sessionId, executionLog] = await runAgent(message, body.session_id)
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
