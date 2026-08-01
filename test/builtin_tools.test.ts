import {
  createWebSearchTool,
  createWebScraperTool,
  createCodeSandboxTool,
  createSQLQueryTool,
  createVectorStoreTool,
} from '../src/index.js'

describe('Built-in Production Tools', () => {
  test('createWebSearchTool executes mock search correctly', async () => {
    const searchTool = createWebSearchTool({ provider: 'mock' })
    const results = await searchTool.execute({ query: 'TypeScript Agents', maxResults: 2 }, {
      runId: 'test', sessionId: 'test', agentName: 'test', turn: 1, metadata: {},
    })

    expect(results).toHaveLength(2)
    expect(results[0].title).toContain('TypeScript Agents')
  })

  test('createWebScraperTool strips HTML tags safely', async () => {
    const scraperTool = createWebScraperTool({ maxLength: 500 })
    // Mock global fetch
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '<html><body><h1>Hello World</h1><script>alert(1)</script><p>Test Paragraph</p></body></html>',
    } as Response)

    const result = await scraperTool.execute({ url: 'https://example.com' }, {
      runId: 'test', sessionId: 'test', agentName: 'test', turn: 1, metadata: {},
    })

    expect(result.status).toBe(200)
    expect(result.content).toContain('Hello World')
    expect(result.content).not.toContain('<script>')
  })

  test('createCodeSandboxTool evaluates JavaScript code safely', async () => {
    const sandboxTool = createCodeSandboxTool()
    const result = await sandboxTool.execute({ code: 'console.log("Hello"); return 10 + 20;' }, {
      runId: 'test', sessionId: 'test', agentName: 'test', turn: 1, metadata: {},
    })

    expect(result.success).toBe(true)
    expect(result.result).toBe('30')
    expect(result.logs).toContain('Hello')
  })

  test('createSQLQueryTool enforces read-only safety guardrails', async () => {
    const sqlTool = createSQLQueryTool({
      executeQuery: jest.fn().mockResolvedValue([{ id: 1, name: 'Alice' }]),
      readOnly: true,
    })

    // SELECT query passes
    const selectRes = await sqlTool.execute({ query: 'SELECT * FROM users' }, {
      runId: 'test', sessionId: 'test', agentName: 'test', turn: 1, metadata: {},
    })
    expect(selectRes.rowCount).toBe(1)

    // DROP query fails read-only check
    await expect(
      sqlTool.execute({ query: 'DROP TABLE users' }, {
        runId: 'test', sessionId: 'test', agentName: 'test', turn: 1, metadata: {},
      })
    ).rejects.toThrow('Security Error: Only read-only SELECT queries are allowed.')
  })

  test('createVectorStoreTool returns semantic search matches', async () => {
    const mockSearch = jest.fn().mockResolvedValue([
      { id: 'chunk-1', score: 0.95, content: 'Vulcan SDK built-in tools documentation' },
    ])
    const vectorTool = createVectorStoreTool({ searchFn: mockSearch })

    const res = await vectorTool.execute({ query: 'vector search', topK: 1 }, {
      runId: 'test', sessionId: 'test', agentName: 'test', turn: 1, metadata: {},
    })

    expect(res.count).toBe(1)
    expect(res.results[0].id).toBe('chunk-1')
  })
})
