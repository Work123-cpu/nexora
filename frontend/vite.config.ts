import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    // TEMP (demo tunnel): Vite blocks unrecognized Host headers by default — allow any
    // trycloudflare.com quick-tunnel hostname. Remove once the demo tunnel is torn down.
    allowedHosts: ['.trycloudflare.com'],
  },
  test: {
    environment: 'node',
    globals: true,
    exclude: ['**/node_modules/**', '**/e2e/**'],
  },
})
