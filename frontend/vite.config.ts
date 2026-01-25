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
      // Route process-transaction API Directly to Functions emulator
      '/api/process-transaction': {
        target: 'http://127.0.0.1:5001/studio-9381016045-4d625/us-central1',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/process-transaction/, '/process_transaction'),
      },
      // Route query API (MURTAZI) to ai_query_api function
      '/api/query': {
        target: 'http://127.0.0.1:5001/studio-9381016045-4d625/us-central1',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/query/, '/ai_query_api'),
      },
      // Route ingest API to ingest_data function
      '/api/ingest': {
        target: 'http://127.0.0.1:5001/studio-9381016045-4d625/us-central1',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/ingest/, '/ingest_data'),
      },
      // Localization Engine
      '/api/translate': {
        target: 'http://127.0.0.1:5001/studio-9381016045-4d625/us-central1',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/translate/, '/translate_ui_batch'),
      },
      // Knowledge Engine
      '/api/knowledge/ingest': {
        target: 'http://127.0.0.1:5001/studio-9381016045-4d625/us-central1',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/knowledge\/ingest/, '/ingest_knowedge_item'),
      },
      '/api/knowledge/search': {
        target: 'http://127.0.0.1:5001/studio-9381016045-4d625/us-central1',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/knowledge\/search/, '/search_knowledge_base'),
      },
      // Anomaly Engine
      '/api/anomalies/detect': {
        target: 'http://127.0.0.1:5001/studio-9381016045-4d625/us-central1',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/anomalies\/detect/, '/detect_financial_anomalies'),
      },
      // Financial Truth Engine
      '/api/financial-truth': {
        target: 'http://127.0.0.1:5001/studio-9381016045-4d625/us-central1',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/financial-truth/, '/generate_financial_truth'),
      },
      // Mapping API
      '/api/mapping/upload': {
        target: 'http://127.0.0.1:5001/studio-9381016045-4d625/us-central1',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/mapping\/upload/, '/mapping_upload'),
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['lucide-react', 'clsx', 'tailwind-merge'],
          'vendor-charts': ['recharts'],
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/functions', 'firebase/storage'],
          'vendor-utils': ['date-fns', 'xlsx', 'jspdf', 'jspdf-autotable', 'zod']
        }
      }
    }
  }
})
