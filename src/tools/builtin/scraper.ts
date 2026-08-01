import { z } from 'zod'
import { Tool } from '../tool.js'

export interface WebScraperOptions {
  /** Maximum response character length (default: 8000) */
  maxLength?: number
  /** Request timeout in ms (default: 10000) */
  timeoutMs?: number
}

const inputSchema = z.object({
  url: z.string().url('Must be a valid URL'),
  maxLength: z.number().min(100).max(50000).optional(),
})

export function createWebScraperTool(options: WebScraperOptions = {}) {
  const defaultMaxLen = options.maxLength ?? 8000

  return Tool.create({
    name: 'web_scraper',
    description: 'Scrape and extract clean text/markdown content from a URL.',
    inputSchema,
    timeoutMs: options.timeoutMs ?? 15000,
    async execute({ url, maxLength }) {
      const maxLen = maxLength ?? defaultMaxLen
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'VulcanAgentSDK/1.0 (TypeScript Agent Framework)',
          },
        })
        if (!response.ok) {
          return { url, status: response.status, content: `HTTP Error ${response.status}: ${response.statusText}` }
        }
        const html = await response.text()
        const text = htmlToCleanText(html).slice(0, maxLen)
        return {
          url,
          status: response.status,
          contentLength: text.length,
          content: text,
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        return { url, status: 500, content: `Failed to scrape URL: ${errorMsg}` }
      }
    },
  })
}

function htmlToCleanText(html: string): string {
  return html
    .replace(/<script\b[^<]*>([\s\S]*?)<\/script>/gi, '')
    .replace(/<style\b[^<]*>([\s\S]*?)<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
