import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/functions/engine': {
        target: 'http://localhost:5001/studio-9381016045-4d625/us-central1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/functions\/engine/, '/process_transaction'),
      },
      '/functions/ai': {
        target: 'http://localhost:5001/studio-9381016045-4d625/us-central1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/functions\/ai/, '/ai_query_api'),
      },
    },
  },
})
