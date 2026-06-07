import fs from 'fs'
import path from 'path'
import { Document } from '@langchain/core/documents'
import { FaissStore } from '@langchain/community/vectorstores/faiss'
import { OpenAIEmbeddings } from '@langchain/openai'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import { DATA_DIR } from '@/lib/paths'

const FAQ_PATH = path.join(DATA_DIR, 'faq_knowledge_base.txt')
const FAQ_FAISS_INDEX_DIR = path.join(DATA_DIR, 'faq_faiss_index')

let vectorstore: FaissStore | null = null

export async function initFaqIndex(): Promise<void> {
  if (vectorstore !== null) return

  const embeddings = new OpenAIEmbeddings()

  if (fs.existsSync(FAQ_FAISS_INDEX_DIR)) {
    vectorstore = await FaissStore.load(FAQ_FAISS_INDEX_DIR, embeddings)
    return
  }

  const text = fs.readFileSync(FAQ_PATH, 'utf-8')
  const documents = [new Document({ pageContent: text })]
  const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 500, chunkOverlap: 50 })
  const chunks = await splitter.splitDocuments(documents)

  vectorstore = await FaissStore.fromDocuments(chunks, embeddings)
  fs.mkdirSync(FAQ_FAISS_INDEX_DIR, { recursive: true })
  await vectorstore.save(FAQ_FAISS_INDEX_DIR)
}

export async function searchFaq(query: string, k = 3): Promise<string[]> {
  if (vectorstore === null) {
    await initFaqIndex()
  }
  if (!vectorstore) return []

  const docs = await vectorstore.similaritySearch(query, k)
  return docs.map((doc) => doc.pageContent)
}
