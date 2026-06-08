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

function extractResponse(messages: BaseMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const msg = messages[i]
    if (msg instanceof AIMessage && msg.content) {
      return String(msg.content)
    }
    if (
      typeof msg === 'object' &&
      msg !== null &&
      'role' in msg &&
      (msg as { role?: string }).role === 'assistant' &&
      'content' in msg
    ) {
      return String((msg as { content?: unknown }).content ?? '')
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

export async function runAgent(
  history: ChatHistoryEntry[],
  sessionId?: string | null,
): Promise<[string, string, string[]]> {
  bootstrap()

  const threadId = sessionId ?? randomUUID()

  await policyService.initPolicyIndex()
  await knowledgeService.initFaqIndex()

  const result = await getAgent().invoke({
    messages: toLangChainMessages(history),
  })

  const messages = result.messages as BaseMessage[]
  const lastUserMessage =
    [...history].reverse().find((entry) => entry.role === 'user')?.content ?? ''
  const executionLog = buildExecutionLog(messages, {
    message: lastUserMessage,
    sessionId: threadId,
    historyLength: history.length,
  })

  return [extractResponse(messages), threadId, executionLog]
}
