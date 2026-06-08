import fs from 'fs'
import path from 'path'
import type { VectorStore } from '@langchain/core/vectorstores'
import { PineconeStore } from '@langchain/pinecone'
import { Pinecone } from '@pinecone-database/pinecone'
import { Document } from '@langchain/core/documents'
import { OpenAIEmbeddings } from '@langchain/openai'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import { DATA_DIR } from '@/lib/paths'

const EMBEDDING_MODEL = 'text-embedding-3-small'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function getEmbeddings(): OpenAIEmbeddings {
  return new OpenAIEmbeddings({ model: EMBEDDING_MODEL })
}

function getPineconeClient(): Pinecone {
  return new Pinecone({ apiKey: requireEnv('PINECONE_API_KEY') })
}

function getPineconeIndex() {
  return getPineconeClient().Index(requireEnv('PINECONE_INDEX'))
}

async function namespaceHasVectors(namespace: string): Promise<boolean> {
  const stats = await getPineconeIndex().describeIndexStats()
  return (stats.namespaces?.[namespace]?.recordCount ?? 0) > 0
}

async function loadDocuments(textFileName: string): Promise<Document[]> {
  const textPath = path.join(DATA_DIR, textFileName)
  const text = fs.readFileSync(textPath, 'utf-8')
  const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 500, chunkOverlap: 50 })
  return splitter.splitDocuments([
    new Document({
      pageContent: text,
      metadata: { source: textFileName },
    }),
  ])
}

export async function createRagStore(
  textFileName: string,
  namespace: string,
): Promise<VectorStore> {
  const embeddings = getEmbeddings()
  const pineconeIndex = getPineconeIndex()

  if (!(await namespaceHasVectors(namespace))) {
    const chunks = await loadDocuments(textFileName)
    await PineconeStore.fromDocuments(chunks, embeddings, {
      pineconeIndex,
      namespace,
    })
  }

  return PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex,
    namespace,
  })
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
