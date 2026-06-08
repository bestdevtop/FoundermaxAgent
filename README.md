# FoundersMax Agent

Unified Next.js application combining the FoundersMax customer support chat UI and LangChain AI backend in a single project.

## Stack

- **Frontend:** Next.js App Router, React 19, plain CSS
- **Backend:** Next.js API routes (`/api/chat`, `/api/health`, `/api/policy`)
- **Agent:** LangChain JS + OpenAI (`gpt-4o-mini`) with 9 support tools
- **Data:** JSON order/product/customer files, in-memory refund store, in-memory vector search (OpenAI embeddings)

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment variables:

   ```bash
   cp .env.example .env.local
   ```

   Set `OPENAI_API_KEY` in `.env.local` (required for chat and vector embeddings).

3. Start the dev server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## Workflow Overview

The app is a customer-support agent that answers questions, looks up orders and customers, searches policy/FAQ documents, and processes refund requests according to company rules.

```
Customer (browser)
    │
    │  types message in chat UI
    ▼
useChatSessions (React hook)
    │  POST /api/chat  { messages[], session_id }
    ▼
app/api/chat/route.ts
    │
    ▼
runAgent()  ──►  LangChain agent (gpt-4o-mini + system prompt)
    │
    ├── order_lookup ──────────────► orders.json
    ├── track_shipment ────────────► orders.json + shipment data
    ├── customer_lookup ───────────► customers.json
    ├── get_customer_history ──────► customers.json + orders.json
    ├── get_product_info ──────────► products.json
    ├── refund_policy_search ──────► in-memory vector store (policy RAG)
    ├── search_knowledge_base ─────► in-memory vector store (FAQ RAG)
    ├── check_refund_eligibility ──► refund-service (rules engine)
    └── create_refund_request ─────► refund-service (in-memory store)
    │
    │  markdown reply + execution_log
    ▼
MessageBubble  ──►  rendered in chat (with "FoundersMax Support" / "You" labels)

Side panel (no chat required):
    View Refund Policy  ──►  GET /api/policy  ──►  RefundPolicyDialog
    View Backend Log    ──►  execution_log from last agent run
    View Orders         ──►  GET /api/orders
    View Customers      ──►  GET /api/customers
```

## How It Works

### Layer 1 — UI (React / Next.js client)

| Piece | Role |
|-------|------|
| `app/page.tsx` | Main layout: left sidebar (chat history), center chat window, right sidebar (tools & info) |
| `hooks/useChatSessions.ts` | Manages sessions in `localStorage`, sends full message history to the API, stores responses |
| `components/ChatWindow.tsx` | Scrollable message list + input |
| `components/MessageBubble.tsx` | Renders each message with a sender label ("You" or "FoundersMax Support") and markdown for assistant replies |
| `components/LeftSidebar.tsx` | Past chat sessions |
| `components/RightSidebar.tsx` | Suggested prompts, policy viewer, backend log, order/customer tables |

### Layer 2 — API routes (Next.js server)

| Route | Purpose |
|-------|---------|
| `POST /api/chat` | Accepts the full conversation, runs the LangChain agent, returns reply + execution log |
| `GET /api/policy` | Returns the refund policy document as markdown |
| `GET /api/orders` | Returns all orders (for the order history dialog) |
| `GET /api/customers` | Returns all customers (for the customer table dialog) |
| `GET /api/health` | Health check |

### Layer 3 — Agent (`lib/agent/`)

1. **`agent.ts`** — Creates a LangChain agent with `gpt-4o-mini` and 9 tools. Converts the full chat history (user + assistant turns) into LangChain messages and invokes the agent.
2. **`prompt.ts`** — System prompt defining support tone, tool usage rules, and refund workflow.
3. **`execution-log.ts`** — Builds a human-readable log of tool calls for the backend log viewer.

On first request the agent bootstraps JSON data (`initCustomers`, `initOrders`) and builds in-memory vector indexes for policy and FAQ search.

### Layer 4 — Tools (`lib/tools/index.ts`)

Nine tools the LLM can call:

| Tool | Service | Data source |
|------|---------|-------------|
| `order_lookup` | `order-service` | `data/orders.json` |
| `track_shipment` | `shipment-service` | order + tracking data |
| `customer_lookup` | `customer-service` | `data/customers.json` |
| `get_customer_history` | `crm-service` | customers + orders |
| `get_product_info` | `product-service` | `data/products.json` |
| `refund_policy_search` | `policy-service` | Vector search over `refund_return_policy_v2026.txt` |
| `search_knowledge_base` | `knowledge-service` | Vector search over `faq_knowledge_base.txt` |
| `check_refund_eligibility` | `refund-service` | rules engine |
| `create_refund_request` | `refund-service` | in-memory refund store |

### Layer 5 — Data

