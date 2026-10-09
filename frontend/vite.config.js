import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiUrl = env.VITE_API_URL || 'http://localhost:8000'

  return {
    plugins: [react()],
    server: {
      port: 5173,
      // Dev proxy — routes /api/* → backend (avoids CORS in dev)
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    build: {
      // Suppress the chunk size warning for production
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          // Split recharts and react-dom into separate chunks
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            charts: ['recharts'],
            axios: ['axios'],
          },
        },
      },
    },
    // Make VITE_API_URL available inside the app
    define: {
      __API_URL__: JSON.stringify(apiUrl),
    },
  }
})
