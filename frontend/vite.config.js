import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // `npm run dev`: same /api path as nginx in production, sent to the backend's local debug port.
  server: {
    proxy: { '/api': { target: 'http://localhost:8001', rewrite: (path) => path.replace(/^\/api/, '') } },
  },
  build: {
    // Only Spline's chunks are this big (react-spline ~2.0 MB, its physics module ~2.0 MB). Both are lazy-loaded and
    // desktop-only: the robot is hidden below lg and loads when it scrolls into view; physics loads only if a scene uses it.
    // The limit sits just above them, so any other chunk that grows large still warns.
    chunkSizeWarningLimit: 2100,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('react-router-dom') || id.includes('/react/')) {
              return 'vendor-react';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-framer';
            }
            if (id.includes('react-markdown') || id.includes('remark-gfm') || id.includes('micromark')) {
              return 'vendor-markdown';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
          }
        }
      }
    }
  }
})
