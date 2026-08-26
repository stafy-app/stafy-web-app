import path from 'node:path'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { sentryVitePlugin } from '@sentry/vite-plugin'

const { version } = JSON.parse(readFileSync(path.resolve(__dirname, './package.json'), 'utf-8'))

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Uploads source maps to Sentry so stack traces are readable — only runs
    // when SENTRY_AUTH_TOKEN is set (CI/Vercel build env), so local `pnpm
    // build` without the token still works, just without upload.
    Boolean(process.env.SENTRY_AUTH_TOKEN) &&
      sentryVitePlugin({
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        authToken: process.env.SENTRY_AUTH_TOKEN,
        // Maps are uploaded to Sentry, then deleted from dist/ so the
        // deployed site never serves original source publicly.
        sourcemaps: { filesToDeleteAfterUpload: ['**/*.map'] },
      }),
  ],
  resolve: {
    alias: {
      '@stafy': path.resolve(__dirname, './src'),
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  build: {
    sourcemap: true,
  },
})
