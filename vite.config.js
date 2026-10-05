import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Bind to all interfaces so the preview/tunnel can reach the dev server.
    host: '0.0.0.0',
    port: 5173,
    // Accept requests through the sandboxed preview domain.
    allowedHosts: ['.e2b.app'],
    // Proxy API calls to the Java servlet backend (backend/, port 8080).
    proxy: {
      '/api': {
        target: process.env.CRM_API_TARGET || 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
