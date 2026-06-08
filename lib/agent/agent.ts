import { randomUUID } from 'crypto'
import { AIMessage, HumanMessage, type BaseMessage } from '@langchain/core/messages'
import { ChatOpenAI } from '@langchain/openai'
import { createAgent } from 'langchain'
import { buildExecutionLog } from '@/lib/agent/execution-log'
import { SYSTEM_PROMPT } from '@/lib/agent/prompt'
import { initCustomers } from '@/lib/services/customer-service'
import { initOrders } from '@/lib/services/order-service'
import * as knowledgeService from '@/lib/services/knowledge-service'
import * as policyService from '@/lib/services/policy-service'
import { ALL_TOOLS } from '@/lib/tools'

let agent: ReturnType<typeof createAgent> | null = null
let bootstrapped = false

function bootstrap(): void {
  if (bootstrapped) return
  initCustomers()
  initOrders()
  bootstrapped = true
}

function getAgent() {
  if (agent === null) {
    const llm = new ChatOpenAI({
      model: 'gpt-4o-mini',
      temperature: 0,
    })

    agent = createAgent({
      model: llm,
      tools: ALL_TOOLS,
      systemPrompt: SYSTEM_PROMPT,
    })
  }
  return agent
}

function stringifyMessageContent(content: unknown): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map((block) => {
        if (typeof block === 'string') return block
        if (block && typeof block === 'object' && 'text' in block) {
          return String((block as { text?: unknown }).text ?? '')
        }
        return ''
      })
      .join('')
  }
  return content != null ? String(content) : ''
}

function extractResponse(messages: BaseMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const msg = messages[i]
    if (msg instanceof AIMessage && msg.content && !msg.tool_calls?.length) {
      const text = stringifyMessageContent(msg.content).trim()
      if (text) return text
    }
    if (
      typeof msg === 'object' &&
      msg !== null &&
      'role' in msg &&
      (msg as { role?: string }).role === 'assistant' &&
      'content' in msg
    ) {
      const text = stringifyMessageContent((msg as { content?: unknown }).content).trim()
      if (text) return text
    }
  }
  return "I'm sorry, I couldn't generate a response. Please try again."
}

type ChatHistoryEntry = {
  role: 'user' | 'assistant'
  content: string
}

function toLangChainMessages(history: ChatHistoryEntry[]): BaseMessage[] {
  return history.map((entry) =>
    entry.role === 'user'
      ? new HumanMessage(entry.content)
      : new AIMessage(entry.content),
  )
}

type AgentStreamCallbacks = {
  onReset: () => void
  onToken: (content: string) => void
}

export async function runAgentStream(
  history: ChatHistoryEntry[],
  sessionId: string | null | undefined,
  callbacks: AgentStreamCallbacks,
): Promise<{ response: string; sessionId: string; executionLog: string[] }> {
  bootstrap()

  const threadId = sessionId ?? randomUUID()

  await policyService.initPolicyIndex()
  await knowledgeService.initFaqIndex()

  const run = await getAgent().streamEvents(
    { messages: toLangChainMessages(history) },
    { version: 'v3' },
  )

  let response = ''

  for await (const msg of run.messages) {
    callbacks.onReset()
    let messageText = ''

    for await (const token of msg.text) {
      messageText += token
      response = messageText
      callbacks.onToken(messageText)
    }
  }

  const output = await run.output
  const messages = output.messages as BaseMessage[]
  const lastUserMessage =
    [...history].reverse().find((entry) => entry.role === 'user')?.content ?? ''
  const executionLog = buildExecutionLog(messages, {
    message: lastUserMessage,
    sessionId: threadId,
    historyLength: history.length,
  })

  const extracted = extractResponse(messages)
  if (extracted !== "I'm sorry, I couldn't generate a response. Please try again.") {
    response = extracted
  } else if (!response.trim()) {
    response = extracted
  }

  return { response, sessionId: threadId, executionLog }
}
