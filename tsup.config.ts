import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: false,
  treeshake: true,
  target: 'node18',
  outDir: 'dist',
  external: [
    'openai',
    '@anthropic-ai/sdk',
    '@google/generative-ai',
    'better-sqlite3',
  ],
  banner: {
    js: '// Vulcan AI Agent SDK — https://github.com/vulcan-ai/sdk',
  },
})
