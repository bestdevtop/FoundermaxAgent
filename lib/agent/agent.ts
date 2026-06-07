import { randomUUID } from 'crypto'
import { AIMessage, HumanMessage, type BaseMessage } from '@langchain/core/messages'
import { MemorySaver } from '@langchain/langgraph'
import { ChatOpenAI } from '@langchain/openai'
import { createAgent } from 'langchain'
import { buildExecutionLog } from '@/lib/agent/execution-log'
import { SYSTEM_PROMPT } from '@/lib/agent/prompt'
import { initDb } from '@/lib/db/init'
import { initOrders } from '@/lib/services/order-service'
import * as knowledgeService from '@/lib/services/knowledge-service'
import * as policyService from '@/lib/services/policy-service'
import { ALL_TOOLS } from '@/lib/tools'

const checkpointer = new MemorySaver()
let agent: ReturnType<typeof createAgent> | null = null
let bootstrapped = false

function bootstrap(): void {
  if (bootstrapped) return
  initDb()
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
      checkpointer,
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

export async function runAgent(
  message: string,
  sessionId?: string | null,
): Promise<[string, string, string[]]> {
  bootstrap()

  const threadId = sessionId ?? randomUUID()

  await policyService.initPolicyIndex()
  await knowledgeService.initFaqIndex()

  const result = await getAgent().invoke(
    { messages: [new HumanMessage(message)] },
    {
      configurable: { thread_id: threadId },
    },
  )

  const messages = result.messages as BaseMessage[]
  const executionLog = buildExecutionLog(messages, { message, sessionId: threadId })

  return [extractResponse(messages), threadId, executionLog]
}
