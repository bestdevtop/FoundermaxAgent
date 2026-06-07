import fs from 'fs'
import path from 'path'
import { Document } from '@langchain/core/documents'
import { FaissStore } from '@langchain/community/vectorstores/faiss'
import { OpenAIEmbeddings } from '@langchain/openai'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import { DATA_DIR } from '@/lib/paths'

const POLICY_PATH = path.join(DATA_DIR, 'refund_return_policy_v2026.txt')
const FAISS_INDEX_DIR = path.join(DATA_DIR, 'faiss_index')

let vectorstore: FaissStore | null = null

export async function initPolicyIndex(): Promise<void> {
  if (vectorstore !== null) return

  const embeddings = new OpenAIEmbeddings()

  if (fs.existsSync(FAISS_INDEX_DIR)) {
    vectorstore = await FaissStore.load(FAISS_INDEX_DIR, embeddings)
    return
  }

  const text = fs.readFileSync(POLICY_PATH, 'utf-8')
  const documents = [new Document({ pageContent: text })]
  const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 500, chunkOverlap: 50 })
  const chunks = await splitter.splitDocuments(documents)

  vectorstore = await FaissStore.fromDocuments(chunks, embeddings)
  fs.mkdirSync(FAISS_INDEX_DIR, { recursive: true })
  await vectorstore.save(FAISS_INDEX_DIR)
}

export function getPolicy(): string {
  return fs.readFileSync(POLICY_PATH, 'utf-8')
}

export async function searchPolicy(query: string, k = 3): Promise<string[]> {
  if (vectorstore === null) {
    await initPolicyIndex()
  }
  if (!vectorstore) return []

  const docs = await vectorstore.similaritySearch(query, k)
  return docs.map((doc) => doc.pageContent)
}
