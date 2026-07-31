/**
 * Vulcan SDK — Structured Output Example
 *
 * Demonstrates:
 * - Defining a Zod schema for output validation
 * - Automatic JSON output enforcement
 * - TypeScript type inference from Zod schema
 * - Retry on invalid output
 */

import { Vulcan, z, Agent } from '../src/index.js'

// ── Output Schema ─────────────────────────────────────────────

const ProductReviewSchema = z.object({
  sentiment: z.enum(['positive', 'negative', 'neutral']),
  score: z.number().min(1).max(10).describe('Rating from 1 to 10'),
  summary: z.string().max(200).describe('Brief summary of the review'),
  pros: z.array(z.string()).min(1).describe('List of positive points'),
  cons: z.array(z.string()).describe('List of negative points'),
  recommendToBuy: z.boolean(),
})

// Infer the TypeScript type from the schema
type ProductReview = z.infer<typeof ProductReviewSchema>

// ── Agent ─────────────────────────────────────────────────────

const reviewAnalyzer = new Agent({
  name: 'review-analyzer',
  instructions: `
    You are a product review analyst.
    Analyze the given product review and extract structured information.
    Be thorough and accurate in your analysis.
  `,
  model: 'gpt-4o',
  outputSchema: ProductReviewSchema,
  maxTurns: 5,
})

// ── Run ───────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Vulcan SDK — Structured Output Example\n')

  const review = `
    I bought this laptop 3 months ago and it's been mostly great!
    The display is gorgeous and the battery life is impressive - I get 10+ hours easily.
    The keyboard feels premium and the build quality is excellent.
    However, it runs hot under load and the fan noise can be annoying during intensive tasks.
    The price is steep but I think it's worth it for the performance.
    Overall, I'd recommend it to professionals but not for budget-conscious buyers.
  `

  const result = await Vulcan.run<ProductReview>(reviewAnalyzer, review)

  if (result.status === 'completed') {
    const structured = result.output
    console.log('✅ Structured Output:')
    console.log(`   Sentiment:     ${structured.sentiment}`)
    console.log(`   Score:         ${structured.score}/10`)
    console.log(`   Summary:       ${structured.summary}`)
    console.log(`   Pros:          ${structured.pros.join(', ')}`)
    console.log(`   Cons:          ${structured.cons.join(', ')}`)
    console.log(`   Recommend:     ${structured.recommendToBuy ? 'Yes ✓' : 'No ✗'}`)
    console.log()
    console.log(`📊 Tokens used: ${result.usage.totalTokens}`)
  } else {
    console.log('❌ Run failed:', result.error)
  }
}

main().catch(console.error)
