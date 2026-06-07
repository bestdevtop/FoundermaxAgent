import fs from 'fs'
import path from 'path'
import type { VectorStore } from '@langchain/core/vectorstores'
import { Document } from '@langchain/core/documents'
import { OpenAIEmbeddings } from '@langchain/openai'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import { DATA_DIR, IS_SERVERLESS } from '@/lib/paths'

async function loadTextChunks(textPath: string) {
  const text = fs.readFileSync(textPath, 'utf-8')
  const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 500, chunkOverlap: 50 })
  return splitter.splitDocuments([new Document({ pageContent: text })])
}

async function loadMemoryStore(textPath: string): Promise<VectorStore> {
  const { MemoryVectorStore } = await import('@langchain/classic/vectorstores/memory')
  const embeddings = new OpenAIEmbeddings()
  const chunks = await loadTextChunks(textPath)
  return MemoryVectorStore.fromDocuments(chunks, embeddings)
}

async function loadFaissStore(textPath: string, indexDir: string): Promise<VectorStore> {
  const { loadOrCreateFaissIndex } = await import('@/lib/services/faiss-vector-store')
  const embeddings = new OpenAIEmbeddings()
  const chunks = await loadTextChunks(textPath)
  return loadOrCreateFaissIndex(chunks, indexDir, embeddings)
}

export async function createRagStore(
  textFileName: string,
  indexDirName: string,
): Promise<VectorStore> {
  const textPath = path.join(DATA_DIR, textFileName)
  const indexDir = path.join(DATA_DIR, indexDirName)

  if (IS_SERVERLESS) {
    return loadMemoryStore(textPath)
  }

  return loadFaissStore(textPath, indexDir)
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