| File / store | Contents |
|--------------|----------|
| `data/orders.json` | Sample orders (IDs, items, totals, delivery dates) |
| `data/customers.json` | Customer profiles and refund counts |
| `data/products.json` | Product specs and warranty info |
| `data/refund_return_policy_v2026.txt` | Full refund & return policy (markdown) |
| `data/faq_knowledge_base.txt` | FAQ entries for general support questions |
| In-memory policy vector store | Built at startup from `refund_return_policy_v2026.txt` (top-3 similarity search) |
| In-memory FAQ vector store | Built at startup from `faq_knowledge_base.txt` (top-3 similarity search) |
| In-memory refund store | Refund requests created during the server process lifetime |

## End-to-End Request Flow

### 1. User sends a message

1. The user types in the chat input (or clicks a suggested prompt in the right sidebar).
2. `useChatSessions` appends the user message to the session and sends `POST /api/chat` with:
   - `messages` — the **full conversation** (all prior user and assistant turns plus the new user message)
   - `session_id` — UUID for the session (used for logging; history is sent explicitly each request)
3. The API route validates that the last message is from the user, then calls `runAgent()`.

### 2. Agent bootstraps and runs

On the first request, the agent:

- Loads customers and orders from JSON files (`initCustomers`, `initOrders`)
- Builds in-memory vector indexes for the refund policy and FAQ (requires `OPENAI_API_KEY`)
- Creates a LangChain agent with `gpt-4o-mini`, 9 tools, and a system prompt

The agent receives the entire chat history, decides which tools to call, and returns a natural-language response (rendered as markdown in the chat).

### 3. Tool routing by question type

