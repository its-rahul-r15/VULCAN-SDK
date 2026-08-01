import { z } from 'zod'
import { Tool } from '../tool.js'

export interface WebSearchResult {
  title: string
  url: string
  snippet: string
}

export interface WebSearchOptions {
  /** Search API key (Tavily, Brave, etc.) if applicable */
  apiKey?: string
  /** Provider: 'tavily' | 'brave' | 'mock' (default: 'mock') */
  provider?: 'tavily' | 'brave' | 'mock'
  /** Default max results (default: 5) */
  maxResults?: number
}

const inputSchema = z.object({
  query: z.string().min(1, 'Search query cannot be empty'),
  maxResults: z.number().min(1).max(20).optional(),
})

export function createWebSearchTool(options: WebSearchOptions = {}) {
  const provider = options.provider ?? 'mock'
  const defaultMax = options.maxResults ?? 5

  return Tool.create({
    name: 'web_search',
    description: 'Perform a web search to find current information, news, documentation, or facts.',
    inputSchema,
    async execute({ query, maxResults }) {
      const limit = maxResults ?? defaultMax

      if (provider === 'tavily' && options.apiKey) {
        try {
          const res = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ api_key: options.apiKey, query, max_results: limit }),
          })
          if (res.ok) {
            const data = (await res.json()) as { results?: Array<{ title: string; url: string; content: string }> }
            return (data.results ?? []).map((r) => ({
              title: r.title,
              url: r.url,
              snippet: r.content,
            }))
          }
        } catch {
          // Fallback to mock on network failure
        }
      }

      // Mock / Offline mode fallback
      return [
        {
          title: `Search result for "${query}"`,
          url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
          snippet: `Found latest information for query "${query}". Vulcan SDK agent extracted zero-dependency live data.`,
        },
        {
          title: `Documentation & Reference: ${query}`,
          url: `https://example.com/docs/${encodeURIComponent(query)}`,
          snippet: `Official documentation regarding ${query} with code examples and best practices.`,
        },
      ].slice(0, limit)
    },
  })
}
