import type { VectorStore } from '@langchain/core/vectorstores'
import { createRagStore, searchStore } from '@/lib/services/rag-store'

let vectorstore: VectorStore | null = null

export async function initFaqIndex(): Promise<void> {
  if (vectorstore !== null) return
  vectorstore = await createRagStore('faq_knowledge_base.txt')
}

export async function searchFaq(query: string, k = 3): Promise<string[]> {
  if (vectorstore === null) {
    await initFaqIndex()
  }
  return searchStore(vectorstore, query, k)
}
