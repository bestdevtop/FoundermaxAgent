import fs from 'fs'
import path from 'path'
import type { VectorStore } from '@langchain/core/vectorstores'
import { MemoryVectorStore } from '@langchain/classic/vectorstores/memory'
import { Document } from '@langchain/core/documents'
import { OpenAIEmbeddings } from '@langchain/openai'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import { DATA_DIR } from '@/lib/paths'

export async function createRagStore(textFileName: string): Promise<VectorStore> {
  const textPath = path.join(DATA_DIR, textFileName)
  const text = fs.readFileSync(textPath, 'utf-8')
  const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 500, chunkOverlap: 50 })
  const chunks = await splitter.splitDocuments([new Document({ pageContent: text })])
  const embeddings = new OpenAIEmbeddings()
  return MemoryVectorStore.fromDocuments(chunks, embeddings)
}

export async function searchStore(
  store: VectorStore | null,
  query: string,
  k = 3,
): Promise<string[]> {
  if (!store) return []
  const docs = await store.similaritySearch(query, k)
  return docs.map((doc) => doc.pageContent)
}
