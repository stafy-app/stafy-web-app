import { defineConfig } from 'orval'

export default defineConfig({
  stafy: {
    input: {
      target: './openapi.json',
    },
    output: {
      mode: 'tags-split',
      target: './src/api/generated/endpoints/index.ts',
      client: 'axios',
      mock: false,
      override: {
        mutator: {
          path: './src/services/api.ts',
          name: 'api',
        },
      },
    },
  },
})
