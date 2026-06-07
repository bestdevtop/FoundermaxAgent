import fs from 'fs'
import { FaissStore } from '@langchain/community/vectorstores/faiss'
import type { DocumentInterface } from '@langchain/core/documents'
import type { EmbeddingsInterface } from '@langchain/core/embeddings'
import type { VectorStore } from '@langchain/core/vectorstores'

/** Local-only FAISS helpers (never imported on Vercel/serverless). */
export async function loadOrCreateFaissIndex(
  chunks: DocumentInterface[],
  indexDir: string,
  embeddings: EmbeddingsInterface,
): Promise<VectorStore> {
  if (fs.existsSync(indexDir)) {
    return FaissStore.load(indexDir, embeddings)
  }

  const store = await FaissStore.fromDocuments(chunks, embeddings)
  fs.mkdirSync(indexDir, { recursive: true })
  await store.save(indexDir)
  return store
}
