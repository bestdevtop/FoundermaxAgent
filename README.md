# FoundersMax Agent

Unified Next.js application combining the FoundersMax customer support chat UI and LangChain AI backend in a single project.

## Stack

- **Frontend:** Next.js App Router, React 19, plain CSS
- **Backend:** Next.js API routes (`/api/chat`, `/api/health`)
- **Agent:** LangChain JS + OpenAI (`gpt-4o-mini`) with 10 support tools
- **Data:** SQLite (`better-sqlite3`), JSON order/product files, FAISS vector search

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

## API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/chat` | Send a message to the support agent |

**Chat request body:**

```json
{
  "message": "Find customer C001",
  "session_id": "optional-uuid-for-conversation-memory"
}
```

**Chat response:**

```json
{
  "response": "...",
  "session_id": "uuid"
}
```

## Project structure

```
foundermaxagent/
├── app/
│   ├── api/chat/route.ts    # Agent endpoint
│   ├── api/health/route.ts
│   ├── page.tsx             # Chat UI
│   └── globals.css
├── components/              # Chat UI components
├── hooks/useChatSessions.ts
├── lib/
│   ├── agent/               # LangChain agent + system prompt
│   ├── db/                  # SQLite init
│   ├── services/            # Business logic + FAISS RAG
│   └── tools/               # Agent tools
└── data/                    # Orders, products, FAQ, policy docs
```

## Notes

- FAISS indexes are built automatically on first request (requires `OPENAI_API_KEY`).
- Session memory uses in-process LangGraph `MemorySaver` — works with `next dev` and `next start`.
- The original `backend/` and `frontend/` folders are unchanged; this project is a full standalone migration.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — production server
- `npm run lint` — ESLint