| Customer asks about… | Tool(s) used |
|----------------------|--------------|
| Order details (items, total, dates) | `order_lookup` |
| Tracking / delivery status | `track_shipment` |
| Return windows, non-refundable items, escalation rules | `refund_policy_search` |
| Shipping times, payments, account help | `search_knowledge_base` |
| Customer profile | `customer_lookup` |
| Past orders and refund history | `get_customer_history` |
| Product warranty / specs | `get_product_info` |
| Refund request | See [Refund workflow](#refund-request-workflow) below |

### 4. Response back to the UI

The API returns:

```json
{
  "response": "…",
  "session_id": "uuid",
  "execution_log": ["tool calls and results…"]
}
```

- The assistant message is rendered with `react-markdown` in `MessageBubble`, labeled **FoundersMax Support**.
- User messages are labeled **You**.
- The execution log is stored in the session and viewable via **View Backend Log** in the right sidebar.

## Refund Request Workflow

When a customer explicitly asks for a refund, the agent follows this sequence:

```
Customer:  "I want a refund for order O1025"
    │
    ▼
Agent calls order_lookup(O1025)
    └── returns order details + customer_id
    │
    ▼
Agent calls customer_lookup(customer_id)
    └── returns profile + refund history
    │
    ▼
Agent calls refund_policy_search(reason)
    └── returns matching policy sections (RAG)
    │
    ▼
Agent calls check_refund_eligibility(order, customer, reason)
    └── returns APPROVED | DENIED | ESCALATED
    │
    ├── APPROVED or ESCALATED
    │       ▼
    │   Agent calls create_refund_request(...)
    │       └── returns request_id (RR-XXXXXXXX)
    │
    └── DENIED
            ▼
        Agent explains denial with policy reference (no request created)
    │
    ▼
Customer receives natural-language decision + request_id if created
```

### Eligibility rules (enforced in `lib/services/refund-service.ts`)

The refund engine evaluates each request in order:

1. **Non-refundable items** — If the order contains Final Sale, clearance, gift card, digital, subscription, personalized, hygiene, or software license items → **DENIED**
2. **30-day window** — If delivery was more than 30 days ago → **DENIED**
3. **Fraud / escalation checks** — Order value > $500, > $1,000, or customer has > 3 refunds in 12 months → **ESCALATED**
4. **Approved reasons** — Damaged, defective, wrong item, lost in transit, fewer items, unused, not received → **APPROVED**
5. **Other reasons** → **DENIED**

### Refund outcomes

| Decision | Meaning | `create_refund_request` called? |
|----------|---------|--------------------------------|
| `APPROVED` | Refund will be processed | Yes — creates `RR-XXXXXXXX` request ID |
| `ESCALATED` | Needs human or manager review | Yes — request logged for review |
| `DENIED` | Does not meet policy | No — agent explains why |

## Viewing the Refund Policy (Markdown)

Users can read the full policy without chatting:

1. Open the **Info** panel (right sidebar).
2. Click **View Refund Policy**.
3. `RefundPolicyDialog` fetches `GET /api/policy`.
4. The policy file (`data/refund_return_policy_v2026.txt`) is returned and rendered as **markdown** using `react-markdown` — headings, lists, bold text, and tables are formatted for readability.

The same policy document powers:

- The **View Refund Policy** dialog (full document, markdown-rendered)
- The **`refund_policy_search`** tool (RAG semantic search over policy sections)
- The **refund evaluation engine** (hard-coded rules aligned with policy sections)

## API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/chat` | Send a message to the support agent |
| `GET` | `/api/policy` | Return the full refund & return policy (markdown) |

**Chat request body:**

```json
{
  "messages": [
    { "role": "assistant", "content": "Hello! I'm AI Agent from FoundersMax. How can I help you?" },
    { "role": "user", "content": "I want a refund for order O1025" }
  ],
  "session_id": "optional-uuid"
}
```

Each entry in `messages` is either `"user"` or `"assistant"`. The last entry must be a user message. The full history is sent on every request so the agent has context from prior turns.

**Chat response:**

```json
{
  "response": "…",
  "session_id": "uuid",
  "execution_log": ["…"]
}
```

**Policy response:**

```json
{
  "policy": "# Refund & Return Policy v2026\n\n…"
}
```

## Project structure

```
foundermaxagent/
│
├── app/                          # Next.js App Router
│   ├── api/
│   │   ├── chat/route.ts         # POST — run agent on full message history
│   │   ├── customers/route.ts    # GET — list customers
│   │   ├── health/route.ts       # GET — health check
│   │   ├── orders/route.ts       # GET — list orders
│   │   └── policy/route.ts       # GET — refund policy markdown
│   ├── globals.css               # All UI styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main chat page (3-column layout)
│
├── components/                   # React UI
│   ├── BackendLogDialog.tsx      # Tool-call log viewer
│   ├── ChatHeader.tsx            # Top bar (title, theme toggle)
│   ├── ChatInput.tsx             # Message input + send button
│   ├── ChatWindow.tsx            # Message list + loading state
│   ├── CustomerTableDialog.tsx   # Customer data table
│   ├── Icons.tsx                 # SVG icon components
│   ├── LeftSidebar.tsx           # Chat session history
│   ├── MessageBubble.tsx         # Single message (sender label + bubble)
│   ├── OrderHistoryDialog.tsx    # Order data table
│   ├── RefundPolicyDialog.tsx    # Policy markdown viewer
│   └── RightSidebar.tsx          # Prompts, policy, log, data links
│
├── hooks/
│   └── useChatSessions.ts        # Session state, localStorage, API calls
│
├── lib/
│   ├── agent/
│   │   ├── agent.ts              # LangChain agent setup + runAgent()
│   │   ├── execution-log.ts      # Build tool-call log for UI
│   │   └── prompt.ts             # System prompt
│   ├── services/
│   │   ├── crm-service.ts        # Customer order/refund history
│   │   ├── customer-service.ts   # Customer lookup (JSON)
│   │   ├── knowledge-service.ts  # FAQ RAG search
│   │   ├── order-service.ts      # Order lookup (JSON)
│   │   ├── policy-service.ts     # Policy file + RAG search
│   │   ├── product-service.ts    # Product lookup (JSON)
│   │   ├── rag-store.ts          # Shared in-memory vector store helpers
│   │   ├── refund-service.ts     # Eligibility rules + request creation
│   │   └── shipment-service.ts   # Tracking status
│   ├── tools/
│   │   └── index.ts              # 9 LangChain tools wired to services
│   └── paths.ts                  # Data file path constants
│
├── types/
│   └── chat.ts                   # ChatMessage, ChatRequest, ChatResponse types
│
├── data/                         # Static JSON + policy/FAQ text
│   ├── customers.json
│   ├── orders.json
│   ├── products.json
│   ├── refund_return_policy_v2026.txt
│   └── faq_knowledge_base.txt
│
├── instrumentation.ts            # Pre-build in-memory vector indexes on server start
├── next.config.ts
├── package.json
└── tsconfig.json
```

### Data flow summary

```
Browser                    Server
───────                    ──────
localStorage ◄──► useChatSessions
       │                    │
       │  POST /api/chat    │
       └──────────────────► chat/route.ts
                                   │
                                   ▼
                            runAgent(history)
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
              gpt-4o-mini      9 tools       JSON + vector RAG
                    │              │              │
                    └──────────────┴──────────────┘
                                   │
                            response + log
                                   │
       ◄───────────────────────────┘
MessageBubble ("FoundersMax Support" / "You")
```

## Try it

Suggested prompts (available in the right sidebar):

- `I want a refund for order O1025`
- `What's the return policy for gift cards?`
- `Find customer C001`

## Notes

- Vector indexes are built in memory on startup via `instrumentation.ts` (or on first chat request).
- Chat history is stored in the browser (`localStorage`) and sent in full on each API request — the server does not persist conversation state.
- Refund requests are stored in memory for the server process lifetime (not persisted to a database).
- The original `backend/` and `frontend/` folders are unchanged; this project is a standalone migration.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — production server
- `npm run lint` — ESLint
