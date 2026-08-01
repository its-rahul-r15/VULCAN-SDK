import { z } from 'zod'
import { Tool } from '../tool.js'

export interface VectorSearchResult {
  id: string
  score: number
  content: string
  metadata?: Record<string, unknown>
}

export interface VectorStoreOptions {
  /** Custom vector search implementation */
  searchFn: (query: string, topK: number) => Promise<VectorSearchResult[]> | VectorSearchResult[]
  /** Default topK matches to retrieve (default: 3) */
  defaultTopK?: number
}

const inputSchema = z.object({
  query: z.string().min(1, 'Search query required'),
  topK: z.number().min(1).max(20).optional(),
})

export function createVectorStoreTool(options: VectorStoreOptions) {
  const defaultTopK = options.defaultTopK ?? 3

  return Tool.create({
    name: 'vector_search',
    description: 'Retrieve semantically relevant knowledge base chunks using vector embeddings.',
    inputSchema,
    async execute({ query, topK }) {
      const limit = topK ?? defaultTopK
      const results = await options.searchFn(query, limit)
      return {
        query,
        count: results.length,
        results,
      }
    },
  })
}
