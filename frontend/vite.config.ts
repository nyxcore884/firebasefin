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
<<<<<<< Updated upstream
      '/functions/engine': {
        target: 'http://localhost:5001/studio-9381016045-4d625/us-central1',
=======
      // Route process-transaction API directly to Functions emulator
      '/api/process-transaction': {
        target: 'http://127.0.0.1:5001/studio-9381016045-4d625/us-central1',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/process-transaction/, '/process_transaction'),
      },
      // Route query API (MURTAZI) to ai_query function
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
      // Fallback for other /api routes
      '/api': {
        target: 'http://127.0.0.1:5002',
>>>>>>> Stashed changes
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
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@radix-ui/react-accordion', '@radix-ui/react-alert-dialog', '@radix-ui/react-aspect-ratio', '@radix-ui/react-avatar', '@radix-ui/react-checkbox', '@radix-ui/react-collapsible', '@radix-ui/react-context-menu', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-hover-card', '@radix-ui/react-label', '@radix-ui/react-menubar', '@radix-ui/react-navigation-menu', '@radix-ui/react-popover', '@radix-ui/react-progress', '@radix-ui/react-radio-group', '@radix-ui/react-scroll-area', '@radix-ui/react-select', '@radix-ui/react-separator', '@radix-ui/react-slider', '@radix-ui/react-slot', '@radix-ui/react-switch', '@radix-ui/react-tabs', '@radix-ui/react-toggle', '@radix-ui/react-toggle-group', '@radix-ui/react-tooltip', 'lucide-react', 'framer-motion', 'clsx', 'tailwind-merge'],
          'vendor-charts': ['recharts'],
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/functions', 'firebase/storage'],
          'vendor-utils': ['date-fns', 'xlsx', 'jspdf', 'jspdf-autotable', 'zod']
        }
      }
    }
  }
})
