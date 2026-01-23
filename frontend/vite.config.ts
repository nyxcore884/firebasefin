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
      '/api': {
        // In local development, we want to hit the Firebase Hosting Emulator (5002) 
        // which handles the rewrites to Functions (5001)
        target: 'http://127.0.0.1:5002',
        changeOrigin: true,
        secure: false,
      },
      // Direct access to functions if needed
      '/studio-9381016045-4d625/us-central1': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
      }
    },
  },
})
