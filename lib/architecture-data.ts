export type FlowStep = {
  id: number
  title: string
  path: string
  description: string
  detail?: string
}

export type AgentTool = {
  name: string
  service: string
  dataSource: string
  description: string
  useWhen: string
}

export const REQUEST_FLOW: FlowStep[] = [
  {
    id: 1,
    title: 'User sends a message',
    path: 'components/ChatInput.tsx',
    description: 'Customer types in the chat box or clicks a suggested prompt in the right sidebar.',
  },
  {
    id: 2,
    title: 'Session hook builds full history',
    path: 'hooks/useChatSessions.ts',
    description:
      'The user message is appended to the active session in localStorage. The entire conversation (all user + assistant turns) is prepared for the API.',
  },
  {
    id: 3,
    title: 'POST /api/chat',
    path: 'app/api/chat/route.ts',
    description:
      'Browser sends { messages[], session_id }. The route validates that the last message is from the user, then calls runAgent().',
  },
  {
    id: 4,
    title: 'Agent bootstraps & converts history',
    path: 'lib/agent/agent.ts',
    description:
      'On first run: loads orders/customers from JSON, builds in-memory vector indexes for policy & FAQ (OpenAI embeddings). Converts chat history into LangChain HumanMessage / AIMessage objects.',
  },
  {
    id: 5,
    title: 'LangChain agent (GPT-4o-mini)',
    path: 'lib/agent/prompt.ts + lib/tools/index.ts',
    description:
      'The LLM reads the system prompt and full conversation, decides which tools to call (if any), and loops until it can answer.',
    detail: 'Model: gpt-4o-mini · 9 tools available · Stateless per request (history sent each time)',
  },
  {
    id: 6,
    title: 'Tools call services & data',
    path: 'lib/services/* + data/*',
    description:
      'Each tool delegates to a service layer — JSON files for orders/customers/products, in-memory vector search (RAG) for policy/FAQ, rules engine for refunds.',
  },
  {
    id: 7,
    title: 'Response returned to browser',
    path: 'app/api/chat/route.ts',
    description:
      'API returns { response, session_id, execution_log }. The assistant reply and tool-call log are stored in the session.',
  },
  {
    id: 8,
    title: 'Message rendered in chat',
    path: 'components/MessageBubble.tsx',
    description:
      'Assistant reply is rendered as markdown under the "FoundersMax Support" label. Execution log is viewable via View Backend Log.',
  },
]

export const AGENT_TOOLS: AgentTool[] = [
  {
    name: 'order_lookup',
    service: 'order-service',
    dataSource: 'data/orders.json',
    description: 'Look up order by ID — status, items, total, delivery date, customer_id.',
    useWhen: 'Customer asks about a specific order',
  },
  {
    name: 'track_shipment',
    service: 'shipment-service',
    dataSource: 'orders + tracking data',
    description: 'Track shipment — carrier, tracking number, stage, delivery date.',
    useWhen: 'Where is my package? / delivery status',
  },
  {
    name: 'customer_lookup',
    service: 'customer-service',
    dataSource: 'data/customers.json',
    description: 'Look up customer by ID or email — profile, refund count.',
    useWhen: 'Find a customer / account info',
  },
  {
    name: 'get_customer_history',
    service: 'crm-service',
    dataSource: 'customers + orders',
    description: 'Past orders and refund history for a customer.',
    useWhen: 'Order history / previous refunds',
  },
  {
    name: 'get_product_info',
    service: 'product-service',
    dataSource: 'data/products.json',
    description: 'Product specs, warranty, returnability by name.',
    useWhen: 'Product details / warranty questions',
  },
  {
    name: 'refund_policy_search',
    service: 'policy-service',
    dataSource: 'Vector search → refund_return_policy_v2026.txt',
    description: 'Semantic search over refund & return policy clauses.',
    useWhen: 'Return windows, non-refundable items, escalation rules',
  },
  {
    name: 'search_knowledge_base',
    service: 'knowledge-service',
    dataSource: 'Vector search → faq_knowledge_base.txt',
    description: 'Semantic search over FAQ entries.',
    useWhen: 'Shipping, payments, account help, cancellations',
  },
  {
    name: 'check_refund_eligibility',
    service: 'refund-service',
    dataSource: 'Rules engine (in-memory)',
    description: 'Evaluate refund without creating a request — APPROVED / DENIED / ESCALATED.',
    useWhen: 'Always before create_refund_request',
  },
  {
    name: 'create_refund_request',
    service: 'refund-service',
    dataSource: 'In-memory refund store',
    description: 'Create refund request (RR-XXXXXXXX) when eligible or escalated.',
    useWhen: 'After check_refund_eligibility approves or escalates',
  },
]
