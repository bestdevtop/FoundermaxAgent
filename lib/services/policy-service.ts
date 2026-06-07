import fs from 'fs'
import path from 'path'
import type { VectorStore } from '@langchain/core/vectorstores'
import { createRagStore, searchStore } from '@/lib/services/rag-store'
import { DATA_DIR } from '@/lib/paths'

const POLICY_PATH = path.join(DATA_DIR, 'refund_return_policy_v2026.txt')

let vectorstore: VectorStore | null = null

export async function initPolicyIndex(): Promise<void> {
  if (vectorstore !== null) return
  vectorstore = await createRagStore('refund_return_policy_v2026.txt')
}

export function getPolicy(): string {
  return fs.readFileSync(POLICY_PATH, 'utf-8')
}

export async function searchPolicy(query: string, k = 3): Promise<string[]> {
  if (vectorstore === null) {
    await initPolicyIndex()
  }
  return searchStore(vectorstore, query, k)
}
