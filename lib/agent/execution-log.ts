import { AIMessage, ToolMessage, type BaseMessage } from '@langchain/core/messages'
import { ALL_TOOLS } from '@/lib/tools'

const MAX_RESULT_CHARS = 200

function truncate(text: string, max = MAX_RESULT_CHARS): string {
  if (text.length <= max) return text
  return `${text.slice(0, max)}...`
}

function formatArgs(args: unknown): string {
  try {
    return JSON.stringify(args, null, 2)
      .split('\n')
      .map((line, i) => (i === 0 ? line : `      ${line}`))
      .join('\n')
  } catch {
    return String(args)
  }
}

function formatResult(content: unknown): string {
  const text = typeof content === 'string' ? content : JSON.stringify(content)
  return truncate(text)
}

export function buildExecutionLog(
  messages: BaseMessage[],
  input: { message: string; sessionId: string },
): string[] {
  const log: string[] = [
    '[API] POST /api/chat',
    `      message: "${input.message}"`,
    `      session_id: ${input.sessionId}`,
    '',
    `[Agent] Invoking GPT-4o-mini with ${ALL_TOOLS.length} tools`,
    '',
  ]

  for (const msg of messages) {
    if (msg instanceof AIMessage && msg.tool_calls?.length) {
      for (const call of msg.tool_calls) {
        log.push(`[Agent] Tool call: ${call.name}`)
        log.push(`      args: ${formatArgs(call.args)}`)
      }
    }

    if (msg instanceof ToolMessage) {
      const toolName = msg.name ?? 'unknown'
      log.push(`[Tool]  ${toolName} → ${formatResult(msg.content)}`)
      log.push('')
    }
  }

  const response = messages
    .slice()
    .reverse()
    .find((msg) => msg instanceof AIMessage && msg.content && !msg.tool_calls?.length)

  const responseLength =
    response instanceof AIMessage && response.content
      ? String(response.content).length
      : 0

  log.push(`[Agent] Final response ready (${responseLength} chars)`)

  return log
}
